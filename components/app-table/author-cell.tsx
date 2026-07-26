import React from "react";
import { Avatar, TableCellLayout } from "@fluentui/react-components";
import type { ClerkUserSummary } from "@/lib/types/clerk";

interface AuthorCellProps {
  user: ClerkUserSummary | null;
}

const AuthorCell: React.FC<AuthorCellProps> = ({ user }) => {
  const name = user?.username || "Anonymous";

  return (
    <TableCellLayout
      media={
        <Avatar
          aria-label={name}
          name={name}
          image={{
            src: user?.imageUrl ? user.imageUrl : undefined,
          }}
        />
      }
    >
      {name}
    </TableCellLayout>
  );
};

export default AuthorCell;
