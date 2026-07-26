import React from "react";
import {
  Body2,
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Radio,
  RadioGroup,
  Subtitle1,
  Skeleton,
  SkeletonItem,
} from "@fluentui/react-components";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { useToast } from "@/lib/hooks/useToast";
import { useStatusVote } from "@/lib/hooks/useStatusVote";
import { COMMUNITY_VOTE_THRESHOLD, PENDING_STATUS_ID } from "@/lib/schemas/post";
import CommunityVoteIndicator from "@/components/voting/community-vote-indicator";

interface StatusVoteProps {
  app: FullPost;
  info: InfoResponse;
}

export default function StatusVote({ app, info }: StatusVoteProps) {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { notify } = useToast();
  const { summary, isPending, vote, clearVote } = useStatusVote(app.id);

  const isSubmitter = Boolean(userId && app.user_id === userId);
  const submitterLockedByHint = isSubmitter && app.status_hint != null;
  const busy = vote.isPending || clearVote.isPending;

  const handleVote = (statusId: number) =>
    vote.mutate(statusId, {
      onSuccess: () => notify("Vote recorded"),
      onError: (error) => notify("Error recording vote", error.message, "error"),
    });

  const handleClear = () =>
    clearVote.mutate(undefined, {
      onSuccess: () => notify("Vote cleared"),
      onError: (error) => notify("Error clearing vote", error.message, "error"),
    });

  if (isPending) {
    return (
      <Card
        className="rounded-lg shadow-md p-6 mb-8"
        appearance={"filled-alternative"}
        size="large"
      >
        <Subtitle1 className="mb-4">Vote on App Status</Subtitle1>
        <div className="space-y-4">
          <Skeleton>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonItem key={i} size={32} className="mb-2" />
            ))}
          </Skeleton>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="rounded-lg shadow-md p-6 mb-8"
      appearance={"filled-alternative"}
      size="large"
    >
      <Subtitle1 className="mb-2 flex items-center gap-2">
        Vote on App Status
        {app.community_voted && <CommunityVoteIndicator size={16} />}
      </Subtitle1>
      <Body2 className="block mb-4 text-gray-500">
        Once {COMMUNITY_VOTE_THRESHOLD} or more users agree on a status that
        differs from the admin-set one, that status is shown automatically with a
        subtle indicator.
      </Body2>
      <div className="space-y-4">
        {!isLoaded ? null : !isSignedIn ? (
          <Link href="/auth/signin">
            <Button>Sign in to vote</Button>
          </Link>
        ) : submitterLockedByHint ? (
          <MessageBar intent="info">
            <MessageBarBody>
              Your initial status hint counts as your vote and can&apos;t be
              changed.
            </MessageBarBody>
          </MessageBar>
        ) : (
          <>
            <RadioGroup
              value={summary?.userVote?.toString() || ""}
              onChange={(_, data) => handleVote(Number(data.value))}
            >
              {info.status
                .filter((s) => s.id !== PENDING_STATUS_ID)
                .map((status) => {
                  const count =
                    summary?.votes?.find((v) => v.status_id === status.id)
                      ?.count || 0;

                  return (
                    <Radio
                      key={status.id}
                      value={status.id.toString()}
                      label={
                        <div className="flex items-center gap-2">
                          <span>{status.name}</span>
                          <span className="text-sm text-gray-500">
                            ({count} vote{count === 1 ? "" : "s"})
                          </span>
                        </div>
                      }
                      disabled={busy}
                    />
                  );
                })}
            </RadioGroup>
            {summary?.userVote != null && (
              <Button size="small" onClick={handleClear} disabled={busy}>
                Clear my vote
              </Button>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
