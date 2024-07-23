import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
} from "@fluentui/react-components";
import { AddCircleFilled } from "@fluentui/react-icons";
import { Form } from "@/components/ui/form";
import InputField, { InputTextArea } from "@/components/ui/form/input";
import SelectField from "@/components/ui/form/select";
import React, { useState } from "react";
import { UseQueryResult } from "react-query";
import { z } from "zod";
import { aqApi } from "@/lib/axios/api";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FormTagPicker from "@/components/ui/form/form-tag-picker";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

const formSchema = z.object({
  title: z.string().max(255),
  company: z.string().max(255),
  description: z.string(),
  tags: z.array(z.string()).max(3).optional(),
  app_url: z.string().optional(),
  banner_url: z.string().optional(),
  status_hint: z.string().optional(),
  icon_url: z.string().optional(),
  categoryId: z.string(),
});

export type postRequest = z.infer<typeof formSchema>;

interface ContributeButtonProps {
  query: UseQueryResult<InfoResponse, unknown>;
}

const ContributeButton = ({ query }: ContributeButtonProps) => {
  const { userId, sessionId, isSignedIn, isLoaded } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<postRequest>({
    resolver: zodResolver(formSchema),
  });

  const {
    data: info,
    isLoading: infoIsLoading,
    isError: infoIsError,
    isIdle: infoIsIdle,
  } = query;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log(values);

    const response = await aqApi.post("/api/v1/posts", values);

    if (!response.success) {
      throw new Error(response.error);
    }

    form.reset();

    setDialogOpen(false);
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
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogBody>
              <DialogTitle>Post application</DialogTitle>
              <DialogContent className={"flex gap-4 flex-col"}>
                <div>
                  Fill out the form below to post your application. Please note
                  that all applications are reviewed before being posted.
                </div>
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
                <InputField
                  placeholder={"https://example.com/icon.png"}
                  formControl={form.control}
                  label={"Icon URL"}
                  name={"icon_url"}
                />

                {info && (
                  <FormTagPicker
                    formControl={form.control}
                    label={"Tags"}
                    name={"tags"}
                    options={info.tags}
                  />
                )}

                <SelectField
                  formControl={form.control}
                  label={"Category ID"}
                  name={"categoryId"}
                >
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
                >
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
                    "A brief description of the application. MD editing support is coming soon."
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
