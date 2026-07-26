import React from "react";
import { TableCellLayout } from "@fluentui/react-components";
import { Status } from "@/lib/generated/prisma/client";
import CommunityVoteIndicator from "@/components/voting/community-vote-indicator";
import { FluentIcon } from "@/lib/hooks/useFluentIcon";

interface StatusCellProps {
  status: Status | null;
  communityVoted?: boolean;
}

const StatusCell: React.FC<StatusCellProps> = ({ status, communityVoted }) => {
  return (
    <TableCellLayout media={status ? <FluentIcon name={status.icon} /> : null}>
      <span className="inline-flex items-center gap-1.5">
        {status?.name || "Testing"}
        {communityVoted && <CommunityVoteIndicator />}
      </span>
    </TableCellLayout>
  );
};

export default StatusCell;
