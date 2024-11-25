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
import InfoSection from "@/components/info-section";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { PostsResponse } from "@/app/api/v1/posts/route";
import ContributeButton from "@/components/contribute-button";
import { DismissRegular } from "@fluentui/react-icons";
import { usePersistedState } from "@/lib/persisted-state";
import { useRouter } from "next/navigation";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { useQueryStates, parseAsString } from "nuqs";

export default function Home() {
  const [{ category, status, search }, setQueryStates] = useQueryStates({
    category: parseAsString.withDefault(""),
    status: parseAsString.withDefault(""),
    search: parseAsString.withDefault(""),
  });

  const selectedCategory = category || null;
  const selectedStatus = status ? parseInt(status) : null;
  const searchBox = search || "";

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

  // Helper functions to update URL state
  const setSelectedCategory = (newCategory: string | null) => {
    setQueryStates({ category: newCategory || "" });
  };

  const setSelectedStatus = (newStatus: number | null) => {
    setQueryStates({ status: newStatus?.toString() || "" });
  };

  const setSearchBox = (newSearch: string) => {
    setQueryStates({ search: newSearch });
  };

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
          selectedCategory={selectedCategory}
          setSelectedStatus={setSelectedStatus}
          setSelectedCategory={setSelectedCategory}
          setSearchBox={setSearchBox}
        />

        <div className="rounded-lg p-4 mb-5 relative overflow-hidden w-full">
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-500/20 to-transparent opacity-70 blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10 gap-4">
            <div className="flex items-center">
              <span className="sm:font-semibold">
                We now have a Discord server! Join now to get support and
                discuss Windows on ARM with other users.
              </span>
            </div>
            <Button
              as="a"
              href="https://discord.gg/8EVWtctVEk"
              target="_blank"
              rel="noopener noreferrer"
              className=""
              appearance="primary"
              icon={<SiDiscord />}
            >
              Join Now
            </Button>
          </div>
        </div>

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
