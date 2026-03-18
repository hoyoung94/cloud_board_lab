import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import {
  assertUploadAllowed,
  createStoredFileName,
  getAttachmentKind,
  type StoredAttachment,
} from "@/lib/storage-shared";

const PUBLIC_ROOT = path.join(process.cwd(), "public");
const UPLOAD_ROOT = path.join(PUBLIC_ROOT, "uploads", "posts");

function normalizeStoragePath(storagePath: string) {
  const normalized = path.posix.normalize(storagePath).replace(/^(\.\.(\/|\\|$))+/, "");

  if (!normalized.startsWith("uploads/posts/")) {
    throw new Error("허용되지 않은 로컬 저장 경로입니다.");
  }

  return normalized;
}

function getAbsolutePath(storagePath: string) {
  const normalized = normalizeStoragePath(storagePath);
  return path.join(PUBLIC_ROOT, ...normalized.split("/"));
}

export async function storeLocalAttachment(postId: string, file: File): Promise<StoredAttachment> {
  assertUploadAllowed(file);

  const storedFileName = createStoredFileName(file.name);
  const relativePath = path.posix.join("uploads", "posts", postId, storedFileName);
  const absoluteDirectory = path.join(UPLOAD_ROOT, postId);
  const absolutePath = getAbsolutePath(relativePath);
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(absoluteDirectory, { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    kind: getAttachmentKind(file),
    fileName: storedFileName,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    storageBucket: "local-public",
    storagePath: relativePath,
    publicUrl: `/${relativePath}`,
  };
}

export async function readLocalAttachmentBuffer(storagePath: string) {
  return readFile(getAbsolutePath(storagePath));
}

export async function removeLocalAttachment(storagePath: string) {
  const absolutePath = getAbsolutePath(storagePath);

  try {
    await unlink(absolutePath);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }

    throw error;
  }
}
