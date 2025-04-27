import { Job, Queue } from "bullmq";

import { env } from "@/config";

interface IngestionJob {
  fileKey: string;
  etag: string;
}

export const ingestionQueue = new Queue<IngestionJob>("ingest", {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
});

ingestionQueue.on("error", (error: Error) => {
  console.error("Queue error:", error);
});

ingestionQueue.on("waiting", (job: Job<IngestionJob>) => {
  console.log(`Job ${job.id} is waiting`);
});

// Helper to add a job
export function enqueueFileForIngestion(fileKey: string, etag: string) {
  return ingestionQueue.add("ingest-file", { fileKey, etag });
}

// Helper to check if there are any pending jobs
export async function hasPendingJobs(): Promise<boolean> {
  const [waiting, active, delayed] = await Promise.all([
    ingestionQueue.getWaitingCount(),
    ingestionQueue.getActiveCount(),
    ingestionQueue.getDelayedCount(),
  ]);

  return waiting > 0 || active > 0 || delayed > 0;
}
