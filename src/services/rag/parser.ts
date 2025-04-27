import pdfParse from "pdf-parse";

export async function parsePdf(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text;
}

export async function parseTxt(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

export async function parseMarkdown(buffer: Buffer): Promise<string> {
  return buffer.toString("utf-8");
}

export async function parseFileByExtension(buffer: Buffer, fileName: string): Promise<string> {
  if (fileName.endsWith(".pdf")) return parsePdf(buffer);
  if (fileName.endsWith(".txt")) return parseTxt(buffer);
  if (fileName.endsWith(".md")) return parseMarkdown(buffer);
  throw new Error(`Unsupported file format for ${fileName}`);
}
