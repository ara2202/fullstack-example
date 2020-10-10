import { Cache, QueryInput } from "@urql/exchange-graphcache";

/*
  запрос me() кешируется, поэтому после логина мы не видим текущего юзера, т.к. запрос me был до логина и он закешировался
  чтобы это обойти, мы устанавливаем доп. либу @urql/exchange-graphcache
  и прописываем как проапдейтить запрос
  Но поскольку там беда с типами, мы также пишем вспомогательную функцию betterUpdateQuery
*/
export function betterUpdateQuery<Result, Query>(
  cache: Cache,
  qi: QueryInput,
  result: any,
  fn: (r: Result, q: Query) => Query
) {
  return cache.updateQuery(qi, (data) => fn(result, data as any) as any);
}
