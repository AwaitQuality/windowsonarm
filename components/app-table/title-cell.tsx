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

const TitleCell: React.FC<TitleCellProps> = ({ item, onUpvoteClick }) => (
  <TableCellLayout
    media={
      <div className="flex gap-2 items-center">
        {item.upvotes && (
          <Button
            aria-label={item.userUpvoted ? "Remove upvote" : "Upvote"}
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
            alt={`${item.title} icon`}
            className="inline w-8 h-8 object-contain"
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

export default TitleCell;
