import React from "react";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@fluentui/react-components";
import { Post } from "@prisma/client";

interface AdminAppTableProps {
  posts: Post[];
  onEditClick: (post: Post) => void;
  onDeleteClick: (postId: string) => void;
}

const AdminAppTable: React.FC<AdminAppTableProps> = ({
  posts,
  onEditClick,
  onDeleteClick,
}) => {
  return (
    <Table aria-label="Admin Posts Table">
      <TableHeader>
        <TableRow>
          <TableHeaderCell>Title</TableHeaderCell>
          <TableHeaderCell>Company</TableHeaderCell>
          <TableHeaderCell>Actions</TableHeaderCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {posts.map((post) => (
          <TableRow key={post.id}>
            <TableCell>
              <TableCellLayout>{post.title}</TableCellLayout>
            </TableCell>
            <TableCell>
              <TableCellLayout>{post.company}</TableCellLayout>
            </TableCell>
            <TableCell>
              <Button onClick={() => onEditClick(post)}>Edit</Button>
              <Button
                appearance="secondary"
                onClick={() => onDeleteClick(post.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AdminAppTable;
