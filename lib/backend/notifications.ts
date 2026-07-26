import type { User } from "@clerk/nextjs/server";
import { sendWebhook } from "@/lib/backend/discord";

/**
 * The Discord announcement for an admin-driven status change.
 *
 * Extracted so every route that can move a status emits the same notification.
 * It previously lived inline in PUT /api/v1/posts/{id}, which meant the admin
 * PATCH route silently changed statuses without telling anyone.
 */

interface StatusForNotification {
  name: string;
  /** Hex, with leading `#`. Used as the embed's accent colour. */
  color: string;
}

export interface StatusChangeNotification {
  webhookUrl: string | undefined;
  postTitle: string;
  previousStatusName: string;
  newStatus: StatusForNotification;
  /** Who made the change — an admin, whether via session or API key. */
  actor: User;
}

/** Discord wants an integer; a malformed colour must not produce NaN. */
const toEmbedColor = (hex: string): number | undefined => {
  const parsed = Number.parseInt(hex.replace("#", ""), 16);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const actorName = (user: User): string =>
  user.username ||
  `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
  "An admin";

/**
 * Fire-and-forget: `sendWebhook` already swallows its own failures, so a Discord
 * outage cannot fail the status change that triggered this.
 */
export const notifyStatusChange = async ({
  webhookUrl,
  postTitle,
  previousStatusName,
  newStatus,
  actor,
}: StatusChangeNotification): Promise<void> => {
  await sendWebhook(webhookUrl, {
    embeds: [
      {
        title: "App Status Updated",
        description: `**${postTitle}** status has been updated`,
        color: toEmbedColor(newStatus.color),
        fields: [
          {
            name: "Previous Status",
            value: previousStatusName,
            inline: true,
          },
          {
            name: "New Status",
            value: newStatus.name,
            inline: true,
          },
          {
            name: "Updated By",
            value: actorName(actor),
            inline: true,
          },
        ],
        timestamp: new Date().toISOString(),
      },
    ],
  });
};
