import React from "react";
import { Metadata } from "next";
import { getAppById } from "@/lib/api";
import { getInfo } from "@/lib/backend/info";
import { getVoteSummary } from "@/lib/backend/voting";
import { listReviews } from "@/lib/backend/reviews";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdminUser } from "@/lib/backend/auth";
import { PENDING_STATUS_ID } from "@/lib/schemas/post";
import { Container } from "@/components/ui/container";
import AppHeader from "./app-header";
import AppContent from "./app-content";
import StatusVoteCard from "@/components/voting/status-vote-card";


export async function generateMetadata(
  props: {
    params: Promise<{ id: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const app = await getAppById(params.id, false);

  // Pending submissions must not leak their title through metadata either.
  if (app && app.effective_status_id === PENDING_STATUS_ID) {
    return {
      title: "App not found - Windows on ARM",
      description: "App not found",
      robots: { index: false, follow: false },
    };
  }

  if (!app) {
    // notFound() cannot change the status once streaming has started, so this
    // renders as a soft 404. Keep it out of the index explicitly.
    return {
      title: "App not found - Windows on ARM",
      description: "App not found",
      robots: { index: false, follow: false },
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
  const { userId } = await auth();

  // Prefetched together with the post: the vote tally and the review list were
  // previously two more Worker invocations fired from the browser on mount.
  const [app, info, voteSummary, reviews] = await Promise.all([
    getAppById(params.id),
    getInfo(),
    getVoteSummary(params.id, userId),
    listReviews(params.id),
  ]);

  if (!app) notFound();

  // Same visibility rule as the API: a pending submission is only readable by
  // its submitter or an admin. Without this the page rendered the review queue
  // to anyone holding an id, even though /api/v1/posts/[id] 404s it.
  if (app.effective_status_id === PENDING_STATUS_ID) {
    const isOwner = Boolean(userId && app.user_id === userId);

    if (!isOwner && !(userId && (await isAdminUser(userId)))) {
      notFound();
    }
  }

  // `app` and `info` cross the server/client boundary as-is: the RSC payload
  // serializes Date values natively, so the JSON round-trip this used to do was
  // a deep clone of the whole post and info payload on every render that also
  // erased the prop types down to `any`.
  return (
    <div className="min-h-screen">
      <AppHeader app={app} />
      <Container>
        {/* First screenful, not the bottom of the sidebar. */}
        <StatusVoteCard
          app={app}
          info={info}
          initialSummary={voteSummary ?? undefined}
        />
        <AppContent app={app} info={info} initialReviews={reviews} />
      </Container>
    </div>
  );
}
