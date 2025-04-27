import { enqueueFileForIngestion, hasPendingJobs } from "@/services/queue/queue";
import { deleteFile, findFileByEtag, getAllFiles } from "@/services/rag/db";
import { s3 } from "@/services/s3/minio";

import { logger } from "../utils/logger";

/**
 * Synchronizes the RAG system with the MinIO bucket:
 * 1. Adds new files from the bucket to the RAG system
 * 2. Removes files from the RAG system that no longer exist in the bucket
 */
async function syncBucket() {
  const startTime = Date.now();

  // Check for pending jobs
  if (await hasPendingJobs()) {
    logger.error("Cannot start sync: There are pending jobs in the queue");
    process.exit(1);
  }

  logger.milestone("Starting bucket synchronization...");

  logger.progress("Fetching objects from MinIO bucket...");
  const bucketStartTime = Date.now();
  const objects = await s3.listObjects();
  const bucketTime = Date.now() - bucketStartTime;
  logger.success(`Found ${objects.length} objects in bucket (${bucketTime}ms)`);

  logger.progress("Fetching files from database...");
  const dbStartTime = Date.now();
  const dbFiles = await getAllFiles();
  const dbTime = Date.now() - dbStartTime;
  logger.success(`Found ${dbFiles.length} files in database (${dbTime}ms)`);

  logger.progress("Creating lookup map...");
  const mapStartTime = Date.now();
  const bucketObjectsMap = new Map();
  for (const obj of objects) {
    if (obj.etag) {
      const normalizedEtag = obj.etag.replace(/"/g, "");
      bucketObjectsMap.set(normalizedEtag, obj);
    }
  }
  const mapTime = Date.now() - mapStartTime;
  logger.success(`Created lookup map (${mapTime}ms)`);

  logger.milestone("Processing files from bucket...");
  let enqueued = 0;
  let skipped = 0;
  let deleted = 0;

  for (const obj of objects) {
    const { name, etag } = obj;

    if (!etag) {
      logger.warning(`Skipping ${name}: missing ETag`);
      skipped++;
      continue;
    }

    const normalizedEtag = etag.replace(/"/g, "");

    const existing = await findFileByEtag(normalizedEtag);
    if (existing?.processedAt) {
      logger.warning(`Already processed: ${name}`);
      skipped++;
      continue;
    }

    logger.progress(`Enqueuing: ${name}`);
    await enqueueFileForIngestion(name, normalizedEtag);
    enqueued++;
  }

  logger.milestone("Cleaning up deleted files...");
  const cleanupStartTime = Date.now();

  for (const dbFile of dbFiles) {
    if (!bucketObjectsMap.has(dbFile.etag)) {
      logger.warning(`Removing from RAG: ${dbFile.name}`);
      await deleteFile(dbFile.id);
      deleted++;
    }
  }

  const cleanupTime = Date.now() - cleanupStartTime;
  logger.success(`Cleaned up ${deleted} files (${cleanupTime}ms)`);

  const totalTime = Date.now() - startTime;
  logger.milestone(`Sync completed in ${totalTime}ms:`);
  logger.info(`   Enqueued: ${enqueued} file(s)`);
  logger.info(`   Skipped: ${skipped} file(s)`);
  logger.info(`   Deleted: ${deleted} file(s)`);

  process.exit(0);
}

// Run the sync process and handle errors
syncBucket().catch((err) => {
  logger.error(`Sync failed: ${err.message}`);
  process.exit(1);
});
