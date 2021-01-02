import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Spinner,
} from "@chakra-ui/core";
import { Formik, Form } from "formik";
import React from "react";
import { InputField } from "../../../components/InputField";
import { Layout } from "../../../components/Layout";
import { useUpdatePostMutation } from "../../../generated/graphql";
import { usePostIdFromUrl } from "../../../utils/usePostIdFromUrl";
import { withApollo } from "../../../utils/withApollo";

const EditPost = () => {
  const { data, loading, postId, router } = usePostIdFromUrl();
  const [updatePost] = useUpdatePostMutation();
  if (loading) {
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
    <Layout variant="small">
      <Formik
        initialValues={{ title: data.post.title, text: data.post.text }}
        onSubmit={async (values) => {
          const { errors } = await updatePost({
            variables: { id: postId, ...values },
          });
          if (!errors) {
            router.back();
          }
        }}
      >
        {({ isSubmitting }) => (
          <Form>
            <InputField name="title" placeholder="title" label="Title" />
            <Box mt={4}>
              <InputField
                name="text"
                placeholder="text..."
                label="Body"
                textarea
              />
            </Box>

            <Button
              mt={4}
              type="submit"
              isLoading={isSubmitting}
              variantColor="teal"
            >
              Edit post
            </Button>
          </Form>
        )}
      </Formik>
    </Layout>
  );
};

//export default withUrqlClient(createUrqlClient)(EditPost);
export default withApollo({ ssr: false })(EditPost);
