import React from "react";
import { StatusWithPercentage } from "@/app/api/v1/info/route";
import { cn } from "@/lib/utils";

interface StatisticsBarProps {
  statuses: StatusWithPercentage[];
  selectedStatus: number | null | undefined;
  setSelectedStatus: React.Dispatch<
    React.SetStateAction<number | undefined | null>
  >;
}

const StatisticsBar: React.FC<StatisticsBarProps> = ({
  statuses,
  selectedStatus,
  setSelectedStatus,
}) => {
  return (
    <div className="my-4 h-10 w-full">
      <div className="w-full rounded-full flex">
        {statuses
          .filter(
            (status) =>
              selectedStatus === undefined || status.id === selectedStatus,
          )
          .filter((status) => status.percentage > 0)
          .sort((a, b) => a.index - b.index)
          .map((status, index) => (
            <div
              key={index}
              className="group relative flex flex-col gap-2 hover:cursor-pointer hover:transform hover:scale-105 transition-all duration-200 hover:z-10"
              style={{
                width: `${selectedStatus === undefined ? status.percentage : 100}%`,
              }}
              onClick={() =>
                setSelectedStatus(
                  selectedStatus === status.id ? undefined : status.id,
                )
              }
            >
              <div className="flex items-center">
                <span className="mr-2" style={{ color: status.color }}>
                  &#9632;
                </span>
                <span
                  className={cn(
                    "overflow-hidden text-nowrap group-hover:overflow-visible group-hover:z-10 group-hover:shadow-lg group-hover:px-1 group-hover:bg-neutral-800/60 group-hover:rounded-md group-hover:backdrop-blur-md",
                    status.percentage < 5 && selectedStatus !== status.id
                      ? "hidden group-hover:block"
                      : "",
                  )}
                >
                  {selectedStatus === status.id && <b>Selected: </b>}
                  {status.name}{" "}
                  {status.percentage <= 5 && (
                    <span className={"group-hover:inline hidden"}>
                      ({status.percentage}%)
                    </span>
                  )}
                </span>
              </div>
              <div
                className={cn(
                  `h-2 pl-2 w-full ${index === 0 ? "rounded-l-full" : ""} ${index === statuses.length - 1 ? "rounded-r-full" : ""} ${selectedStatus === status.id ? "rounded-full" : ""} group-hover:h-5`,
                  selectedStatus === status.id ? "h-5" : "",
                )}
                style={{
                  backgroundColor: status.color,
                }}
              >
                {(status.percentage > 5 || selectedStatus === status.id) && (
                  <div
                    className={cn(
                      "hidden group-hover:block",
                      selectedStatus === status.id ? "block" : "",
                    )}
                  >
                    {status.percentage}%{" "}
                    {(status.percentage > 20 || selectedStatus === status.id) &&
                      `of total apps are ${status.name}`}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default StatisticsBar;
