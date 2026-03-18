import { AttachmentKind } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import {
  assertUploadAllowed,
  createStoredFileName,
  type StoredAttachment,
} from "@/lib/storage-shared";

type SupabaseStorageConfig = {
  url: string;
  serverKey: string;
  bucket: string;
};

type BufferedAttachmentInput = {
  postId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  buffer: Buffer;
};

function isPlaceholder(value: string | undefined) {
  if (!value) {
    return true;
  }

  return (
    value.includes("your-project") ||
    value.includes("your-anon-key") ||
    value.includes("your-service-role-key") ||
    value.includes("your-secret-key")
  );
}

function getServerKey() {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function isSupabaseStorageConfigured() {
  return !(
    isPlaceholder(process.env.SUPABASE_URL) ||
    isPlaceholder(getServerKey()) ||
    isPlaceholder(process.env.SUPABASE_STORAGE_BUCKET)
  );
}

function getSupabaseStorageConfig(): SupabaseStorageConfig {
  const url = process.env.SUPABASE_URL;
  const serverKey = getServerKey();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET;

  if (!isSupabaseStorageConfigured() || !url || !serverKey || !bucket) {
    throw new Error(
      "Supabase Storage를 사용하려면 SUPABASE_URL, SUPABASE_SECRET_KEY 또는 SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET을 실제 값으로 채워 주세요.",
    );
  }

  return { url, serverKey, bucket };
}

function createSupabaseAdminClient() {
  const { url, serverKey } = getSupabaseStorageConfig();

  return createClient(url, serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function uploadToSupabase({
  postId,
  fileName,
  mimeType,
  fileSize,
  buffer,
}: BufferedAttachmentInput): Promise<StoredAttachment> {
  const { bucket } = getSupabaseStorageConfig();
  const client = createSupabaseAdminClient();
  const storedFileName = createStoredFileName(fileName);
  const storagePath = `posts/${postId}/${storedFileName}`;

  const { error: uploadError } = await client.storage.from(bucket).upload(storagePath, buffer, {
    contentType: mimeType || "application/octet-stream",
    cacheControl: "3600",
    upsert: false,
  });

  if (uploadError) {
    throw new Error(`Supabase Storage 업로드에 실패했습니다: ${uploadError.message}`);
  }

  const { data } = client.storage.from(bucket).getPublicUrl(storagePath);

  return {
    kind: mimeType.startsWith("image/") ? AttachmentKind.IMAGE : AttachmentKind.FILE,
    fileName: storedFileName,
    originalName: fileName,
    mimeType: mimeType || "application/octet-stream",
    fileSize,
    storageBucket: bucket,
    storagePath,
    publicUrl: data.publicUrl,
  };
}

export async function storeSupabaseAttachment(
  postId: string,
  file: File,
): Promise<StoredAttachment> {
  assertUploadAllowed(file);

  return uploadToSupabase({
    postId,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size,
    buffer: Buffer.from(await file.arrayBuffer()),
  });
}

export async function storeSupabaseAttachmentFromBuffer(
  input: BufferedAttachmentInput,
): Promise<StoredAttachment> {
  return uploadToSupabase(input);
}

export async function removeSupabaseAttachment(storageBucket: string, storagePath: string) {
  const client = createSupabaseAdminClient();
  const { error } = await client.storage.from(storageBucket).remove([storagePath]);

  if (error) {
    throw new Error(`Supabase Storage 파일 삭제에 실패했습니다: ${error.message}`);
  }
}
