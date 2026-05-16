import React, { useState } from "react";
import { Card, Link as FluentLink } from "@fluentui/react-components";
import GlobalMarkdown from "@/components/markdown";

const PREVIEW_LIMIT = 820;

interface AppDescriptionProps {
  description: string;
}

const AppDescription: React.FC<AppDescriptionProps> = ({ description }) => {
  const [expanded, setExpanded] = useState(false);
  const isTruncated = description.length > PREVIEW_LIMIT;

  const head = isTruncated && !expanded
    ? description.slice(0, PREVIEW_LIMIT) + "..."
    : description.slice(0, PREVIEW_LIMIT);
  const tail = expanded ? description.slice(PREVIEW_LIMIT) : "";

  return (
    <Card
      className="rounded-lg p-6 mb-8"
      appearance="filled-alternative"
      size="large"
    >
      <GlobalMarkdown>{head}</GlobalMarkdown>
      {tail && <GlobalMarkdown>{tail}</GlobalMarkdown>}
      {isTruncated && (
        <div className="mt-4">
          <FluentLink onClick={() => setExpanded(!expanded)}>
            {expanded ? "Show less" : "Show more"}
          </FluentLink>
        </div>
      )}
    </Card>
  );
};

export default AppDescription;
