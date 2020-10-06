import { Post } from "./entities/Post";
import { IS_PROD } from "./constants";
import { MikroORM } from "@mikro-orm/core";
import path from "path";
import { User } from "./entities/User";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"), // path to the folder with migrations
    pattern: /^[\w-]+\d+\.[tj]s$/, // regex pattern for the migration files
  },
  entities: [Post, User],
  dbName: "lireddit",
  debug: !IS_PROD,
  type: "postgresql",
  user: "postgres",
  password: "p0$tgre$",
} as Parameters<typeof MikroORM.init>[0]; // type of 1st MicroORM.init parameter
