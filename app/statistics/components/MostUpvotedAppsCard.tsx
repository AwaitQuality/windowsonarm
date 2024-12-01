import { Card, Title2, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, TableCellLayout } from "@fluentui/react-components";
import { ThumbLikeRegular } from "@fluentui/react-icons";

interface UpvoteStats {
  title: string;
  upvotes: number;
}

interface MostUpvotedAppsCardProps {
  upvoteStats: UpvoteStats[];
}

export const MostUpvotedAppsCard: React.FC<MostUpvotedAppsCardProps> = ({ upvoteStats }) => {
  return (
    <Card 
      className="p-6 rounded-lg shadow-md" 
      appearance="filled-alternative"
    >
      <div className="flex items-center gap-3 mb-4">
        <ThumbLikeRegular className="text-green-500 text-2xl" />
        <Title2>Most Upvoted Apps</Title2>
      </div>
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-neutral-800">
            <TableHeaderCell className="text-neutral-400">App</TableHeaderCell>
            <TableHeaderCell className="text-neutral-400">Upvotes</TableHeaderCell>
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
                  <span className="font-semibold text-green-400">{app.upvotes}</span>
                </TableCellLayout>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}; 