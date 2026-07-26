"use client";

import React, { useState } from "react";
import {
  Avatar,
  Body1,
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  Spinner,
  Subtitle1,
  Text,
  tokens,
} from "@fluentui/react-components";
import {
  DeleteRegular,
  EditRegular,
  StarFilled,
  StarRegular,
} from "@fluentui/react-icons";
import { useUser } from "@clerk/nextjs";
import { aqApi } from "@/lib/http/client";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/useToast";

dayjs.extend(relativeTime);

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    padding: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusLarge,
    marginBottom: tokens.spacingVerticalXXL,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: tokens.spacingVerticalM,
  },
  summaryCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalXL,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
  },
  averageRating: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
    backgroundColor: tokens.colorNeutralBackground3,
    borderRadius: tokens.borderRadiusLarge,
    minWidth: "200px",
  },
  ratingNumber: {
    fontSize: "48px",
    lineHeight: "1",
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorBrandForeground1,
  },
  distributionContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
    marginLeft: tokens.spacingHorizontalXL,
  },
  distributionRow: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  starLabel: {
    width: "45px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  progressContainer: {
    flex: 1,
    height: "12px",
    backgroundColor: tokens.colorNeutralBackground4,
    borderRadius: "6px",
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: tokens.colorBrandBackground,
    transition: "width 0.3s ease",
  },
  reviewCard: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalXL,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
    marginBottom: tokens.spacingVerticalS,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    "&:hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  starContainer: {
    display: "flex",
    gap: "2px",
    color: "#FFB400",
  },
  emptyState: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalXXL,
    borderRadius: tokens.borderRadiusLarge,
    textAlign: "center",
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    alignItems: "center",
  },
  emptyStateTitle: {
    marginBottom: tokens.spacingVerticalS,
  },
  emptyStateDescription: {
    marginBottom: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground2,
    marginLeft: tokens.spacingHorizontalS,
  },
  reviewList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  reviewHeader: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalS,
    alignItems: "center",
  },
  reviewContent: {},
  textarea: {
    width: "100%",
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    resize: "vertical",
    minHeight: "100px",
    "&:focus": {
      outline: "none",
    },
  },
});

interface Review {
  id: string;
  rating: number;
  comment?: string;
  user_id: string;
  created_at: string;
  user?: {
    username?: string;
    imageUrl?: string;
  };
}

interface ReviewResponse {
  data: Review[];
}

const MAX_REVIEW_LENGTH = 2000;

export default function Reviews({ postId }: { postId: string }) {
  const styles = useStyles();
  const { user, isSignedIn } = useUser();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const { notify } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const { data: reviews = [], isPending } = useQuery<Review[]>({
    queryKey: ["reviews", postId],
    queryFn: async () => {
      const response = await aqApi.get<Review[]>(`/api/v1/posts/${postId}/reviews`);
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60,
  });

  const submitReviewMutation = useMutation<Review, Error, { rating: number; comment?: string }>({
    mutationFn: async ({ rating, comment }) => {
      const response = await aqApi.post<Review>(`/api/v1/posts/${postId}/reviews`, {
        rating,
        comment: comment?.trim() || undefined,
      });
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      notify(editingReview ? "Review updated successfully" : "Review submitted successfully");
      setIsReviewDialogOpen(false);
      setRating(0);
      setComment("");
      setEditingReview(null);
      queryClient.invalidateQueries({ queryKey: ["reviews", postId] });
    },
    onError: (error: Error) => {
      notify("Error submitting review", error.message, "error");
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const response = await aqApi.delete(
        `/api/v1/posts/${postId}/reviews?reviewId=${reviewId}`,
      );
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: () => {
      notify("Review deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["reviews", postId] });
    },
    onError: (error: Error) => {
      notify("Error deleting review", error.message, "error");
    },
  });

  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setRating(review.rating);
    setComment(review.comment || "");
    setIsReviewDialogOpen(true);
  };

  const handleSubmitReview = () => {
    submitReviewMutation.mutate({ rating, comment });
  };

  const handleDeleteReview = (reviewId: string) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      deleteReviewMutation.mutate(reviewId);
    }
  };

  if (isPending) {
    return (
      <div className={styles.root}>
        <div className="flex justify-center items-center h-32">
          <Spinner size="medium" label="Loading reviews..." />
        </div>
      </div>
    );
  }

  const averageRating = reviews.length
    ? reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length
    : 0;

  const userReview = reviews.find((review: Review) => review.user_id === user?.id);

  // Calculate rating distribution
  const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
    const count = reviews.filter((r: Review) => r.rating === 5 - i).length;
    const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
    return { stars: 5 - i, count, percentage };
  });

  const renderStars = (rating: number, size: "small" | "large" = "small") => (
    <div className={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{ fontSize: size === "large" ? "20px" : "16px" }}
        >
          {star <= rating ? <StarFilled /> : <StarRegular />}
        </span>
      ))}
    </div>
  );

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Subtitle1>Experience Reviews</Subtitle1>
        {isSignedIn && !userReview && (
          <Button
            appearance="primary"
            onClick={() => setIsReviewDialogOpen(true)}
            size="large"
          >
            Write a Review
          </Button>
        )}
      </div>

      <div className={styles.summaryCard}>
        <div style={{ display: "flex" }}>
          <div className={styles.averageRating}>
            <span className={styles.ratingNumber}>
              {averageRating.toFixed(1)}
            </span>
            {renderStars(Math.round(averageRating), "large")}
            <Caption1>
              {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </Caption1>
          </div>

          <div className={styles.distributionContainer}>
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className={styles.distributionRow}>
                <div className={styles.starLabel}>
                  <Text>{stars}</Text>
                  <StarFilled fontSize={14} style={{ color: "#FFB400" }} />
                </div>
                <div className={styles.progressContainer}>
                  <div
                    className={styles.progressBar}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <Text size={200} style={{ width: "40px" }}>
                  {count}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div>
          {reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <Avatar
                  name={review.user?.username || "Anonymous"}
                  image={{ src: review.user?.imageUrl }}
                  size={48}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <div>
                      <Text weight="semibold">
                        {review.user?.username || "Anonymous"}
                      </Text>
                      <div style={{ marginTop: tokens.spacingVerticalXS }}>
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: tokens.spacingHorizontalS,
                      }}
                    >
                      {user?.id === review.user_id && (
                        <Button
                          icon={<EditRegular />}
                          appearance="subtle"
                          onClick={() => handleEditClick(review)}
                        >
                          Edit
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          icon={<DeleteRegular />}
                          appearance="subtle"
                          onClick={() => handleDeleteReview(review.id)}
                          disabled={deleteReviewMutation.isPending}
                        >
                          {deleteReviewMutation.isPending ? (
                            <Spinner size="tiny" />
                          ) : (
                            "Delete"
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  <Caption1 style={{ marginTop: tokens.spacingVerticalXS }}>
                    {dayjs(review.created_at).fromNow()}
                  </Caption1>
                </div>
              </div>
              {review.comment && (
                <div className={styles.reviewContent}>
                  <Text>{review.comment}</Text>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div>
            <Text
              size={500}
              weight="semibold"
              className={styles.emptyStateTitle}
            >
              No reviews yet
            </Text>
            <Text as="p" size={300} className={styles.emptyStateDescription}>
              Be the first to share your experience
            </Text>
          </div>
          {isSignedIn && (
            <Button
              appearance="primary"
              onClick={() => setIsReviewDialogOpen(true)}
              size="large"
            >
              Write a Review
            </Button>
          )}
        </div>
      )}

      <Dialog
        open={isReviewDialogOpen}
        onOpenChange={(e, data) => {
          setIsReviewDialogOpen(data.open);
          if (!data.open) {
            setEditingReview(null);
            setRating(0);
            setComment("");
          }
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>
              {editingReview ? "Edit Review" : "Write a Review"}
            </DialogTitle>
            <DialogContent>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: tokens.spacingVerticalL,
                }}
              >
                <div>
                  <Body1 style={{ marginBottom: tokens.spacingVerticalS }}>
                    Overall Rating
                  </Body1>
                  <div
                    style={{ display: "flex", gap: tokens.spacingHorizontalS }}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Button
                        key={star}
                        appearance="subtle"
                        icon={star <= rating ? <StarFilled /> : <StarRegular />}
                        onClick={() => setRating(star)}
                        style={{
                          color:
                            star <= rating
                              ? tokens.colorBrandForeground1
                              : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <Body1 style={{ marginBottom: tokens.spacingVerticalS }}>
                    Review (optional)
                  </Body1>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this app..."
                    className={styles.textarea}
                    maxLength={MAX_REVIEW_LENGTH}
                  />
                  <Caption1
                    style={{
                      marginTop: tokens.spacingVerticalXS,
                      color: tokens.colorNeutralForeground3,
                      textAlign: "right",
                    }}
                  >
                    {comment.length}/{MAX_REVIEW_LENGTH} characters
                  </Caption1>
                </div>
              </div>
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => {
                  setIsReviewDialogOpen(false);
                  setEditingReview(null);
                  setRating(0);
                  setComment("");
                }}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                onClick={handleSubmitReview}
                disabled={rating === 0 || submitReviewMutation.isPending}
              >
                {submitReviewMutation.isPending ? (
                  <Spinner size="tiny" />
                ) : editingReview ? (
                  "Update Review"
                ) : (
                  "Submit Review"
                )}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
