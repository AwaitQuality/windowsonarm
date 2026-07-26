import {
  keepPreviousData,
  useInfiniteQuery,
  useQuery,
} from "@tanstack/react-query";
import { aqApi } from "@/lib/axios/api";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { PostsResponse } from "@/app/api/v1/posts/route";

const CACHE_MS = 1000 * 60 * 5;

interface PostsFilters {
  category: string | null;
  status: number | null | undefined;
  search: string;
}

export const usePostsQuery = (filters: PostsFilters) => {
  return useInfiniteQuery({
    queryKey: ["posts", filters.category, filters.status, filters.search],
    initialPageParam: null as string | null,
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

export const useInfoQuery = (selectedStatus: number | null | undefined) => {
  return useQuery({
    queryKey: ["info", selectedStatus ?? "default"],
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
