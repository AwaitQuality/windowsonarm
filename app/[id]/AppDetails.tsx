"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";

import { Container } from "@/components/ui/container";
import Hero from "@/components/app-details/Hero";
import AppDescription from "@/components/app-details/AppDescription";
import TagsCard from "@/components/app-details/TagsCard";
import DiscussionsCard from "@/components/app-details/DiscussionsCard";
import Sidebar from "@/components/app-details/Sidebar";
import EditDialog from "@/components/app-details/EditDialog";
import StatusVoteCard from "@/components/voting/StatusVoteCard";
import ForumMessages from "@/app/[id]/ForumMessages";

import { FullPost } from "@/lib/types/prisma/prisma-types";
import { InfoResponse } from "@/lib/backend/response/info/InfoResponse";

interface AppDetailsProps {
  app: FullPost;
  info: InfoResponse;
}

export default function AppDetails({ app, info }: AppDetailsProps) {
  const { user } = useUser();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const isEditable = user?.publicMetadata.role === "admin";

  return (
    <div className="min-h-screen">
      <Hero app={app} />
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <AppDescription description={app.description} />
            <StatusVoteCard app={app} info={info} />
            <TagsCard tags={app.tags} />
            <ForumMessages postId={app.id} />
            <DiscussionsCard term={app.title} />
          </div>

          <Sidebar
            app={app}
            isEditable={isEditable}
            onEditClick={() => setIsEditOpen(true)}
          />
        </div>
      </Container>

      {isEditable && (
        <EditDialog
          app={app}
          info={info}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSaved={() => window.location.reload()}
        />
      )}
    </div>
  );
}
