import { pgTableCreator } from "drizzle-orm/pg-core";

import { env } from "@/config";

export const munPgTable = pgTableCreator((name) => {
  return env.ENVIRONMENT === "production" ? `mun_${name}` : `dev_mun_${name}`;
});
