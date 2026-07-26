import { NextRequest, NextResponse } from "next/server";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import {
  avatarUrl,
  createForumThread,
  getThread,
  getThreadMessages,
  isThread,
  unarchiveThread,
} from "@/lib/backend/discord";

export interface ForumMessage {
  id: string;
  content: string;
  author: { username: string; avatar_url: string | null };
  timestamp: number;
}

export interface ForumResponse {
  messages: ForumMessage[];
  discordUrl: string;
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const appId = params.id;
    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);
    const discordToken = env.DISCORD_BOT_TOKEN;
    const guildId = env.DISCORD_GUILD_ID;

    const post = await prisma.post.findUnique({
      where: { id: appId },
      select: { discord_forum_post_id: true, title: true, description: true },
    });

    if (!post) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    let forumPostId = post.discord_forum_post_id;

    // No thread yet for this app: open one and remember it.
    if (!forumPostId) {
      const thread = await createForumThread(
        discordToken,
        env.DISCORD_FORUM_CHANNEL_ID,
        {
          name: `Discussion for ${post.title}`,
          content: `A new app has been added: ${post.title}\n\nDescription: ${post.description}\n\nDiscuss this app here!`,
        }
      );

      forumPostId = thread.id;

      await prisma.post.update({
        where: { id: appId },
        data: { discord_forum_post_id: forumPostId },
      });
    }

    const thread = await getThread(discordToken, forumPostId);

    if (!isThread(thread)) {
      return ErrorResponse.json(
        "The linked Discord channel is not a thread",
        { status: 502 }
      );
    }

    if (thread.thread_metadata?.archived) {
      await unarchiveThread(discordToken, forumPostId);
      // Discord needs a moment before an unarchived thread serves messages.
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    const messages = await getThreadMessages(discordToken, forumPostId);

    const formattedMessages: ForumMessage[] = messages.map((message) => ({
      id: message.id,
      content: message.content,
      author: {
        username: message.author.username,
        avatar_url: avatarUrl(message.author),
      },
      timestamp: new Date(message.timestamp).getTime(),
    }));

    const nextResponse = NextResponse.json<ForumResponse>({
      messages: formattedMessages,
      discordUrl: `https://discord.com/channels/${guildId}/${forumPostId}`,
    });

    nextResponse.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    nextResponse.headers.set("Pragma", "no-cache");
    nextResponse.headers.set("Expires", "0");
    nextResponse.headers.set("Surrogate-Control", "no-store");

    return nextResponse;
  } catch (error) {
    console.error("Error loading Discord forum messages:", error);
    return ErrorResponse.json("Failed to load discussion", { status: 502 });
  }
}
