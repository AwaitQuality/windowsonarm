import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
  Toast,
  ToastBody,
  ToastIntent,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import { AddCircleFilled } from "@fluentui/react-icons";
import { Form } from "@/components/ui/form";
import InputField, { InputTextArea } from "@/components/ui/form/input";
import SelectField from "@/components/ui/form/select";
import { UseQueryResult } from "react-query";
import { z } from "zod";
import { aqApi } from "@/lib/axios/api";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormTagPicker from "@/components/ui/form/form-tag-picker";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import axios from "axios";
import FileUploader from "@/components/ui/upload-button";
import {
  FileUploadRequest,
  FileUploadResponse,
} from "@/app/api/v1/upload/route";

export const postSchema = z.object({
  title: z.string().max(255),
  company: z.string().max(255),
  description: z.string().min(50),
  tags: z.array(z.string()).max(10).optional(),
  app_url: z.string().optional(),
  banner_url: z.string().optional(),
  status_hint: z.string().optional(),
  icon_url: z.string().optional(),
  categoryId: z.string(),
});

export type postRequest = z.infer<typeof postSchema>;

interface ContributeButtonProps {
  query: UseQueryResult<InfoResponse, unknown>;
}

const ContributeButton: React.FC<ContributeButtonProps> = ({ query }) => {
  const { userId, sessionId, isSignedIn, isLoaded } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { dispatchToast } = useToastController("toaster");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<postRequest>({
    resolver: zodResolver(postSchema),
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

  const {
    data: info,
    isLoading: infoIsLoading,
    isError: infoIsError,
    isIdle: infoIsIdle,
  } = query;

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

  const onSubmit = async (values: z.infer<typeof postSchema>) => {
    try {
      if (selectedFile) {
        values.icon_url = await uploadFile(selectedFile);
      }

      const response = await aqApi.post("/api/v1/posts", values);

      if (!response.success) {
        notify("Failed to post application", response.error, "error");
        return;
      }

      form.reset();
      notify(
        "Thank you for contributing!",
        "Your application has been posted successfully. Approval may take up to one week. You will not be notified of the status of your application.",
        "success",
      );
      setDialogOpen(false);
    } catch (error) {
      notify("Failed to post application", (error as Error).message, "error");
    }
  };

  const onError = (errors: any) => {
    console.log(errors);
    notify(
      "Form validation failed",
      "Please check the form for errors. If you believe this is a mistake, please report it on GitHub.",
      "error",
    );
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(_, o) => setDialogOpen(o.open)}>
      {infoIsError || infoIsLoading || infoIsIdle || !isLoaded ? (
        <Button disabled>Loading...</Button>
      ) : isLoaded && !isSignedIn ? (
        <Link href={"/auth/signin"}>
          <Button>Sign in to request an app</Button>
        </Link>
      ) : (
        <DialogTrigger disableButtonEnhancement>
          <Button icon={<AddCircleFilled />} disabled={!userId || !sessionId}>
            Request an app
          </Button>
        </DialogTrigger>
      )}

      <DialogSurface>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onError)}>
            <DialogBody>
              <DialogTitle>Post application</DialogTitle>
              <DialogContent className={"flex gap-4 flex-col"}>
                <div className={"flex gap-4 w-full"}>
                  <InputField
                    placeholder={"Photoshop"}
                    formControl={form.control}
                    label={"App name"}
                    name={"title"}
                    formItemClassName={"w-full"}
                  />
                  <InputField
                    placeholder={"Adobe"}
                    formControl={form.control}
                    label={"Company"}
                    name={"company"}
                    formItemClassName={"w-full"}
                  />
                </div>
                <InputField
                  placeholder={"https://example.com"}
                  formControl={form.control}
                  label={"App URL"}
                  name={"app_url"}
                />
                <InputField
                  placeholder={"https://example.com/banner.png"}
                  formControl={form.control}
                  label={"Banner URL"}
                  name={"banner_url"}
                  disabled
                  description="Banner URL is coming soon."
                />

                <FileUploader onFileSelect={(file) => setSelectedFile(file)} />

                {info && (
                  <FormTagPicker
                    formControl={form.control}
                    label={"Tags"}
                    name={"tags"}
                    options={info.tags.map((tag) => tag.name)}
                  />
                )}

                <SelectField
                  formControl={form.control}
                  label={"Category ID"}
                  name={"categoryId"}
                >
                  <option value={""}>Select a category</option>
                  {info?.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </SelectField>

                <SelectField
                  formControl={form.control}
                  label={"Status hint"}
                  name={"status_hint"}
                  description={
                    "Select a status hint for the application. If you're not sure, select the 'Under review' status and we will test the app for you."
                  }
                >
                  <option value={""}>Select a status hint</option>
                  {info?.status.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </SelectField>

                <InputTextArea
                  placeholder={"Description"}
                  formControl={form.control}
                  rows={5}
                  label={"Description"}
                  name={"description"}
                  description={
                    "A brief description of the application. Markdown is supported. A rich MD editor is coming soon."
                  }
                />
              </DialogContent>

              <DialogActions className={"mt-2"}>
                <DialogTrigger disableButtonEnhancement>
                  <Button appearance="secondary">Close</Button>
                </DialogTrigger>
                <Button
                  appearance="primary"
                  type={"submit"}
                  disabled={
                    form.formState.isSubmitting || !userId || !sessionId
                  }
                >
                  Post
                </Button>
              </DialogActions>
            </DialogBody>
          </form>
        </Form>
      </DialogSurface>
    </Dialog>
  );
};

export default ContributeButton;
