import { get_encoding } from "@dqbd/tiktoken";

const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

export function chunkTextByTokens(text: string): string[] {
  const encoder = get_encoding("cl100k_base");
  const tokens = encoder.encode(text);
  const chunks: string[] = [];

  for (let i = 0; i < tokens.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = tokens.slice(i, i + CHUNK_SIZE);
    const decodedBytes = encoder.decode(chunk); // Uint8Array
    const decoded = new TextDecoder().decode(decodedBytes); // Convert to string
    chunks.push(decoded);
  }

  encoder.free();
  return chunks;
}
