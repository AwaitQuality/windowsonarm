"use client";

import React from "react";
import {
  Button,
  Display,
  Link as FluentLink,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Subtitle1,
} from "@fluentui/react-components";
import { DismissRegular } from "@fluentui/react-icons";
import { useRouter } from "next/navigation";

import { Container } from "@/components/ui/container";
import ShareButton from "@/components/share-button";
import Navigation from "@/components/navigation";
import AppTable from "@/components/app-table";
import InfoSection from "@/components/info-section";
import ContributeButton from "@/components/contribute-button";
import { useAppContext } from "@/contexts/AppContext";
import { usePersistedState } from "@/lib/persisted-state";
import { useInfoQuery, usePostsQuery } from "@/lib/hooks/usePosts";

export default function Home() {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
  } = useAppContext();

  const [searchBox, setSearchBox] = React.useState<string>("");
  const [messageBox, setMessageBox] = usePersistedState("messageBox", "true");
  const router = useRouter();

  const infoQuery = useInfoQuery(selectedStatus);
  const postsQuery = usePostsQuery({
    category: selectedCategory,
    status: selectedStatus,
    search: searchBox,
  });

  return (
    <Container>
      <Navigation className={"pt-10"} />

      <div className="flex flex-col items-center pt-5" id={"#app"}>
        <Display as={"h1"}>
          <span className={"text-blue-400"}>Windows 11</span> on ARM
        </Display>
        <Subtitle1 className={"mb-4"}>
          Software and games that are reported to work on Snapdragon and other
          ARM devices.
        </Subtitle1>

        <div className={"mb-8 flex gap-2"}>
          <ContributeButton query={infoQuery} />
          <ShareButton />
        </div>

        <InfoSection
          query={infoQuery}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          setSelectedCategory={setSelectedCategory}
          setSearchBox={setSearchBox}
        />

        {messageBox === "true" && (
          <MessageBar className="mb-4 w-full">
            <MessageBarBody>
              <MessageBarTitle>Accuracy Notice</MessageBarTitle>
              Some statuses are decided by community vote and have not been
              admin-verified. Look for the subtle question-mark indicator. You
              can help by voting on individual app pages.{" "}
              <FluentLink href="https://github.com/AwaitQuality/windowsonarm/issues/new?assignees=&labels=incorrect-app-info&projects=&template=application-content-change.yml&title=Content+Change+To+Application+%5B+NAME+%5D+needed.">
                Report an issue.
              </FluentLink>
            </MessageBarBody>
            <MessageBarActions
              containerAction={
                <Button
                  aria-label="dismiss"
                  appearance="transparent"
                  icon={<DismissRegular />}
                  onClick={() => setMessageBox("false")}
                />
              }
            />
          </MessageBar>
        )}

        <AppTable
          onAppClick={(app) => router.push(`/${app.id}`)}
          query={postsQuery}
        />
      </div>
    </Container>
  );
}
