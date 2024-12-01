import { Card, Title2, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, TableCellLayout } from "@fluentui/react-components";
import { AppFolderRegular } from "@fluentui/react-icons";

interface StatusDistributionCardProps {
  appsPerStatus: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

export const StatusDistributionCard: React.FC<StatusDistributionCardProps> = ({ appsPerStatus }) => {
  return (
    <Card 
      className="p-6 rounded-lg shadow-md" 
      appearance="filled-alternative"
    >
      <div className="flex items-center gap-3 mb-4">
        <AppFolderRegular className="text-purple-500 text-2xl" />
        <Title2>Status Distribution</Title2>
      </div>
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-neutral-800">
            <TableHeaderCell className="text-neutral-400">Status</TableHeaderCell>
            <TableHeaderCell className="text-neutral-400">Count</TableHeaderCell>
            <TableHeaderCell className="text-neutral-400">Percentage</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appsPerStatus.map((status) => (
            <TableRow key={status.status} className="border-b border-neutral-800">
              <TableCell>
                <TableCellLayout>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    <span className="text-neutral-200">{status.status}</span>
                  </div>
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <span className="font-semibold text-neutral-200">{status.count}</span>
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <span className="font-semibold text-neutral-200">{status.percentage.toFixed(1)}%</span>
                </TableCellLayout>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}; 