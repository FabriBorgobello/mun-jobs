import * as Minio from "minio";

import { env } from "@/config";

interface S3Config {
  endPoint: string;
  accessKey: string;
  secretKey: string;
  bucket: string;
}

export class S3 {
  private client: Minio.Client;
  private defaultBucket: string;

  constructor(config: S3Config) {
    this.client = new Minio.Client({
      useSSL: true,
      endPoint: config.endPoint,
      accessKey: config.accessKey,
      secretKey: config.secretKey,
    });
    this.defaultBucket = config.bucket;
  }

  async listObjects(prefix?: string): Promise<Minio.BucketItem[]> {
    const objects: Minio.BucketItem[] = [];
    const stream = this.client.listObjects(this.defaultBucket, prefix, true);

    return new Promise((resolve, reject) => {
      stream.on("data", (obj: Minio.BucketItem) => objects.push(obj));
      stream.on("error", reject);
      stream.on("end", () => resolve(objects));
    });
  }

  /**
   * Gets a presigned URL for direct access to an object
   * Best for: Direct downloads, viewing files in browser, large files
   * @param objectName The name of the object to get
   * @param expirySeconds How long the URL should be valid for (default: 1 hour)
   * @returns A presigned URL that can be used to access the object
   */
  async getObject(objectName: string, expirySeconds: number = 3600): Promise<string> {
    const url = await this.client.presignedGetObject(this.defaultBucket, objectName, expirySeconds);
    return url;
  }

  /**
   * Gets an object as a buffer
   * Best for: When you need to process the file, small files, or need to transform the content
   * @param objectName The name of the object to get
   * @returns A buffer containing the object's contents
   */
  async getObjectAsBuffer(objectName: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.defaultBucket, objectName);
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  async deleteObject(objectName: string): Promise<void> {
    await this.client.removeObject(this.defaultBucket, objectName);
  }

  async uploadObject(
    objectName: string,
    data: Buffer | string,
    contentType?:
      | "application/pdf"
      | "application/json"
      | "application/octet-stream"
      | "application/jsonl"
      | "text/plain"
      | "text/csv"
      | (string & {}),
  ): Promise<void> {
    await this.client.putObject(this.defaultBucket, objectName, data, data.length, {
      "Content-Type": contentType || "application/octet-stream",
    });
  }
}

export const s3 = new S3({
  endPoint: env.MINIO_ENDPOINT,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
  bucket: env.MINIO_BUCKET,
});
