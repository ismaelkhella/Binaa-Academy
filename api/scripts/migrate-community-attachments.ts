/**
 * One-off migration: move CommunityAttachment.data (Postgres Bytes)
 * into object storage, then clear the DB column.
 * Safe to re-run — only touches rows where storageKey is null and data exists.
 *
 * Run: cd api && npx ts-node scripts/migrate-community-attachments.ts
 */
import { PrismaClient } from '@prisma/client';
import { Client } from '@replit/object-storage';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();
const storage = new Client(
  process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID
    ? { bucketId: process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID }
    : undefined,
);

async function main() {
  const rows = await prisma.communityAttachment.findMany({
    where: { storageKey: null, data: { not: null } },
    select: { id: true, fileName: true },
  });
  console.log(`Migrating ${rows.length} attachment(s)...`);
  let ok = 0;
  for (const row of rows) {
    const full = await prisma.communityAttachment.findUnique({
      where: { id: row.id },
      select: { data: true },
    });
    if (!full?.data) continue;
    const ext = (row.fileName.match(/\.([A-Za-z0-9]{1,8})$/)?.[1] || '').toLowerCase();
    const key = `community-attachments/${randomUUID()}${ext ? '.' + ext : ''}`;
    const res = await storage.uploadFromBytes(key, Buffer.from(full.data));
    if (!res.ok) {
      console.error(`FAILED ${row.id}: ${res.error?.message}`);
      continue;
    }
    await prisma.communityAttachment.update({
      where: { id: row.id },
      data: { storageKey: key, data: null },
    });
    ok++;
  }
  console.log(`Done: ${ok}/${rows.length} migrated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
