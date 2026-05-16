import React from "react";
import Link from "next/link";
import dayjs from "dayjs";
import {
  Avatar,
  Body1,
  Button,
  Card,
  InfoLabel,
  LargeTitle,
  Subtitle1,
} from "@fluentui/react-components";
import {
  ArrowLeftRegular,
  ArrowReplyRegular,
  EditRegular,
  LinkRegular,
} from "@fluentui/react-icons";

import ShareButton from "@/components/share-button";
import { FullPost } from "@/lib/types/prisma/prisma-types";

interface SidebarProps {
  app: FullPost;
  isEditable: boolean;
  onEditClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ app, isEditable, onEditClick }) => (
  <div className="lg:col-span-1">
    <Card
      className="rounded-lg shadow-md p-6 mb-8"
      appearance="filled-alternative"
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
      appearance="filled-alternative"
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
          <Button icon={<ArrowReplyRegular fontSize={16} />} className="w-full">
            Report an issue
          </Button>
        </Link>
        <ShareButton className="w-full" />
        <Link href="/" passHref className="block">
          <Button className="w-full" icon={<ArrowLeftRegular />}>
            Back to app list
          </Button>
        </Link>
        {isEditable && (
          <Button
            icon={<EditRegular />}
            onClick={onEditClick}
            className="w-full"
          >
            Edit Post
          </Button>
        )}
      </div>
    </Card>
  </div>
);

export default Sidebar;
