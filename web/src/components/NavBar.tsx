import { Box, Button, Flex, Link } from "@chakra-ui/core";
import React from "react";
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavBarProps {}

export const NavBar: React.FC<NavBarProps> = ({}) => {
  // опция pause позволяет не выполнять запрос, если она = true
  // в данном случае мы не хотим выполнять этот запрос на сервере
  // т.к. там нет куки и запрос всегда возвращает null, т.е. он лишний
  const [{ data, fetching }] = useMeQuery({
    pause: isServer(),
  });

  const [{ fetching: logoutFething }, logout] = useLogoutMutation();
  let body = null;
  if (fetching) {
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
      <Flex>
        <Box mr={4}>{data.me.username}</Box>
        <NextLink href="/create-post">
          <Link mr={4}>Create post</Link>
        </NextLink>
        <Button
          onClick={() => logout()}
          isLoading={logoutFething}
          variant="link"
        >
          Logout
        </Button>
      </Flex>
    );
  }
  return (
    <Flex position="sticky" top={0} zIndex={20} bg="tomato" p={4} ml={"auto"}>
      <Box ml={"auto"}>{body}</Box>
    </Flex>
  );
};
