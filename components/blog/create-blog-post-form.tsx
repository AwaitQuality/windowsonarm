"use client";

import React, { useEffect, useState } from "react";
import {
  Button,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogTitle,
  SelectTabData,
  SelectTabEvent,
  Tab,
  TabList,
  Text,
} from "@fluentui/react-components";
import { EditRegular, EyeRegular } from "@fluentui/react-icons";
import { Form } from "@/components/ui/form";
import InputField, { InputTextArea } from "@/components/ui/form/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { aqApi } from "@/lib/http/client";
import { uploadFileToR2 } from "@/lib/hooks/useFileUpload";
import { useToast } from "@/lib/hooks/useToast";
import FileUploader from "@/components/ui/upload-button";
import { useQueryClient } from "@tanstack/react-query";
import GlobalMarkdown from "@/components/markdown";
import { InputDate } from "@/components/ui/form/input-date";
import { BlogPost } from "@/lib/types/prisma/prisma-types";
import dayjs from "dayjs";

const blogPostSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string().min(50),
  description: z.string().min(10).max(200).optional(),
  image_url: z.string().url().optional().or(z.literal("")),
  published: z.boolean().default(true),
  created_at: z.string().optional(),
});

type BlogPostFormData = z.infer<typeof blogPostSchema>;

export interface CreateBlogPostFormProps {
  editPost?: BlogPost;
  onClose: () => void;
}

/**
 * The heavy half of the blog editor (react-hook-form, zod, the markdown
 * renderer, the uploader). Kept in its own module so `create-blog-post.tsx` can
 * pull it in lazily once the dialog is actually opened.
 */
export default function CreateBlogPostForm({
  editPost,
  onClose,
}: CreateBlogPostFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("edit");
  const { notify } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<BlogPostFormData>({
    resolver: zodResolver(blogPostSchema),
    defaultValues: {
      title: editPost?.title || "",
      content: editPost?.content || "",
      description: editPost?.description || "",
      image_url: editPost?.image_url || "",
      published: editPost?.published ?? true,
      created_at: editPost?.created_at
        ? dayjs(editPost.created_at).format("YYYY-MM-DDTHH:mm")
        : undefined,
    },
  });

  useEffect(() => {
    if (editPost) {
      const formData = {
        title: editPost.title,
        content: editPost.content,
        description: editPost.description || "",
        image_url: editPost.image_url || "",
        published: editPost.published,
        created_at: editPost.created_at
          ? dayjs(editPost.created_at).format("YYYY-MM-DDTHH:mm")
          : undefined,
      };
      form.reset(formData);
    }
  }, [editPost, form]);

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    setSelectedTab("edit");
    onClose();
  };

  const onSubmit = async (values: BlogPostFormData) => {
    try {
      notify("Saving changes...", undefined, "info");

      if (selectedFile) {
        try {
          const imageUrl = await uploadFileToR2(selectedFile);
          values.image_url = imageUrl;
        } catch (error) {
          notify("Failed to upload image", (error as Error).message, "error");
          return;
        }
      }

      if (values.created_at) {
        values.created_at = new Date(values.created_at).toISOString();
      }

      const endpoint = editPost
        ? `/api/v1/blog/${editPost.id}`
        : "/api/v1/blog";
      const method = editPost ? "put" : "post";

      const response = await aqApi[method](endpoint, {
        ...values,
        ...(editPost && { id: editPost.id }),
      });

      if (response.success) {
        notify(
          `Blog post ${editPost ? "updated" : "created"} successfully`,
          "Your changes have been saved.",
          "success",
        );

        handleClose();

        queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
        if (editPost) {
          queryClient.invalidateQueries({
            queryKey: ["blog-post", editPost.id],
          });
        }
      } else {
        notify(
          `Failed to ${editPost ? "update" : "create"} blog post`,
          response.error,
          "error",
        );
      }
    } catch (error) {
      notify(
        `Error ${editPost ? "updating" : "creating"} blog post`,
        (error as Error).message,
        "error",
      );
    }
  };

  const onTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setSelectedTab(data.value as string);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <DialogBody>
          <DialogTitle>{editPost ? "Edit" : "Create New"} Blog Post</DialogTitle>
          <DialogContent className="space-y-4">
            <div className="flex gap-4 items-center">
              <InputField
                name="title"
                label="Title"
                placeholder="Enter post title"
                formControl={form.control}
                className="flex-grow"
              />
              <InputDate
                name="created_at"
                label="Publication Date (Optional)"
                formControl={form.control}
                className="w-48"
              />
            </div>

            <InputTextArea
              name="description"
              label="Short Description (Optional)"
              placeholder="Enter a brief description (max 200 characters). If not provided, it will be generated from content."
              formControl={form.control}
              rows={3}
            />

            <div className="border rounded-lg">
              <TabList selectedValue={selectedTab} onTabSelect={onTabSelect}>
                <Tab icon={<EditRegular />} value="edit">
                  Edit
                </Tab>
                <Tab icon={<EyeRegular />} value="preview">
                  Preview
                </Tab>
              </TabList>

              <div className="p-4">
                {selectedTab === "edit" ? (
                  <InputTextArea
                    name="content"
                    label="Content (Markdown supported)"
                    placeholder="Write your blog post content using Markdown..."
                    formControl={form.control}
                    rows={15}
                  />
                ) : (
                  <div className="min-h-[300px] prose dark:prose-invert max-w-none overflow-y-auto p-4">
                    <Text weight="semibold" size={500}>
                      Preview
                    </Text>
                    <div className="whitespace-pre-wrap">
                      <GlobalMarkdown>
                        {form.watch("content") || "*No content yet*"}
                      </GlobalMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4">
              <Text weight="semibold" size={300}>
                Featured Image
              </Text>
              <FileUploader onFileSelect={(file) => setSelectedFile(file)} />
              {selectedFile && (
                <Text size={200} className="mt-2 text-neutral-500">
                  Selected: {selectedFile.name}
                </Text>
              )}
            </div>

            <div className="bg-neutral-100 dark:bg-neutral-800 p-4 rounded-lg mt-4">
              <Text
                weight="medium"
                className="text-neutral-600 dark:text-neutral-400"
                size={200}
              >
                Markdown Tips:
              </Text>
              <ul className="text-sm mt-2 space-y-1 text-neutral-600 dark:text-neutral-400">
                <li>
                  • Use **text** for <strong>bold</strong>
                </li>
                <li>
                  • Use *text* for <em>italic</em>
                </li>
                <li>• Use # for headings (# H1, ## H2, ### H3)</li>
                <li>• Use - or * for bullet points</li>
                <li>• Use [text](url) for links</li>
                <li>• Use ```code``` for code blocks</li>
              </ul>
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              appearance="secondary"
              onClick={handleClose}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              appearance="primary"
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting
                ? "Saving..."
                : editPost
                  ? "Update"
                  : "Publish"}
            </Button>
          </DialogActions>
        </DialogBody>
      </form>
    </Form>
  );
}
