import {
  Avatar,
  Button,
  Caption1,
  makeStyles,
  Spinner,
  Text,
  tokens,
} from "@fluentui/react-components";
import { DeleteRegular, EditRegular } from "@fluentui/react-icons";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ReviewStars from "@/components/post/review-stars";
import type { Review } from "@/lib/types/review";

dayjs.extend(relativeTime);

const useStyles = makeStyles({
  card: {
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
  header: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalS,
    alignItems: "center",
  },
  headerBody: {
    flex: 1,
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  actions: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
  comment: {
    overflowWrap: "break-word",
  },
});

interface ReviewCardProps {
  review: Review;
  canEdit: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onEdit: (review: Review) => void;
  onDelete: (review: Review) => void;
}

const ReviewCard = ({
  review,
  canEdit,
  canDelete,
  isDeleting,
  onEdit,
  onDelete,
}: ReviewCardProps) => {
  const styles = useStyles();
  const author = review.user?.username || "Anonymous";

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <Avatar name={author} image={{ src: review.user?.imageUrl }} size={48} />
        <div className={styles.headerBody}>
          <div className={styles.headerRow}>
            <div>
              <Text weight="semibold">{author}</Text>
              <div style={{ marginTop: tokens.spacingVerticalXS }}>
                <ReviewStars
                  rating={review.rating}
                  label={`Rating by ${author}`}
                />
              </div>
            </div>
            <div className={styles.actions}>
              {canEdit && (
                <Button
                  icon={<EditRegular />}
                  appearance="subtle"
                  onClick={() => onEdit(review)}
                >
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  icon={isDeleting ? undefined : <DeleteRegular />}
                  appearance="subtle"
                  onClick={() => onDelete(review)}
                  disabled={isDeleting}
                >
                  {isDeleting ? <Spinner size="tiny" /> : "Delete"}
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
        <div className={styles.comment}>
          <Text>{review.comment}</Text>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;
