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
import { DismissRegular, GridDotsRegular } from "@fluentui/react-icons";
import { UseQueryResult } from "@tanstack/react-query";

import StatisticsBar from "@/components/ui/statistics-bar";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { getFluentIcon } from "@/lib/hooks/useFluentIcon";

interface InfoSectionProps {
  query: UseQueryResult<InfoResponse>;
  selectedStatus: number | undefined | null;
  setSelectedStatus: React.Dispatch<
    React.SetStateAction<number | undefined | null>
  >;
  setSelectedCategory: (category: string | null) => void;
  setSearchBox: (search: string) => void;
}

const ALL_CATEGORIES_VALUE = "tab0";

const InfoSection: React.FC<InfoSectionProps> = ({
  selectedStatus,
  setSelectedStatus,
  setSelectedCategory,
  setSearchBox,
  query,
}) => {
  const isDesktop = useMediaQuery("(min-width: 1300px)");
  const [selectedValue, setSelectedValue] = useState(ALL_CATEGORIES_VALUE);

  const { data: info, isError, isPending } = query;

  useEffect(() => {
    if (isDesktop) {
      setSelectedCategory(
        selectedValue === ALL_CATEGORIES_VALUE ? null : selectedValue,
      );
    }
  }, [isDesktop, selectedValue, setSelectedCategory]);

  if (isError) {
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

  if (isPending || !info) {
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
    setSelectedCategory(value === ALL_CATEGORIES_VALUE ? null : value);
  };

  const sortedCategories = [...info.categories].sort(
    (a, b) => a.index - b.index,
  );

  const renderCategorySelector = () => {
    if (isDesktop) {
      return (
        <TabList
          selectedValue={selectedValue}
          onTabSelect={(_, data) => handleCategoryChange(data.value as string)}
        >
          <Tab value={ALL_CATEGORIES_VALUE} icon={<GridDotsRegular />}>
            Show all
          </Tab>
          {sortedCategories.map((category) => {
            const Icon = getFluentIcon(category.icon);
            return (
              <Tab key={category.id} value={category.id} icon={<Icon />}>
                {category.name}
              </Tab>
            );
          })}
        </TabList>
      );
    }

    return (
      <Select
        value={selectedValue}
        onChange={(_, data) => handleCategoryChange(data.value as string)}
        className={"w-full"}
      >
        <option value={ALL_CATEGORIES_VALUE}>Show all</option>
        {sortedCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </Select>
    );
  };

  return (
    <>
      <StatisticsBar
        statuses={info.status}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 h-24 md:h-14 mb-4 w-full">
        {renderCategorySelector()}
        <SearchBox
          className="w-full max-w-full"
          placeholder="Search"
          onChange={(_, e) => setSearchBox(e.value)}
        />
      </div>
    </>
  );
};

export default InfoSection;
