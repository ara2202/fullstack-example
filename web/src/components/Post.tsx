import { ApolloCache, gql } from "@apollo/client";
import { Box, Flex, Heading, IconButton, Link, Text } from "@chakra-ui/core";
import NextLink from "next/link";
import React from "react";
import {
  PostSnippetFragment,
  useVoteMutation,
  VoteMutation,
} from "../generated/graphql";
import { EditAndDeleteButtons } from "./EditAndDeleteButtons";

interface PostProps {
  post: PostSnippetFragment;
}

const updateAfterVote = (
  value: number,
  postId: number,
  cache: ApolloCache<VoteMutation>
) => {
  const curVoteData = cache.readFragment<PostSnippetFragment>({
    id: "Post:" + postId,
    fragment: gql`
      fragment _ on Post {
        id
        points
        voteStatus
      }
    `,
    variables: { id: postId } as any,
  });

  if (curVoteData) {
    if (curVoteData.voteStatus === value) {
      return;
    }
    const newPoints =
      (curVoteData.points as number) +
      (!curVoteData.voteStatus ? 1 : 2) * value;
    cache.writeFragment({
      id: "Post:" + postId,
      fragment: gql`
        fragment __ on Post {
          id
          points
          voteStatus
        }
      `,
      data: {
        points: newPoints,
        voteStatus: value,
      },
    });
  }
};

export const PostComponent: React.FC<PostProps> = ({
  post: { id, author, textSnippet, points, title, voteStatus },
}) => {
  const [vote] = useVoteMutation();

  if (!id) return null;
  return (
    <Box key={id} p={5} shadow="md" borderWidth="1px">
      <Flex justifyContent="space-between">
        <NextLink href="/post/[id]" as={`/post/${id}`}>
          <Link>
            <Heading fontSize="xl">{title}</Heading>
          </Link>
        </NextLink>
        {author.username}
      </Flex>
      <Text mt={4}>{textSnippet}</Text>
      <br />
      <Flex justifyContent="space-between" align="center">
        <Box>
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
              await vote({
                variables: { value: 1, postId: id },
                update: (cache) => updateAfterVote(1, id, cache),
              });
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
              await vote({
                variables: { value: -1, postId: id },
                update: (cache) => updateAfterVote(-1, id, cache),
              });
            }}
          />
        </Box>
        <EditAndDeleteButtons authorId={author.id} postId={id} />
      </Flex>
    </Box>
  );
};
