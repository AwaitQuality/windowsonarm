import React from "react";
import { Card, CardHeader } from "@fluentui/react-components";

export const BlogCardSkeleton = () => {
  return (
    <Card appearance="filled-alternative" className="p-6 hover:shadow-lg transition-all h-full flex flex-col">
      <div className="aspect-video mb-4 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-md" />
      <CardHeader>
        <div className="space-y-4 w-full">
          <div className="h-8 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded w-3/4" />
          <div className="flex items-center space-x-4">
            <div className="h-5 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded w-32" />
            <div className="h-5 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded w-24" />
          </div>
        </div>
      </CardHeader>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded w-full" />
        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded w-5/6" />
        <div className="h-4 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded w-4/6" />
      </div>
      <div className="mt-6">
        <div className="h-9 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded w-full" />
      </div>
    </Card>
  );
}; 