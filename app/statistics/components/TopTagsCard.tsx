import { Card, Title2, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, TableCellLayout } from "@fluentui/react-components";
import { TagRegular } from "@fluentui/react-icons";

interface TopTagsCardProps {
  topTags: Array<{
    tag: string;
    count: number;
  }>;
}

export const TopTagsCard: React.FC<TopTagsCardProps> = ({ topTags }) => {
  return (
    <Card 
      className="p-6 rounded-lg shadow-md" 
      appearance="filled-alternative"
    >
      <div className="flex items-center gap-3 mb-4">
        <TagRegular className="text-red-500 text-2xl" />
        <Title2>Popular Tags</Title2>
      </div>
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-neutral-800">
            <TableHeaderCell className="text-neutral-400">Tag</TableHeaderCell>
            <TableHeaderCell className="text-neutral-400">Count</TableHeaderCell>
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
                  <span className="font-semibold text-neutral-200">{tag.count}</span>
                </TableCellLayout>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}; 