import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { Post } from "../entities/Post";
import { getConnection } from "typeorm";
import { UpDoot } from "../entities/Updoot";
import { User } from "../entities/User";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  // Здесь мы не берем поле из ДБ, а создаем его "на лету"
  // короткий text в качестве "превью" содержимого
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  author(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    // userLoader батчит все вызовы в 1 массив
    return userLoader.load(post.authorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }
    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });
    return updoot?.value ?? null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;

    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;

    const userVote = await UpDoot.findOne({
      where: {
        postId,
        userId,
      },
    });

    if (userVote && userVote.value !== realValue) {
      // user has voted, but changed his mind
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        update up_doot
        set value = $1
        where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
        update post
        set points = points + $1
        where id = $2;
        `,
          [2 * realValue, postId]
        );
      });
    } else if (!userVote) {
      // user has never voted before on this post
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
        insert into up_doot ("userId", "postId", value)
        values ($1, $2, $3);
        `,
          [userId, postId, realValue]
        );

        await tm.query(
          `
        update post
        set points = points + $1
        where id = $2;
        `,
          [realValue, postId]
        );
      });
    }
    // await UpDoot.insert({
    //   userId,
    //   postId,
    //   value: realValue,
    // });
    // Выполняем SQL-транзакцию, чтобы либо внести изменения в обе таблицы
    // либо откатить все
    // await getConnection().query(
    //   `
    //   START TRANSACTION;

    //   insert into up_doot ("userId", "postId", value)
    //   values (${userId},${postId},${realValue});

    //   update post
    //   set points = points + ${realValue}
    //   where id = ${postId};

    //   COMMIT;
    // `
    // );
    return true;
  }

  // get all posts
  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): // идея с курсором - что мы берем посты, после того, на который указывает курсор.
  // для этого они должны быть как-то отсортированы (по дате, id...)
  Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    //const userId = req.session.userId;

    const replacements: any[] = [realLimit];
    //userId && replacements.push(userId);
    //let cursorIdx = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      //cursorIdx = replacements.length;
    }
    // Ещё более новая версия с dataLoader
    const posts = await getConnection().query(
      `
        select p.*
        from post p
        ${cursor ? `where p."createdAt" < $2` : ""}
        order by p."createdAt" DESC
        limit $1
    `,
      replacements
    );

    // более новая версия запроса, где мы подтягиваем автора поста через FieldResolver
    // const posts = await getConnection().query(
    //   `
    //     select p.*,
    //     ${
    //       req.session.userId
    //         ? `(select value from up_doot where "userId" = $2 and "postId" = p.id) "voteStatus"`
    //         : 'null as "voteStatus"'
    //     }
    //     from post p
    //     ${cursor ? `where p."createdAt" < ${cursorIdx}` : ""}
    //     order by p."createdAt" DESC
    //     limit $1
    // `,
    //   replacements
    // );

    // const posts = await getConnection().query(
    //   `
    //     select p.*,
    //     json_build_object(
    //       'id', u.id,
    //       'username', u.username,
    //       'email', u.email,
    //       'createdAt', u."createdAt",
    //       'updatedAt', u."updatedAt"
    //       ) author,
    //     ${
    //       req.session.userId
    //         ? `(select value from up_doot where "userId" = $2 and "postId" = p.id) "voteStatus"`
    //         : 'null as "voteStatus"'
    //     }
    //     from post p
    //     inner join public.user u on u.id = p."authorId"
    //     ${cursor ? `where p."createdAt" < ${cursorIdx}` : ""}
    //     order by p."createdAt" DESC
    //     limit $1
    // `,
    //   replacements
    // );

    // const qb = getConnection()
    //   .getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.author", "a", 'a.id = p."authorId"')
    //   .orderBy('"createdAt"', "DESC") // Специфика Postgres, нужны двойные кавычки, если в поле есть camelCase
    //   // кроме того, если есть объединение таблиц с одинаковыми полями, то нужно
    //   // указывать откуда берется поле (p."createdAt")
    //   .take(realLimit);

    // if (cursor) {
    //   qb.where('"createdAt" < :cursor', {
    //     cursor: new Date(parseInt(cursor)),
    //   });
    // }
    //const posts = await qb.getMany();
    return { posts, hasMore: posts.length === realLimit };
  }
  // get single post
  @Query(() => Post, { nullable: true })
  post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
    // сделали через FieldResolver
    //return Post.findOne(id, { relations: ["author"] });
  }

  // create post
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<Post> {
    return Post.create({ ...input, authorId: req.session.userId }).save();
  }

  // update post
  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id", () => Int) id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
    const post = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "authorId" = :authorId', {
        id,
        authorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return post.raw[0];
  }

  // delete post
  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // NOT Cascade way
    // const post = await Post.findOne(id);
    // if (!post) return false;
    // if (post.authorId !== req.session.userId) throw new Error("not authorized");

    // await UpDoot.delete({ postId: id });
    // await Post.delete({ id });

    // cascade way: PostgresSQL will automatically delete connected data
    // we need to tell Postgress when to cascade in Updoot entity

    const post = await Post.findOne(id);
    if (!post) return false;
    if (post.authorId !== req.session.userId) throw new Error("not authorized");
    await Post.delete(id);
    //await Post.delete({ id, authorId: req.session.userId });
    return true;
  }
}
