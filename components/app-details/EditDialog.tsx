import React, { useState } from "react";
import {
  Body1,
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
} from "@fluentui/react-components";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import InputField, { InputTextArea } from "@/components/ui/form/input";
import SelectField from "@/components/ui/form/select";
import FormTagPicker from "@/components/ui/form/form-tag-picker";
import FileUploader from "@/components/ui/upload-button";

import { aqApi } from "@/lib/axios/api";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { useToast } from "@/lib/hooks/useToast";
import { UpdatePostInput, updatePostSchema } from "@/lib/schemas/post";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";

interface EditDialogProps {
  app: FullPost;
  info: InfoResponse;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const EditDialog: React.FC<EditDialogProps> = ({
  app,
  info,
  open,
  onOpenChange,
  onSaved,
}) => {
  const { notify } = useToast();
  const { setSelectedFile, upload } = useFileUpload();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<UpdatePostInput>({
    resolver: zodResolver(updatePostSchema),
    defaultValues: {
      title: app.title,
      company: app.company,
      description: app.description,
      tags: app.tags.map((tag) => tag.name),
      app_url: app.app_url || "",
      banner_url: app.banner_url || "",
      icon_url: app.icon_url || "",
      categoryId: app.categoryId,
      status_id: app.status_id,
    },
  });

  const handleEdit = async (values: UpdatePostInput) => {
    setIsSaving(true);
    try {
      const uploaded = await upload();
      if (uploaded) values.icon_url = uploaded;

      const response = await aqApi.put(`/api/v1/posts/${app.id}`, values);

      if (response.success) {
        notify("Post updated successfully");
        onOpenChange(false);
        onSaved?.();
      } else {
        notify("Error updating post", response.error, "error");
      }
    } catch (error) {
      notify("Error updating post", (error as Error).message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => onOpenChange(data.open)}>
      <DialogSurface>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleEdit)}>
            <DialogBody>
              <DialogTitle>Edit Post</DialogTitle>
              <DialogContent className="space-y-4">
                <InputField
                  name="title"
                  label="Title"
                  formControl={form.control}
                  placeholder="Application name"
                />
                <InputField
                  name="company"
                  label="Company"
                  formControl={form.control}
                  placeholder="Company name"
                />
                <InputTextArea
                  name="description"
                  label="Description"
                  formControl={form.control}
                  placeholder="Application description"
                  rows={5}
                />
                <InputField
                  name="app_url"
                  label="App URL"
                  formControl={form.control}
                  placeholder="https://example.com"
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
                <FormTagPicker
                  formControl={form.control}
                  label="Tags"
                  name="tags"
                  options={info?.tags.map((tag) => tag.name) ?? []}
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
                {app.status_hint != null && (
                  <Body1 className="!mt-2">
                    Submitter&apos;s status hint: {app.status_hint}
                  </Body1>
                )}
              </DialogContent>
              <DialogActions>
                <Button
                  appearance="secondary"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  appearance="primary"
                  type="submit"
                  disabled={isSaving}
                >
                  Save Changes
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </Form>
      </DialogSurface>
    </Dialog>
  );
};

export default EditDialog;
