import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React from "react";
import { Layout } from "../../components/Layout";
import { usePostQuery } from "../../generated/graphql";
import { createUrqlClient } from "../../utils/createUrqlClient";
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Heading,
  Spinner,
  Text,
} from "@chakra-ui/core";

const PostPage = () => {
  const router = useRouter();
  const postId = router.query.id;
  const id = typeof postId === "string" ? parseInt(postId) : -1;
  const [{ data, fetching }] = usePostQuery({
    pause: id === -1,
    variables: {
      id,
    },
  });

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
      <Text>{data.post.text}</Text>
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(PostPage);
