import { ObjectType, Field } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UpDoot } from "./Updoot";
import { User } from "./User";

/* TODO: закончил смотреть на 6:53 */

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field() // Если не указать Field - это поле будет недоступно в GraphQl
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({ type: "int", default: 0 })
  points!: number;

  @Field()
  @Column()
  authorId: number;

  @Field()
  @ManyToOne(() => User, (user) => user.posts)
  author: User;

  @OneToMany(() => UpDoot, (updoot) => updoot.post)
  updoots: UpDoot[];

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt = new Date();
}
