import "reflect-metadata";
import "dotenv-safe/config";
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
import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";
import { UpDoot } from "./entities/Updoot";
import { createUserLoader } from "./utils/createUserLoader";
import { createUpdootLoader } from "./utils/createUpdootLoader";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    // database: "lireddit2",
    // username: "postgres",
    // password: "p0$tgre$",
    url: process.env.DATABASE_URL,
    migrations: [path.join(__dirname, "./migrations/*")],
    logging: true,
    // in prod - turn off syncchronize
    //synchronize: true, // it will create & update tables for you, so you don't need to run migrations
    entities: [Post, User, UpDoot],
  });

  await conn.runMigrations();

  // rerun
  //await Post.delete({});

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);
  app.set("trust proxy", 1); // чтобы cookie работали с nginx
  // нужно сказать express, что перед ней будет сидеть proxy (nginx)

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
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
        domain: IS_PROD ? ".araperm.online" : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET, // this should be hided in env for example
      resave: false, // csrf-relative
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      updootLoader: createUpdootLoader(),
    }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(parseInt(process.env.PORT), () => {
    console.log(`server started on PORT:${process.env.PORT}`);
  });
};

main().catch((e) => console.error(e));
