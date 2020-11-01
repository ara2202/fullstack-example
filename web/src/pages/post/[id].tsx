import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Heading,
  Spinner,
  Text,
} from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import React from "react";
import { EditAndDeleteButtons } from "../../components/EditAndDeleteButtons";
import { Layout } from "../../components/Layout";
import { createUrqlClient } from "../../utils/createUrqlClient";
import { usePostIdFromUrl } from "../../utils/usePostIdFromUrl";

const PostPage = () => {
  const { data, fetching, postId } = usePostIdFromUrl();

  if (fetching) {
    return (
      <Layout>
        <Spinner />
      </Layout>
    );
  }

  if (!data?.post) {
    return (
      <Layout>
        <Alert status="error">
          <AlertIcon />
          <AlertTitle mr={2}>Post is not found!</AlertTitle>
          <AlertDescription>
            The requested post does not exist.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <Heading>{data.post.title}</Heading>
      <Text mb={4}>{data.post.text}</Text>
      <EditAndDeleteButtons authorId={data.post.author.id} postId={postId} />
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(PostPage);
