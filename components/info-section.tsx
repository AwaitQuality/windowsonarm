import React, { useEffect, useState } from "react";
import {
  Button,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  SearchBox,
  Select,
  Tab,
  TabList,
} from "@fluentui/react-components";
import * as FluentIcons from "@fluentui/react-icons";
import { DismissRegular, GridDotsRegular } from "@fluentui/react-icons";
import StatisticsBar from "@/components/ui/statistics-bar";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";
import { UseQueryResult } from "react-query";

// Custom useMediaQuery hook
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

interface InfoSectionProps {
  query: UseQueryResult<InfoResponse>;
  selectedStatus: number | undefined | null;
  setSelectedStatus: React.Dispatch<
    React.SetStateAction<number | undefined | null>
  >;
  setSelectedCategory: (category: string | null) => void;
  setSearchBox: (search: string) => void;
}

const InfoSection: React.FC<InfoSectionProps> = ({
  selectedStatus,
  setSelectedStatus,
  setSelectedCategory,
  setSearchBox,
  query,
}) => {
  const isDesktop = useMediaQuery("(min-width: 1300px)");
  const [selectedValue, setSelectedValue] = useState("tab0");

  const {
    data: info,
    isError: infoIsError,
    isLoading: infoIsLoading,
    isIdle: infoIsIdle,
  } = query;

  useEffect(() => {
    if (isDesktop) {
      setSelectedCategory(selectedValue === "tab0" ? null : selectedValue);
    }
  }, [isDesktop, selectedValue, setSelectedCategory]);

  if (infoIsError) {
    return (
      <MessageBar>
        <MessageBarBody>
          <MessageBarTitle>Something went wrong</MessageBarTitle>
          We couldn't fetch the data. Please try again later.
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

  if (infoIsIdle || infoIsLoading || !info) {
    return null;
  }

  const handleCategoryChange = (value: string) => {
    setSelectedValue(value);
    setSelectedCategory(value === "tab0" ? null : value);
  };

  const renderCategorySelector = () => {
    if (isDesktop) {
      return (
        <TabList
          selectedValue={selectedValue}
          onTabSelect={(_, data) => handleCategoryChange(data.value as string)}
        >
          <Tab value="tab0" icon={<GridDotsRegular />}>
            Show all
          </Tab>
          {info.categories
            .sort((a, b) => a.index - b.index)
            .map((category) => {
              // @ts-ignore
              const Icon = FluentIcons[category.icon];
              return (
                <Tab key={category.id} value={category.id} icon={<Icon />}>
                  {category.name}
                </Tab>
              );
            })}
        </TabList>
      );
    } else {
      return (
        <Select
          value={selectedValue}
          onChange={(_, data) => handleCategoryChange(data.value as string)}
          className={"w-full"}
        >
          <option value="tab0">Show all</option>
          {info.categories
            .sort((a, b) => a.index - b.index)
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </Select>
      );
    }
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
        {renderCategorySelector()}
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
