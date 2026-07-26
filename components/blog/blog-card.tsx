import React from "react";
import {
  Card,
  CardHeader,
  CardPreview,
  Text,
  Button,
  Body1,
  Caption1,
} from "@fluentui/react-components";
import { CalendarRegular, PersonRegular } from "@fluentui/react-icons";
import dayjs from "dayjs";
import Link from "next/link";

const EXCERPT_LENGTH = 220;

/**
 * Strips markdown syntax so the excerpt can be rendered as plain text. Feeding
 * it through the real markdown renderer would pull react-markdown, remark and
 * the rehype-raw/parse5 stack into the home page bundle for a two-line preview.
 */
const toPlainText = (markdown: string): string =>
  markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}([-*_])(\s*\1){2,}\s*$/gm, " ")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (text: string, limit: number): string => {
  if (text.length <= limit) return text;

  const clipped = text.slice(0, limit);
  const lastSpace = clipped.lastIndexOf(" ");

  return `${(lastSpace > limit * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}...`;
};

interface BlogCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    description?: string;
    image_url?: string;
    created_at: Date;
    author: {
      username?: string;
      imageUrl?: string;
    };
  };
}

export const BlogCard: React.FC<BlogCardProps> = ({ post }) => {
  const excerpt = truncate(
    toPlainText(post.description || post.content),
    EXCERPT_LENGTH,
  );

  return (
    <Card appearance="filled-alternative" className="h-full flex flex-col">
      {post.image_url && (
        <CardPreview>
          {/* Explicit dimensions plus aspect-video reserve the box before the
              image loads, so the card below it does not jump. */}
          <img
            src={post.image_url}
            alt={post.title}
            width={640}
            height={360}
            loading="lazy"
            decoding="async"
            className="w-full aspect-video object-cover"
          />
        </CardPreview>
      )}

      <CardHeader
        header={
          <Text
            weight="semibold"
            size={500}
            className="line-clamp-2 hover:text-blue-400 transition-colors"
          >
            {post.title}
          </Text>
        }
        description={
          <div className="flex items-center space-x-4 text-sm text-neutral-400">
            <Caption1 className="flex items-center">
              <CalendarRegular className="mr-2" />
              {dayjs(post.created_at).format("MMMM D, YYYY")}
            </Caption1>
            <Caption1 className="flex items-center">
              <PersonRegular className="mr-2" />
              {post.author?.username || "Anonymous"}
            </Caption1>
          </div>
        }
      />

      <div className="pt-0 flex-1 flex flex-col">
        <div className="mb-6 max-h-[150px] overflow-hidden">
          <Body1 className="break-words">{excerpt}</Body1>
        </div>

        <div className="mt-auto">
          <Link href={`/blog/${post.id}`} className="block">
            <Button className="w-full hover:bg-blue-500 hover:text-white transition-colors">
              Read More
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
