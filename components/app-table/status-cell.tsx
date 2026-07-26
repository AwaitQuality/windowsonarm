import React from "react";
import { TableCellLayout } from "@fluentui/react-components";
import * as FluentIcons from "@fluentui/react-icons";
import { Status } from "@prisma/client";
import CommunityVoteIndicator from "@/components/voting/community-vote-indicator";

interface StatusCellProps {
  status: Status | null;
  communityVoted?: boolean;
}

const StatusCell: React.FC<StatusCellProps> = ({ status, communityVoted }) => {
  const getIconByStatus = (status: Status) => {
    // @ts-ignore
    const Icon = FluentIcons[status.icon];

    if (!Icon) {
      return <FluentIcons.InfoRegular />;
    }

    return <Icon />;
  };

  return (
    <TableCellLayout media={status && getIconByStatus(status)}>
      <span className="inline-flex items-center gap-1.5">
        {status?.name || "Testing"}
        {communityVoted && <CommunityVoteIndicator />}
      </span>
    </TableCellLayout>
  );
};

export default StatusCell;
