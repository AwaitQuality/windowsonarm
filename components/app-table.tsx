import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Button,
  makeStyles,
  tokens,
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
import {
  AddCircleFilled,
  DismissRegular,
  MailRegular,
  StarRegular,
  ArrowRightRegular,
} from "@fluentui/react-icons";
import dayjs from "dayjs";
import { Post } from "@/lib/generated/prisma/client";
import type { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/hooks/useToast";
import AuthorCell from "@/components/app-table/author-cell";
import StatusCell from "@/components/app-table/status-cell";
import TitleCell from "@/components/app-table/title-cell";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import type { PostsResponse } from "@/app/api/v1/posts/route";
import { aqApi } from "@/lib/http/client";
import type { UpvoteRequest } from "@/app/api/v1/posts/upvote/route";

const GoogleAdsense = dynamic(() => import("./google-adsense"), { ssr: false });

const useStyles = makeStyles({
  /**
   * The title cell holds a real <a>, and its ::after is stretched across this
   * row so the whole row is clickable without a second click handler: keyboard
   * focus, middle-click and "open in new tab" all keep working, and there is
   * only ever one navigation target per row.
   */
  appRow: {
    position: "relative",
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  responsiveCell: {
    display: "table-cell",

    // Default widths for full desktop view
    "&:first-child": { width: "33%" }, // Title
    "&:nth-child(2)": { width: "15%" }, // Status
    "&:nth-child(3)": { width: "20%" }, // Company
    "&:nth-child(4)": { width: "20%" }, // Author
    "&:nth-child(5)": { width: "12%" }, // Last Updated

    "@media (max-width: 1024px)": {
      "&:nth-child(5)": {
        display: "none",
      },
      // Adjust remaining columns
      "&:first-child": { width: "35%" },
      "&:nth-child(2)": { width: "20%" },
      "&:nth-child(3)": { width: "25%" },
      "&:nth-child(4)": { width: "20%" },
    },
    "@media (max-width: 768px)": {
      "&:nth-child(4)": {
        display: "none",
      },
      "&:nth-child(3)": {
        display: "none",
      },
      // Show only title and status
      "&:first-child": { width: "60%" },
      "&:nth-child(2)": { width: "40%" },
    },
    "@media (max-width: 480px)": {
      // Keep title and status visible
      "&:first-child": { width: "70%" },
      "&:nth-child(2)": { width: "30%" },
      "&:nth-child(n+3)": {
        // Hide everything after status
        display: "none",
      },
    },
  },
  tableContainer: {
    overflowX: "auto",
    marginBottom: "1rem",
    "@media (max-width: 640px)": {
      overflowX: "hidden",
      padding: "0 1rem",
    },
  },
  table: {
    tableLayout: "fixed",
    width: "100%",
  },
  featuredCell: {
    "@media (max-width: 640px)": {
      padding: "0.75rem !important",

      "& .featured-icon": {
        padding: "0.5rem !important",
        "& svg": {
          fontSize: "20px !important",
        },
      },

      "& .featured-title": {
        fontSize: "1rem !important",
        lineHeight: "1.25rem !important",
      },

      "& .featured-description": {
        fontSize: "0.875rem !important",
        lineHeight: "1.25rem !important",
      },

      "& .gap-6": {
        gap: "0.75rem !important",
      },
    },
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
  query: UseInfiniteQueryResult<InfiniteData<PostsResponse>, Error>;
  /**
   * @deprecated Rows navigate through the real `<Link>` in the title cell, so
   * this callback is no longer invoked. Kept so existing callers still compile.
   */
  onAppClick?: (app: FullPost) => void;
}

const AppTable: React.FC<AppTableProps> = ({ query }) => {
  const styles = useStyles();
  const {
    data,
    isPending,
    isError,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = query;

  const { notify } = useToast();
  const queryClient = useQueryClient();
  const [errorDismissed, setErrorDismissed] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const posts = useMemo(
    () => data?.pages.flatMap((page) => page.posts) ?? [],
    [data],
  );

  // Infinite scroll: a sentinel below the table avoids reading layout on every
  // scroll event.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleFeatureClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const toggleUpvoteInCache = useCallback(
    (postId: string) => {
      queryClient.setQueriesData<InfiniteData<PostsResponse>>(
        { queryKey: ["posts"] },
        (current) => {
          if (!current) return current;
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              posts: page.posts.map((p) =>
                p.id === postId
                  ? {
                      ...p,
                      userUpvoted: !p.userUpvoted,
                      _count: {
                        ...p._count,
                        upvotes: p._count.upvotes + (p.userUpvoted ? -1 : 1),
                      },
                    }
                  : p,
              ),
            })),
          };
        },
      );
    },
    [queryClient],
  );

  const upvoteMutation = useMutation({
    mutationFn: async (post: FullPost) => {
      const response = await aqApi.post<Post, UpvoteRequest>(
        "/api/v1/posts/upvote",
        { postId: post.id },
      );
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (post: FullPost) => {
      await queryClient.cancelQueries({ queryKey: ["posts"] });
      toggleUpvoteInCache(post.id);
      return { postId: post.id };
    },
    onError: (error: Error, post: FullPost) => {
      // Roll the optimistic flip back.
      toggleUpvoteInCache(post.id);
      notify("Failed to upvote", error.message, "error");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const { mutate: upvote } = upvoteMutation;

  const onUpvoteClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, post: FullPost) => {
      e.stopPropagation();
      upvote(post);
    },
    [upvote],
  );

  if (isError && !errorDismissed) {
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
              aria-label="Dismiss"
              appearance="transparent"
              icon={<DismissRegular />}
              onClick={() => setErrorDismissed(true)}
            />
          }
        >
          <Button onClick={() => query.refetch()}>Retry</Button>
        </MessageBarActions>
      </MessageBar>
    );
  }

  const renderCell = (item: FullPost, column: Column) => {
    switch (column.columnKey) {
      case "title":
        return <TitleCell item={item} onUpvoteClick={onUpvoteClick} />;
      case "status":
        return (
          <StatusCell
            status={item.effective_status ?? item.status}
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
      <Table aria-label="Applications table" className={styles.table}>
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
              className={`!p-4 border-b-2 border-blue-500/20 ${styles.featuredCell}`}
            >
              <a
                href="mailto:dejan@thearcadia.xyz?subject=Feature%20Request%20for%20Windows%20on%20ARM&body=I%20would%20like%20to%20feature%20my%20app%20on%20Windows%20on%20ARM."
                className="relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 blur-2xl opacity-50 group-hover:opacity-75 transition-all duration-500" />
                <div className="relative flex items-center gap-6">
                  <div className="featured-icon flex-shrink-0 p-3 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                    <StarRegular
                      className="text-blue-500 group-hover:scale-110 transition-transform duration-300"
                      fontSize={32}
                    />
                  </div>
                  <div className="flex-grow space-y-1">
                    <div className="featured-title font-semibold text-xl group-hover:text-blue-500 transition-colors duration-300">
                      Want to promote your Windows on ARM application?
                    </div>
                    <div className="featured-description text-gray-500">
                      Get featured at the top of our list and reach thousands of
                      Windows on ARM users while supporting our work.
                      <div className="flex items-center gap-1 text-blue-500 mt-1 *:group-hover:translate-x-1 transition-transform duration-300">
                        Contact us <ArrowRightRegular />
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            </TableCell>
          </TableRow>

          {/* AdSense Row */}
          <TableRow>
            <TableCell colSpan={columns.length} className="!p-4">
              <div className="h-[120px] w-full overflow-hidden">
                <div className="relative w-full h-full">
                  <GoogleAdsense className="w-full h-[120px]" />
                </div>
              </div>
            </TableCell>
          </TableRow>

          {/* Regular Rows */}
          {!isPending &&
            posts.map((item) => (
              <TableRow key={item.id} className={styles.appRow}>
                {columns.map((column) => (
                  <TableCell
                    key={`${item.id}-${column.columnKey}`}
                    className={styles.responsiveCell}
                    // Inline, because Fluent's own cell class sets
                    // `position: relative` and would otherwise trap the title
                    // link's stretched ::after inside this one cell.
                    style={{ position: "static" }}
                  >
                    {renderCell(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
      {/* Sentinel observed for infinite scroll. */}
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
      {isPending || isFetchingNextPage ? (
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
