"use client";

import React from "react";
import { aqApi } from "@/lib/axios/api";
import { useInfiniteQuery, useQuery } from "react-query";
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
import { Container } from "@/components/ui/container";
import ShareButton from "@/components/share-button";
import Navigation from "@/components/navigation";
import AppTable from "@/components/app-table";
import { useAppContext } from "@/contexts/AppContext";
import InfoSection from "@/components/info-section";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { PostsResponse } from "@/app/api/v1/posts/route";
import ContributeButton from "@/components/contribute-button";
import { DismissRegular } from "@fluentui/react-icons";
import { usePersistedState } from "@/lib/persisted-state";
import { useRouter } from "next/navigation";

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

  const fetchPosts = async ({ pageParam = null }) => {
    const response = await aqApi.get<PostsResponse>(
      `/api/v1/posts?cursor=${pageParam || ""}&category=${selectedCategory || ""}&status=${selectedStatus === null ? "" : selectedStatus}&search=${searchBox}&verified=true`,
    );

    if (!response.success) {
      throw new Error(response.error);
    }

    return response.data;
  };

  const fetchInfo = async () => {
    const response = await aqApi.get<InfoResponse>("/api/v1/info");

    if (!response.success) {
      throw new Error(response.error);
    }

    return response.data;
  };

  const infoQuery = useQuery(
    ["info", selectedStatus === null ? "default" : selectedStatus],
    fetchInfo,
    {
      refetchOnWindowFocus: false,
      cacheTime: 1000 * 60 * 5,
      staleTime: 1000 * 60 * 5,
      keepPreviousData: true,
    },
  );

  const query = useInfiniteQuery(
    ["posts", selectedCategory, selectedStatus, searchBox],
    fetchPosts,
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      cacheTime: 1000 * 60 * 5,
      staleTime: 1000 * 60 * 5,
    },
  );

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
              Please note that the correctness of the information provided here
              is not guaranteed. Please verify the information before making any
              decisions. Report any issues{" "}
              <FluentLink href="https://github.com/AwaitQuality/windowsonarm/issues/new?assignees=&labels=incorrect-app-info&projects=&template=application-content-change.yml&title=Content+Change+To+Application+%5B+NAME+%5D+needed.">
                here
              </FluentLink>
              .
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
            ></MessageBarActions>
          </MessageBar>
        )}

        <AppTable
          onAppClick={(app) => router.push(`/${app.id}`)}
          query={query}
        />
      </div>
    </Container>
  );
}
