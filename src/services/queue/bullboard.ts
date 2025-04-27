import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import express from "express";

import { ingestionQueue } from "./queue";

/**
 * Sets up BullBoard for monitoring queues
 * @returns Express router with BullBoard UI
 */
export function setupBullBoard(): express.Router {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(ingestionQueue)],
    serverAdapter,
  });

  return serverAdapter.getRouter();
}
