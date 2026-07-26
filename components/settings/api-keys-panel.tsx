"use client";

import React, { useState } from "react";
import {
  Body1,
  Button,
  FluentProvider,
  MessageBar,
  MessageBarBody,
  Spinner,
  Subtitle1,
  makeStyles,
  tokens,
  webLightTheme,
} from "@fluentui/react-components";
import { AddRegular } from "@fluentui/react-icons";
import { useApiKeys } from "@/lib/hooks/useApiKeys";
import ApiKeyForm from "@/components/settings/api-key-form";
import ApiKeyReveal from "@/components/settings/api-key-reveal";
import ApiKeyRow from "@/components/settings/api-key-row";
import type { CreateApiKeyInput, CreatedApiKey } from "@/lib/schemas/api-key";

const useStyles = makeStyles({
  // FluentProvider paints colorNeutralBackground1 by default. Clerk already
  // painted the modal surface, so this stays out of the way.
  provider: {
    backgroundColor: "transparent",
  },
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    // Clerk renders this inside its own modal, which is narrow. Everything here
    // has to survive being squeezed rather than assume a page-width canvas.
    maxWidth: "100%",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  lead: {
    color: tokens.colorNeutralForeground3,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: tokens.spacingVerticalM,
    paddingBlock: tokens.spacingVerticalXXL,
  },
  list: {
    display: "flex",
    flexDirection: "column",
  },
  centered: {
    display: "flex",
    justifyContent: "center",
    paddingBlock: tokens.spacingVerticalXXL,
  },
});

type PanelMode =
  | { step: "list" }
  | { step: "create" }
  | { step: "reveal"; createdKey: CreatedApiKey };

/**
 * API key management, rendered as a custom page inside Clerk's user profile.
 *
 * Admin-only by placement: the parent only mounts it for admins, and every
 * endpoint it calls re-checks the role server-side, so hiding it is presentation
 * rather than the access control.
 *
 * Wrapped in its own FluentProvider because Clerk renders this page through a
 * portal, outside the app's provider in the DOM. React context still reaches it,
 * but Fluent's theme is a set of CSS custom properties that cascade from the
 * provider's element — so without this every `tokens.*` resolves to an undefined
 * var and the whole panel renders unstyled.
 *
 * Light, not the app's dark theme: the container here is Clerk's modal, which is
 * light. Matching the app instead would put pale text on a white surface.
 */
const ApiKeysPanel = () => {
  const styles = useStyles();
  const { keys, isPending, isError, error, createKey, revokeKey } = useApiKeys();

  const [mode, setMode] = useState<PanelMode>({ step: "list" });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const create = (input: CreateApiKeyInput) => {
    createKey.mutate(input, {
      onSuccess: (createdKey) => setMode({ step: "reveal", createdKey }),
    });
  };

  const confirmRevoke = (id: string) => {
    revokeKey.mutate(id, { onSettled: () => setConfirmingId(null) });
  };

  const content = () => {
    if (mode.step === "reveal") {
      return (
        <ApiKeyReveal
          createdKey={mode.createdKey}
          onDone={() => setMode({ step: "list" })}
        />
      );
    }

    if (mode.step === "create") {
      return (
        <>
          <div className={styles.header}>
            <Subtitle1>New API key</Subtitle1>
          </div>
          <ApiKeyForm
            isSubmitting={createKey.isPending}
            onCancel={() => setMode({ step: "list" })}
            onSubmit={create}
          />
        </>
      );
    }

    return (
      <>
        <div className={styles.header}>
          <Subtitle1>API keys</Subtitle1>
          <Body1 className={styles.lead}>
            Keys let scripts and services perform admin actions on your behalf.
            Each one carries only the permissions you give it, and stops working
            the moment you revoke it or lose the admin role.
          </Body1>
        </div>

        {isError && (
          <MessageBar intent="error">
            <MessageBarBody>
              {error?.message ?? "Couldn't load your keys."}
            </MessageBarBody>
          </MessageBar>
        )}

        {isPending ? (
          <div className={styles.centered}>
            <Spinner size="small" label="Loading keys" />
          </div>
        ) : keys.length === 0 ? (
          <div className={styles.empty}>
            <Body1 className={styles.lead}>
              You haven&apos;t created any keys yet.
            </Body1>
            <Button
              appearance="primary"
              icon={<AddRegular />}
              onClick={() => setMode({ step: "create" })}
            >
              Create your first key
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.list}>
              {keys.map((apiKey) => (
                <ApiKeyRow
                  key={apiKey.id}
                  apiKey={apiKey}
                  confirming={confirmingId === apiKey.id}
                  isRevoking={revokeKey.isPending && confirmingId === apiKey.id}
                  onAskRevoke={setConfirmingId}
                  onConfirmRevoke={confirmRevoke}
                  onCancelRevoke={() => setConfirmingId(null)}
                />
              ))}
            </div>
            <div>
              <Button
                appearance="primary"
                icon={<AddRegular />}
                onClick={() => setMode({ step: "create" })}
              >
                Create key
              </Button>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <FluentProvider theme={webLightTheme} className={styles.provider}>
      <div className={styles.root}>{content()}</div>
    </FluentProvider>
  );
};

export default ApiKeysPanel;
