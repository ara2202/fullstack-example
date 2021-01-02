import { Stack, Button, Flex } from "@chakra-ui/core";
import React from "react";
import { Layout } from "../components/Layout";
import { PostComponent } from "../components/Post";
import { usePostsQuery } from "../generated/graphql";
import { withApollo } from "../utils/withApollo";

const Index = () => {
  // нам не нужно это с Apollo, там есть fetchMore
  // const [variables, setVariables] = useState({
  //   limit: 15,
  //   cursor: null as string | null,
  // });
  const { data, error, loading, fetchMore, variables } = usePostsQuery({
    variables: {
      limit: 15,
      cursor: null as string | null,
    },
    notifyOnNetworkStatusChange: true,
  });

  if (!loading && !data) {
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
      {!data && loading ? (
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
              fetchMore({
                variables: {
                  limit: variables?.limit,
                  cursor:
                    data.posts.posts[data.posts.posts.length - 1].createdAt,
                },
                // updateQuery: (
                //   previousValues,
                //   { fetchMoreResult }
                // ): PostsQuery => {
                //   if (!fetchMoreResult) {
                //     return previousValues as PostsQuery;
                //   }

                //   return {
                //     __typename: "Query",
                //     posts: {
                //       __typename: "PaginatedPosts",
                //       hasMore: (fetchMoreResult as PostsQuery).posts.hasMore,
                //       posts: [
                //         ...(previousValues as PostsQuery).posts.posts,
                //         ...(fetchMoreResult as PostsQuery).posts.posts,
                //       ],
                //     },
                //   };
                // },
              })
            }
            isLoading={loading}
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

//export default withUrqlClient(createUrqlClient, { ssr: true })(Index);
export default withApollo({ ssr: true })(Index);
