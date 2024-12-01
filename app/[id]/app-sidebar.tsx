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
  Subtitle1,
  Toast,
  ToastBody,
  ToastIntent,
  ToastTitle,
  useToastController,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  ArrowReplyRegular,
  DeleteRegular,
  EyeRegular,
  LinkRegular,
} from "@fluentui/react-icons";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import Link from "next/link";
import ShareButton from "@/components/share-button";
import { useUser } from "@clerk/nextjs";
import dayjs from "dayjs";
import { aqApi } from "@/lib/axios/api";
import StatusVote from "@/components/post/status-vote";
import EditPost from "@/components/post/edit-post";

interface AppSidebarProps {
  app: FullPost;
  info: InfoResponse;
}

export default function AppSidebar({ app, info }: AppSidebarProps) {
  const { user } = useUser();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { dispatchToast } = useToastController("toaster");
  const isEditable = user?.publicMetadata.role === "admin";

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

  const handleDelete = async () => {
    try {
      const response = await aqApi.delete(`/api/v1/posts/${app.id}`);

      if (response.success) {
        notify("Post deleted successfully");
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        notify("Error deleting post", response.error, "error");
      }
    } catch (error) {
      notify("Error deleting post", (error as Error).message, "error");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
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
          <div className="flex justify-end items-center gap-2 text-gray-500 pt-2 border-t border-neutral-500">
            <EyeRegular />
            <Body1>{app._count?.views || 0} views</Body1>
          </div>
        </div>
      </Card>

      {app.status_id === -1 && <StatusVote postId={app.id} info={info} />}

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
            <>
              <EditPost post={app} info={info} className="w-full" />
              <Button
                icon={<DeleteRegular />}
                onClick={() => setIsDeleteDialogOpen(true)}
                className="w-full !bg-red-600 !text-white hover:!bg-red-700"
                appearance="primary"
              >
                Delete Post
              </Button>
            </>
          )}
        </div>
      </Card>

      {isEditable && (
        <Dialog
          open={isDeleteDialogOpen}
          onOpenChange={(e, data) => setIsDeleteDialogOpen(data.open)}
        >
          <DialogSurface>
            <DialogBody>
              <DialogTitle>Delete Post</DialogTitle>
              <DialogContent>
                Are you sure you want to delete this post? This action cannot be
                undone.
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
      )}
    </>
  );
}
