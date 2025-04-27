import { Job, Worker } from "bullmq";

import { env } from "@/config";
import { chunkTextByTokens } from "@/services/rag/chunker";
import { findFileByEtag, insertChunks, insertFileRecord, markFileAsProcessed } from "@/services/rag/db";
import { embedChunks } from "@/services/rag/embedder";
import { parseFileByExtension } from "@/services/rag/parser";
import { s3 } from "@/services/s3/minio";
import { logger } from "@/utils/logger";

interface IngestionJob {
  fileKey: string;
  etag: string;
}

const worker = new Worker<IngestionJob>(
  "ingest",
  async (job: Job<IngestionJob>) => {
    const { fileKey, etag } = job.data;
    const startTime = Date.now();
    let stepStartTime: number;

    try {
      logger.milestone(`Starting job ${job.id} for file: ${fileKey}`);

      // Check if already processed
      stepStartTime = Date.now();
      const existing = await findFileByEtag(etag);
      if (existing?.processedAt) {
        logger.warning(`Job ${job.id}: Already processed: ${fileKey}`);
        return;
      }
      logger.progress(`Job ${job.id}: Checked existing file in ${Date.now() - stepStartTime}ms`);

      // Download file
      stepStartTime = Date.now();
      logger.progress(`Job ${job.id}: Downloading: ${fileKey}`);
      const buffer = await s3.getObjectAsBuffer(fileKey);
      logger.progress(`Job ${job.id}: Downloaded file in ${Date.now() - stepStartTime}ms`);

      // Parse file
      stepStartTime = Date.now();
      const text = await parseFileByExtension(buffer, fileKey);
      logger.progress(`Job ${job.id}: Parsed file in ${Date.now() - stepStartTime}ms`);

      // Chunk text
      stepStartTime = Date.now();
      logger.progress(`Job ${job.id}: Chunking text...`);
      const chunks = chunkTextByTokens(text);
      logger.progress(`Job ${job.id}: Created ${chunks.length} chunks in ${Date.now() - stepStartTime}ms`);

      // Embed chunks
      stepStartTime = Date.now();
      logger.progress(`Job ${job.id}: Embedding chunks...`);
      const embedded = await embedChunks(chunks);
      logger.progress(`Job ${job.id}: Embedded ${embedded.length} chunks in ${Date.now() - stepStartTime}ms`);

      // Store in database
      stepStartTime = Date.now();
      logger.progress(`Job ${job.id}: Storing in database...`);
      const fileId = existing?.id || (await insertFileRecord(fileKey, etag));
      await insertChunks(
        embedded.map(({ text, embedding, index }) => ({
          fileId,
          content: text,
          embedding,
          index,
        })),
      );
      logger.progress(`Job ${job.id}: Stored in database in ${Date.now() - stepStartTime}ms`);

      // Mark as processed
      stepStartTime = Date.now();
      await markFileAsProcessed(fileId);
      logger.progress(`Job ${job.id}: Marked as processed in ${Date.now() - stepStartTime}ms`);

      const totalTime = Date.now() - startTime;
      logger.success(`Job ${job.id}: Successfully processed ${fileKey} (${chunks.length} chunks) in ${totalTime}ms`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`Job ${job.id} failed after ${Date.now() - startTime}ms: ${errorMessage}`);
      throw error;
    }
  },
  { connection: { url: env.REDIS_URL } },
);

worker.on("completed", (job) => {
  logger.milestone(`Worker completed job ${job.id}: ${job.name}`);
});

worker.on("failed", (job, err) => {
  logger.error(`Worker failed job ${job?.id}: ${err.message}`);
});

worker.on("error", (err) => {
  logger.error(`Worker error: ${err.message}`);
});

worker.on("stalled", (jobId) => {
  logger.warning(`Job ${jobId} has stalled`);
});

worker.on("active", (job) => {
  logger.progress(`Worker started processing job ${job.id}`);
});
