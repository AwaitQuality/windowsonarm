import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aqApi } from "@/lib/http/client";
import type { VoteStatusResponse } from "@/app/api/v1/posts/[id]/vote-status/route";

const queryKey = (postId: string) => ["status-votes", postId];

export const useStatusVote = (postId: string) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKey(postId),
    queryFn: async () => {
      const response = await aqApi.get<VoteStatusResponse>(
        `/api/v1/posts/${postId}/vote-status`
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: queryKey(postId) });

  const vote = useMutation<VoteStatusResponse, Error, number>({
    mutationFn: async (statusId) => {
      const response = await aqApi.post<VoteStatusResponse>(
        `/api/v1/posts/${postId}/vote-status`,
        { status_id: statusId }
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: invalidate,
  });

  const clearVote = useMutation<VoteStatusResponse, Error, void>({
    mutationFn: async () => {
      const response = await aqApi.delete<VoteStatusResponse>(
        `/api/v1/posts/${postId}/vote-status`
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: invalidate,
  });

  return {
    summary: query.data,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    vote,
    clearVote,
  };
};
