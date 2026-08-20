import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Local-disk replacement for Replit App Storage.
 * Files are stored under uploads/community-attachments/ relative to the project root.
 * The public API is identical to the original Replit-backed service so no callers need to change.
 */
@Injectable()
export class ObjectStorageService {
  private readonly logger = new Logger(ObjectStorageService.name);
  private readonly baseDir: string;

  constructor() {
    // Resolve uploads dir relative to the compiled dist output (two levels up from dist/src/community)
    this.baseDir = path.resolve(__dirname, '..', '..', '..', 'uploads', 'community-attachments');
    fs.mkdirSync(this.baseDir, { recursive: true });
  }

  buildAttachmentKey(fileName: string): string {
    // Never trust the client filename for the key — use a random UUID.
    const ext = (fileName.match(/\.([A-Za-z0-9]{1,8})$/)?.[1] || '').toLowerCase();
    return `community-attachments/${randomUUID()}${ext ? '.' + ext : ''}`;
  }

  async upload(key: string, buffer: Buffer): Promise<void> {
    try {
      const filePath = this.keyToPath(key);
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
      await fs.promises.writeFile(filePath, buffer);
    } catch (error: any) {
      this.logger.error(`Local storage upload failed for ${key}: ${error?.message}`);
      throw new InternalServerErrorException('فشل رفع الملف، حاول مرة أخرى');
    }
  }

  /** Returns a readable stream of the object's bytes. */
  downloadStream(key: string): Readable {
    return fs.createReadStream(this.keyToPath(key));
  }

  /** Best-effort delete — a leaked file is logged, never fatal. */
  async deleteQuietly(key: string): Promise<void> {
    try {
      await fs.promises.unlink(this.keyToPath(key));
    } catch (e: any) {
      this.logger.warn(`Local storage delete failed for ${key}: ${e?.message}`);
    }
  }

  private keyToPath(key: string): string {
    // key is like "community-attachments/<uuid>.ext" — strip the leading segment
    const filename = key.replace(/^community-attachments\//, '');
    return path.join(this.baseDir, filename);
  }
}
