import React from "react";
import { Card, Subtitle1, Tag } from "@fluentui/react-components";
import type { Tag as PrismaTag } from "@prisma/client";

interface TagsCardProps {
  tags: PrismaTag[];
}

const TagsCard: React.FC<TagsCardProps> = ({ tags }) => {
  if (!tags?.length) return null;

  return (
    <Card
      className="rounded-lg shadow-md p-6 mb-8"
      appearance="filled-alternative"
      size="large"
    >
      <Subtitle1 className="mb-4">Tags</Subtitle1>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Tag key={tag.id} className="text-sm">
            {tag.name}
          </Tag>
        ))}
      </div>
    </Card>
  );
};

export default TagsCard;
