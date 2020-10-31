import { isAuth } from "../middleware/isAuth";
import { MyContext } from "src/types";
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
    const userId = req.session.userId;

    const replacements: any[] = [realLimit];
    userId && replacements.push(userId);
    let cursorIdx = 3;
    if (cursor) {
      replacements.push(new Date(parseInt(cursor)));
      cursorIdx = replacements.length;
    }
    const posts = await getConnection().query(
      `
        select p.*, 
        json_build_object(
          'id', u.id,
          'username', u.username,
          'email', u.email,
          'createdAt', u."createdAt",
          'updatedAt', u."updatedAt"
          ) author, 
        ${
          req.session.userId
            ? `(select value from up_doot where "userId" = $2 and "postId" = p.id) "voteStatus"`
            : 'null as "voteStatus"'
        } 
        from post p
        inner join public.user u on u.id = p."authorId"
        ${cursor ? `where p."createdAt" < ${cursorIdx}` : ""}
        order by p."createdAt" DESC
        limit $1
    `,
      replacements
    );

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
  post(@Arg("id") id: number): Promise<Post | undefined> {
    return Post.findOne(id);
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
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string
  ): Promise<Post | null> {
    const post = await Post.findOne(id); //eqiv to {where: { id }}
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      await Post.update({ id }, { title });
    }
    return post;
  }

  // delete post
  @Mutation(() => Boolean)
  async deletePost(@Arg("id") id: number): Promise<boolean> {
    await Post.delete(id);
    return true;
  }
}
