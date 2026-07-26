"use client";

import React from "react";
import dynamic from "next/dynamic";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import type { Review } from "@/lib/types/review";
import AppDescription from "./app-description";
import AppSidebar from "./app-sidebar";
import { Card, Skeleton, SkeletonItem } from "@fluentui/react-components";

const SectionPlaceholder = ({ height }: { height: string }) => (
  <Skeleton className="mb-8">
    <SkeletonItem style={{ height }} />
  </Skeleton>
);

/**
 * Everything below the description is below the fold and fetches its own data,
 * so none of it belongs in the initial payload for this route. Giscus in
 * particular injects its own iframe and cannot render on the server at all.
 */
const Reviews = dynamic(() => import("@/components/post/reviews"), {
  ssr: false,
  loading: () => <SectionPlaceholder height="240px" />,
});

const ForumMessages = dynamic(() => import("@/components/post/forum-messages"), {
  ssr: false,
  loading: () => <SectionPlaceholder height="200px" />,
});

const Giscus = dynamic(() => import("@giscus/react"), {
  ssr: false,
  loading: () => <SectionPlaceholder height="150px" />,
});

interface AppContentProps {
  /** Prefetched during the server render. */
  initialReviews?: Review[];
  app: FullPost;
  info: InfoResponse;
}

export default function AppContent({
  app,
  info,
  initialReviews,
}: AppContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2">
        <AppDescription app={app} />
        <Reviews postId={app.id} initialReviews={initialReviews} />
        <ForumMessages postId={app.id} />

        <Card
          className="rounded-lg shadow-md p-6 mb-8"
          appearance={"filled-alternative"}
          size="large"
        >
          <Giscus
            repo="AwaitQuality/windowsonarm"
            repoId="R_kgDOMUHZaw"
            category="General"
            categoryId="DIC_kwDOMUHZa84Cg2tJ"
            mapping="specific"
            term={app.title}
            strict="0"
            theme={"noborder_dark"}
            reactionsEnabled="0"
            emitMetadata="0"
            inputPosition="bottom"
            lang="en"
          />
        </Card>
      </div>

      <div className="lg:col-span-1">
        <AppSidebar app={app} info={info} />
      </div>
    </div>
  );
}
