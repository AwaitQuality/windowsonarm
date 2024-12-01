import React from "react";
import { Metadata } from "next";
import { getAppById } from "@/lib/api";
import { getInfo } from "@/lib/backend/info";
import { Container } from "@/components/ui/container";
import AppHeader from "./app-header";
import AppContent from "./app-content";

export const runtime = "edge";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
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
    keywords: app.tags.map((tag: any) => tag.name).join(", "),
  };
}

export default async function AppPage({ params }: { params: { id: string } }) {
  const [app, info] = await Promise.all([
    getAppById(params.id),
    getInfo(),
  ]);

  if (!app) return <div>App not found: {params.id}</div>;

  const serializedApp = JSON.parse(JSON.stringify(app));
  const serializedInfo = JSON.parse(JSON.stringify(info));

  return (
    <div className="min-h-screen">
      <AppHeader app={serializedApp} />
      <Container>
        <AppContent app={serializedApp} info={serializedInfo} />
      </Container>
    </div>
  );
}
