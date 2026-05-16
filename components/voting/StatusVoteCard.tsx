import React from "react";
import {
  Body1,
  Body2,
  Button,
  Card,
  MessageBar,
  MessageBarBody,
  Spinner,
  Subtitle1,
} from "@fluentui/react-components";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

import { aqApi } from "@/lib/axios/api";
import { useToast } from "@/lib/hooks/useToast";
import { useStatusVote } from "@/lib/hooks/useStatusVote";
import { getFluentIcon } from "@/lib/hooks/useFluentIcon";
import { COMMUNITY_VOTE_THRESHOLD } from "@/lib/schemas/post";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import CommunityVoteIndicator from "@/components/voting/community-vote-indicator";

interface StatusVoteCardProps {
  app: FullPost;
  info: InfoResponse;
}

const StatusVoteCard: React.FC<StatusVoteCardProps> = ({ app, info }) => {
  const { isSignedIn, isLoaded, userId } = useAuth();
  const { notify } = useToast();
  const { summary, isPending, refetch } = useStatusVote(app.id);

  const votableStatuses = info.status.filter((s) => s.id !== -1);

  const isSubmitter = Boolean(userId && app.user_id === userId);
  const submitterLockedByHint = isSubmitter && app.status_hint != null;

  const handleVote = async (statusId: number) => {
    const response = await aqApi.post(`/api/v1/posts/${app.id}/vote`, {
      status_id: statusId,
    });
    if (!response.success) {
      notify("Could not record vote", response.error, "error");
      return;
    }
    notify("Vote recorded");
    void refetch();
  };

  const handleClear = async () => {
    const response = await aqApi.delete(`/api/v1/posts/${app.id}/vote`);
    if (!response.success) {
      notify("Could not clear vote", response.error, "error");
      return;
    }
    notify("Vote cleared");
    void refetch();
  };

  return (
    <Card
      className="rounded-lg shadow-md p-6 mb-8"
      appearance="filled-alternative"
      size="large"
    >
      <Subtitle1 className="mb-2 flex items-center gap-2">
        Community status vote
        {app.community_voted && <CommunityVoteIndicator size={16} />}
      </Subtitle1>
      <Body2 className="text-neutral-400 block mb-4">
        Help everyone find accurate info. Once {COMMUNITY_VOTE_THRESHOLD} or
        more users agree on a status that differs from the admin-set one, that
        status is shown automatically with a subtle indicator.
      </Body2>

      {isPending && <Spinner size="tiny" />}

      {!isPending && summary && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            {votableStatuses.map((status) => {
              const tally = summary.tallies.find(
                (t) => t.status_id === status.id,
              );
              const count = tally?.count ?? 0;
              const Icon = getFluentIcon(status.icon);
              const isMyVote = summary.userVoteStatusId === status.id;
              const isSubmitterHint =
                submitterLockedByHint && app.status_hint === status.id;

              return (
                <div
                  key={status.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-md border border-neutral-800"
                >
                  <div className="flex items-center gap-2">
                    <span style={{ color: status.color }}>
                      <Icon />
                    </span>
                    <Body1>{status.name}</Body1>
                    <Body2 className="text-neutral-400">
                      {count} vote{count === 1 ? "" : "s"}
                    </Body2>
                  </div>
                  {isLoaded && isSignedIn && !submitterLockedByHint && (
                    <Button
                      size="small"
                      appearance={isMyVote ? "primary" : "secondary"}
                      onClick={() =>
                        isMyVote ? handleClear() : handleVote(status.id)
                      }
                    >
                      {isMyVote ? "Your vote — clear" : "Vote"}
                    </Button>
                  )}
                  {isSubmitterHint && (
                    <Body2 className="text-neutral-400">Your hint vote</Body2>
                  )}
                </div>
              );
            })}
          </div>

          {submitterLockedByHint && (
            <MessageBar intent="info">
              <MessageBarBody>
                Your initial status hint counts as your vote and can&apos;t be
                changed.
              </MessageBarBody>
            </MessageBar>
          )}

          {!isLoaded ? null : !isSignedIn ? (
            <MessageBar intent="info">
              <MessageBarBody>
                <Link href="/auth/signin" className="underline">
                  Sign in
                </Link>{" "}
                to vote on this app&apos;s status.
              </MessageBarBody>
            </MessageBar>
          ) : null}
        </div>
      )}
    </Card>
  );
};

export default StatusVoteCard;
