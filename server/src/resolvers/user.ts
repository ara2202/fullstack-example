import {
  Resolver,
  Mutation,
  Arg,
  InputType,
  Field,
  Ctx,
  ObjectType,
  Query,
} from "type-graphql";
import { MyContext } from "src/types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { EntityManager } from "@mikro-orm/postgresql";

// альтернатива указанию @Arg по отдельности
@InputType()
class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

// ObjectType мы возвращаем из резолвера, InputType - для ввода
@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  async me(@Ctx() { em, req }: MyContext) {
    // you are not logged in
    if (!req.session.id) return null;
    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  /* --- REGISTER --- */
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput, // type inferred
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    if (options.username.length <= 2) {
      return {
        errors: [
          {
            field: "username",
            message: "username should contain at least 3 characters",
          },
        ],
      };
    }

    if (options.password.length <= 5) {
      return {
        errors: [
          {
            field: "password",
            message: "password should contain at least 5 characters",
          },
        ],
      };
    }
    const hashedPassword = await argon2.hash(options.password);
    // этот код вызывает проблемы при ошибке
    // const user = em.create(User, {
    //   username: options.username,
    //   password: hashedPassword,
    // });
    let user;
    try {
      const result = await (em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username: options.username,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");
      user = result[0];
      // этот код вызывает проблемы при ошибке
      //await em.persistAndFlush(user);
    } catch (err) {
      if (err.code === "23505") {
        // duplicate username error
        return {
          errors: [
            {
              field: "username",
              message: "username already exists",
            },
          ],
        };
      } else {
        console.error(err);
      }
    }
    return { user };
  }
  /* --- LOGIN --- */
  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput, // type inferred
    @Ctx() { em, req }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: "that username doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "password isn't correct",
          },
        ],
      };
    }

    req.session.userId = user.id;

    return { user };
  }
}
