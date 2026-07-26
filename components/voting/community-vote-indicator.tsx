import React from "react";
import { Tooltip } from "@fluentui/react-components";
import { QuestionCircleRegular } from "@fluentui/react-icons";

interface CommunityVoteIndicatorProps {
  className?: string;
  size?: number;
}

const TOOLTIP_TEXT =
  "Community-voted status. This status has not been verified by an admin and was determined by user votes.";

const CommunityVoteIndicator: React.FC<CommunityVoteIndicatorProps> = ({
  className,
  size = 14,
}) => (
  <Tooltip
    content={TOOLTIP_TEXT}
    relationship="description"
    withArrow
    positioning="above"
  >
    <span
      role="img"
      aria-label="Community-voted status"
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        opacity: 0.55,
        cursor: "help",
      }}
    >
      <QuestionCircleRegular fontSize={size} />
    </span>
  </Tooltip>
);

export default CommunityVoteIndicator;
