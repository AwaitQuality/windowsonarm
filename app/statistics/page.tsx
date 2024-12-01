"use client";

import React from "react";
import { useQuery } from "react-query";
import {
  Card,
  Title1,
  Title2,
  Text,
  ProgressBar,
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  TableCellLayout,
  Badge,
  Subtitle2,
} from "@fluentui/react-components";
import {
  ChartMultipleRegular,
  TagRegular,
  AppFolderRegular,
  PersonRegular,
  StarRegular,
  TimerRegular,
  DataTrendingRegular,
  NumberSymbolRegular,
  ArrowTrendingRegular,
  ThumbLikeRegular,
} from "@fluentui/react-icons";
import Navigation from "@/components/navigation";
import { aqApi } from "@/lib/axios/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";

interface StatisticsResponse {
  totalApps: number;
  appsPerStatus: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  appsPerCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
  recentActivity: {
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };
  recentStatusChanges: Array<{
    status: string;
    count: number;
    color: string;
  }>;
  activeCategories: Array<{
    category: string;
    count: number;
  }>;
  averageRating: number;
  totalReviews: number;
  recentReviews: {
    averageRating: number;
    totalReviews: number;
  };
  mostReviewedApps: Array<{
    title: string;
    review_count: number;
    avg_rating: number;
  }>;
  upvoteStats: Array<{
    title: string;
    upvotes: number;
  }>;
}

export default function Statistics() {
  const { data, isLoading, error } = useQuery<StatisticsResponse>(
    ["statistics"],
    async () => {
      const response = await aqApi.get<StatisticsResponse>("/api/v1/statistics");
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Navigation className="mb-8" />
        <Title1 className="mb-6">Statistics</Title1>
        <ProgressBar />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Navigation className="mb-8" />
        <Title1 className="mb-6">Statistics</Title1>
        <Text>Error loading statistics.</Text>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Navigation className="mb-8" />
      <Title1 className="mb-6">Statistics</Title1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {/* Total Apps Card */}
        <Card 
          className="p-6 rounded-lg shadow-md" 
          appearance="filled-alternative"
        >
          <div className="flex items-center gap-3 mb-3">
            <ChartMultipleRegular className="text-blue-500 text-2xl" />
            <Title2>Total Apps</Title2>
          </div>
          <Text size={800} className="text-4xl font-bold text-blue-400">{data?.totalApps}</Text>
        </Card>

        {/* Average Rating Card */}
        <Card 
          className="p-6 rounded-lg shadow-md" 
          appearance="filled-alternative"
        >
          <div className="flex items-center gap-3 mb-3">
            <StarRegular className="text-yellow-500 text-2xl" />
            <Title2>Average Rating</Title2>
          </div>
          <Text size={800} className="text-4xl font-bold text-yellow-400">{data?.averageRating.toFixed(1)} / 5.0</Text>
          <Text size={200} className="mt-2 text-neutral-400">Based on {data?.totalReviews} reviews</Text>
          {data?.recentReviews && (
            <div className="mt-3">
              <Badge appearance="filled" className="bg-blue-900 text-blue-200">Last 7 days</Badge>
              <Text size={200} className="mt-2 text-neutral-300">
                {data.recentReviews.totalReviews} new reviews, avg {data.recentReviews.averageRating.toFixed(1)}
              </Text>
            </div>
          )}
        </Card>

        {/* Recent Activity Card */}
        <Card 
          className="p-6 rounded-lg shadow-md" 
          appearance="filled-alternative"
        >
          <div className="flex items-center gap-3 mb-3">
            <TimerRegular className="text-green-500 text-2xl" />
            <Title2>Recent Activity</Title2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text className="text-neutral-400">Last 24 hours</Text>
              <Text className="text-green-400 font-semibold">{data?.recentActivity.lastDay} updates</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text className="text-neutral-400">Last 7 days</Text>
              <Text className="text-green-400 font-semibold">{data?.recentActivity.lastWeek} updates</Text>
            </div>
            <div className="flex items-center justify-between">
              <Text className="text-neutral-400">Last 30 days</Text>
              <Text className="text-green-400 font-semibold">{data?.recentActivity.lastMonth} updates</Text>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Activity Graph */}
        <Card 
          className="p-6 rounded-lg shadow-md" 
          appearance="filled-alternative"
        >
          <div className="flex items-center gap-3 mb-4">
            <DataTrendingRegular className="text-indigo-500 text-2xl" />
            <Title2>Activity Trend</Title2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[
                  { name: 'Last 24h', updates: data?.recentActivity.lastDay || 0 },
                  { name: 'Last 7d', updates: data?.recentActivity.lastWeek || 0 },
                  { name: 'Last 30d', updates: data?.recentActivity.lastMonth || 0 },
                ]}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
                <Line
                  type="monotone"
                  dataKey="updates"
                  stroke="#6366F1"
                  strokeWidth={2}
                  dot={{ fill: '#6366F1' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Category Distribution Pie Chart */}
        <Card 
          className="p-6 rounded-lg shadow-md" 
          appearance="filled-alternative"
        >
          <div className="flex items-center gap-3 mb-4">
            <PersonRegular className="text-orange-500 text-2xl" />
            <Title2>Category Distribution</Title2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.appsPerCategory || []}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={true}
                >
                  {data?.appsPerCategory.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={`hsl(${index * (360 / (data?.appsPerCategory.length || 1))}, 70%, 50%)`} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#9CA3AF' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Most Reviewed Apps Bar Chart */}
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
                data={data?.mostReviewedApps || []}
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
                  {data?.mostReviewedApps.map((entry, index) => (
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

        {/* Recent Status Changes */}
        <Card 
          className="p-6 rounded-lg shadow-md" 
          appearance="filled-alternative"
        >
          <div className="flex items-center gap-3 mb-4">
            <DataTrendingRegular className="text-indigo-500 text-2xl" />
            <Title2>Recent Status Changes (7 Days)</Title2>
          </div>
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-neutral-800">
                <TableHeaderCell className="text-neutral-400">Status</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400">New Apps</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.recentStatusChanges.map((status) => (
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Status Distribution */}
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
              {data?.appsPerStatus.map((status) => (
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

        {/* Popular Tags */}
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
              {data?.topTags.map((tag) => (
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Reviewed Apps */}
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
              {data?.mostReviewedApps.map((app) => (
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

        {/* Most Upvoted Apps */}
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
              {data?.upvoteStats.map((app) => (
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

        {/* Category Distribution */}
        <Card 
          className="p-6 rounded-lg shadow-md" 
          appearance="filled-alternative"
        >
          <div className="flex items-center gap-3 mb-4">
            <PersonRegular className="text-orange-500 text-2xl" />
            <Title2>Category Distribution</Title2>
          </div>
          <Table className="w-full">
            <TableHeader>
              <TableRow className="border-b border-neutral-800">
                <TableHeaderCell className="text-neutral-400">Category</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400">Count</TableHeaderCell>
                <TableHeaderCell className="text-neutral-400">Percentage</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.appsPerCategory.map((category) => (
                <TableRow key={category.category} className="border-b border-neutral-800">
                  <TableCell>
                    <TableCellLayout>
                      <span className="text-neutral-200">{category.category}</span>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <span className="font-semibold text-neutral-200">{category.count}</span>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <TableCellLayout>
                      <span className="font-semibold text-neutral-200">{category.percentage.toFixed(1)}%</span>
                    </TableCellLayout>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Popular Tags */}
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
              {data?.topTags.map((tag) => (
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
      </div>
    </div>
  );
} 