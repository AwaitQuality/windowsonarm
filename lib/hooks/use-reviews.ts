import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { aqApi } from "@/lib/http/client";
import { useToast } from "@/lib/hooks/useToast";
import type { Review } from "@/lib/types/review";

export interface SubmitReviewInput {
  rating: number;
  comment?: string;
  /** The endpoint upserts, so this only decides the wording of the toast. */
  isUpdate?: boolean;
}

const reviewsQueryKey = (postId: string) => ["reviews", postId] as const;

/**
 * The reviews query plus the submit/delete mutations for one post. Owns the
 * toasts and cache invalidation so the presentational components stay dumb.
 */
export const useReviews = (
  postId: string,
  /** Prefetched during the server render, so the list paints without a fetch. */
  initialReviews?: Review[]
) => {
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const queryKey = reviewsQueryKey(postId);

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const { data: reviews = [], isPending } = useQuery<Review[]>({
    queryKey,
    initialData: initialReviews,
    queryFn: async () => {
      const response = await aqApi.get<Review[]>(
        `/api/v1/posts/${postId}/reviews`,
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60,
  });

  const submitReview = useMutation<Review, Error, SubmitReviewInput>({
    mutationFn: async ({ rating, comment }) => {
      const response = await aqApi.post<Review>(
        `/api/v1/posts/${postId}/reviews`,
        { rating, comment: comment?.trim() || undefined },
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: (_review, { isUpdate }) => {
      notify(
        isUpdate
          ? "Review updated successfully"
          : "Review submitted successfully",
      );
      invalidate();
    },
    onError: (error) => {
      notify("Error submitting review", error.message, "error");
    },
  });

  const deleteReview = useMutation<void, Error, string>({
    mutationFn: async (reviewId) => {
      const response = await aqApi.delete(
        `/api/v1/posts/${postId}/reviews?reviewId=${reviewId}`,
      );
      if (!response.success) throw new Error(response.error);
    },
    onSuccess: () => {
      notify("Review deleted successfully");
      invalidate();
    },
    onError: (error) => {
      notify("Error deleting review", error.message, "error");
    },
  });

  return { reviews, isPending, submitReview, deleteReview };
};
