import React, { useEffect, useMemo, useRef, useState } from "react";
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
import StatisticsBar from "@/components/ui/statistics-bar";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import type { UseQueryResult } from "@tanstack/react-query";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { FluentIcon } from "@/lib/hooks/useFluentIcon";

const SEARCH_DEBOUNCE_MS = 300;

interface InfoSectionProps {
  query: UseQueryResult<InfoResponse>;
  selectedStatus: number | null;
  selectedCategory: string | null;
  setSelectedStatus: (status: number | null) => void;
  setSelectedCategory: (category: string | null) => void;
  setSearchBox: (search: string) => void;
  /** Current committed search term, so the box stays controlled across back/forward. */
  searchValue?: string;
}

const InfoSection: React.FC<InfoSectionProps> = ({
  selectedStatus,
  selectedCategory,
  setSelectedStatus,
  setSelectedCategory,
  setSearchBox,
  searchValue,
  query,
}) => {
  const isDesktop = useMediaQuery("(min-width: 1300px)");

  const {
    data: info,
    isError: infoIsError,
    isPending: infoIsPending,
  } = query;

  // Derived straight from the prop — mirroring it into state only risked drift.
  const selectedValue = selectedCategory || "tab0";

  // `sort` mutates, and `info.categories` is the array react-query has cached,
  // so it has to be copied before sorting.
  const sortedCategories = useMemo(
    () => [...(info?.categories ?? [])].sort((a, b) => a.index - b.index),
    [info?.categories],
  );

  // The committed search term is part of the posts query key, so keystrokes are
  // held locally and only pushed to the URL after a pause.
  const [searchInput, setSearchInput] = useState(searchValue ?? "");
  const lastCommittedRef = useRef(searchValue ?? "");
  const setSearchBoxRef = useRef(setSearchBox);

  // Assigned in an effect, not during render: refs must not be written while
  // rendering.
  useEffect(() => {
    setSearchBoxRef.current = setSearchBox;
  }, [setSearchBox]);

  useEffect(() => {
    if (searchValue === undefined) return;
    if (searchValue !== lastCommittedRef.current) {
      lastCommittedRef.current = searchValue;
      setSearchInput(searchValue);
    }
  }, [searchValue]);

  useEffect(() => {
    if (searchInput === lastCommittedRef.current) return;

    const timer = setTimeout(() => {
      lastCommittedRef.current = searchInput;
      setSearchBoxRef.current(searchInput);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const [errorDismissed, setErrorDismissed] = useState(false);

  if (infoIsError && !errorDismissed) {
    return (
      <MessageBar>
        <MessageBarBody>
          <MessageBarTitle>Something went wrong</MessageBarTitle>
          We couldn&apos;t fetch the data. Please try again later.
        </MessageBarBody>
        <MessageBarActions
          containerAction={
            <Button
              aria-label="Dismiss"
              appearance="transparent"
              icon={<DismissRegular />}
              onClick={() => setErrorDismissed(true)}
            />
          }
        >
          <Button onClick={() => query.refetch()}>Retry</Button>
        </MessageBarActions>
      </MessageBar>
    );
  }

  if (infoIsPending || !info) {
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
    setSelectedCategory(value === "tab0" ? null : value);
  };

  return (
    <>
      <StatisticsBar
        statuses={info.status}
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
            {sortedCategories.map((category) => {
              return (
                <Tab
                  key={category.id}
                  value={category.id}
                  icon={<FluentIcon name={category.icon} />}
                >
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
            {sortedCategories.map((category) => (
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
          value={searchInput}
          onChange={(_, e) => setSearchInput(e.value)}
        />
      </div>
    </>
  );
};

export default InfoSection;
