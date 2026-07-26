"use client";

import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogSurface,
  DialogTrigger,
  Spinner,
} from "@fluentui/react-components";
import { AddRegular } from "@fluentui/react-icons";
import dynamic from "next/dynamic";
import { useUser } from "@clerk/nextjs";
import { BlogPost } from "@/lib/types/prisma/prisma-types";

/**
 * The editor body is the expensive part (react-hook-form, zod, the markdown
 * renderer, the uploader, dayjs), so it is fetched on first open instead of
 * shipping with whichever page mounts the trigger.
 */
const CreateBlogPostForm = dynamic(
  () => import("@/components/blog/create-blog-post-form"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-12">
        <Spinner label="Loading editor..." />
      </div>
    ),
  },
);

interface CreateBlogPostProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  editPost?: BlogPost;
}

export const CreateBlogPost: React.FC<CreateBlogPostProps> = ({
  isOpen: propIsOpen,
  onOpenChange,
  editPost,
}) => {
  const [isOpen, setIsOpen] = useState(propIsOpen);
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  // Use controlled open state from props if provided
  const dialogOpen = propIsOpen ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  const handleClose = () => {
    setIsOpen(false);
    onOpenChange?.(false);
  };

  if (!isAdmin) return null;

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(_, data) => {
        setDialogOpen(data.open);
        if (!data.open) {
          handleClose();
        }
      }}
    >
      <DialogTrigger disableButtonEnhancement>
        {!editPost ? (
          <Button icon={<AddRegular />}>New Blog Post</Button>
        ) : null}
      </DialogTrigger>
      <DialogSurface className="w-[800px] max-w-[90vw]">
        {dialogOpen && (
          <CreateBlogPostForm editPost={editPost} onClose={handleClose} />
        )}
      </DialogSurface>
    </Dialog>
  );
};
