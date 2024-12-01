import React from "react";
import {
  Card,
  Subtitle1,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
} from "@fluentui/react-components";
import { EyeRegular } from "@fluentui/react-icons";
import {
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

interface MostViewedApp {
  title: string;
  view_count: number;
}

interface MostViewedAppsCardProps {
  mostViewedApps: MostViewedApp[];
  variant: "chart" | "table";
}

export function MostViewedAppsCard({
  mostViewedApps,
  variant,
}: MostViewedAppsCardProps) {
  return (
    <Card
      className="rounded-lg shadow-md p-6"
      appearance={"filled-alternative"}
      size="large"
    >
      <div className="flex items-center gap-2 mb-4">
        <EyeRegular />
        <Subtitle1>Most Viewed Apps</Subtitle1>
      </div>

      {variant === "chart" ? (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mostViewedApps}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="title"
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip />
              <Bar dataKey="view_count" fill="#0078D4" name="Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHeaderCell>App</TableHeaderCell>
              <TableHeaderCell>Views</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mostViewedApps.map((app, index) => (
              <TableRow key={index}>
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
      )}
    </Card>
  );
} 