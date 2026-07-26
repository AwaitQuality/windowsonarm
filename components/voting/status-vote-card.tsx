"use client";

import React from "react";
import Link from "next/link";
import {
  Body1Strong,
  Button,
  Caption1,
  Card,
  CounterBadge,
  ProgressBar,
  Radio,
  RadioGroup,
  Spinner,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { CheckmarkCircleFilled } from "@fluentui/react-icons";
import { useAuth } from "@clerk/nextjs";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { useToast } from "@/lib/hooks/useToast";
import { useStatusVote } from "@/lib/hooks/useStatusVote";
import type { VoteStatusResponse } from "@/lib/backend/voting";
import { FluentIcon } from "@/lib/hooks/useFluentIcon";
import {
  COMMUNITY_VOTE_THRESHOLD,
  PENDING_STATUS_ID,
} from "@/lib/schemas/post";

const useStyles = makeStyles({
  card: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalL}`,
    marginBottom: tokens.spacingVerticalXXL,
  },
  row: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: tokens.spacingHorizontalXXL,
    rowGap: tokens.spacingVerticalM,
  },
  ask: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXS,
    minWidth: "220px",
  },
  progress: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalXXS,
  },
  meter: {
    width: "120px",
  },
  options: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalM,
  },
  label: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
  },
  icon: {
    display: "inline-flex",
    alignItems: "center",
    fontSize: "16px",
  },
  hint: {
    color: tokens.colorNeutralForeground3,
  },
  voted: {
    display: "inline-flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalXS,
    color: tokens.colorPaletteGreenForeground1,
  },
});

interface StatusVoteCardProps {
  app: FullPost;
  info: InfoResponse;
  /** Tally resolved during the server render; avoids a fetch on mount. */
  initialSummary?: VoteStatusResponse;
}

/**
 * Compact ballot, directly under the hero.
 *
 * Voting used to sit at the bottom of the sidebar, below an information card and
 * an ad unit, so nothing invited anyone to vote. This keeps it in the first
 * screenful without taking one over: a single card, the ask, the options with
 * their live counts, and how close the community is to deciding.
 */
export default function StatusVoteCard({
  app,
  info,
  initialSummary,
}: StatusVoteCardProps) {
  const styles = useStyles();
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { notify } = useToast();
  const { summary, isPending, vote, clearVote } = useStatusVote(
    app.id,
    initialSummary
  );

  const statuses = info.status
    .filter((status) => status.id !== PENDING_STATUS_ID)
    .sort((a, b) => a.index - b.index);

  const isSubmitter = Boolean(userId && app.user_id === userId);
  const hintCountsAsVote = isSubmitter && app.status_hint != null;
  const busy = vote.isPending || clearVote.isPending;
  const canVote = isLoaded && isSignedIn && !hintCountsAsVote;

  const countFor = (statusId: number) =>
    summary?.votes.find((tally) => tally.status_id === statusId)?.count ?? 0;

  const leadingCount = statuses.reduce(
    (max, status) => Math.max(max, countFor(status.id)),
    0
  );
  const votesToDecide = Math.max(0, COMMUNITY_VOTE_THRESHOLD - leadingCount);

  // Keyed off the status actually being shown, not the admin-set one: an app can
  // still be pending review while the community has already decided it, and
  // saying "your vote decides it" next to "the community has decided" reads as a
  // contradiction.
  const shownStatusId = summary?.effective_status_id ?? app.effective_status_id;
  const undecided = shownStatusId === PENDING_STATUS_ID;

  const handleVote = (statusId: number) =>
    vote.mutate(statusId, {
      onSuccess: () => notify("Vote recorded"),
      onError: (error) => notify("Vote not recorded", error.message, "error"),
    });

  const ask = undecided
    ? "This app has no verified status yet — your vote decides it"
    : "Does this status match your experience?";

  return (
    <Card appearance="filled-alternative" size="small" className={styles.card}>
      <div className={styles.row}>
        <div className={styles.ask}>
          <Body1Strong>{ask}</Body1Strong>
          {votesToDecide > 0 ? (
            <div className={styles.progress}>
              <ProgressBar
                className={styles.meter}
                value={leadingCount}
                max={COMMUNITY_VOTE_THRESHOLD}
                thickness="medium"
              />
              <Caption1 className={styles.hint}>
                {leadingCount} of {COMMUNITY_VOTE_THRESHOLD} matching votes
                needed
              </Caption1>
            </div>
          ) : (
            <Caption1 className={styles.hint}>
              The community has decided this status.
            </Caption1>
          )}
        </div>

        {isPending ? (
          <Spinner size="tiny" label="Loading votes" labelPosition="after" />
        ) : (
          <div className={styles.options}>
            {canVote ? (
              <RadioGroup
                layout="horizontal"
                value={summary?.userVote?.toString() ?? ""}
                onChange={(_, data) => handleVote(Number(data.value))}
                disabled={busy}
              >
                {statuses.map((status) => (
                  <Radio
                    key={status.id}
                    value={status.id.toString()}
                    label={
                      <span className={styles.label}>
                        <span
                          className={styles.icon}
                          style={{ color: status.color }}
                          aria-hidden
                        >
                          <FluentIcon name={status.icon} />
                        </span>
                        {status.name}
                        <CounterBadge
                          count={countFor(status.id)}
                          appearance="ghost"
                          showZero
                        />
                      </span>
                    }
                  />
                ))}
              </RadioGroup>
            ) : (
              <div className={styles.options}>
                {statuses.map((status) => (
                  <span key={status.id} className={styles.label}>
                    <span
                      className={styles.icon}
                      style={{ color: status.color }}
                      aria-hidden
                    >
                      <FluentIcon name={status.icon} />
                    </span>
                    <Caption1>{status.name}</Caption1>
                    <CounterBadge
                      count={countFor(status.id)}
                      appearance="ghost"
                      showZero
                    />
                  </span>
                ))}
              </div>
            )}

            {isLoaded && !isSignedIn && (
              <Link href="/auth/signin">
                <Button appearance="primary">Sign in to vote</Button>
              </Link>
            )}

            {hintCountsAsVote && (
              <Caption1 className={styles.hint}>
                Your submitted status counts as your vote
              </Caption1>
            )}

            {canVote && summary?.userVote != null && (
              <>
                <Caption1 className={styles.voted}>
                  <CheckmarkCircleFilled fontSize={16} />
                  Voted
                </Caption1>
                <Button
                  appearance="subtle"
                  size="small"
                  disabled={busy}
                  onClick={() =>
                    clearVote.mutate(undefined, {
                      onSuccess: () => notify("Vote cleared"),
                      onError: (error) =>
                        notify("Vote not cleared", error.message, "error"),
                    })
                  }
                >
                  Clear
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
