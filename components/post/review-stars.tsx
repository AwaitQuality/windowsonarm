import { makeStyles } from "@fluentui/react-components";
import { StarFilled, StarRegular } from "@fluentui/react-icons";

export const STAR_COLOR = "#FFB400";

const STARS = [1, 2, 3, 4, 5] as const;

const useStyles = makeStyles({
  root: {
    display: "flex",
    gap: "2px",
    color: STAR_COLOR,
  },
});

interface ReviewStarsProps {
  rating: number;
  size?: "small" | "large";
  /** Describes what the rating belongs to, e.g. "Average rating". */
  label: string;
}

/** Read-only star rendering of a 1-5 rating. */
const ReviewStars = ({ rating, size = "small", label }: ReviewStarsProps) => {
  const styles = useStyles();

  return (
    <div
      className={styles.root}
      role="img"
      aria-label={`${label}: ${rating} out of 5 stars`}
    >
      {STARS.map((star) => (
        <span
          key={star}
          aria-hidden
          style={{ fontSize: size === "large" ? "20px" : "16px" }}
        >
          {star <= rating ? <StarFilled /> : <StarRegular />}
        </span>
      ))}
    </div>
  );
};

export default ReviewStars;
