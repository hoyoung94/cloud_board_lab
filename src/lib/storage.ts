import { removeLocalAttachment, storeLocalAttachment } from "@/lib/local-storage";
import {
  isSupabaseStorageConfigured,
  removeSupabaseAttachment,
  storeSupabaseAttachment,
} from "@/lib/supabase-storage";
import { UPLOAD_LIMITS, type StoredAttachment } from "@/lib/storage-shared";

export type StorageProvider = "local" | "supabase";

function normalizeProvider(value?: string): StorageProvider {
  return value?.toLowerCase() === "supabase" ? "supabase" : "local";
}

export function getStorageProvider() {
  return normalizeProvider(process.env.STORAGE_PROVIDER);
}

export function getStorageProviderLabel() {
  return getStorageProvider() === "supabase" ? "Supabase Storage" : "로컬 저장소";
}

export function getStorageSetupState() {
  const provider = getStorageProvider();

  if (provider === "supabase" && !isSupabaseStorageConfigured()) {
    return {
      provider,
      configured: false,
      message:
        "현재 저장소는 Supabase로 설정되어 있지만 필수 환경변수가 비어 있습니다. .env의 URL, 비밀 키, 버킷 이름을 확인해 주세요.",
    };
  }

  return {
    provider,
    configured: true,
    message: null,
  };
}

export { UPLOAD_LIMITS };
export type { StoredAttachment };

export async function storeAttachment(postId: string, file: File): Promise<StoredAttachment> {
  const provider = getStorageProvider();

  if (provider === "supabase") {
    return storeSupabaseAttachment(postId, file);
  }

  return storeLocalAttachment(postId, file);
}

export async function removeStoredAttachment(storageBucket: string, storagePath: string) {
  if (storageBucket === "local-public") {
    return removeLocalAttachment(storagePath);
  }

  return removeSupabaseAttachment(storageBucket, storagePath);
}
