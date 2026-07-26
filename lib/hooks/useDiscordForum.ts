import { useQuery } from "@tanstack/react-query";
import type { ForumResponse } from "@/app/api/v1/posts/[id]/forum/route";

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
  const { data, isPending, error } = useQuery({
    queryKey: ["discord-forum", postId],
    queryFn: () => fetchForum(postId as string),
    enabled: Boolean(postId),
    refetchOnWindowFocus: false,
    staleTime: 1000 * 30,
  });

  return {
    messages: data?.messages ?? null,
    discordUrl: data?.discordUrl ?? null,
    // A disabled query stays pending forever, so treat "no postId" as settled.
    loading: Boolean(postId) && isPending,
    error: (error as Error | null) ?? null,
  };
}
