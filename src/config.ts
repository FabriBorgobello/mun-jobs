import { z } from "zod";

import "dotenv/config";

const envSchema = z.object({
  PORT: z.coerce.number(),
  OPENAI_API_KEY: z.string(),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  MINIO_ENDPOINT: z.string(),
  MINIO_ACCESS_KEY: z.string(),
  MINIO_SECRET_KEY: z.string(),
  MINIO_BUCKET: z.string(),
  ENVIRONMENT: z.enum(["production", "staging", "development"]),
});

export const env = envSchema.parse(process.env);
