"use client";

import React from "react";
import {
  Badge,
  Body1Strong,
  Button,
  Caption1,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { SCOPE_DESCRIPTIONS, type ApiKeySummary } from "@/lib/schemas/api-key";

dayjs.extend(relativeTime);

const useStyles = makeStyles({
  root: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: tokens.spacingHorizontalM,
    paddingBlock: tokens.spacingVerticalM,
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  inactive: {
    opacity: 0.55,
  },
  details: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
    minWidth: 0,
  },
  heading: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    flexWrap: "wrap",
  },
  prefix: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    wordBreak: "break-all",
  },
  scopes: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalXS,
  },
  meta: {
    color: tokens.colorNeutralForeground3,
  },
  confirm: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    flexShrink: 0,
    flexWrap: "wrap",
    justifyContent: "flex-end",
  },
});

interface ApiKeyRowProps {
  apiKey: ApiKeySummary;
  /** True once the admin has asked to revoke and the row is awaiting a confirm. */
  confirming: boolean;
  isRevoking: boolean;
  onAskRevoke: (id: string) => void;
  onConfirmRevoke: (id: string) => void;
  onCancelRevoke: () => void;
}

const isExpired = (key: ApiKeySummary): boolean =>
  !!key.expires_at && new Date(key.expires_at).getTime() <= Date.now();

const ApiKeyRow = ({
  apiKey,
  confirming,
  isRevoking,
  onAskRevoke,
  onConfirmRevoke,
  onCancelRevoke,
}: ApiKeyRowProps) => {
  const styles = useStyles();

  const revoked = !!apiKey.revoked_at;
  const expired = isExpired(apiKey);
  const inactive = revoked || expired;

  const expiryLabel = apiKey.expires_at
    ? expired
      ? `Expired ${dayjs(apiKey.expires_at).fromNow()}`
      : `Expires ${dayjs(apiKey.expires_at).fromNow()}`
    : "No expiry";

  return (
    <div className={`${styles.root} ${inactive ? styles.inactive : ""}`}>
      <div className={styles.details}>
        <div className={styles.heading}>
          <Body1Strong>{apiKey.name}</Body1Strong>
          {revoked && <Badge appearance="tint" color="danger">Revoked</Badge>}
          {!revoked && expired && (
            <Badge appearance="tint" color="warning">
              Expired
            </Badge>
          )}
        </div>

        <span className={styles.prefix}>woa_{apiKey.prefix}…</span>

        <div className={styles.scopes}>
          {apiKey.scopes.map((scope) => (
            <Badge
              key={scope}
              appearance="outline"
              color={scope === "admin:*" ? "danger" : "informative"}
              title={SCOPE_DESCRIPTIONS[scope]}
            >
              {scope}
            </Badge>
          ))}
        </div>

        <Caption1 className={styles.meta}>
          {apiKey.last_used_at
            ? `Last used ${dayjs(apiKey.last_used_at).fromNow()}`
            : "Never used"}
          {" · "}
          {expiryLabel}
          {" · "}
          {`Created ${dayjs(apiKey.created_at).format("D MMM YYYY")}`}
        </Caption1>
      </div>

      {/* Confirmed inline rather than in a dialog: this panel already lives
          inside Clerk's modal, and stacking a second focus trap on top of it
          traps the keyboard in the wrong layer. */}
      {!revoked &&
        (confirming ? (
          <div className={styles.confirm}>
            <Caption1>Revoke?</Caption1>
            <Button
              appearance="primary"
              size="small"
              disabled={isRevoking}
              onClick={() => onConfirmRevoke(apiKey.id)}
            >
              {isRevoking ? "Revoking…" : "Yes, revoke"}
            </Button>
            <Button
              appearance="subtle"
              size="small"
              disabled={isRevoking}
              onClick={onCancelRevoke}
            >
              Keep
            </Button>
          </div>
        ) : (
          <Button
            appearance="subtle"
            size="small"
            onClick={() => onAskRevoke(apiKey.id)}
          >
            Revoke
          </Button>
        ))}
    </div>
  );
};

export default ApiKeyRow;
