import { Button, makeStyles, Text, tokens } from "@fluentui/react-components";
import ReviewCard from "@/components/post/review-card";
import type { Review } from "@/lib/types/review";

const useStyles = makeStyles({
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
  emptyStateCopy: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  emptyStateDescription: {
    color: tokens.colorNeutralForeground2,
  },
});

interface ReviewListProps {
  reviews: Review[];
  /** Clerk id of the signed-in user, used to decide who may edit. */
  currentUserId?: string;
  isAdmin: boolean;
  isSignedIn: boolean;
  deletingReviewId?: string;
  onEdit: (review: Review) => void;
  onDelete: (review: Review) => void;
  onWriteReview: () => void;
}

const ReviewList = ({
  reviews,
  currentUserId,
  isAdmin,
  isSignedIn,
  deletingReviewId,
  onEdit,
  onDelete,
  onWriteReview,
}: ReviewListProps) => {
  const styles = useStyles();

  if (reviews.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyStateCopy}>
          <Text as="h3" size={500} weight="semibold">
            No reviews yet
          </Text>
          <Text as="p" size={300} className={styles.emptyStateDescription}>
            Be the first to share your experience
          </Text>
        </div>
        {isSignedIn && (
          <Button appearance="primary" onClick={onWriteReview} size="large">
            Write a Review
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          canEdit={review.user_id === currentUserId}
          canDelete={isAdmin}
          isDeleting={deletingReviewId === review.id}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ReviewList;
