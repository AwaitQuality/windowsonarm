import React from "react";
import {
  Button,
  Card,
  Radio,
  RadioGroup,
  Subtitle1,
  Toast,
  ToastBody,
  ToastIntent,
  ToastTitle,
  useToastController,
  Skeleton,
  SkeletonItem,
} from "@fluentui/react-components";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { aqApi } from "@/lib/axios/api";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { useMutation, useQuery, useQueryClient } from "react-query";

interface StatusVoteProps {
  postId: string;
  info: InfoResponse;
}

interface StatusVoteData {
  status_id: number;
  count: number;
}

interface VoteResponse {
  votes: StatusVoteData[];
  userVote: number | null;
}

interface VoteApiResponse {
  success: boolean;
  data: VoteResponse;
}

export default function StatusVote({ postId, info }: StatusVoteProps) {
  const { isSignedIn } = useUser();
  const { dispatchToast } = useToastController("toaster");
  const queryClient = useQueryClient();

  const notify = (
    title: string,
    subtitle?: string,
    intent: ToastIntent = "success"
  ) =>
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {subtitle && <ToastBody>{subtitle}</ToastBody>}
      </Toast>,
      { intent }
    );

  const { data, isLoading } = useQuery<VoteResponse>(
    ["status-votes", postId],
    async () => {
      const response = await aqApi.get<VoteResponse>(`/api/v1/posts/${postId}/vote-status`);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    }
  );

  const voteMutation = useMutation<VoteResponse, Error, number>(
    async (statusId: number) => {
      const response = await aqApi.post<VoteResponse>(`/api/v1/posts/${postId}/vote-status`, {
        status_id: statusId,
      });
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    {
      onSuccess: () => {
        notify("Vote recorded successfully");
        queryClient.invalidateQueries(["status-votes", postId]);
      },
      onError: (error: Error) => {
        notify("Error recording vote", error.message, "error");
      },
    }
  );

  if (isLoading) {
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
      <Subtitle1 className="mb-4">Vote on App Status</Subtitle1>
      <div className="space-y-4">
        {!isSignedIn ? (
          <Link href="/auth/signin">
            <Button>Sign in to vote</Button>
          </Link>
        ) : (
          <RadioGroup
            value={data?.userVote?.toString() || ""}
            onChange={(_, data) => voteMutation.mutate(Number(data.value))}
          >
            {info.status
              .filter((s) => s.id >= 0)
              .map((status) => (
                <Radio
                  key={status.id}
                  value={status.id.toString()}
                  label={
                    <div className="flex items-center gap-2">
                      <span>{status.name}</span>
                      <span className="text-sm text-gray-500">
                        ({data?.votes?.find((v) => v.status_id === status.id)?.count || 0}{" "}
                        votes)
                      </span>
                    </div>
                  }
                  disabled={voteMutation.isLoading}
                />
              ))}
          </RadioGroup>
        )}
      </div>
    </Card>
  );
}
