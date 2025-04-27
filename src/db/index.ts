import { drizzle } from "drizzle-orm/node-postgres";

import { env } from "@/config";

import { chunks } from "./schema/chunks";
import { files } from "./schema/files";

export const db = drizzle(env.DATABASE_URL, {
  schema: { files, chunks },
  logger: false,
});
