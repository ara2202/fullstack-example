import { InputType, Field } from "type-graphql";

// альтернатива указанию @Arg по отдельности

@InputType()
export class UsernamePasswordInput {
  @Field()
  username: string;

  @Field()
  email: string;

  @Field()
  password: string;
}
