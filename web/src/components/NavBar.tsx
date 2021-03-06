import { Box, Button, Flex, Link } from "@chakra-ui/core";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";
import { useApolloClient } from "@apollo/client";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  // опция skip позволяет не выполнять запрос, если она = true
  // в данном случае мы не хотим выполнять этот запрос на сервере
  // т.к. там нет куки и запрос всегда возвращает null, т.е. он лишний
  //const router = useRouter();
  const [logout, { loading: logoutFething }] = useLogoutMutation();
  const apolloClient = useApolloClient();
  const { data, loading } = useMeQuery({
    skip: isServer(),
  });

  let body = null;
  if (loading) {
  } else if (!data?.me) {
    body = (
      <>
        <NextLink href="/login">
          <Link mr={4}>Login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link>Register</Link>
        </NextLink>
      </>
    );
  } else {
    body = (
      <Flex align="center">
        <Box mr={4}>{data.me.username}</Box>
        <NextLink href="/create-post">
          <Button variantColor="teal" size="sm" mr={4}>
            Create post
          </Button>
        </NextLink>
        <Button
          onClick={async () => {
            await logout();
            await apolloClient.resetStore();
          }}
          isLoading={logoutFething}
          variant="link"
        >
          Logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex
      align="center"
      position="sticky"
      top={0}
      zIndex={20}
      bg="tomato"
      p={4}
      ml={"auto"}
    >
      <NextLink href="/">
        <Link>Home</Link>
      </NextLink>
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
