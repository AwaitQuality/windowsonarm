"use client";

import { FullPost } from "@/lib/types/prisma/prisma-types";
import { Container } from "@/components/ui/container";
import {
  CalendarRegular,
  PersonRegular,
  TagRegular,
} from "@fluentui/react-icons";
import dayjs from "dayjs";
import { makeStyles, tokens } from "@fluentui/react-components";
import CommunityVoteIndicator from "@/components/voting/community-vote-indicator";

const useStyles = makeStyles({
  heroTitle: {
    fontSize: tokens.fontSizeHero900,
    lineHeight: tokens.lineHeightHero900,
    fontWeight: tokens.fontWeightBold,
    "@media (min-width: 768px)": {
      fontSize: tokens.fontSizeHero1000,
      lineHeight: tokens.lineHeightHero1000,
    },
  },
  heroSubtitle: {
    fontSize: tokens.fontSizeBase600,
    lineHeight: tokens.lineHeightBase600,
    fontWeight: tokens.fontWeightSemibold,
  },
});

export default function AppHeader({ app }: { app: FullPost }) {
  const classes = useStyles();
  const displayStatus = app.effective_status ?? app.status;

  return (
    <div className="bg-gradient-to-r from-blue-800 to-blue-950 text-white py-16 mb-12">
      <Container>
        <div className="flex items-center mb-4">
          {app.icon_url && (
            <div className="mr-4 bg-gray-300 p-2 rounded-lg shadow-md w-20 h-20 flex items-center justify-center">
              <img
                src={app.icon_url}
                alt={`${app.title} icon`}
                className="rounded-md max-w-full max-h-full object-contain h-[64px] w-[64px]"
              />
            </div>
          )}
          <h1 className={classes.heroTitle}>Is {app.title} ARM ready?</h1>
        </div>
        <h2 className={`${classes.heroSubtitle} mb-6`}>
          <span
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full`}
            style={{ backgroundColor: displayStatus?.color }}
          >
            {displayStatus?.text}
            {app.community_voted && <CommunityVoteIndicator size={16} />}
          </span>
        </h2>
        <div className="flex items-center space-x-4 text-sm">
          <span className="flex items-center">
            <CalendarRegular className="mr-2" />
            {dayjs(app.created_at).format("MMMM D, YYYY")}
          </span>
          <span className="flex items-center">
            <PersonRegular className="mr-2" />
            {app.user?.username || "Anonymous"}
          </span>
          {app.category && (
            <span className="flex items-center">
              <TagRegular className="mr-2" />
              {app.category.name}
            </span>
          )}
        </div>
      </Container>
    </div>
  );
}
