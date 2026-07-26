import React from "react";
import Link from "next/link";
import { Avatar, Button, TableCellLayout } from "@fluentui/react-components";
import {
  KeyboardShiftUppercase20Filled,
  KeyboardShiftUppercase20Regular,
} from "@fluentui/react-icons";
import { FullPost } from "@/lib/types/prisma/prisma-types";

interface TitleCellProps {
  item: FullPost;
  onUpvoteClick: (
    e: React.MouseEvent<HTMLButtonElement>,
    post: FullPost,
  ) => void;
}

const TitleCell: React.FC<TitleCellProps> = ({ item, onUpvoteClick }) => {
  const upvoteCount = item._count?.upvotes ?? 0;

  return (
    <TableCellLayout
      media={
        <div className="flex items-center gap-2">
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
      <Link
        href={`/${item.id}`}
        className="break-words hover:underline focus-visible:underline"
      >
        {item.title}
      </Link>
    </TableCellLayout>
  );
};

export default TitleCell;
