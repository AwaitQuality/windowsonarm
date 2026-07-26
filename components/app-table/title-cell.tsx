import React from "react";
import Link from "next/link";
import {
  Avatar,
  Button,
  TableCellLayout,
  makeStyles,
} from "@fluentui/react-components";
import {
  KeyboardShiftUppercase20Filled,
  KeyboardShiftUppercase20Regular,
} from "@fluentui/react-icons";
import { FullPost } from "@/lib/types/prisma/prisma-types";

const useStyles = makeStyles({
  /**
   * One anchor per row, stretched across it.
   *
   * The row carries no click handler: this ::after covers the whole row (which
   * is `position: relative`), so clicking anywhere on the row activates this
   * link. Keyboard focus, middle-click and "open in new tab" keep behaving like
   * the plain link this is.
   */
  stretchedLink: {
    overflowWrap: "break-word",
    ":hover": { textDecorationLine: "underline" },
    ":focus-visible": { textDecorationLine: "underline" },
    "::after": {
      content: '""',
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  },
  /** Sits above the stretched link so upvoting never navigates. */
  media: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    width: "fit-content",
  },
});

interface TitleCellProps {
  item: FullPost;
  onUpvoteClick: (
    e: React.MouseEvent<HTMLButtonElement>,
    post: FullPost,
  ) => void;
}

const TitleCell: React.FC<TitleCellProps> = ({ item, onUpvoteClick }) => {
  const styles = useStyles();
  const upvoteCount = item._count?.upvotes ?? 0;

  return (
    <TableCellLayout
      media={
        <div className={styles.media}>
          <Button
            aria-label={
              item.userUpvoted
                ? `Remove your upvote from ${item.title}`
                : `Upvote ${item.title}`
            }
            aria-pressed={item.userUpvoted}
            title={`${upvoteCount} upvote${upvoteCount === 1 ? "" : "s"}`}
            icon={
              item.userUpvoted ? (
                <KeyboardShiftUppercase20Filled />
              ) : (
                <KeyboardShiftUppercase20Regular />
              )
            }
            appearance="transparent"
            onClick={(e) => onUpvoteClick(e, item)}
          />
          {item.icon_url ? (
            <img
              src={item.icon_url}
              width={32}
              height={32}
              loading="lazy"
              decoding="async"
              style={{ width: "32px", height: "32px", display: "inline" }}
              alt={item.title}
            />
          ) : (
            <Avatar aria-label={item.title} name={item.title} />
          )}
        </div>
      }
    >
      <Link href={`/${item.id}`} className={styles.stretchedLink}>
        {item.title}
      </Link>
    </TableCellLayout>
  );
};

export default TitleCell;
