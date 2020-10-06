import { Resolver, Query, Ctx, Arg, Mutation, Int } from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "src/types";

@Resolver()
export class PostResolver {
  // get all posts
  @Query(() => [Post])
  posts(@Ctx() { em }: MyContext): Promise<Post[]> {
    return em.find(Post, {});
  }
  // get single post
  @Query(() => Post, { nullable: true }) // {nullable: true} - аналог "| null" в TS
  post(
    @Ctx() { em }: MyContext,
    @Arg("id", () => Int) id: number // здесь ()=>Int - лишнее, type-graphql infers type from TS,  просто для синтаксиса
  ): Promise<Post | null> {
    // number может быть infered в type-graphql, не нужно типизировать
    return em.findOne(Post, { id });
  }

  // create post
  @Mutation(() => Post)
  async createPost(
    @Arg("title") title: string, //  string может быть infered в type-graphql, не нужно типизировать для graphql
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title });
    await em.persistAndFlush(post);
    return post;
  }

  // update post
  @Mutation(() => Post, { nullable: true })
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post | null> {
    const post = await em.findOne(Post, { id });
    if (!post) {
      return null;
    }
    if (typeof title !== "undefined") {
      post.title = title;
      await em.persistAndFlush(post);
    }

    return post;
  }

  // delete post
  @Mutation(() => Boolean)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { em }: MyContext
  ): Promise<boolean> {
    await em.nativeDelete(Post, { id });
    return true;
  }
}
