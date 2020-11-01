import { Stack, Button, Flex } from "@chakra-ui/core";
import { withUrqlClient } from "next-urql";
import React, { useState } from "react";
import { Layout } from "../components/Layout";
import { PostComponent } from "../components/Post";
import { usePostsQuery } from "../generated/graphql";
import { createUrqlClient } from "../utils/createUrqlClient";

const Index = () => {
  const [variables, setVariables] = useState({
    limit: 15,
    cursor: null as string | null,
  });
  const [{ data, error, fetching }] = usePostsQuery({
    variables,
  });

  if (!fetching && !data) {
    return (
      <div>
        <div>Something went wrong with fetching posts</div>
        <div>{error?.message}</div>
      </div>
    );
  }

  return (
    <Layout>
      <div>Hello world from Next.JS</div>
      <br />
      {!data && fetching ? (
        <div>...loading</div>
      ) : (
        <Stack spacing={8}>
          {data?.posts.posts.map((p) =>
            p ? <PostComponent key={p.id} post={p} /> : null
          )}
        </Stack>
      )}
      {data && data.posts.hasMore ? (
        <Flex>
          <Button
            onClick={() =>
              setVariables({
                limit: variables.limit,
                cursor: data.posts.posts[data.posts.posts.length - 1].createdAt,
              })
            }
            isLoading={fetching}
            m="auto"
            my={8}
          >
            load more
          </Button>
        </Flex>
      ) : null}
    </Layout>
  );
};

export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
