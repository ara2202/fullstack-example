import { useRouter } from "next/router";
import { usePostQuery } from "../generated/graphql";

export const usePostIdFromUrl = () => {
  const router = useRouter();
  const id = router.query.id;
  const postId = typeof id === "string" ? parseInt(id) : -1;
  const [{ data, fetching }] = usePostQuery({
    pause: postId === -1,
    variables: {
      id: postId,
    },
  });
  return { postId, data, fetching, router };
};
