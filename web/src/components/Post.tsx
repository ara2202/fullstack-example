import { Box, Flex, Heading, IconButton, Text } from "@chakra-ui/core";
import { title } from "process";
import React from "react";
import { PostSnippetFragment, useVoteMutation } from "../generated/graphql";

interface PostProps {
  post: PostSnippetFragment;
}

export const PostComponent: React.FC<PostProps> = ({
  post: { id, author, textSnippet, points },
}) => {
  const [, vote] = useVoteMutation();
  return (
    <Box key={id} p={5} shadow="md" borderWidth="1px">
      <Flex justifyContent="space-between">
        <Heading fontSize="xl">{title}</Heading>
        {author.username}
      </Flex>
      <Text mt={4}>{textSnippet}</Text>
      {title}
      <br />
      <IconButton
        aria-label="upvote a post"
        icon="chevron-up"
        size="sm"
        mr={2}
        onClick={() => vote({ value: 1, postId: id })}
      />
      {points}
      <IconButton
        aria-label="downvote a post"
        icon="chevron-down"
        size="sm"
        ml={2}
        onClick={() => vote({ value: -1, postId: id })}
      />
    </Box>
  );
};
