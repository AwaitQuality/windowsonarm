import React from "react";
import { Card, Subtitle1 } from "@fluentui/react-components";
import Giscus from "@giscus/react";

interface DiscussionsCardProps {
  term: string;
}

const DiscussionsCard: React.FC<DiscussionsCardProps> = ({ term }) => (
  <Card
    className="rounded-lg shadow-md p-6 mb-8"
    appearance="filled-alternative"
    size="large"
  >
    <Subtitle1 className="mb-4">Discuss on Github</Subtitle1>
    <Giscus
      repo="AwaitQuality/windowsonarm"
      repoId="R_kgDOMUHZaw"
      category="General"
      categoryId="DIC_kwDOMUHZa84Cg2tJ"
      mapping="specific"
      term={term}
      strict="0"
      theme="noborder_dark"
      reactionsEnabled="0"
      emitMetadata="0"
      inputPosition="bottom"
      lang="en"
    />
  </Card>
);

export default DiscussionsCard;
