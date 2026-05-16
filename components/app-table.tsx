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
} from "@fluentui/react-components";
import { AddCircleFilled, DismissRegular } from "@fluentui/react-icons";
import dayjs from "dayjs";
import { Post } from "@prisma/client";
import { UseInfiniteQueryResult } from "@tanstack/react-query";

import AuthorCell from "@/components/app-table/author-cell";
import StatusCell from "@/components/app-table/status-cell";
import TitleCell from "@/components/app-table/title-cell";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { PostsResponse } from "@/app/api/v1/posts/route";
import { aqApi } from "@/lib/axios/api";
import { UpvoteRequest } from "@/app/api/v1/posts/upvote/route";
import { useToast } from "@/lib/hooks/useToast";

const useStyles = makeStyles({
  responsiveCell: {
    "@media (max-width: 640px)": {
      "&:nth-child(n+3)": { display: "none" },
    },
    "@media (max-width: 768px)": {
      "&:nth-child(n+4)": { display: "none" },
    },
    "@media (max-width: 1024px)": {
      "&:nth-child(n+5)": { display: "none" },
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

const COLUMNS: Column[] = [
  { columnKey: "title", label: "Application" },
  { columnKey: "status", label: "Status" },
  { columnKey: "company", label: "Company" },
  { columnKey: "author", label: "Author" },
  { columnKey: "lastUpdated", label: "Last updated" },
];

interface AppTableProps {
  query: UseInfiniteQueryResult<{ pages: PostsResponse[] }, Error>;
  onAppClick?: (app: FullPost) => void;
}

const AppTable: React.FC<AppTableProps> = ({ query, onAppClick }) => {
  const styles = useStyles();
  const {
    data,
    status,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = query;
  const isPending = status === "pending";

  const [optimisticPosts, setOptimisticPosts] = useState<FullPost[]>([]);
  const { notify } = useToast();

  useEffect(() => {
    if (data) {
      setOptimisticPosts(data.pages.flatMap((page) => page.posts));
    }
  }, [data]);

  useEffect(() => {
    const handleScroll = () => {
      const { scrollHeight, scrollTop, clientHeight } = document.documentElement;
      const reachedBottom = scrollTop + clientHeight >= scrollHeight - 32;
      const allFits = scrollHeight <= clientHeight;
      if ((reachedBottom || allFits) && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

    const toggle = (posts: FullPost[]) =>
      posts.map((p) =>
        p.id === post.id ? { ...p, userUpvoted: !p.userUpvoted } : p,
      );

    setOptimisticPosts(toggle);

    const response = await aqApi.post<Post, UpvoteRequest>(
      "/api/v1/posts/upvote",
      { postId: post.id },
    );

    if (!response.success) {
      setOptimisticPosts(toggle);
      notify("Failed to upvote", response.error, "error");
    }
  };

  const renderCell = (item: FullPost, column: Column) => {
    const displayStatus = item.effective_status ?? item.status;
    switch (column.columnKey) {
      case "title":
        return <TitleCell item={item} onUpvoteClick={onUpvoteClick} />;
      case "status":
        return (
          <StatusCell
            status={displayStatus}
            communityVoted={item.community_voted}
          />
        );
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
      <Table aria-label="Responsive table">
        <TableHeader>
          <TableRow>
            {COLUMNS.map((column) => (
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
          {!isPending &&
            optimisticPosts.map((item) => (
              <TableRow
                key={item.id}
                onClick={() => onAppClick?.(item)}
              >
                {COLUMNS.map((column) => (
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
      {isPending ? (
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
