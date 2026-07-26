const DISCORD_API = "https://discord.com/api/v10";

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface DiscordMessage {
  id: string;
  content: string;
  timestamp: string;
  author: DiscordUser;
}

export interface DiscordThread {
  id: string;
  type: number;
  thread_metadata?: { archived?: boolean };
}

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  timestamp?: string;
}

/** Thread types that can hold messages (public/private/announcement threads). */
const THREAD_TYPES = [10, 11, 12];

export const isThread = (thread: DiscordThread): boolean =>
  THREAD_TYPES.includes(thread.type);

const request = async <T>(
  path: string,
  token: string,
  init: { method?: string; body?: unknown; noCache?: boolean } = {}
): Promise<T> => {
  const { method = "GET", body, noCache } = init;

  const response = await fetch(`${DISCORD_API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(noCache ? { "Cache-Control": "no-cache" } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Discord API ${method} ${path} failed with ${response.status}`
    );
  }

  return (await response.json()) as T;
};

export const createForumThread = async (
  token: string,
  channelId: string,
  { name, content }: { name: string; content: string }
): Promise<DiscordThread> =>
  request<DiscordThread>(`/channels/${channelId}/threads`, token, {
    method: "POST",
    body: {
      name,
      auto_archive_duration: 10080, // 7 days
      message: { content },
    },
  });

export const getThread = (token: string, threadId: string) =>
  request<DiscordThread>(`/channels/${threadId}`, token, { noCache: true });

export const unarchiveThread = (token: string, threadId: string) =>
  request<DiscordThread>(`/channels/${threadId}`, token, {
    method: "PATCH",
    body: { archived: false },
    noCache: true,
  });

export const getThreadMessages = (
  token: string,
  threadId: string,
  limit = 100
) =>
  request<DiscordMessage[]>(
    `/channels/${threadId}/messages?limit=${limit}`,
    token,
    { noCache: true }
  );

export const avatarUrl = (author: DiscordUser): string | null =>
  author.avatar
    ? `https://cdn.discordapp.com/avatars/${author.id}/${author.avatar}.png`
    : null;

/**
 * Webhook posts are fire-and-forget notifications: a failure here must never
 * fail the request that triggered it.
 */
export const sendWebhook = async (
  webhookUrl: string | undefined,
  payload: { content?: string; embeds?: DiscordEmbed[] }
): Promise<void> => {
  if (!webhookUrl) {
    console.warn("Discord webhook URL is not configured; skipping notification");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`Discord webhook failed with ${response.status}`);
    }
  } catch (error) {
    console.error("Failed to send Discord webhook:", error);
  }
};
