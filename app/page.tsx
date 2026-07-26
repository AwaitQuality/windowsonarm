"use client";

import React from "react";
import { aqApi } from "@/lib/http/client";
import { useQuery } from "@tanstack/react-query";
import { useInfoQuery, usePostsQuery } from "@/lib/hooks/usePosts";
import {
  Button,
  Display,
  Link as FluentLink,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Subtitle1,
  Card,
  Text,
} from "@fluentui/react-components";
import { Container } from "@/components/ui/container";
import ShareButton from "@/components/share-button";
import Navigation from "@/components/navigation";
import AppTable from "@/components/app-table";
import InfoSection from "@/components/info-section";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import type { PostsResponse } from "@/app/api/v1/posts/route";
import ContributeButton from "@/components/contribute-button";
import { DismissRegular } from "@fluentui/react-icons";
import { usePersistedState } from "@/lib/hooks/use-persisted-state";
import { useRouter } from "next/navigation";
import { SiDiscord } from "@icons-pack/react-simple-icons";
import { useQueryStates, parseAsString } from "nuqs";
import { BlogCard } from "@/components/blog/blog-card";
import { CreateBlogPost } from "@/components/blog/create-blog-post";
import { useUser } from "@clerk/nextjs";
import { BlogSection } from "@/components/blog/blog-section";

// Add interface for BlogPost
interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  published: boolean;
  author_id: string;
  created_at: Date;
  updated_at: Date;
  author: {
    username?: string;
    imageUrl?: string;
  };
}

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

  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const infoQuery = useInfoQuery(selectedStatus);

  const query = usePostsQuery({
    category: selectedCategory,
    status: selectedStatus,
    search: searchBox,
  });

  const { data: blogPosts = [], isPending: blogLoading } = useQuery<BlogPost[]>({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const response = await aqApi.get<BlogPost[]>("/api/v1/blog");
      if (!response.success) {
        throw new Error(response.error);
      }
      return response.data;
    },
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
  });

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
          <span className={"text-blue-400"}>Windows ARM</span> Software & News
        </Display>
        <Subtitle1 className={"mb-4"}>
          News and software & games compatibility for Windows ARM (Snapdragon)
          devices.
        </Subtitle1>

        <div className={"mb-8 flex gap-2"}>
          <ContributeButton query={infoQuery} />
          <ShareButton />
        </div>

        <BlogSection posts={blogPosts} isAdmin={isAdmin} isLoading={blogLoading} />

        <InfoSection
          query={infoQuery}
          selectedStatus={selectedStatus}
          selectedCategory={selectedCategory}
          setSelectedStatus={setSelectedStatus}
          setSelectedCategory={setSelectedCategory}
          setSearchBox={setSearchBox}
          searchValue={searchBox}
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

        {/* Rows navigate via the title link, so no row-level click handler. */}
        <AppTable query={query} />
      </div>
    </Container>
  );
}
