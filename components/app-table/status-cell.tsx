import React from "react";
import { TableCellLayout } from "@fluentui/react-components";
import * as FluentIcons from "@fluentui/react-icons";
import { Status } from "@prisma/client";

interface StatusCellProps {
  status: Status | null;
}

const StatusCell: React.FC<StatusCellProps> = ({ status }) => {
  const getIconByStatus = (status: Status) => {
    // @ts-ignore
    const Icon = FluentIcons[status.icon];
    return <Icon />;
  };

  return (
    <TableCellLayout media={status && getIconByStatus(status)}>
      {status?.name || "Testing"}
    </TableCellLayout>
  );
};

export default StatusCell;
