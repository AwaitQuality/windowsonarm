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
import { StarRegular, NumberSymbolRegular } from "@fluentui/react-icons";
import { StatCard } from "./StatCard";
import { MostReviewedApp } from "../types";

interface MostReviewedAppsCardProps {
  mostReviewedApps: MostReviewedApp[];
}

/**
 * Table half of the pair. The chart half lives in `MostReviewedAppsChartCard`
 * so recharts is not pulled in by the table.
 */
export const MostReviewedAppsCard: React.FC<MostReviewedAppsCardProps> = ({
  mostReviewedApps,
}) => {
  return (
    <StatCard
      title="Most Reviewed Apps"
      icon={<NumberSymbolRegular className="text-purple-500 text-2xl" />}
    >
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-neutral-800">
            <TableHeaderCell className="text-neutral-400">App</TableHeaderCell>
            <TableHeaderCell className="text-neutral-400">
              Reviews
            </TableHeaderCell>
            <TableHeaderCell className="text-neutral-400">
              Rating
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mostReviewedApps.map((app) => (
            <TableRow key={app.title} className="border-b border-neutral-800">
              <TableCell>
                <TableCellLayout>
                  <span className="text-neutral-200">{app.title}</span>
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <span className="font-semibold text-neutral-200">
                    {app.review_count}
                  </span>
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <div className="flex items-center gap-2">
                    <StarRegular className="text-yellow-500" />
                    <span className="font-semibold text-yellow-400">
                      {app.avg_rating.toFixed(1)}
                    </span>
                  </div>
                </TableCellLayout>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StatCard>
  );
};
