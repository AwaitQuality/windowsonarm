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
  Toaster,
  ToastIntent,
  ToastTitle,
  useId,
  useToastController,
} from "@fluentui/react-components";
import { AddCircleFilled, DismissRegular } from "@fluentui/react-icons";
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

  const toasterId = useId("toaster");
  const { dispatchToast } = useToastController(toasterId);

  const notify = (
    title: string,
    subtitle?: string,
    intent: ToastIntent = "success",
  ) =>
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {subtitle && <ToastBody>{subtitle}</ToastBody>}
      </Toast>,
      { intent },
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
    post: FullPost,
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
          : p,
      ),
    );

    const response = await aqApi.post<Post, UpvoteRequest>(
      "/api/v1/posts/upvote",
      {
        postId: post.id,
      },
    );

    if (!response.success) {
      setOptimisticPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === post.id
            ? {
                ...p,
                userUpvoted: !p.userUpvoted,
              }
            : p,
        ),
      );

      notify("Failed to upvote", response.error, "error");
    }
  };

  const renderCell = (item: FullPost, column: Column) => {
    switch (column.columnKey) {
      case "title":
        return <TitleCell item={item} onUpvoteClick={onUpvoteClick} />;
      case "status":
        return <StatusCell status={item.statusRel} />;
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
      <Toaster toasterId={toasterId} />

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
