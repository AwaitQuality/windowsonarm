"use client";

import React from "react";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import AppDescription from "./app-description";
import AppSidebar from "./app-sidebar";
import Reviews from "@/components/post/reviews";
import ForumMessages from "@/components/post/forum-messages";
import Giscus from "@giscus/react";
import { Card } from "@fluentui/react-components";

interface AppContentProps {
  app: FullPost;
  info: InfoResponse;
}

export default function AppContent({ app, info }: AppContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
      <div className="lg:col-span-2">
        <AppDescription app={app} />
        <Reviews postId={app.id} />
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
