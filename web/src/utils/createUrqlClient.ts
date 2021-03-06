import { cacheExchange, Resolver, Cache } from "@urql/exchange-graphcache";
import Router from "next/router";
import gql from "graphql-tag";
import {
  dedupExchange,
  Exchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import { pipe, tap } from "wonka";

import {
  DeletePostMutationVariables,
  LoginMutation,
  LogoutMutation,
  MeDocument,
  MeQuery,
  RegisterMutation,
  VoteMutationVariables,
} from "../generated/graphql";
import { betterUpdateQuery } from "./betterUpdateQuery";
import { isServer } from "./isServer";

const errorExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error) {
        if (error.message.includes("not authenticated")) {
          Router.replace("/login");
        }
      }
    })
  );
};

export const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    // создаем уникальный ключ, проверяем его наличие в cache
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isItInTheCache = cache.resolve(
      cache.resolveFieldByKey(entityKey, fieldKey) as string,
      "posts"
    );
    // если ключ не найден - выставляем флаг partial в true, сообщая URQL, что нужен запрос
    info.partial = !isItInTheCache;
    const results: string[] = [];
    let hasMore = true;
    fieldInfos.forEach((fi) => {
      const key = cache.resolveFieldByKey(entityKey, fi.fieldKey) as string;

      const data = cache.resolve(key, "posts") as string[];
      if (cache.resolve(key, "hasMore") === false) hasMore = false;
      results.push(...data);
    });

    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results,
    };
  };
};

export const invalidateAllPosts = (cache: Cache) => {
  const allFields = cache.inspectFields("Query");
  const fieldInfos = allFields.filter((info) => info.fieldName === "posts");
  fieldInfos.forEach((fi) =>
    cache.invalidate("Query", "posts", fi.arguments || {})
  );
};

export const createUrqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie;
  }
  return {
    url: process.env.NEXT_PUBLIC_API_URL as string,
    fetchOptions: {
      credentials: "include" as const,
      headers: cookie
        ? {
            cookie,
          }
        : undefined,
    },
    exchanges: [
      dedupExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null,
        },
        resolvers: {
          Query: {
            posts: cursorPagination(),
            // client-side resolvers
            // will run whenever the query will run
            // name "posts" have to match "posts" in posts.graphql query
          },
        },
        updates: {
          Mutation: {
            deletePost: (_result, args, cache, _) => {
              const id = (args as DeletePostMutationVariables).id;
              // этот вызов обнулит (=null) соотв-ий пост в кеше
              cache.invalidate({ __typename: "Post", id });
            },
            vote: (_result, args, cache, _) => {
              // здесь мы обновляем кусочек кеша, который содержит votes
              // один из методов, второй - возвращать актуальное значение, а не boolean
              // вероятно в данном случае предпочтительнее второй, чтобы получать актуальное значение, а не просто +1 / -1
              // но здесь просто в качестве примера
              const { postId, value } = args as VoteMutationVariables;
              const curVoteData = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    points
                    voteStatus
                  }
                `,
                { id: postId } as any
              );
              if (curVoteData) {
                if (curVoteData.voteStatus === value) {
                  return;
                }
                const newPoints =
                  (curVoteData.points as number) +
                  (!curVoteData.voteStatus ? 1 : 2) * value;
                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      id
                      points
                      voteStatus
                    }
                  `,
                  {
                    id: postId,
                    points: newPoints,
                    voteStatus: value,
                  } as any
                );
              }
            },
            createPost: (_result, _, cache, __) => {
              // когда создается пост - запрос (Query) posts инвалидируется
              // и перезапрашивается с сервера
              invalidateAllPosts(cache);
            },
            logout: (_result, _, cache, __) => {
              betterUpdateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                () => ({ me: null })
              );
            },
            login: (_result, _, cache, __) => {
              betterUpdateQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.login.errors) {
                    return query;
                  } else {
                    return {
                      me: result.login.user,
                    };
                  }
                }
              );
              invalidateAllPosts(cache);
            },
            register: (_result, _, cache, __) => {
              betterUpdateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return {
                      me: result.register.user,
                    };
                  }
                }
              );
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};
