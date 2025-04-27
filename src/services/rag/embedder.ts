import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";

import { env } from "@/config";

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });

interface EmbeddingResult {
  embedding: number[];
  text: string;
  index: number;
}
export async function embedChunks(chunks: string[]): Promise<EmbeddingResult[]> {
  const BATCH_SIZE = 10;
  const results: EmbeddingResult[] = [];

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);

    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: batch,
    });

    embeddings.forEach((item, idx) => {
      results.push({
        embedding: item,
        text: batch[idx],
        index: i + idx,
      });
    });
  }

  return results;
}
