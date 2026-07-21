import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const PENDING_DIR = path.join(process.cwd(), "private-uploads", "pending");
const PUBLIC_PHOTOS_DIR = path.join(process.cwd(), "public", "uploads", "photos");
const PUBLIC_PHOTOS_URL_PREFIX = "/uploads/photos/";

async function unlinkIfExists(absolutePath: string) {
  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function writePendingPhotoFile(buffer: Buffer): Promise<{ storagePath: string }> {
  await fs.mkdir(PENDING_DIR, { recursive: true });
  const filename = `${randomUUID()}.jpg`;
  const absolutePath = path.join(PENDING_DIR, filename);
  await fs.writeFile(absolutePath, buffer);
  return { storagePath: path.relative(process.cwd(), absolutePath) };
}

export async function readPendingPhotoFile(storagePath: string): Promise<Buffer> {
  return fs.readFile(path.join(process.cwd(), storagePath));
}

export async function deletePendingPhotoFile(storagePath: string): Promise<void> {
  await unlinkIfExists(path.join(process.cwd(), storagePath));
}

export async function movePendingPhotoToPublic(storagePath: string, poiId: string): Promise<string> {
  const sourcePath = path.join(process.cwd(), storagePath);
  const targetDir = path.join(PUBLIC_PHOTOS_DIR, poiId);
  await fs.mkdir(targetDir, { recursive: true });
  const filename = path.basename(storagePath);
  const targetPath = path.join(targetDir, filename);
  await fs.rename(sourcePath, targetPath);
  return `${PUBLIC_PHOTOS_URL_PREFIX}${poiId}/${filename}`;
}

export async function deletePublicPhotoFile(url: string): Promise<void> {
  if (!url.startsWith(PUBLIC_PHOTOS_URL_PREFIX)) {
    return;
  }
  const relativePath = url.slice(1);
  await unlinkIfExists(path.join(process.cwd(), "public", relativePath));
}
