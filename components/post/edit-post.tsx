"use client";

import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Toast,
  ToastBody,
  ToastIntent,
  ToastTitle,
  useToastController,
  Text,
  Card,
  Label,
} from "@fluentui/react-components";
import { EditRegular } from "@fluentui/react-icons";
import { useUser } from "@clerk/nextjs";
import { Form } from "@/components/ui/form";
import InputField from "@/components/ui/form/input";
import { InputTextArea } from "@/components/ui/form/input";
import SelectField from "@/components/ui/form/select";
import FormTagPicker from "@/components/ui/form/form-tag-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import FileUploader from "@/components/ui/upload-button";
import axios from "axios";
import { aqApi } from "@/lib/axios/api";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import {
  FileUploadRequest,
  FileUploadResponse,
} from "@/app/api/v1/upload/route";

const formSchema = z.object({
  title: z.string().max(255),
  company: z.string().max(255),
  description: z.string(),
  tags: z.array(z.string()).max(15).optional(),
  app_url: z.string().url().optional().or(z.literal("")),
  banner_url: z.string().optional().or(z.literal("")),
  icon_url: z.string().optional().or(z.literal("")),
  status_id: z.coerce.number(),
  categoryId: z.string(),
});

type EditPostRequest = z.infer<typeof formSchema>;

interface EditPostProps {
  post: FullPost;
  info: InfoResponse;
  className?: string;
}

export default function EditPost({ post, info, className }: EditPostProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useUser();
  const { dispatchToast } = useToastController("toaster");
  const isEditable = user?.publicMetadata.role === "admin";

  const form = useForm<EditPostRequest>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: post.title,
      company: post.company,
      description: post.description,
      tags: post.tags.map((tag) => tag.name),
      app_url: post.app_url || "",
      banner_url: post.banner_url || "",
      icon_url: post.icon_url || "",
      categoryId: post.categoryId,
      status_id: post.status_id,
    },
  });

  const notify = (
    title: string,
    subtitle?: string,
    intent: ToastIntent = "success",
  ) =>
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {subtitle && <ToastBody>{subtitle}</ToastBody>}
      </Toast>,
      { intent },
    );

  const uploadFile = async (file: File): Promise<string> => {
    const response = await aqApi.post<FileUploadResponse, FileUploadRequest>(
      "/api/v1/upload",
      {
        filename: file.name,
        contentType: file.type,
      },
    );
    if (!response.success) {
      throw new Error("Failed to get upload URL");
    }
    const { url, downloadUrl } = response.data;
    await axios.put(url, file, {
      headers: {
        "Content-Type": file.type,
      },
    });
    return downloadUrl;
  };

  const handleEdit = async (values: EditPostRequest) => {
    try {
      if (selectedFile) {
        values.icon_url = await uploadFile(selectedFile);
      }
      const response = await aqApi.put(`/api/v1/posts/${post.id}`, values);
      if (response.success) {
        notify("Post updated successfully");
        setTimeout(() => {
          location.reload();
        }, 2000);
      } else {
        notify("Error updating post", response.error, "error");
      }
    } catch (error) {
      notify("Error updating post", (error as Error).message, "error");
    } finally {
      setIsEditDialogOpen(false);
    }
  };

  if (!isEditable) return null;

  return (
    <>
      <Button
        icon={<EditRegular />}
        onClick={() => setIsEditDialogOpen(true)}
        className={className}
      >
        Edit Post
      </Button>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(e, data) => setIsEditDialogOpen(data.open)}
      >
        <DialogSurface>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEdit)}>
              <DialogBody>
                <DialogTitle>Edit Post</DialogTitle>
                <DialogContent className="space-y-4">
                  <div className="flex gap-4 w-full">
                    <InputField
                      placeholder="Photoshop"
                      formControl={form.control}
                      label="App name"
                      name="title"
                      formItemClassName="w-full"
                    />
                    <InputField
                      placeholder="Adobe"
                      formControl={form.control}
                      label="Company"
                      name="company"
                      formItemClassName="w-full"
                    />
                  </div>
                  <InputField
                    placeholder="https://example.com"
                    formControl={form.control}
                    label="App URL"
                    name="app_url"
                  />
                  <div>
                    <InputField
                      name="icon_url"
                      label="Icon URL"
                      formControl={form.control}
                      placeholder="https://example.com/icon.png"
                    />
                    <FileUploader
                      onFileSelect={(file) => setSelectedFile(file)}
                    />
                  </div>
                  <InputTextArea
                    name="description"
                    label="Description"
                    formControl={form.control}
                    placeholder="Application description"
                    rows={10}
                  />
                  <FormTagPicker
                    formControl={form.control}
                    label="Tags"
                    name="tags"
                    options={post.tags.map((tag) => tag.name)}
                  />
                  <SelectField
                    formControl={form.control}
                    label="Category"
                    name="categoryId"
                  >
                    <option value="">Select a category</option>
                    {info?.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField
                    formControl={form.control}
                    label="Status"
                    name="status_id"
                  >
                    <option value="">Select the status</option>
                    {info?.status.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.name}
                      </option>
                    ))}
                  </SelectField>
                  <div className="flex flex-col gap-2">
                    <Label size={"medium"}>Original Status Hint</Label>
                    <Card appearance="outline" size="small">
                      <Text>
                        {post.status_hint === -1
                          ? "Ask community to test"
                          : info?.status.find((s) => s.id === post.status_hint)
                              ?.name || "No status hint"}
                      </Text>
                    </Card>
                  </div>
                </DialogContent>
                <DialogActions>
                  <Button
                    appearance="secondary"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button appearance="primary" type="submit">
                    Save Changes
                  </Button>
                </DialogActions>
              </DialogBody>
            </form>
          </Form>
        </DialogSurface>
      </Dialog>
    </>
  );
} 