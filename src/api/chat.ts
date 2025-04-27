// src/api/chat.ts
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { Router } from "express";

import { env } from "@/config";
import { getTopKChunks } from "@/services/rag/db";
import { embedChunks } from "@/services/rag/embedder";

const router = Router();
const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

// curl -X POST http://localhost:4747/chat \
//   -H "Content-Type: application/json" \
//   -d '{"query": "Que impuestos y formularios debo pagar como autonomo en españa?"}'

router.post("/", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Missing query string" });
    }

    // Step 1: Embed query
    const [{ embedding: queryEmbedding }] = await embedChunks([query]);

    // Step 2: Retrieve relevant chunks
    const contextChunks = await getTopKChunks(queryEmbedding, 5);
    const contextText = contextChunks.map((c) => c.content).join("\n---\n");

    // Step 3: Stream completion
    const { textStream } = streamText({
      model: openai.chat("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Use the context provided to answer the user's question accurately.",
        },
        {
          role: "user",
          content: `Context:\n${contextText}\n\nQuestion: ${query}`,
        },
      ],
    });

    // Step 4: Stream response to client
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");

    for await (const chunk of textStream) {
      res.write(chunk);
    }

    res.end();
  } catch (err) {
    console.error("❌ Error in /chat:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});

export default router;
