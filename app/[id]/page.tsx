import React from "react";
import { Metadata } from "next";
import { getAppById } from "@/lib/api";
import AppDetails from "./AppDetails";
import { getInfo } from "@/lib/backend/info";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const app = await getAppById(params.id);

  if (!app) {
    return {
      title: "App not found - Windows on ARM",
      description: "App not found",
    };
  }

  return {
    title: `Is ${app.title} ARM ready? - Windows on ARM`,
    description: `Check if ${app.title} is ARM ready on Windows and can be used on Windows ARM devices such as the Surface with the Snapdragon X Elite.`,
    keywords: app.tags.map((tag: any) => tag.name).join(", "),
  };
}

export default async function AppDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const app = JSON.parse(JSON.stringify(await getAppById(params.id)));
  const info = await getInfo();

  if (!app) return <div>App not found: {params.id}</div>;

  return <AppDetails app={app} info={info} />;
}
