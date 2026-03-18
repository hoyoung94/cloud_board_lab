import Link from "next/link";
import { PostStatus } from "@prisma/client";
import { deletePostAction, updatePostAction } from "@/app/admin/actions";
import { AttachmentManager } from "@/components/admin/attachment-manager";
import { PostForm } from "@/components/admin/post-form";
import { NoticeBanner } from "@/components/notice-banner";
import { requireAdminSession } from "@/lib/auth";
import { getDatabaseSetupState, getEditablePostById, listCategoryOptions } from "@/lib/content";
import { getPostHref, readSearchParam } from "@/lib/format";

export const dynamic = "force-dynamic";

type EditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EditPostPage({ params, searchParams }: EditPostPageProps) {
  const { id } = await params;
  await requireAdminSession(`/admin/posts/${id}/edit`);
  const resolvedSearchParams = await searchParams;
  const setupState = getDatabaseSetupState();
  const { data: post, error } = await getEditablePostById(id);
  const { data: categories, error: categoryError } = await listCategoryOptions();
  const message = readSearchParam(resolvedSearchParams.message);
  const pageError = readSearchParam(resolvedSearchParams.error);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 lg:px-10">
        <NoticeBanner tone="error">{error}</NoticeBanner>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10 lg:px-10">
        <NoticeBanner tone="error">게시글을 찾을 수 없습니다.</NoticeBanner>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 lg:px-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">
            Edit Post
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">게시글 수정</h1>
          <p className="text-lg leading-8 text-zinc-600">
            제목, 슬러그, 카테고리, 태그, 고정글 여부를 조정하고 Markdown 미리보기로 결과를 바로
            확인할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin"
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
          >
            관리자 대시보드
          </Link>
          <Link
            href={`/admin/posts/${post.id}/preview`}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
          >
            초안 미리보기
          </Link>
          {post.status === PostStatus.PUBLISHED ? (
            <Link
              href={getPostHref(post.type, post.id)}
              prefetch={false}
              className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
            >
              공개 보기
            </Link>
          ) : null}
          <form action={deletePostAction}>
            <input type="hidden" name="id" value={post.id} />
            <button
              type="submit"
              className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
            >
              게시글 삭제
            </button>
          </form>
        </div>
      </section>

      {!setupState.configured ? <NoticeBanner>{setupState.message}</NoticeBanner> : null}
      {message ? <NoticeBanner tone="success">{message}</NoticeBanner> : null}
      {pageError ? <NoticeBanner tone="error">{pageError}</NoticeBanner> : null}
      {categoryError ? <NoticeBanner tone="error">{categoryError}</NoticeBanner> : null}

      <PostForm
        action={updatePostAction}
        submitLabel="변경사항 저장"
        categories={categories}
        post={post}
      />
      <AttachmentManager postId={post.id} attachments={post.attachments} />
    </main>
  );
}
