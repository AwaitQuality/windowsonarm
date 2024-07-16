import React from "react";
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
  return (
    <TableCellLayout
      media={
        <div className="flex gap-2">
          {item.upvotes && (
            <Button
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
          )}
          {item.icon_url ? (
            <img
              src={item.icon_url}
              style={{ width: "32px", height: "32px", display: "inline" }}
              alt={item.title}
            />
          ) : (
            <Avatar aria-label={item.title} name={item.title} />
          )}
        </div>
      }
    >
      {item.title}
    </TableCellLayout>
  );
};

export default TitleCell;
