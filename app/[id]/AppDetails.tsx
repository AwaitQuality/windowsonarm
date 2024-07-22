"use client";

import React, { useState } from "react";
import {
  Avatar,
  Body1,
  Button,
  Caption1,
  Card,
  InfoLabel,
  LargeTitle,
  Link as FluentLink,
  makeStyles,
  Subtitle1,
  Tag,
  tokens,
} from "@fluentui/react-components";
import {
  ArrowReplyRegular,
  CalendarRegular,
  LinkRegular,
  PersonRegular,
} from "@fluentui/react-icons";
import dayjs from "dayjs";
import Link from "next/link";
import Markdown from "react-markdown";
import { FullPost } from "@/lib/types/prisma/prisma-types";
import ShareButton from "@/components/share-button";
import { Container } from "@/components/ui/container";
import Giscus from "@giscus/react";

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

interface AppDetailsContentProps {
  app: FullPost;
}

export default function AppDetailsContent({ app }: AppDetailsContentProps) {
  const classes = useStyles();

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "native":
        return "bg-green-600 text-white";
      case "emulated":
        return "bg-yellow-600 text-black";
      case "not working":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 mb-12">
        <Container>
          <h1 className={`${classes.heroTitle} mb-4`}>
            Is {app.title} ARM ready?
          </h1>
          <h2 className={`${classes.heroSubtitle} mb-6`}>
            <span
              className={`inline-block px-3 py-1 rounded-full ${getStatusColor(app.statusRel?.text || "")}`}
            >
              {app.statusRel?.text}
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
          </div>
        </Container>
      </div>
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <Card className="rounded-lg p-6 mb-8">
              <AppDescription description={app.description} />
            </Card>

            {app.tags && app.tags.length > 0 && (
              <Card className="rounded-lg shadow-md p-6 mb-8">
                <Subtitle1 className="mb-4">Tags</Subtitle1>
                <div className="flex flex-wrap gap-2">
                  {app.tags.map((tag) => (
                    <Tag key={tag} className="text-sm">
                      {tag}
                    </Tag>
                  ))}
                </div>
              </Card>
            )}

            <Card className="rounded-lg shadow-md p-6 mb-8">
              <Subtitle1 className="mb-4">Discussion</Subtitle1>
              <Giscus
                repo="AwaitQuality/windowsonarm"
                repoId="R_kgDOMUHZaw"
                category="General"
                categoryId="DIC_kwDOMUHZa84Cg2tJ"
                mapping="specific"
                term={app.title}
                strict="0"
                theme={"noborder_dark"}
                reactionsEnabled="0"
                emitMetadata="0"
                inputPosition="bottom"
                lang="en"
                loading="lazy"
              />
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="rounded-lg shadow-md p-6 mb-8">
              <LargeTitle className="mb-4">App Information</LargeTitle>
              <div className="space-y-4">
                <div>
                  <strong>Last updated: </strong>
                  <Body1>{dayjs(app.updated_at).format("MMMM D, YYYY")}</Body1>
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

            <Card className="rounded-lg shadow-md p-6">
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
                  <Button appearance="subtle" className="w-full">
                    Back to app list
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

function AppDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <Markdown
        components={{
          h1: ({ children }) => (
            <LargeTitle className="mb-4">{children}</LargeTitle>
          ),
          h2: ({ children }) => (
            <Subtitle1 className="mb-3 mt-6">{children}</Subtitle1>
          ),
          h3: ({ children }) => (
            <Caption1 className="mb-2 mt-4 font-semibold">{children}</Caption1>
          ),
          p: ({ children }) => <Body1 className="mb-4">{children}</Body1>,
          a: ({ children, href }) => (
            <FluentLink href={href}>{children}</FluentLink>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-6 mb-4">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-6 mb-4">{children}</ol>
          ),
          li: ({ children }) => <li className="mb-2">{children}</li>,
        }}
      >
        {description.slice(0, 820) +
          (description.length > 820 && !expanded ? "..." : "")}
      </Markdown>
      {expanded && (
        <Markdown
          components={{
            h1: ({ children }) => (
              <LargeTitle className="mb-4">{children}</LargeTitle>
            ),
            h2: ({ children }) => (
              <Subtitle1 className="mb-3 mt-6">{children}</Subtitle1>
            ),
            h3: ({ children }) => (
              <Caption1 className="mb-2 mt-4 font-semibold">
                {children}
              </Caption1>
            ),
            p: ({ children }) => <Body1 className="mb-4">{children}</Body1>,
            a: ({ children, href }) => (
              <FluentLink href={href}>{children}</FluentLink>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-6 mb-4">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 mb-4">{children}</ol>
            ),
            li: ({ children }) => <li className="mb-2">{children}</li>,
          }}
        >
          {description.slice(820)}
        </Markdown>
      )}
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
