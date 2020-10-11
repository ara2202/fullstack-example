import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import microConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";

import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { COOKIE_NAME, IS_PROD } from "./constants";
import cors from "cors";

const main = async () => {
  const orm = await MikroORM.init(microConfig); // подключаемся к БД с конфигом
  await orm.getMigrator().up(); // запускаем миграции

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }), // disableTouch keeps entry in DB forever
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
        httpOnly: true, // cannot access on frontend from JS
        secure: IS_PROD, // works only in https
        sameSite: "lax",
      },
      saveUninitialized: false,
      secret: "someSecretKey", // this should be hided in env for example
      resave: false, // csrf-relative
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({ em: orm.em, req, res, redis }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });

  //const post = orm.em.create(Post, { title: "my first post" }); // creates just a simple post object
  //await orm.em.persistAndFlush(post); // write post to DB
  //console.log("-----------SQL2----------------");
  //await orm.em.nativeInsert(Post, { title: "second post" });
  //const posts = await orm.em.find(Post, {});
  //console.log(posts);
};

main().catch((e) => console.error(e));
