import { z } from "zod";

import "dotenv/config";

const envSchema = z.object({
  PORT: z.coerce.number(),
  // AI
  OPENAI_API_KEY: z.string(),
  // DATABASE
  DATABASE_URL: z.string(),
  // REDIS
  REDIS_HOST: z.string(),
  REDIS_PORT: z.coerce.number(),
  REDIS_USERNAME: z.string(),
  REDIS_PASSWORD: z.string(),
  // MINIO
  MINIO_ENDPOINT: z.string(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string(),
});

export const env = envSchema.parse(process.env);
