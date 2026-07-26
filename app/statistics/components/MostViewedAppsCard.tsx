import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import { EyeRegular } from "@fluentui/react-icons";
import { StatCard } from "./StatCard";
import { MostViewedApp } from "../types";

interface MostViewedAppsCardProps {
  mostViewedApps: MostViewedApp[];
}

/**
 * Table half of the pair. The chart half lives in `MostViewedAppsChartCard` so
 * recharts is not pulled in by the table.
 */
export function MostViewedAppsCard({
  mostViewedApps,
}: MostViewedAppsCardProps) {
  return (
    <StatCard title="Most Viewed Apps" icon={<EyeRegular />}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>App</TableHeaderCell>
            <TableHeaderCell>Views</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mostViewedApps.map((app) => (
            <TableRow key={app.title}>
              <TableCell>
                <Text weight="semibold">{app.title}</Text>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <EyeRegular />
                  {app.view_count}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </StatCard>
  );
}
