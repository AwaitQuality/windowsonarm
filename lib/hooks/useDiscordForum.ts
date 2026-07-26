import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ForumResponse } from "@/app/api/v1/posts/[id]/forum/route";

const forumKey = (postId: string | null) => ["discord-forum", postId];

const fetchForum = async (postId: string): Promise<ForumResponse> => {
  const response = await fetch(`/api/v1/posts/${postId}/forum`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load discussion (${response.status})`);
  }

  return (await response.json()) as ForumResponse;
};

export function useDiscordForum(postId: string | null) {
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery({
    queryKey: forumKey(postId),
    queryFn: () => fetchForum(postId as string),
    enabled: Boolean(postId),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30,
  });

  /**
   * Opens the Discord thread for posts that never got one. Requires a signed-in
   * user — the endpoint no longer creates threads on read.
   */
  const startDiscussion = useMutation<ForumResponse, Error, void>({
    mutationFn: async () => {
      const response = await fetch(`/api/v1/posts/${postId}/forum`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Sign in to start a discussion"
            : `Could not start the discussion (${response.status})`
        );
      }

      return (await response.json()) as ForumResponse;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: forumKey(postId) }),
  });

  return {
    messages: data?.messages ?? null,
    discordUrl: data?.discordUrl ?? null,
    // A disabled query stays pending forever, so treat "no postId" as settled.
    loading: Boolean(postId) && isPending,
    error: (error as Error | null) ?? null,
    startDiscussion,
  };
}
