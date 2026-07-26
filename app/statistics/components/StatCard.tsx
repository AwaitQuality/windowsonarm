import React from "react";
import { Card, Title2 } from "@fluentui/react-components";

interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  /** Wraps the icon in a tinted square, e.g. "bg-indigo-500/10". */
  iconBackground?: string;
  children: React.ReactNode;
}

/** Shared header/surface for every card on the statistics dashboard. */
export function StatCard({
  title,
  icon,
  iconBackground,
  children,
}: StatCardProps) {
  return (
    <Card className="p-6 rounded-lg shadow-md" appearance="filled-alternative">
      <div className="flex items-center gap-3 mb-4">
        {iconBackground ? (
          <div className={`p-2 rounded-lg ${iconBackground}`}>{icon}</div>
        ) : (
          icon
        )}
        <Title2>{title}</Title2>
      </div>
      {children}
    </Card>
  );
}

/** Fixed-height box so a chart swapping in does not shift the grid. */
export function ChartFrame({ children }: { children: React.ReactNode }) {
  return <div className="h-[300px] w-full">{children}</div>;
}

/**
 * Stands in for a chart card while recharts is being fetched. Matches the real
 * card's height so the dashboard layout is stable.
 */
export function ChartCardSkeleton({ title }: { title: string }) {
  return (
    <Card className="p-6 rounded-lg shadow-md" appearance="filled-alternative">
      <div className="flex items-center gap-3 mb-4">
        <Title2>{title}</Title2>
      </div>
      <div className="h-[300px] w-full rounded bg-neutral-200/40 dark:bg-neutral-700/30 animate-pulse" />
    </Card>
  );
}
