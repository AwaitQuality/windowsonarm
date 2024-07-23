import React from "react";
import { Metadata } from "next";
import { getAppById } from "@/lib/api";
import AppDetails from "./AppDetails";

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
    description: `ARM compatibility status for ${app.title}`,
  };
}

export default async function AppDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const app = await getAppById(params.id);

  if (!app) return <div>App not found: {params.id}</div>;

  return <AppDetails app={app} />;
}
