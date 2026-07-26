import React from "react";
import { Metadata } from "next";
import { getAppById } from "@/lib/api";
import { getInfo } from "@/lib/backend/info";
import { Container } from "@/components/ui/container";
import AppHeader from "./app-header";
import AppContent from "./app-content";


export async function generateMetadata(
  props: {
    params: Promise<{ id: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const app = await getAppById(params.id, false);

  if (!app) {
    return {
      title: "App not found - Windows on ARM",
      description: "App not found",
    };
  }

  return {
    title: `Is ${app.title} ARM ready? - Windows on ARM`,
    description: `Check if ${app.title} is ARM ready on Windows and can be used on Windows ARM devices such as the Surface with the Snapdragon X Elite.`,
    keywords: app.tags.map((tag) => tag.name).join(", "),
  };
}

export default async function AppPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [app, info] = await Promise.all([
    getAppById(params.id),
    getInfo(),
  ]);

  if (!app) return <div>App not found: {params.id}</div>;

  // `app` and `info` cross the server/client boundary as-is: the RSC payload
  // serializes Date values natively, so the JSON round-trip this used to do was
  // a deep clone of the whole post and info payload on every render that also
  // erased the prop types down to `any`.
  return (
    <div className="min-h-screen">
      <AppHeader app={app} />
      <Container>
        <AppContent app={app} info={info} />
      </Container>
    </div>
  );
}
