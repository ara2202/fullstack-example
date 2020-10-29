import React from "react";
import { Formik, Form } from "formik";
import { Box, Button, Flex, Link } from "@chakra-ui/core";
import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";
import { useLoginMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/graphqlToFormikErrors";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import { createUrqlClient } from "../utils/createUrqlClient";
import NextLink from "next/link";

const Login: React.FC = ({}) => {
  const router = useRouter();
  // urql generated hook, возвращает функцию, которая выполняет запрос + статус запроса первым параметром
  const [, login] = useLoginMutation();
  return (
    <Wrapper variant="small">
      <Formik
        initialValues={{ usernameOrEmail: "", password: "" }}
        onSubmit={async (values, { setErrors }) => {
          // в данном случае совпадение 1-в-1, поэтому можно так коротко, не надо:
          //register({ $password: values.password, $username: values.username });
          const response = await login(values);
          if (response.data?.login.errors) {
            setErrors(toErrorMap(response.data.login.errors));
          } else if (response.data?.login.user) {
            const nextLocation =
              typeof router.query.next === "string" ? router.query.next : "/";

            router.push(nextLocation);
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField
              name="usernameOrEmail"
              placeholder="username or email"
              label="Username or Email"
            />
            <Box mt={4}>
              <InputField
                name="password"
                placeholder="password"
                label="Password"
                type="password"
              />
              <Flex mt={4} alignItems="center">
                <Button
                  mr={4}
                  type="submit"
                  isLoading={isSubmitting}
                  variantColor="teal"
                >
                  Login
                </Button>
                <NextLink href="/forgot-password">
                  <Link mr={2} color="blue.600">
                    forgot password?
                  </Link>
                </NextLink>
              </Flex>
            </Box>
          </Form>
        )}
      </Formik>
    </Wrapper>
  );
};
// ssr тут не нужен, поскольку страница не тянет ничего с сервера, контент статичен
// плюс SEO здесь также не нужно
export default withUrqlClient(createUrqlClient)(Login);
