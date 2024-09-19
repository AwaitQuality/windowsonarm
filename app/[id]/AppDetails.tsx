"use client";

import React, { useState } from "react";
import {
  Avatar,
  Body1,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  InfoLabel,
  LargeTitle,
  Link as FluentLink,
  makeStyles,
  Subtitle1,
  Tag,
  Toast,
  ToastBody,
  ToastIntent,
  ToastTitle,
  tokens,
  useToastController,
} from "@fluentui/react-components";
import {
  ArrowReplyRegular,
  CalendarRegular,
  EditRegular,
  LinkRegular,
  PersonRegular,
  ArrowLeftRegular,
  TagRegular,
} from "@fluentui/react-icons";
import dayjs from "dayjs";
import Link from "next/link";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import ShareButton from "@/components/share-button";
import { Container } from "@/components/ui/container";
import { useUser } from "@clerk/nextjs";
import { Form } from "@/components/ui/form";
import InputField, { InputTextArea } from "@/components/ui/form/input";
import SelectField from "@/components/ui/form/select";
import FormTagPicker from "@/components/ui/form/form-tag-picker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { aqApi } from "@/lib/axios/api";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import ForumMessages from "./ForumMessages";
import GlobalMarkdown from "@/components/markdown";
import Image from "next/image";

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
  heroSubtitle: {
    fontSize: tokens.fontSizeBase600,
    lineHeight: tokens.lineHeightBase600,
    fontWeight: tokens.fontWeightSemibold,
  },
});

const formSchema = z.object({
  title: z.string().max(255),
  company: z.string().max(255),
  description: z.string(),
  tags: z.array(z.string()).max(3).optional(),
  app_url: z.string().url().optional().or(z.literal("")),
  banner_url: z.string().optional().or(z.literal("")),
  icon_url: z.string().optional().or(z.literal("")),
  status_id: z.coerce.number(),
  categoryId: z.string(),
});

type EditPostRequest = z.infer<typeof formSchema>;

interface AppDetailsContentProps {
  app: FullPost;
  info: InfoResponse;
}

export default function AppDetailsContent({
  app,
  info,
}: AppDetailsContentProps) {
  const classes = useStyles();
  const { user } = useUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const isEditable = user?.publicMetadata.role === "admin";

  const { dispatchToast } = useToastController("toaster");

  const form = useForm<EditPostRequest>({
    resolver: zodResolver(formSchema),
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

  const notify = (
    title: string,
    subtitle?: string,
    intent: ToastIntent = "success"
  ) =>
    dispatchToast(
      <Toast>
        <ToastTitle>{title}</ToastTitle>
        {subtitle && <ToastBody>{subtitle}</ToastBody>}
      </Toast>,
      { intent }
    );

  const handleEdit = async (values: EditPostRequest) => {
    try {
      const response = await aqApi.put(`/api/v1/posts/${app.id}`, values);

      if (response.success) {
        notify("Post updated successfully");

        setTimeout(() => {
          location.reload();
        }, 5000);
      } else {
        notify("Error updating post", response.error, "error");
      }
    } catch (error) {
      notify("Error updating post", (error as Error).message, "error");
    } finally {
      setIsEditDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-blue-800 to-blue-950 text-white py-16 mb-12">
        <Container>
          <div className="flex items-center mb-4">
            {app.icon_url && (
              <div className="mr-4 bg-gray-300 p-2 rounded-lg shadow-md w-20 h-20 flex items-center justify-center">
                <Image
                  src={app.icon_url}
                  alt={`${app.title} icon`}
                  width={64}
                  height={64}
                  className="rounded-md max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <h1 className={`${classes.heroTitle}`}>
              Is {app.title} ARM ready?
            </h1>
          </div>
          <h2 className={`${classes.heroSubtitle} mb-6`}>
            <span
              className={`inline-block px-3 py-1 rounded-full`}
              style={{ backgroundColor: app.status?.color }}
            >
              {app.status?.text}
            </span>
          </h2>
          <div className="flex items-center space-x-4 text-sm">
            <span className="flex items-center">
              <CalendarRegular className="mr-2" />
              {dayjs(app.created_at).format("MMMM D, YYYY")}
            </span>
            <span className="flex items-center">
              <PersonRegular className="mr-2" />
              {app.user?.username || "Anonymous"}
            </span>
            {app.category && (
              <span className="flex items-center">
                <TagRegular className="mr-2" />
                {app.category.name}
              </span>
            )}
          </div>
        </Container>
      </div>
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <Card
              className="rounded-lg p-6 mb-8"
              appearance={"filled-alternative"}
              size="large"
            >
              <AppDescription
                description={app.description}
                expanded={expanded}
                setExpanded={setExpanded}
              />
            </Card>

            {app.tags && app.tags.length > 0 && (
              <Card
                className="rounded-lg shadow-md p-6 mb-8"
                appearance={"filled-alternative"}
                size="large"
              >
                <Subtitle1 className="mb-4">Tags</Subtitle1>
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((tag) => (
                    <Tag key={tag.id} className="text-sm">
                      {tag.name}
                    </Tag>
                  ))}
                </div>
              </Card>
            )}

            <ForumMessages postId={app.id} />
          </div>

          <div className="lg:col-span-1">
            <Card
              className="rounded-lg shadow-md p-6 mb-8"
              appearance={"filled-alternative"}
              size="large"
            >
              <LargeTitle className="mb-4">App Information</LargeTitle>
              <div className="space-y-4">
                <div>
                  <strong>Last updated: </strong>
                  <Body1>{dayjs(app.updated_at).format("MMMM D, YYYY")}</Body1>
                </div>
                <div>
                  <strong>Company: </strong>
                  <Body1>{app.company}</Body1>
                </div>
                <div>
                  <strong>Posted by:</strong>
                  <div className="flex items-center mt-1">
                    <Avatar
                      aria-label={app.user?.username || "Anonymous"}
                      name={app.user?.username || "Anonymous"}
                      image={{ src: app.user?.imageUrl || undefined }}
                      className="mr-2"
                    />
                    <Body1>{app.user?.username || "Anonymous"}</Body1>
                  </div>
                </div>
                {app.update_description && (
                  <div>
                    <strong>Update description:</strong>
                    <Body1>{app.update_description}</Body1>
                  </div>
                )}
              </div>
            </Card>

            <Card
              className="rounded-lg shadow-md p-6"
              appearance={"filled-alternative"}
              size="large"
            >
              <Subtitle1 className="mb-4">Actions</Subtitle1>
              <div className="space-y-4">
                {app.app_url && (
                  <Link href={app.app_url} passHref className="block">
                    <Button
                      icon={<LinkRegular fontSize={16} />}
                      appearance="primary"
                      className="w-full"
                    >
                      Visit official website
                    </Button>
                  </Link>
                )}
                {app.community_url && (
                  <InfoLabel
                    info="This project is not compatible with ARM by default, but the community has made it work. This link will take you to the community project."
                    className="block"
                  >
                    <Link href={app.community_url} passHref>
                      <Button
                        icon={<LinkRegular fontSize={16} />}
                        appearance="outline"
                        className="w-full"
                      >
                        Community project
                      </Button>
                    </Link>
                  </InfoLabel>
                )}
                <Link
                  href={`https://github.com/AwaitQuality/windowsonarm/issues/new?assignees=&labels=incorrect-app-info&projects=&template=application-content-change.yml&title=Content+Change+To+Application+${app.title}+needed.`}
                  passHref
                  className="block"
                >
                  <Button
                    icon={<ArrowReplyRegular fontSize={16} />}
                    className="w-full"
                  >
                    Report an issue
                  </Button>
                </Link>
                <ShareButton className={"w-full"} />
                <Link href="/" passHref className="block">
                  <Button className="w-full" icon={<ArrowLeftRegular />}>
                    Back to app list
                  </Button>
                </Link>
                {isEditable && (
                  <Button
                    icon={<EditRegular />}
                    onClick={() => setIsEditDialogOpen(true)}
                    className="w-full"
                  >
                    Edit Post
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </Container>

      {isEditable && (
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
                    <InputField
                      name="icon_url"
                      label="Icon URL"
                      formControl={form.control}
                      placeholder="https://example.com/icon.png"
                    />
                    <FormTagPicker
                      formControl={form.control}
                      label="Tags"
                      name="tags"
                      options={app.tags.map((tag) => tag.name)}
                    />
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
                      label={"Status ID"}
                      name={"status_id"}
                    >
                      <option value={""}>Select the status</option>
                      {info?.status.map((status) => (
                        <option key={status.id} value={status.id}>
                          {status.name}
                        </option>
                      ))}
                    </SelectField>
                    <Body1 className="!mt-2">
                      Status hint: {app.status_hint}
                    </Body1>
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
      )}
    </div>
  );
}

function AppDescription({
  description,
  expanded,
  setExpanded,
}: {
  description: string;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
}) {
  return (
    <div>
      <GlobalMarkdown>
        {description.slice(0, 820) +
          (description.length > 820 && !expanded ? "..." : "")}
      </GlobalMarkdown>
      {expanded && <GlobalMarkdown>{description.slice(820)}</GlobalMarkdown>}
      {description.length > 820 && (
        <div className="mt-4">
          <FluentLink onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show less" : "Show more"}
          </FluentLink>
        </div>
      )}
    </div>
  );
}
