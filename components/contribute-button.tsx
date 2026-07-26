import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogSurface,
  DialogTrigger,
  Spinner,
} from "@fluentui/react-components";
import { AddCircleFilled } from "@fluentui/react-icons";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { aqApi } from "@/lib/http/client";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { CreatePostInput, createPostSchema } from "@/lib/schemas/post";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { useToast } from "@/lib/hooks/useToast";

/**
 * The dialog body is only ever seen after a click, so it is fetched on first
 * open rather than shipping with the home page.
 */
const ContributeForm = dynamic(
  () => import("@/components/contribute/ContributeForm"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-12">
        <Spinner label="Loading form..." />
      </div>
    ),
  },
);

interface ContributeButtonProps {
  query: UseQueryResult<InfoResponse>;
}

const ContributeButton: React.FC<ContributeButtonProps> = ({ query }) => {
  const { userId, sessionId, isSignedIn, isLoaded } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { notify } = useToast();
  const { selectedFile, setSelectedFile, upload } = useFileUpload();
  const router = useRouter();

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  });

  const {
    data: info,
    isPending: infoIsPending,
    isError: infoIsError,
  } = query;

  const onSubmit = async (values: CreatePostInput) => {
    try {
      if (selectedFile) {
        values.icon_url = (await upload()) ?? values.icon_url;
      }

      const response = await aqApi.post<{ id: string }>("/api/v1/posts", values);

      if (!response.success) {
        notify("Failed to post application", response.error, "error");
        return;
      }

      form.reset();
      setSelectedFile(null);
      notify(
        "Thank you for contributing!",
        "Your application has been posted successfully. Approval may take up to one week. You will not be notified of the status of your application.",
        "success"
      );
      setDialogOpen(false);

      router.push(`/${response.data.id}`);
    } catch (error) {
      notify("Failed to post application", (error as Error).message, "error");
    }
  };

  const onError = () => {
    notify(
      "Form validation failed",
      "Please check the form for errors. If you believe this is a mistake, please report it on GitHub.",
      "error"
    );
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(_, o) => setDialogOpen(o.open)}>
      {infoIsError || infoIsPending || !isLoaded ? (
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
        {dialogOpen && (
          <ContributeForm
            form={form}
            info={info}
            onSubmit={onSubmit}
            onError={onError}
            onFileSelect={setSelectedFile}
            submitDisabled={
              form.formState.isSubmitting || !userId || !sessionId
            }
          />
        )}
      </DialogSurface>
    </Dialog>
  );
};

export default ContributeButton;
