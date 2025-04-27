import { integer, text, timestamp, uuid, vector } from "drizzle-orm/pg-core";

import { munPgTable } from "../utils";
import { files } from "./files";

export const chunks = munPgTable("chunks", {
  id: uuid("id").primaryKey().defaultRandom(),
  fileId: uuid("file_id")
    .notNull()
    .references(() => files.id, { onDelete: "cascade" }),
  index: integer("index").notNull(), // chunk index
  content: text("content").notNull(),
  embedding: vector("embedding", { dimensions: 1536 }), // pgvector-specific
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
