import { Caption1, makeStyles, Text, tokens } from "@fluentui/react-components";
import { StarFilled } from "@fluentui/react-icons";
import ReviewStars, { STAR_COLOR } from "@/components/post/review-stars";
import type { Review } from "@/lib/types/review";

const useStyles = makeStyles({
  card: {
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalXL,
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
    display: "flex",
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
    marginInlineStart: tokens.spacingHorizontalXL,
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
});

/** Average rating and the 5-to-1 star histogram for a set of reviews. */
const ReviewSummary = ({ reviews }: { reviews: Review[] }) => {
  const styles = useStyles();

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => review.rating === stars).length;
    return {
      stars,
      count,
      percentage: reviews.length ? (count / reviews.length) * 100 : 0,
    };
  });

  return (
    <div className={styles.card}>
      <div className={styles.averageRating}>
        <span className={styles.ratingNumber}>{averageRating.toFixed(1)}</span>
        <ReviewStars
          rating={Math.round(averageRating)}
          size="large"
          label="Average rating"
        />
        <Caption1>
          {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
        </Caption1>
      </div>

      <div className={styles.distributionContainer}>
        {distribution.map(({ stars, count, percentage }) => (
          <div key={stars} className={styles.distributionRow}>
            <div className={styles.starLabel}>
              <Text>{stars}</Text>
              <StarFilled fontSize={14} style={{ color: STAR_COLOR }} />
            </div>
            <div
              className={styles.progressContainer}
              role="meter"
              aria-label={`${stars} star reviews`}
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={reviews.length}
            >
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
  );
};

export default ReviewSummary;
