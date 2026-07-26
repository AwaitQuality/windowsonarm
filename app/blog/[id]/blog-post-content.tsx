"use client";

import React, { useState, useEffect } from "react";
import { Container } from "@/components/ui/container";
import {
  Card,
  Text,
  Caption1,
  Display,
  makeStyles,
  tokens,
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@fluentui/react-components";
import {
  CalendarRegular,
  PersonRegular,
  ArrowLeftRegular,
  EditRegular,
  DeleteRegular,
} from "@fluentui/react-icons";
import dayjs from "dayjs";
import GlobalMarkdown from "@/components/markdown";
import { BlogPost } from "@/lib/types/prisma/prisma-types";
// Below-the-fold comment widget that injects its own iframe: no reason to ship
// it in the page bundle.
const Giscus = dynamic(() => import("@giscus/react"), { ssr: false });
import Navigation from "@/components/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { CreateBlogPost } from "@/components/blog/create-blog-post";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { aqApi } from "@/lib/http/client";
import { useToast } from "@/lib/hooks/useToast";
import dynamic from "next/dynamic";

const GoogleAdsense = dynamic(() => import("@/components/google-adsense"), {
  ssr: false,
});

interface BlogPostContentProps {
  post: BlogPost & {
    author: {
      username?: string;
      imageUrl?: string;
    };
  };
}

// Add styles for better typography control
const useStyles = makeStyles({
  heroTitle: {
    fontSize: tokens.fontSizeHero900,
    lineHeight: tokens.lineHeightHero900,
    fontWeight: tokens.fontWeightBold,
    "@media (min-width: 768px)": {
      fontSize: tokens.fontSizeHero1000,
      lineHeight: tokens.lineHeightHero1000,
    },
  },
});

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const { user } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const isAdmin = user?.publicMetadata?.role === "admin";
  const styles = useStyles();
  const router = useRouter();
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    try {
      const response = await aqApi.delete(`/api/v1/blog/${post.id}`);
      if (response.success) {
        notify("Blog post deleted successfully");
        setIsDeleteDialogOpen(false);
        await queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
        router.push("/");
      } else {
        notify("Failed to delete blog post", response.error, "error");
      }
    } catch (error) {
      notify("Error deleting blog post", (error as Error).message, "error");
    }
  };

  return (
    <>
      {/* Header with image background or gradient fallback */}
      <div
        className={`relative ${
          post.image_url
            ? "bg-neutral-900"
            : "bg-gradient-to-r from-blue-800 to-blue-950"
        }`}
      >
        {post.image_url && (
          <>
            {/* Background image with overlay */}
            <div
              className="absolute inset-0 z-0"
              style={{
                backgroundImage: `url(${post.image_url})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
            {/* Dark overlay for better text readability */}
            <div className="absolute inset-0 bg-black opacity-60 z-10" />
          </>
        )}

        {/* Navigation - now inside the header */}
        <div className="relative z-20">
          <Container>
            <Navigation className="pt-6" />
          </Container>
        </div>

        {/* Content */}
        <Container className="relative z-20">
          <div className="text-white py-24">
            <Display className={styles.heroTitle} as="h1">
              {post.title}
            </Display>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center space-x-4 text-sm text-neutral-200">
                <Caption1 className="flex items-center">
                  <CalendarRegular className="mr-2" />
                  {dayjs(post.created_at).format("MMMM D, YYYY")}
                </Caption1>
                <Caption1 className="flex items-center">
                  <PersonRegular className="mr-2" />
                  {post.author?.username || "Anonymous"}
                </Caption1>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    icon={<EditRegular />}
                    appearance="subtle"
                    size="small"
                    className="!text-neutral-300 hover:!bg-white/10"
                    onClick={() => setIsEditDialogOpen(true)}
                  >
                    Edit
                  </Button>
                  <Button
                    icon={<DeleteRegular />}
                    appearance="subtle"
                    size="small"
                    className="!text-red-300 hover:!bg-red-500/10"
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    Delete
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      {/* Content */}
      <Container>
        <div className="py-8">
          <Card className="p-8 mb-8" appearance="filled-alternative">
            <div className="prose dark:prose-invert max-w-none">
              <GlobalMarkdown>{post.content}</GlobalMarkdown>
            </div>
          </Card>

          {/* In-article Ad */}
          <Card className="p-8 mb-8" appearance="filled-alternative">
            <GoogleAdsense type="in-article" className="w-full" />
          </Card>

          {/* Comments */}
          <Card className="p-8" appearance="filled-alternative">
            <Giscus
              repo="AwaitQuality/windowsonarm"
              repoId="R_kgDOMUHZaw"
              category="Blog Comments"
              categoryId="DIC_kwDOMUHZa84Cg2tJ"
              mapping="specific"
              term={post.title}
              strict="0"
              theme="noborder_dark"
              reactionsEnabled="0"
              emitMetadata="0"
              inputPosition="bottom"
              lang="en"
            />
          </Card>
        </div>
      </Container>

      {/* Edit Dialog */}
      {isAdmin && (
        <>
          <CreateBlogPost
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            editPost={post}
          />

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={(_, data) => setIsDeleteDialogOpen(data.open)}
          >
            <DialogSurface>
              <DialogBody>
                <DialogTitle>Delete Blog Post</DialogTitle>
                <DialogContent>
                  Are you sure you want to delete this blog post? This action
                  cannot be undone.
                </DialogContent>
                <DialogActions>
                  <Button
                    appearance="secondary"
                    onClick={() => setIsDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    appearance="primary"
                    className="!bg-red-600 !text-white hover:!bg-red-700"
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>
                </DialogActions>
              </DialogBody>
            </DialogSurface>
          </Dialog>
        </>
      )}
    </>
  );
}
