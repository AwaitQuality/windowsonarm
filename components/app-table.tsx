import React, { useEffect, useState } from "react";
import {
  Button,
  makeStyles,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  ProgressBar,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Toast,
  ToastBody,
  ToastIntent,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import {
  AddCircleFilled,
  DismissRegular,
  MailRegular,
  StarRegular,
  ArrowRightRegular,
} from "@fluentui/react-icons";
import dayjs from "dayjs";
import { Post } from "@prisma/client";
import { UseInfiniteQueryResult } from "react-query";
import AuthorCell from "@/components/app-table/author-cell";
import StatusCell from "@/components/app-table/status-cell";
import TitleCell from "@/components/app-table/title-cell";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { PostsResponse } from "@/app/api/v1/posts/route";
import { aqApi } from "@/lib/axios/api";
import { UpvoteRequest } from "@/app/api/v1/posts/upvote/route";

const useStyles = makeStyles({
  responsiveCell: {
    "@media (max-width: 640px)": {
      "&:nth-child(n+3)": {
        display: "none",
      },
    },
    "@media (max-width: 768px)": {
      "&:nth-child(n+4)": {
        display: "none",
      },
    },
    "@media (max-width: 1024px)": {
      "&:nth-child(n+5)": {
        display: "none",
      },
    },
  },
  tableContainer: {
    overflowX: "auto",
    marginBottom: "1rem",
  },
});

interface Column {
  columnKey: string;
  label: string;
}

const columns: Column[] = [
  { columnKey: "title", label: "Application" },
  { columnKey: "status", label: "Status" },
  { columnKey: "company", label: "Company" },
  { columnKey: "author", label: "Author" },
  { columnKey: "lastUpdated", label: "Last updated" },
];

interface AppTableProps {
  query: UseInfiniteQueryResult<PostsResponse, unknown>;
  onAppClick?: (app: FullPost) => void;
}

const AppTable: React.FC<AppTableProps> = ({ query, onAppClick }) => {
  const styles = useStyles();
  const {
    data,
    isLoading,
    isIdle,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = query;

  const [optimisticPosts, setOptimisticPosts] = useState<FullPost[]>([]);

  const { dispatchToast } = useToastController("toaster");

  const notify = (
    title: string,
    subtitle?: string,
    intent: ToastIntent = "success"
  ) =>
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {subtitle && <ToastBody>{subtitle}</ToastBody>}
      </Toast>,
      { intent }
    );

  useEffect(() => {
    if (data) {
      setOptimisticPosts(data.pages.flatMap((page) => page.posts));
    }
  }, [data]);

  const handleScroll = async () => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;

    if (scrollHeight <= clientHeight && hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    } else if (
      scrollTop + clientHeight >= scrollHeight &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      await fetchNextPage();
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage]);

  const handleFeatureClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href =
      "mailto:dejan@thearcadia.xyz?subject=Feature%20Request%20for%20Windows%20on%20ARM&body=I%20would%20like%20to%20feature%20my%20app%20on%20Windows%20on%20ARM.";
  };

  if (isError) {
    return (
      <MessageBar>
        <MessageBarBody>
          <MessageBarTitle>Something went wrong</MessageBarTitle>
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          We couldn't fetch the data. Please try again later.
        </MessageBarBody>
        <MessageBarActions
          containerAction={
            <Button
              aria-label="dismiss"
              appearance="transparent"
              icon={<DismissRegular />}
            />
          }
        >
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </MessageBarActions>
      </MessageBar>
    );
  }

  const onUpvoteClick = async (
    e: React.MouseEvent<HTMLButtonElement>,
    post: FullPost
  ) => {
    e.stopPropagation();

    // Optimistically update the UI
    setOptimisticPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === post.id
          ? {
              ...p,
              userUpvoted: !p.userUpvoted,
            }
          : p
      )
    );

    const response = await aqApi.post<Post, UpvoteRequest>(
      "/api/v1/posts/upvote",
      {
        postId: post.id,
      }
    );

    if (!response.success) {
      setOptimisticPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === post.id
            ? {
                ...p,
                userUpvoted: !p.userUpvoted,
              }
            : p
        )
      );

      notify("Failed to upvote", response.error, "error");
    }
  };

  const renderCell = (item: FullPost, column: Column) => {
    switch (column.columnKey) {
      case "title":
        return <TitleCell item={item} onUpvoteClick={onUpvoteClick} />;
      case "status":
        return <StatusCell status={item.status} />;
      case "company":
        return <TableCellLayout>{item.company}</TableCellLayout>;
      case "author":
        return <AuthorCell user={item.user} />;
      case "lastUpdated":
        return dayjs(item.updated_at).format("YYYY-MM-DD HH:mm");
      default:
        return null;
    }
  };

  return (
    <div className={styles.tableContainer}>
      <Table arial-label="Responsive table">
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHeaderCell
                key={column.columnKey}
                className={styles.responsiveCell}
              >
                {column.label}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Featured Row */}
          <TableRow
            className="cursor-pointer group relative hover:bg-blue-50/5 mb-6"
            onClick={handleFeatureClick}
          >
            <TableCell
              colSpan={columns.length}
              className="!p-4 border-b-2 border-blue-500/20"
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-2xl opacity-50 group-hover:opacity-75 transition-all duration-500" />

                {/* Content */}
                <div className="relative flex items-center gap-6">
                  <div className="flex-shrink-0 p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                    <StarRegular 
                      className="text-blue-500 group-hover:scale-110 transition-transform duration-300" 
                      fontSize={32} 
                    />
                  </div>
                  <div className="flex-grow space-y-2">
                    <div className="font-semibold text-xl group-hover:text-blue-500 transition-colors duration-300">
                      Want to promote your Windows on ARM application and support our work?
                    </div>
                    <div className="text-gray-500 max-w-2xl">
                      Get your application featured at the top of our list and reach thousands of Windows on ARM users. 
                      Perfect for showcasing your ARM-native apps or highlighting your progress on ARM compatibility.
                      <span className="inline-flex items-center gap-1 text-blue-500 mt-2 *:group-hover:translate-x-1 transition-transform duration-300">
                        Contact us to learn more <ArrowRightRegular />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>

          {/* Regular Rows */}
          {!isLoading &&
            !isIdle &&
            optimisticPosts.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => (onAppClick ? onAppClick(item) : undefined)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={`${item.id}-${column.columnKey}`}
                    className={styles.responsiveCell}
                  >
                    {renderCell(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {isLoading || isIdle ? (
        <ProgressBar thickness="large" />
      ) : (
        hasNextPage && (
          <div className={"mt-4"}>
            <Button
              onClick={() => fetchNextPage()}
              appearance="transparent"
              icon={<AddCircleFilled />}
            >
              Load more
            </Button>
          </div>
        )
      )}
    </div>
  );
};

export default AppTable;
