import { NextRequest, NextResponse } from "next/server";
import getPrisma from "@/lib/db/prisma";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import ErrorResponse from "@/lib/backend/response/ErrorResponse";
import { auth } from "@clerk/nextjs/server";
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
  // Null until the post's Discord thread exists. GET never creates one — that
  // is what the authenticated POST below is for.
  discordUrl: string | null;
}

const forumJson = (body: ForumResponse) => {
  const nextResponse = NextResponse.json<ForumResponse>(body);

  nextResponse.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  nextResponse.headers.set("Pragma", "no-cache");
  nextResponse.headers.set("Expires", "0");
  nextResponse.headers.set("Surrogate-Control", "no-store");

  return nextResponse;
};

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
      select: { discord_forum_post_id: true },
    });

    if (!post) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    const forumPostId = post.discord_forum_post_id;

    // This endpoint is public and read-only: it must never create a thread or
    // write to the post. Threads are opened when the post is created, so a
    // missing id just means there is nothing to discuss yet.
    if (!forumPostId) {
      return forumJson({ messages: [], discordUrl: null });
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

    return forumJson({
      messages: formattedMessages,
      discordUrl: `https://discord.com/channels/${guildId}/${forumPostId}`,
    });
  } catch (error) {
    console.error("Error loading Discord forum messages:", error);
    return ErrorResponse.json("Failed to load discussion", { status: 502 });
  }
}

/**
 * Opens the Discord thread for a post that does not have one yet.
 *
 * Thread creation used to happen lazily inside GET, which let any anonymous
 * visitor drive Discord writes. Posts created before creation moved into the
 * post-create path still have no thread, so this gives signed-in users an
 * explicit, authenticated way to start the discussion. Idempotent: if a thread
 * already exists it is returned as-is.
 */
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    const { userId } = await auth();

    if (!userId) {
      return ErrorResponse.json("Sign in to start a discussion", {
        status: 401,
      });
    }

    const { env } = await getCloudflareContext({ async: true });
    const prisma = getPrisma(env.DB);

    const post = await prisma.post.findUnique({
      where: { id: params.id },
      select: {
        discord_forum_post_id: true,
        title: true,
        description: true,
        effective_status_id: true,
      },
    });

    if (!post) {
      return ErrorResponse.json("Post not found", { status: 404 });
    }

    if (post.discord_forum_post_id) {
      return forumJson({
        messages: [],
        discordUrl: `https://discord.com/channels/${env.DISCORD_GUILD_ID}/${post.discord_forum_post_id}`,
      });
    }

    const thread = await createForumThread(
      env.DISCORD_BOT_TOKEN,
      env.DISCORD_FORUM_CHANNEL_ID,
      {
        name: `Discussion for ${post.title}`,
        content: `A new app has been added: ${post.title}\n\nDescription: ${post.description}\n\nDiscuss this app here!`,
      }
    );

    await prisma.post.update({
      where: { id: params.id },
      data: { discord_forum_post_id: thread.id },
    });

    return forumJson({
      messages: [],
      discordUrl: `https://discord.com/channels/${env.DISCORD_GUILD_ID}/${thread.id}`,
    });
  } catch (error) {
    console.error("Error creating Discord forum thread:", error);
    return ErrorResponse.json("Failed to start discussion", { status: 502 });
  }
}
