import React, { useEffect, useId, useState } from "react";
import {
  Button,
  Caption1,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Label,
  makeStyles,
  Spinner,
  tokens,
} from "@fluentui/react-components";
import { StarFilled, StarRegular } from "@fluentui/react-icons";
import type { Review } from "@/lib/types/review";

export const MAX_REVIEW_LENGTH = 2000;

const STARS = [1, 2, 3, 4, 5] as const;

const useStyles = makeStyles({
  fields: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
  },
  starGroup: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
    marginTop: tokens.spacingVerticalS,
  },
  textarea: {
    width: "100%",
    marginTop: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    resize: "vertical",
    minHeight: "100px",
  },
  counter: {
    display: "block",
    marginTop: tokens.spacingVerticalXS,
    color: tokens.colorNeutralForeground3,
    textAlign: "right",
  },
});

export interface ReviewDraft {
  rating: number;
  comment: string;
}

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Non-null when editing an existing review, which seeds the draft. */
  editingReview: Review | null;
  isSubmitting: boolean;
  onSubmit: (draft: ReviewDraft) => void;
}

const ReviewDialog = ({
  open,
  onOpenChange,
  editingReview,
  isSubmitting,
  onSubmit,
}: ReviewDialogProps) => {
  const styles = useStyles();
  const commentId = useId();
  // Seeded from props rather than reset in an effect: the parent gives this
  // component a `key` per edit target, so each open mounts a fresh draft.
  const [rating, setRating] = useState(editingReview?.rating ?? 0);
  const [comment, setComment] = useState(editingReview?.comment ?? "");

  return (
    <Dialog open={open} onOpenChange={(_e, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            {editingReview ? "Edit Review" : "Write a Review"}
          </DialogTitle>
          <DialogContent>
            <div className={styles.fields}>
              <div>
                <Label id={`${commentId}-rating-label`}>Overall Rating</Label>
                <div
                  className={styles.starGroup}
                  role="radiogroup"
                  aria-labelledby={`${commentId}-rating-label`}
                >
                  {STARS.map((star) => (
                    <Button
                      key={star}
                      appearance="subtle"
                      role="radio"
                      aria-checked={star === rating}
                      aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
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
                <Label htmlFor={commentId}>Review (optional)</Label>
                <textarea
                  id={commentId}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this app..."
                  className={styles.textarea}
                  maxLength={MAX_REVIEW_LENGTH}
                  aria-describedby={`${commentId}-counter`}
                />
                <Caption1 id={`${commentId}-counter`} className={styles.counter}>
                  {comment.length}/{MAX_REVIEW_LENGTH} characters
                </Caption1>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={() => onSubmit({ rating, comment })}
              disabled={rating === 0 || isSubmitting}
            >
              {isSubmitting ? (
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
  );
};

export default ReviewDialog;
