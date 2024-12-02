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
import GlobalMarkdown from "@/components/markdown";

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
  console.log('Blog Post Data:', post);

  const getPreviewContent = (content: string) => {
    let preview = content.slice(0, 400);
    
    if (content.length > 400) {
      const lastPeriod = preview.lastIndexOf('.');
      if (lastPeriod > 300) {
        preview = preview.slice(0, lastPeriod + 1);
      }
    }

    return content.length > preview.length ? preview + '...' : preview;
  };

  return (
    <Card 
      appearance="filled-alternative" 
      className="h-full flex flex-col"
    >
      {post.image_url && (
        <CardPreview>
          <img 
            src={post.image_url} 
            alt={post.title} 
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
        <div className="prose dark:prose-invert max-w-none mb-6 max-h-[150px] overflow-hidden">
          <GlobalMarkdown>
            {post.description || post.content.slice(0, 197).trim() + "..."}
          </GlobalMarkdown>
        </div>

        <div className="mt-auto">
          <Link href={`/blog/${post.id}`} className="block">
            <Button 
              className="w-full hover:bg-blue-500 hover:text-white transition-colors"
            >
              Read More
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}; 