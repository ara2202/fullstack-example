import { Box, IconButton, Link } from "@chakra-ui/core";
import React from "react";
import NextLink from "next/link";
import { useDeletePostMutation, useMeQuery } from "../generated/graphql";

interface EditAndDeleteButtonsProps {
  postId: number;
  authorId: number;
}

export const EditAndDeleteButtons: React.FC<EditAndDeleteButtonsProps> = ({
  authorId,
  postId,
}) => {
  const { data } = useMeQuery();
  const [deletePost] = useDeletePostMutation();

  if (data?.me?.id !== authorId) return null;

  return (
    <Box>
      <NextLink href="/post/edit/[id]" as={`/post/edit/${postId}`}>
        <IconButton as={Link} aria-label="edit post" icon="edit" mr={4} />
      </NextLink>
      <IconButton
        aria-label="delete post"
        icon="delete"
        onClick={() =>
          deletePost({
            variables: { id: postId },
            update: (cache) => {
              cache.evict({ id: "Post:" + postId });
            },
          })
        }
      />
    </Box>
  );
};
