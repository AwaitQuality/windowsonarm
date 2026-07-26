import React from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
} from "@fluentui/react-components";
import { ThumbLikeRegular } from "@fluentui/react-icons";
import { StatCard } from "./StatCard";
import { UpvotedApp } from "../types";

interface MostUpvotedAppsCardProps {
  upvoteStats: UpvotedApp[];
}

export const MostUpvotedAppsCard: React.FC<MostUpvotedAppsCardProps> = ({
  upvoteStats,
}) => {
  return (
    <StatCard
      title="Most Upvoted Apps"
      icon={<ThumbLikeRegular className="text-green-500 text-2xl" />}
    >
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-neutral-800">
            <TableHeaderCell className="text-neutral-400">App</TableHeaderCell>
            <TableHeaderCell className="text-neutral-400">
              Upvotes
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {upvoteStats.map((app) => (
            <TableRow key={app.title} className="border-b border-neutral-800">
              <TableCell>
                <TableCellLayout>
                  <span className="text-neutral-200">{app.title}</span>
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <span className="font-semibold text-green-400">
                    {app.upvotes}
                  </span>
                </TableCellLayout>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StatCard>
  );
};
