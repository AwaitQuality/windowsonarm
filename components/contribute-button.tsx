import React, { useState } from "react";
import {
  Button,
  Dialog,
  DialogSurface,
  DialogTrigger,
} from "@fluentui/react-components";
import { AddCircleFilled } from "@fluentui/react-icons";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UseQueryResult } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

import { aqApi } from "@/lib/axios/api";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { CreatePostInput, createPostSchema } from "@/lib/schemas/post";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { useToast } from "@/lib/hooks/useToast";
import ContributeForm from "@/components/contribute/ContributeForm";

interface ContributeButtonProps {
  query: UseQueryResult<InfoResponse>;
}

const ContributeButton: React.FC<ContributeButtonProps> = ({ query }) => {
  const { userId, sessionId, isSignedIn, isLoaded } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const { notify } = useToast();
  const { selectedFile, setSelectedFile, upload } = useFileUpload();

  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
  });

  const { data: info, isError, isPending } = query;

  const onSubmit = async (values: CreatePostInput) => {
    try {
      if (selectedFile) {
        values.icon_url = (await upload()) ?? values.icon_url;
      }

      const response = await aqApi.post("/api/v1/posts", values);

      if (!response.success) {
        notify("Failed to post application", response.error, "error");
        return;
      }

      form.reset();
      setSelectedFile(null);
      notify(
        "Thank you for contributing!",
        "Your app is live in pending state. As community votes come in, it will appear in the right status category automatically. An admin will review when possible.",
        "success",
      );
      setDialogOpen(false);
    } catch (error) {
      notify("Failed to post application", (error as Error).message, "error");
    }
  };

  const onError = () => {
    notify(
      "Form validation failed",
      "Please check the form for errors.",
      "error",
    );
  };

  if (isError || isPending || !info || !isLoaded) {
    return <Button disabled>Loading...</Button>;
  }

  if (!isSignedIn) {
    return (
      <Link href="/auth/signin">
        <Button>Sign in to request an app</Button>
      </Link>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={(_, o) => setDialogOpen(o.open)}>
      <DialogTrigger disableButtonEnhancement>
        <Button icon={<AddCircleFilled />} disabled={!userId || !sessionId}>
          Request an app
        </Button>
      </DialogTrigger>

      <DialogSurface>
        <ContributeForm
          form={form}
          info={info}
          onSubmit={onSubmit}
          onError={onError}
          onFileSelect={setSelectedFile}
          submitDisabled={!userId || !sessionId}
        />
      </DialogSurface>
    </Dialog>
  );
};

export default ContributeButton;
