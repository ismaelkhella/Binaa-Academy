import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Client } from '@replit/object-storage';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

/**
 * Thin wrapper around Replit App Storage (GCS-backed object storage).
 * Community attachment binaries live here; PostgreSQL keeps only metadata + key.
 */
@Injectable()
export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name);
  // Explicit bucketId: the sidecar default-bucket lookup is empty in some environments.
  private readonly client = new Client(
    process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID
      ? { bucketId: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID }
      : undefined,
  );

  buildAttachmentKey(fileName: string): string {
    // Never trust the client filename for the key — use a random UUID.
    const ext = (fileName.match(/\.([A-Za-z0-9]{1,8})$/)?.[1] || '').toLowerCase();
    return `community-attachments/${randomUUID()}${ext ? '.' + ext : ''}`;
  }

  async upload(key: string, buffer: Buffer): Promise<void> {
    const { ok, error } = await this.client.uploadFromBytes(key, buffer);
    if (!ok) {
      this.logger.error(`Object storage upload failed for ${key}: ${error?.message}`);
      throw new InternalServerErrorException('فشل رفع الملف، حاول مرة أخرى');
    }
  }

  /** Returns a readable stream of the object's bytes. */
  downloadStream(key: string): Readable {
    return this.client.downloadAsStream(key);
  }

  /** Best-effort delete — a leaked object is logged, never fatal. */
  async deleteQuietly(key: string): Promise<void> {
    try {
      const { ok, error } = await this.client.delete(key);
      if (!ok) this.logger.warn(`Object storage delete failed for ${key}: ${error?.message}`);
    } catch (e: any) {
      this.logger.warn(`Object storage delete threw for ${key}: ${e?.message}`);
    }
  }
}
