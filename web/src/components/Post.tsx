import { Box, Flex, Heading, IconButton, Text } from "@chakra-ui/core";
import React from "react";
import { PostSnippetFragment, useVoteMutation } from "../generated/graphql";

interface PostProps {
  post: PostSnippetFragment;
}

export const PostComponent: React.FC<PostProps> = ({
  post: { id, author, textSnippet, points, title, voteStatus },
}) => {
  const [, vote] = useVoteMutation();
  return (
    <Box key={id} p={5} shadow="md" borderWidth="1px">
      <Flex justifyContent="space-between">
        <Heading fontSize="xl">{title}</Heading>
        {author.username}
      </Flex>
      <Text mt={4}>{textSnippet}</Text>
      <br />
      <IconButton
        aria-label="upvote a post"
        icon="chevron-up"
        size="sm"
        variantColor={voteStatus === 1 ? "green" : undefined}
        mr={2}
        onClick={async () => {
          if (voteStatus === 1) {
            return;
          }
          await vote({ value: 1, postId: id });
        }}
      />
      {points}
      <IconButton
        aria-label="downvote a post"
        icon="chevron-down"
        size="sm"
        ml={2}
        variantColor={voteStatus === -1 ? "red" : undefined}
        onClick={async () => {
          if (voteStatus === -1) {
            return;
          }
          vote({ value: -1, postId: id });
        }}
      />
    </Box>
  );
};
