import { PostStatus, PostType } from "@prisma/client";

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "미정";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(date);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "미정";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  return dateTimeFormatter.format(date);
}

export function getPostTypeLabel(type: PostType) {
  return type === PostType.BLOG ? "블로그" : "게시판";
}

export function getPostStatusLabel(status: PostStatus) {
  switch (status) {
    case PostStatus.PUBLISHED:
      return "발행";
    case PostStatus.ARCHIVED:
      return "보관";
    default:
      return "초안";
  }
}

export function getPostHref(type: PostType, key: string) {
  const encodedKey = encodeURIComponent(key);
  return type === PostType.BLOG ? `/blog/${encodedKey}` : `/board/${encodedKey}`;
}

export function getCollectionHref(
  type: PostType,
  filters?: {
    categorySlug?: string | null;
    tagSlug?: string | null;
    searchQuery?: string | null;
    page?: number | null;
  },
) {
  const basePath = type === PostType.BLOG ? "/blog" : "/board";
  const params = new URLSearchParams();

  if (filters?.categorySlug) {
    params.set("category", filters.categorySlug);
  }

  if (filters?.tagSlug) {
    params.set("tag", filters.tagSlug);
  }

  if (filters?.searchQuery?.trim()) {
    params.set("q", filters.searchQuery.trim());
  }

  if (filters?.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function getAdminHref(filters?: {
  searchQuery?: string | null;
  status?: PostStatus | null;
  type?: PostType | null;
  page?: number | null;
}) {
  const params = new URLSearchParams();

  if (filters?.searchQuery?.trim()) {
    params.set("q", filters.searchQuery.trim());
  }

  if (filters?.status) {
    params.set("status", filters.status);
  }

  if (filters?.type) {
    params.set("type", filters.type);
  }

  if (filters?.page && filters.page > 1) {
    params.set("page", String(filters.page));
  }

  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

export function formatFileSize(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  if (value < 1024 * 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(value / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function formatViewCount(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function splitContent(content: string) {
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function readPositivePageParam(value: string | string[] | undefined) {
  const normalized = readSearchParam(value);
  const parsed = Number(normalized);

  if (!normalized || !Number.isFinite(parsed)) {
    return 1;
  }

  return Math.max(1, Math.floor(parsed));
}
