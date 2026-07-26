import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { aqApi } from "@/lib/http/client";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import type { PostsResponse } from "@/lib/backend/posts";

const CACHE_MS = 1000 * 60 * 5;

interface PostsFilters {
  category: string | null;
  status: number | null | undefined;
  search: string;
}

/**
 * `initialPage` is the page the server already rendered. Seeding the cache with
 * it means the browser does not immediately re-request /api/v1/posts for data
 * that arrived with the HTML — one fewer Worker invocation and one fewer set of
 * D1 queries per visit.
 */
export const usePostsQuery = (
  filters: PostsFilters,
  initialPage?: PostsResponse
) => {
  return useInfiniteQuery({
    queryKey: ["posts", filters.category, filters.status, filters.search],
    initialPageParam: null as string | null,
    initialData: initialPage
      ? { pages: [initialPage], pageParams: [null] }
      : undefined,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        cursor: pageParam ?? "",
        category: filters.category ?? "",
        status: filters.status == null ? "" : String(filters.status),
        search: filters.search,
        verified: "true",
      });

      const response = await aqApi.get<PostsResponse>(
        `/api/v1/posts?${params.toString()}`
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    gcTime: CACHE_MS,
    staleTime: CACHE_MS,
  });
};

export const useInfoQuery = (
  selectedStatus: number | null | undefined,
  initialInfo?: InfoResponse
) => {
  return useQuery({
    queryKey: ["info", selectedStatus ?? "default"],
    initialData: initialInfo,
    queryFn: async () => {
      const response = await aqApi.get<InfoResponse>("/api/v1/info");
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    refetchOnWindowFocus: false,
    gcTime: CACHE_MS,
    staleTime: CACHE_MS,
    placeholderData: keepPreviousData,
  });
};
