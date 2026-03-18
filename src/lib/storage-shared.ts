import { randomUUID } from "crypto";
import path from "path";
import { AttachmentKind } from "@prisma/client";

const MAX_FILE_SIZE = 6 * 1024 * 1024;
const MAX_FILES_PER_REQUEST = 5;
const BLOCKED_EXTENSIONS = new Set([
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".msi",
  ".ps1",
  ".sh",
  ".scr",
]);

export const UPLOAD_LIMITS = {
  maxFileSize: MAX_FILE_SIZE,
  maxFilesPerRequest: MAX_FILES_PER_REQUEST,
};

export type StoredAttachment = {
  kind: AttachmentKind;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  storageBucket: string;
  storagePath: string;
  publicUrl: string;
};

export function sanitizeBaseName(fileName: string) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension);

  const normalized = baseName
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");

  return normalized || "file";
}

export function getSafeExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

export function assertUploadAllowed(file: File) {
  if (file.size <= 0) {
    throw new Error("비어 있는 파일은 업로드할 수 없습니다.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("파일 하나당 최대 6MB까지 업로드할 수 있습니다.");
  }

  const extension = getSafeExtension(file.name);

  if (BLOCKED_EXTENSIONS.has(extension)) {
    throw new Error("실행 파일 형식은 업로드할 수 없습니다.");
  }
}

export function createStoredFileName(fileName: string) {
  const extension = getSafeExtension(fileName);
  const baseName = sanitizeBaseName(fileName);
  return `${Date.now()}-${baseName}-${randomUUID()}${extension}`;
}

export function getAttachmentKind(file: File) {
  return file.type.startsWith("image/") ? AttachmentKind.IMAGE : AttachmentKind.FILE;
}
