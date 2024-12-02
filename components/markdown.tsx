import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import {
  Body1,
  Caption1,
  Link as FluentLink,
  LargeTitle,
  Subtitle1,
  Divider,
} from "@fluentui/react-components";

interface GlobalMarkdownProps {
  children: string;
}

export default function GlobalMarkdown({ children }: GlobalMarkdownProps) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      rehypePlugins={[rehypeRaw, rehypeSanitize]}
      components={{
        h1: ({ children }) => <LargeTitle className="!block mb-4">{children}</LargeTitle>,
        h2: ({ children }) => <Subtitle1 className="!block mb-3 mt-6">{children}</Subtitle1>,
        h3: ({ children }) => (
          <Caption1 className="!block mb-2 mt-4 font-semibold">{children}</Caption1>
        ),
        p: ({ children }) => (
          <div className="whitespace-pre-wrap mb-4">
            <Body1>{children}</Body1>
          </div>
        ),
        a: ({ children, href }) => <FluentLink href={href}>{children}</FluentLink>,
        ul: ({ children }) => <ul className="list-disc pl-6 mb-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4">{children}</ol>,
        li: ({ children }) => <li className="mb-2">{children}</li>,
        hr: () => (
          <Divider 
            className="my-8" 
            appearance="subtle"
          />
        ),
        pre: ({ children }) => (
          <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">{children}</pre>
        ),
        code: ({ children }) => (
          <code className="bg-gray-800 p-1 rounded whitespace-pre-wrap">{children}</code>
        ),
      }}
    >
      {children}
    </Markdown>
  );
}