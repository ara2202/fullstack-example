import DataLoader from "dataloader";
import { User } from "../entities/User";

// in keys --> [1, 5, 6, 9] (ids..)
// out     --> Users for each id
export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const searchIds = [...userIds];
    const users = await User.findByIds(searchIds);
    const userIdToUser: Record<number, User> = {};
    users.forEach((u) => (userIdToUser[u.id] = u));
    return userIds.map((userId) => userIdToUser[userId]);
  });
