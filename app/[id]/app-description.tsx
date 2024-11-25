"use client";

import React, { useState } from "react";
import { Card, Link as FluentLink, Subtitle1, Tag } from "@fluentui/react-components";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import GlobalMarkdown from "@/components/markdown";

interface AppDescriptionProps {
  app: FullPost;
}

export default function AppDescription({ app }: AppDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Card
        className="rounded-lg p-6 mb-8"
        appearance={"filled-alternative"}
        size="large"
      >
        <GlobalMarkdown>
          {app.description.slice(0, 820) +
            (app.description.length > 820 && !expanded ? "..." : "")}
        </GlobalMarkdown>
        {expanded && <GlobalMarkdown>{app.description.slice(820)}</GlobalMarkdown>}
        {app.description.length > 820 && (
          <div className="mt-4">
            <FluentLink onClick={() => setExpanded(!expanded)}>
              {expanded ? "Show less" : "Show more"}
            </FluentLink>
          </div>
        )}
      </Card>

      {app.tags && app.tags.length > 0 && (
        <Card
          className="rounded-lg shadow-md p-6 mb-8"
          appearance={"filled-alternative"}
          size="large"
        >
          <Subtitle1 className="mb-4">Tags</Subtitle1>
          <div className="flex flex-wrap gap-2">
            {app.tags.map((tag) => (
              <Tag key={tag.id} className="text-sm">
                {tag.name}
              </Tag>
            ))}
          </div>
        </Card>
      )}
    </>
  );
} 