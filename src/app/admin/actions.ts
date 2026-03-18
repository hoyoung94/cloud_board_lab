"use server";

import { PostStatus, PostType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth";
import { readLocalAttachmentBuffer, removeLocalAttachment } from "@/lib/local-storage";
import { db } from "@/lib/prisma";
import { getStorageProvider, getStorageSetupState, removeStoredAttachment, storeAttachment, UPLOAD_LIMITS } from "@/lib/storage";
import { storeSupabaseAttachmentFromBuffer } from "@/lib/supabase-storage";

const postSchema = z.object({
  id: z.string().cuid().optional(),
  title: z.string().trim().min(2, "제목은 2자 이상 입력해 주세요."),
  slug: z.string().trim().optional(),
  excerpt: z.string().trim().max(240, "요약은 240자 이내로 입력해 주세요.").optional(),
  content: z.string().trim().min(10, "본문은 10자 이상 입력해 주세요."),
  type: z.nativeEnum(PostType),
  status: z.nativeEnum(PostStatus),
  isPinned: z.boolean(),
  categoryId: z.string().cuid().optional(),
  tags: z.string().trim().max(120, "태그는 120자 이내로 입력해 주세요.").optional(),
});

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseTagNames(value?: string) {
  const tags = (value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return Array.from(new Set(tags)).slice(0, 8);
}

function throwIfRedirectError(error: unknown): never | void {
  if (isRedirectError(error)) {
    throw error;
  }
}

function getActionErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "요청을 처리하는 중 문제가 발생했습니다.";
}

function buildErrorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

function getEncodedPostHref(type: PostType, key: string) {
  const encodedKey = encodeURIComponent(key);
  return type === PostType.BLOG ? `/blog/${encodedKey}` : `/board/${encodedKey}`;
}

function revalidateAll(
  type: PostType,
  id: string,
  previous?: { type: PostType; id: string; slug?: string },
) {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/blog");
  revalidatePath("/board");
  revalidatePath(getEncodedPostHref(type, id));

  if (previous && (previous.id !== id || previous.type !== type)) {
    revalidatePath(getEncodedPostHref(previous.type, previous.id));
  }

  if (previous?.slug) {
    revalidatePath(getEncodedPostHref(previous.type, previous.slug));
  }
}

function revalidatePostDetail(type: PostType, postId: string, slug?: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/posts/${postId}/edit`);
  revalidatePath(`/admin/posts/${postId}/preview`);
  revalidatePath(getEncodedPostHref(type, postId));

  if (slug) {
    revalidatePath(getEncodedPostHref(type, slug));
  }
}

async function resolveCategoryId(categoryId: string | undefined, type: PostType) {
  if (!categoryId) {
    return null;
  }

  const category = await db.category.findUnique({
    where: { id: categoryId },
    select: {
      id: true,
      type: true,
    },
  });

  if (!category) {
    throw new Error("선택한 카테고리를 찾을 수 없습니다.");
  }

  if (category.type !== type) {
    throw new Error("글 유형과 맞는 카테고리를 선택해 주세요.");
  }

  return category.id;
}

async function syncPostTags(tx: Prisma.TransactionClient, postId: string, tagNames: string[]) {
  await tx.postTag.deleteMany({
    where: { postId },
  });

  if (tagNames.length === 0) {
    return;
  }

  const tagIds: string[] = [];

  for (const tagName of tagNames) {
    const slug = normalizeSlug(tagName);

    if (!slug) {
      continue;
    }

    const tag = await tx.tag.upsert({
      where: { slug },
      update: {
        name: tagName,
      },
      create: {
        name: tagName,
        slug,
      },
      select: {
        id: true,
      },
    });

    tagIds.push(tag.id);
  }

  if (tagIds.length === 0) {
    return;
  }

  await tx.postTag.createMany({
    data: tagIds.map((tagId) => ({
      postId,
      tagId,
    })),
    skipDuplicates: true,
  });
}

function getUploadFiles(formData: FormData) {
  return formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);
}

export async function createPostAction(formData: FormData) {
  const session = await requireAdminSession("/admin/posts/new");

  const parsed = postSchema.safeParse({
    title: getFormValue(formData, "title"),
    slug: normalizeOptionalText(getFormValue(formData, "slug")),
    excerpt: normalizeOptionalText(getFormValue(formData, "excerpt")),
    content: getFormValue(formData, "content"),
    type: getFormValue(formData, "type"),
    status: getFormValue(formData, "status"),
    isPinned: formData.get("isPinned") === "on",
    categoryId: normalizeOptionalText(getFormValue(formData, "categoryId")),
    tags: normalizeOptionalText(getFormValue(formData, "tags")),
  });

  if (!parsed.success) {
    redirect(
      buildErrorUrl(
        "/admin/posts/new",
        parsed.error.issues[0]?.message ?? "입력값을 다시 확인해 주세요.",
      ),
    );
  }

  try {
    const input = parsed.data;
    const slug = normalizeSlug(input.slug ?? input.title);

    if (!slug) {
      throw new Error("슬러그를 생성할 수 없습니다. 제목이나 슬러그를 다시 입력해 주세요.");
    }

    const conflict = await db.post.findUnique({
      where: { slug },
      select: {
        id: true,
      },
    });

    if (conflict) {
      throw new Error("이미 사용 중인 슬러그입니다.");
    }

    const categoryId = await resolveCategoryId(input.categoryId, input.type);
    const tagNames = parseTagNames(input.tags);

    const created = await db.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          title: input.title,
          slug,
          excerpt: input.excerpt ?? null,
          content: input.content,
          type: input.type,
          status: input.status,
          isPinned: input.isPinned,
          publishedAt: input.status === PostStatus.PUBLISHED ? new Date() : null,
          authorId: session.user.id,
          categoryId,
        },
        select: {
          id: true,
          slug: true,
          type: true,
        },
      });

      await syncPostTags(tx, post.id, tagNames);
      return post;
    });

    revalidateAll(created.type, created.id);
    redirect(`/admin/posts/${created.id}/edit?message=${encodeURIComponent("게시글이 저장되었습니다.")}`);
  } catch (error) {
    throwIfRedirectError(error);
    redirect(buildErrorUrl("/admin/posts/new", getActionErrorMessage(error)));
  }
}

export async function updatePostAction(formData: FormData) {
  const id = getFormValue(formData, "id");
  await requireAdminSession(id ? `/admin/posts/${id}/edit` : "/admin");

  const parsed = postSchema.safeParse({
    id,
    title: getFormValue(formData, "title"),
    slug: normalizeOptionalText(getFormValue(formData, "slug")),
    excerpt: normalizeOptionalText(getFormValue(formData, "excerpt")),
    content: getFormValue(formData, "content"),
    type: getFormValue(formData, "type"),
    status: getFormValue(formData, "status"),
    isPinned: formData.get("isPinned") === "on",
    categoryId: normalizeOptionalText(getFormValue(formData, "categoryId")),
    tags: normalizeOptionalText(getFormValue(formData, "tags")),
  });

  if (!parsed.success || !parsed.data.id) {
    redirect("/admin?error=수정할 게시글 정보를 읽지 못했습니다.");
  }

  try {
    const input = parsed.data;
    const previous = await db.post.findUnique({
      where: { id: input.id },
      select: {
        id: true,
        slug: true,
        type: true,
        publishedAt: true,
      },
    });

    if (!previous) {
      throw new Error("수정할 게시글을 찾을 수 없습니다.");
    }

    const slug = normalizeSlug(input.slug ?? input.title);

    if (!slug) {
      throw new Error("슬러그를 생성할 수 없습니다. 제목이나 슬러그를 다시 입력해 주세요.");
    }

    const conflict = await db.post.findFirst({
      where: {
        slug,
        NOT: {
          id: input.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (conflict) {
      throw new Error("이미 사용 중인 슬러그입니다.");
    }

    const categoryId = await resolveCategoryId(input.categoryId, input.type);
    const tagNames = parseTagNames(input.tags);

    const updated = await db.$transaction(async (tx) => {
      const post = await tx.post.update({
        where: { id: input.id },
        data: {
          title: input.title,
          slug,
          excerpt: input.excerpt ?? null,
          content: input.content,
          type: input.type,
          status: input.status,
          isPinned: input.isPinned,
          categoryId,
          publishedAt:
            input.status === PostStatus.PUBLISHED
              ? previous.publishedAt ?? new Date()
              : input.status === PostStatus.DRAFT
                ? null
                : previous.publishedAt,
        },
        select: {
          id: true,
          slug: true,
          type: true,
        },
      });

      await syncPostTags(tx, post.id, tagNames);
      return post;
    });

    revalidateAll(updated.type, updated.id, {
      type: previous.type,
      id: previous.id,
      slug: previous.slug,
    });

    redirect(
      `/admin/posts/${updated.id}/edit?message=${encodeURIComponent("게시글이 업데이트되었습니다.")}`,
    );
  } catch (error) {
    throwIfRedirectError(error);
    redirect(buildErrorUrl(`/admin/posts/${parsed.data.id}/edit`, getActionErrorMessage(error)));
  }
}

export async function deletePostAction(formData: FormData) {
  const id = getFormValue(formData, "id");
  await requireAdminSession(id ? `/admin/posts/${id}/edit` : "/admin");

  if (!id) {
    redirect("/admin?error=삭제할 게시글 ID가 없습니다.");
  }

  try {
    const existing = await db.post.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        type: true,
      },
    });

    if (!existing) {
      throw new Error("이미 삭제되었거나 존재하지 않는 게시글입니다.");
    }

    await db.post.delete({
      where: { id },
    });

    revalidateAll(existing.type, existing.id, {
      type: existing.type,
      id: existing.id,
      slug: existing.slug,
    });

    redirect(`/admin?message=${encodeURIComponent("게시글을 삭제했습니다.")}`);
  } catch (error) {
    throwIfRedirectError(error);
    redirect(`/admin?error=${encodeURIComponent(getActionErrorMessage(error))}`);
  }
}

export async function uploadAttachmentsAction(formData: FormData) {
  const session = await requireAdminSession("/admin");
  const postId = getFormValue(formData, "postId");

  if (!postId) {
    redirect("/admin?error=첨부파일을 연결할 게시글 ID가 없습니다.");
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
      type: true,
    },
  });

  if (!post) {
    redirect("/admin?error=첨부파일을 연결할 게시글을 찾을 수 없습니다.");
  }

  const files = getUploadFiles(formData);

  if (files.length === 0) {
    redirect(`/admin/posts/${post.id}/edit?error=${encodeURIComponent("업로드할 파일을 선택해 주세요.")}`);
  }

  if (files.length > UPLOAD_LIMITS.maxFilesPerRequest) {
    redirect(
      `/admin/posts/${post.id}/edit?error=${encodeURIComponent(
        `한 번에 최대 ${UPLOAD_LIMITS.maxFilesPerRequest}개 파일까지 업로드할 수 있습니다.`,
      )}`,
    );
  }

  const savedFiles: Awaited<ReturnType<typeof storeAttachment>>[] = [];

  try {
    for (const file of files) {
      const saved = await storeAttachment(post.id, file);
      savedFiles.push(saved);
    }

    await db.attachment.createMany({
      data: savedFiles.map((file) => ({
        postId: post.id,
        uploaderId: session.user.id,
        kind: file.kind,
        fileName: file.fileName,
        originalName: file.originalName,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        storageBucket: file.storageBucket,
        storagePath: file.storagePath,
        publicUrl: file.publicUrl,
      })),
    });

    revalidatePostDetail(post.type, post.id, post.slug);
    redirect(
      `/admin/posts/${post.id}/edit?message=${encodeURIComponent("첨부파일을 업로드했습니다.")}`,
    );
  } catch (error) {
    throwIfRedirectError(error);
    await Promise.all(
      savedFiles.map((file) => removeStoredAttachment(file.storageBucket, file.storagePath)),
    );
    redirect(`/admin/posts/${post.id}/edit?error=${encodeURIComponent(getActionErrorMessage(error))}`);
  }
}

export async function deleteAttachmentAction(formData: FormData) {
  await requireAdminSession("/admin");
  const attachmentId = getFormValue(formData, "attachmentId");

  if (!attachmentId) {
    redirect("/admin?error=삭제할 첨부파일 ID가 없습니다.");
  }

  const attachment = await db.attachment.findUnique({
    where: { id: attachmentId },
    select: {
      id: true,
      storageBucket: true,
      storagePath: true,
      post: {
        select: {
          id: true,
          slug: true,
          type: true,
        },
      },
    },
  });

  if (!attachment?.post) {
    redirect("/admin?error=삭제할 첨부파일을 찾을 수 없습니다.");
  }

  try {
    await db.attachment.delete({
      where: { id: attachment.id },
    });

    await removeStoredAttachment(attachment.storageBucket, attachment.storagePath);
    revalidatePostDetail(attachment.post.type, attachment.post.id, attachment.post.slug);
    redirect(
      `/admin/posts/${attachment.post.id}/edit?message=${encodeURIComponent("첨부파일을 삭제했습니다.")}`,
    );
  } catch (error) {
    throwIfRedirectError(error);
    redirect(
      `/admin/posts/${attachment.post.id}/edit?error=${encodeURIComponent(getActionErrorMessage(error))}`,
    );
  }
}

export async function migrateLocalAttachmentsToSupabaseAction() {
  await requireAdminSession("/admin");

  const storageState = getStorageSetupState();

  if (getStorageProvider() !== "supabase") {
    redirect("/admin?error=마이그레이션을 실행하려면 STORAGE_PROVIDER를 supabase로 설정해야 합니다.");
  }

  if (!storageState.configured) {
    redirect(`/admin?error=${encodeURIComponent(storageState.message ?? "Supabase 설정이 비어 있습니다.")}`);
  }

  const attachments = await db.attachment.findMany({
    where: {
      storageBucket: "local-public",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      postId: true,
      fileName: true,
      originalName: true,
      mimeType: true,
      fileSize: true,
      storagePath: true,
      post: {
        select: {
          id: true,
          slug: true,
          type: true,
        },
      },
    },
  });

  if (attachments.length === 0) {
    redirect("/admin?message=이전할 로컬 첨부파일이 없습니다.");
  }

  let migratedCount = 0;
  const failedFiles: string[] = [];
  const affectedPosts = new Map<string, { id: string; slug: string; type: PostType }>();

  for (const attachment of attachments) {
    try {
      const buffer = await readLocalAttachmentBuffer(attachment.storagePath);
      const postId = attachment.postId ?? "orphaned";
      const stored = await storeSupabaseAttachmentFromBuffer({
        postId,
        fileName: attachment.originalName ?? attachment.fileName,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        buffer,
      });

      await db.attachment.update({
        where: {
          id: attachment.id,
        },
        data: {
          kind: stored.kind,
          fileName: stored.fileName,
          originalName: attachment.originalName ?? attachment.fileName,
          mimeType: stored.mimeType,
          fileSize: stored.fileSize,
          storageBucket: stored.storageBucket,
          storagePath: stored.storagePath,
          publicUrl: stored.publicUrl,
        },
      });

      await removeLocalAttachment(attachment.storagePath).catch((error) => {
        console.error("로컬 첨부파일 삭제 실패", error);
      });

      migratedCount += 1;

      if (attachment.post) {
        affectedPosts.set(attachment.post.id, attachment.post);
      }
    } catch (error) {
      console.error(error);
      failedFiles.push(attachment.originalName ?? attachment.fileName);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/blog");
  revalidatePath("/board");

  for (const post of affectedPosts.values()) {
    revalidatePostDetail(post.type, post.id, post.slug);
  }

  const message = `${attachments.length}개 중 ${migratedCount}개 첨부파일을 Supabase로 옮겼습니다.`;

  if (failedFiles.length > 0) {
    const errorMessage = `실패 ${failedFiles.length}개: ${failedFiles.slice(0, 3).join(", ")}${failedFiles.length > 3 ? " 외" : ""}`;
    redirect(`/admin?message=${encodeURIComponent(message)}&error=${encodeURIComponent(errorMessage)}`);
  }

  redirect(`/admin?message=${encodeURIComponent(message)}`);
}
