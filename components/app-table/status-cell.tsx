import React from "react";
import { TableCellLayout } from "@fluentui/react-components";
import { Status } from "@prisma/client";
import { getFluentIcon } from "@/lib/hooks/useFluentIcon";
import CommunityVoteIndicator from "@/components/voting/community-vote-indicator";

interface StatusCellProps {
  status: Status | null;
  communityVoted?: boolean;
}

const StatusCell: React.FC<StatusCellProps> = ({ status, communityVoted }) => {
  const Icon = getFluentIcon(status?.icon);

  return (
    <TableCellLayout media={status ? <Icon /> : null}>
      <span className="inline-flex items-center gap-1.5">
        {status?.name || "Testing"}
        {communityVoted && <CommunityVoteIndicator />}
      </span>
    </TableCellLayout>
  );
};

export default StatusCell;
