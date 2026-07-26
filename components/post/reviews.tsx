"use client";

import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  makeStyles,
  Spinner,
  Subtitle1,
  tokens,
} from "@fluentui/react-components";
import { useUser } from "@clerk/nextjs";
import ReviewSummary from "@/components/post/review-summary";
import ReviewList from "@/components/post/review-list";
import ReviewDialog, { type ReviewDraft } from "@/components/post/review-dialog";
import { useReviews } from "@/lib/hooks/use-reviews";
import type { Review } from "@/lib/types/review";

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
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "128px",
  },
});

interface ReviewsProps {
  postId: string;
  /** Prefetched on the server; avoids a request on mount. */
  initialReviews?: Review[];
}

export default function Reviews({ postId, initialReviews }: ReviewsProps) {
  const styles = useStyles();
  const { user, isSignedIn } = useUser();
  const { reviews, isPending, submitReview, deleteReview } =
    useReviews(postId, initialReviews);

  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [reviewPendingDeletion, setReviewPendingDeletion] =
    useState<Review | null>(null);

  const isAdmin = user?.publicMetadata?.role === "admin";
  const userReview = reviews.find((review) => review.user_id === user?.id);

  const openNewReview = () => {
    setEditingReview(null);
    setIsReviewDialogOpen(true);
  };

  const openEditReview = (review: Review) => {
    setEditingReview(review);
    setIsReviewDialogOpen(true);
  };

  const handleSubmit = ({ rating, comment }: ReviewDraft) => {
    submitReview.mutate(
      { rating, comment, isUpdate: Boolean(editingReview) },
      {
        onSuccess: () => {
          setIsReviewDialogOpen(false);
          setEditingReview(null);
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!reviewPendingDeletion) return;
    deleteReview.mutate(reviewPendingDeletion.id, {
      onSettled: () => setReviewPendingDeletion(null),
    });
  };

  if (isPending) {
    return (
      <div className={styles.root}>
        <div className={styles.loading}>
          <Spinner size="medium" label="Loading reviews..." />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <Subtitle1>Experience Reviews</Subtitle1>
        {isSignedIn && !userReview && (
          <Button appearance="primary" onClick={openNewReview} size="large">
            Write a Review
          </Button>
        )}
      </div>

      <ReviewSummary reviews={reviews} />

      <ReviewList
        reviews={reviews}
        currentUserId={user?.id}
        isAdmin={isAdmin}
        isSignedIn={Boolean(isSignedIn)}
        deletingReviewId={
          deleteReview.isPending ? reviewPendingDeletion?.id : undefined
        }
        onEdit={openEditReview}
        onDelete={setReviewPendingDeletion}
        onWriteReview={openNewReview}
      />

      <ReviewDialog
        // Remount per edit target so the draft state is seeded, not reset.
        key={editingReview?.id ?? "new-review"}
        open={isReviewDialogOpen}
        onOpenChange={(open) => {
          setIsReviewDialogOpen(open);
          if (!open) setEditingReview(null);
        }}
        editingReview={editingReview}
        isSubmitting={submitReview.isPending}
        onSubmit={handleSubmit}
      />

      <Dialog
        open={reviewPendingDeletion !== null}
        onOpenChange={(_e, data) => {
          if (!data.open) setReviewPendingDeletion(null);
        }}
      >
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogContent>
              Are you sure you want to delete this review? This action cannot be
              undone.
            </DialogContent>
            <DialogActions>
              <Button
                appearance="secondary"
                onClick={() => setReviewPendingDeletion(null)}
              >
                Cancel
              </Button>
              <Button
                appearance="primary"
                className="!bg-red-600 !text-white hover:!bg-red-700"
                onClick={confirmDelete}
                disabled={deleteReview.isPending}
              >
                {deleteReview.isPending ? <Spinner size="tiny" /> : "Delete"}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </div>
  );
}
