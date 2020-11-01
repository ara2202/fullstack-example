import DataLoader from "dataloader";
import { UpDoot } from "../entities/Updoot";

// in keys --> [1, 5, 6, 9] (ids..)
// out     --> Users for each id
export const createUpdootLoader = () =>
  new DataLoader<{ postId: number; userId: number }, UpDoot | null>(
    async (keys) => {
      const searchKeys = [...keys];
      const updoots = await UpDoot.findByIds(searchKeys);
      const keyToUpdoot: Record<string, UpDoot | null> = {};
      updoots.forEach((u) => (keyToUpdoot[`${u.userId}|${u.postId}`] = u));
      return keys.map((key) => keyToUpdoot[`${key.userId}|${key.postId}`]);
    }
  );
