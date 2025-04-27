import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { chunks } from "@/db/schema/chunks";
import { files } from "@/db/schema/files";

export async function insertFileRecord(name: string, etag: string) {
  const [inserted] = await db.insert(files).values({ name, etag }).returning({ id: files.id });
  return inserted.id;
}

export async function insertChunks(
  data: {
    fileId: string;
    index: number;
    content: string;
    embedding: number[];
  }[],
) {
  await db.insert(chunks).values(data);
}

export async function markFileAsProcessed(fileId: string) {
  await db.update(files).set({ processedAt: new Date() }).where(eq(files.id, fileId));
}

export async function findFileByEtag(etag: string) {
  return db.query.files.findFirst({
    where: eq(files.etag, etag),
    columns: { id: true, name: true, processedAt: true },
  });
}

export async function getAllFiles() {
  return db.query.files.findMany({
    columns: { id: true, name: true, etag: true, processedAt: true },
  });
}

export async function deleteFile(fileId: string) {
  await db.delete(files).where(eq(files.id, fileId));
  // Note: Chunks will be automatically deleted due to the onDelete: "cascade" constraint
}

export async function getTopKChunks(embedding: number[], topK: number = 5) {
  const embeddingStr = `ARRAY[${embedding.join(",")}]`;

  return db
    .select({
      id: chunks.id,
      content: chunks.content,
      similarity: sql<number>`1 - (embedding <#> ${sql.raw(embeddingStr)}::vector)`,
    })
    .from(chunks)
    .orderBy(sql`embedding <#> ${sql.raw(embeddingStr)}::vector`)
    .limit(topK);
}
