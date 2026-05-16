import { useQuery } from "@tanstack/react-query";
import { aqApi } from "@/lib/axios/api";
import type { VoteSummary } from "@/app/api/v1/posts/[id]/vote/route";

export const useStatusVote = (postId: string) => {
  const query = useQuery({
    queryKey: ["status-vote", postId],
    queryFn: async () => {
      const response = await aqApi.get<VoteSummary>(
        `/api/v1/posts/${postId}/vote`,
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });

  return {
    summary: query.data,
    isPending: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
};
