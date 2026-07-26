import React, { useEffect, useState } from "react";
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  SearchBox,
  Select,
  Skeleton,
  SkeletonItem,
  Tab,
  TabList,
} from "@fluentui/react-components";
import * as FluentIcons from "@fluentui/react-icons";
import { DismissRegular, GridDotsRegular } from "@fluentui/react-icons";
import StatisticsBar from "@/components/ui/statistics-bar";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

interface InfoSectionProps {
  query: UseQueryResult<InfoResponse>;
  selectedStatus: number | null;
  selectedCategory: string | null;
  setSelectedStatus: (status: number | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setSearchBox: (search: string) => void;
}

const InfoSection: React.FC<InfoSectionProps> = ({
  selectedStatus,
  selectedCategory,
  setSelectedStatus,
  setSelectedCategory,
  setSearchBox,
  query,
}) => {
  const isDesktop = useMediaQuery("(min-width: 1300px)");
  const [selectedValue, setSelectedValue] = useState(selectedCategory || "tab0");

  const {
    data: info,
    isError: infoIsError,
    isPending: infoIsPending,
  } = query;

  useEffect(() => {
    setSelectedValue(selectedCategory || "tab0");
  }, [selectedCategory]);

  if (infoIsError) {
    return (
      <MessageBar>
        <MessageBarBody>
          <MessageBarTitle>Something went wrong</MessageBarTitle>
          We couldn&apos;t fetch the data. Please try again later.
        </MessageBarBody>
        <MessageBarActions
          containerAction={
            <Button
              aria-label="dismiss"
              appearance="transparent"
              icon={<DismissRegular />}
            />
          }
        >
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </MessageBarActions>
      </MessageBar>
    );
  }

  if (infoIsPending || infoIsPending || !info) {
    return (
      <Skeleton
        aria-label="Loading Content"
        className="w-full h-28 space-y-4 mt-4 mb-4"
      >
        <SkeletonItem className="w-full !h-10" />
        <div className="flex flex-row gap-2">
          <SkeletonItem className="!h-8" />
          <SkeletonItem className="!h-8" />
          <SkeletonItem className="!h-8" />
          <SkeletonItem className="!h-8" />
          <SkeletonItem className="!h-8" />
          <SkeletonItem className="!h-8" />
        </div>
      </Skeleton>
    );
  }

  const handleCategoryChange = (value: string) => {
    setSelectedValue(value);
    setSelectedCategory(value === "tab0" ? null : value);
  };

  return (
    <>
      <StatisticsBar
        statuses={info?.status || []}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />
      <div
        className={
          "flex flex-col md:flex-row items-center justify-center gap-4 h-24 md:h-14 mb-4 w-full"
        }
      >
        {isDesktop ? (
          <TabList
            selectedValue={selectedValue}
            onTabSelect={(_, data) => handleCategoryChange(data.value as string)}
          >
            <Tab value="tab0" icon={<GridDotsRegular />}>
              Show all
            </Tab>
            {info?.categories
              .sort((a, b) => a.index - b.index)
              .map((category) => {
                // @ts-ignore
                let Icon = FluentIcons[category.icon];
                if (!Icon) {
                  Icon = FluentIcons.InfoRegular;
                }
                return (
                  <Tab key={category.id} value={category.id} icon={<Icon />}>
                    {category.name}
                  </Tab>
                );
              })}
          </TabList>
        ) : (
          <Select
            value={selectedValue}
            onChange={(_, data) => handleCategoryChange(data.value as string)}
            className={"w-full"}
          >
            <option value="tab0">Show all</option>
            {info?.categories
              .sort((a, b) => a.index - b.index)
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </Select>
        )}
        <SearchBox
          className={"w-full"}
          placeholder={"Search"}
          style={{ maxWidth: "100%" }}
          onChange={(_, e) => setSearchBox(e.value)}
        />
      </div>
    </>
  );
};

export default InfoSection;
