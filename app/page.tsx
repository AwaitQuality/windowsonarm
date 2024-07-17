"use client";

import React from "react";
import { aqApi } from "@/lib/axios/api";
import { useInfiniteQuery, useQuery } from "react-query";
import { Display, Subtitle1 } from "@fluentui/react-components";
import { Container } from "@/components/ui/container";
import ShareButton from "@/components/share-button";
import SelectedAppModal from "@/components/selected-app-modal";
import Navigation from "@/components/navigation";
import AppTable from "@/components/app-table";
import { useAppContext } from "@/contexts/AppContext";
import InfoSection from "@/components/info-section";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { PostsResponse } from "@/app/api/v1/posts/route";
import ContributeButton from "@/components/contribute-button";

export default function Home() {
  const {
    selectedApp,
    setSelectedApp,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
  } = useAppContext();

  const [searchBox, setSearchBox] = React.useState<string>("");

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

  const closeModal = () => {
    setSelectedApp(null);
  };

  return (
    <Container>
      <Navigation className={"pt-10"} />

      <div className="flex flex-col items-center pt-5" id={"#app"}>
        <SelectedAppModal
          selectedApp={selectedApp}
          open={selectedApp !== null}
          closeModal={closeModal}
        />

        <Display>
          <span className={"text-blue-400"}>Windows 11</span> on ARM
        </Display>
        <Subtitle1 className={"mb-4"}>
          Apps that are reported to support Windows 11 on ARM
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

        <AppTable onAppClick={setSelectedApp} query={query} />
      </div>
    </Container>
  );
}
