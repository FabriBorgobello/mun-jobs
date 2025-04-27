import { text, timestamp, uuid } from "drizzle-orm/pg-core";

import { munPgTable } from "../utils";

export const files = munPgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // filename
  etag: text("etag").notNull(), // hash or identifier from MinIO
  processedAt: timestamp("processed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
