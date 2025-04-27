import path from "node:path";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import chatRouter from "@/api/chat";
import { env } from "@/config";
import { setupBullBoard } from "@/services/queue/bullboard";

import { logger } from "./utils/logger";

const app = express();

/** Middlewares  */
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/** Routes */
app.use("/chat", chatRouter);

// BullBoard UI for monitoring queues
app.use("/admin/queues", setupBullBoard());

app.listen(env.PORT, () => {
  logger.milestone(`Server is running on port ${env.PORT}. http://localhost:${env.PORT}`);
  logger.info(`BullBoard UI available at http://localhost:${env.PORT}/admin/queues`);
});
