"use client";

import React, { useState } from "react";
import {
  Card,
  Link as FluentLink,
  Subtitle1,
  Tag,
} from "@fluentui/react-components";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import GlobalMarkdown from "@/components/markdown";

interface AppDescriptionProps {
  app: FullPost;
}

/**
 * Descriptions longer than this get collapsed. It only decides whether the
 * toggle appears — the clipping itself is done in CSS, so the text is never cut
 * mid-word.
 */
const COLLAPSE_THRESHOLD = 700;

export default function AppDescription({ app }: AppDescriptionProps) {
  const [expanded, setExpanded] = useState(false);
  const isLong = app.description.length > COLLAPSE_THRESHOLD;
  const clipped = isLong && !expanded;

  return (
    <>
      <Card
        className="rounded-lg p-6 mb-8"
        appearance={"filled-alternative"}
        size="large"
      >
        {/*
          One markdown document, clipped with max-height. It used to be sliced at
          a character count with the remainder rendered as a second markdown
          block, which cut words in half ("creating bar" / "riers") and left a
          stray paragraph break at the seam once expanded.
        */}
        <div className="relative">
          <div
            className={`overflow-hidden break-words transition-[max-height] duration-300 motion-reduce:transition-none ${
              clipped ? "max-h-72" : "max-h-none"
            }`}
          >
            <GlobalMarkdown>{app.description}</GlobalMarkdown>
          </div>

          {clipped && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
              style={{
                backgroundImage:
                  "linear-gradient(to top, var(--colorNeutralBackground2), transparent)",
              }}
            />
          )}
        </div>

        {isLong && (
          <div className="mt-4">
            <FluentLink
              as="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
            >
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
