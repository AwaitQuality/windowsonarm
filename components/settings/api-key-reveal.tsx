"use client";

import React, { useState } from "react";
import {
  Body1,
  Button,
  Caption1,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Subtitle2,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { CheckmarkRegular, CopyRegular } from "@fluentui/react-icons";
import type { CreatedApiKey } from "@/lib/schemas/api-key";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  // The token is the one thing on this screen that cannot be recovered, so it
  // gets the only strong container in the panel — everything else stays flat.
  tokenBox: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground3,
  },
  token: {
    flex: 1,
    minWidth: 0,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase300,
    // Tokens are one long unbroken string, so they must be allowed to break
    // anywhere or they push the Clerk modal into a horizontal scroll.
    wordBreak: "break-all",
  },
  usage: {
    padding: tokens.spacingVerticalM,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    overflowX: "auto",
    whiteSpace: "pre",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
  },
});

interface ApiKeyRevealProps {
  createdKey: CreatedApiKey;
  onDone: () => void;
}

/**
 * The one-time token reveal.
 *
 * Rendered as a distinct panel state rather than a toast: the token is
 * unrecoverable, so it has to stay on screen until the admin explicitly says
 * they have stored it.
 */
const ApiKeyReveal = ({ createdKey, onDone }: ApiKeyRevealProps) => {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(createdKey.token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be denied. The token is selectable on screen, so
      // there is still a way through — no need to interrupt with an error.
      setCopied(false);
    }
  };

  return (
    <div className={styles.root}>
      <Subtitle2>{createdKey.name} is ready</Subtitle2>

      <MessageBar intent="warning">
        <MessageBarBody>
          <MessageBarTitle>Copy this key now</MessageBarTitle>
          This is the only time it is shown. Store it somewhere safe — if you
          lose it, revoke this key and create another.
        </MessageBarBody>
      </MessageBar>

      <div className={styles.tokenBox}>
        <code className={styles.token}>{createdKey.token}</code>
        <Button
          appearance="primary"
          icon={copied ? <CheckmarkRegular /> : <CopyRegular />}
          onClick={copy}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      <div>
        <Body1>Send it as a bearer token:</Body1>
        <div className={styles.usage}>
          {`curl https://windowsonarm.org/api/v1/admin/me \\\n  -H "Authorization: Bearer ${createdKey.token}"`}
        </div>
        <Caption1>
          An <code>X-API-Key</code> header works too, if a proxy rewrites
          Authorization.
        </Caption1>
      </div>

      <div className={styles.actions}>
        <Button appearance="secondary" onClick={onDone}>
          I&apos;ve stored it
        </Button>
      </div>
    </div>
  );
};

export default ApiKeyReveal;
