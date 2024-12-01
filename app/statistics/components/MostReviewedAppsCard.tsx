import { Card, Title2, Table, TableHeader, TableRow, TableHeaderCell, TableBody, TableCell, TableCellLayout } from "@fluentui/react-components";
import { StarRegular, NumberSymbolRegular } from "@fluentui/react-icons";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface MostReviewedApp {
  title: string;
  review_count: number;
  avg_rating: number;
}

interface MostReviewedAppsCardProps {
  mostReviewedApps: MostReviewedApp[];
  variant?: 'chart' | 'table';
}

export const MostReviewedAppsCard: React.FC<MostReviewedAppsCardProps> = ({ 
  mostReviewedApps,
  variant = 'chart'
}) => {
  if (variant === 'chart') {
    return (
      <Card 
        className="p-6 rounded-lg shadow-md" 
        appearance="filled-alternative"
      >
        <div className="flex items-center gap-3 mb-4">
          <StarRegular className="text-yellow-500 text-2xl" />
          <Title2>Most Reviewed Apps</Title2>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mostReviewedApps}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9CA3AF" />
              <YAxis 
                type="category" 
                dataKey="title" 
                stroke="#9CA3AF"
                width={150}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Bar 
                dataKey="review_count" 
                fill="#EAB308"
                radius={[0, 4, 4, 0]}
              >
                {mostReviewedApps.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={`hsl(48, ${90 - (index * 10)}%, 50%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="p-6 rounded-lg shadow-md" 
      appearance="filled-alternative"
    >
      <div className="flex items-center gap-3 mb-4">
        <NumberSymbolRegular className="text-purple-500 text-2xl" />
        <Title2>Most Reviewed Apps</Title2>
      </div>
      <Table className="w-full">
        <TableHeader>
          <TableRow className="border-b border-neutral-800">
            <TableHeaderCell className="text-neutral-400">App</TableHeaderCell>
            <TableHeaderCell className="text-neutral-400">Reviews</TableHeaderCell>
            <TableHeaderCell className="text-neutral-400">Rating</TableHeaderCell>
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
                  <span className="font-semibold text-neutral-200">{app.review_count}</span>
                </TableCellLayout>
              </TableCell>
              <TableCell>
                <TableCellLayout>
                  <div className="flex items-center gap-2">
                    <StarRegular className="text-yellow-500" />
                    <span className="font-semibold text-yellow-400">{app.avg_rating.toFixed(1)}</span>
                  </div>
                </TableCellLayout>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}; 