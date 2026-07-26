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
import { TagRegular } from "@fluentui/react-icons";
import { StatCard } from "./StatCard";
import { TagCount } from "../types";

interface TopTagsCardProps {
  topTags: TagCount[];
}

export const TopTagsCard: React.FC<TopTagsCardProps> = ({ topTags }) => {
  return (
    <StatCard
      title="Popular Tags"
      icon={<TagRegular className="text-red-500 text-2xl" />}
    >
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-neutral-800">
            <TableHeaderCell className="text-neutral-400">Tag</TableHeaderCell>
            <TableHeaderCell className="text-neutral-400">
              Count
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topTags.map((tag) => (
            <TableRow key={tag.tag} className="border-b border-neutral-800">
              <TableCell>
                <TableCellLayout>
                  <span className="text-neutral-200">{tag.tag}</span>
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <span className="font-semibold text-neutral-200">
                    {tag.count}
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
