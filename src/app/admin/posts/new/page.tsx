import Link from "next/link";
import { PostStatus, PostType } from "@prisma/client";
import { createPostAction } from "@/app/admin/actions";
import { PostForm } from "@/components/admin/post-form";
import { NoticeBanner } from "@/components/notice-banner";
import { requireAdminSession } from "@/lib/auth";
import { getDatabaseSetupState, listCategoryOptions } from "@/lib/content";
import { readSearchParam } from "@/lib/format";

export const dynamic = "force-dynamic";

type NewPostPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  await requireAdminSession("/admin/posts/new");
  const resolvedSearchParams = await searchParams;
  const setupState = getDatabaseSetupState();
  const defaultType =
    readSearchParam(resolvedSearchParams.type) === PostType.BOARD
      ? PostType.BOARD
      : PostType.BLOG;
  const error = readSearchParam(resolvedSearchParams.error);
  const { data: categories, error: categoryError } = await listCategoryOptions();

  const defaultCategoryId =
    categories.find((category) => category.type === defaultType && category.isDefault)?.id ??
    categories.find((category) => category.type === defaultType)?.id ??
    "";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10 lg:px-10">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">
            New Post
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">새 글 작성</h1>
          <p className="text-lg leading-8 text-zinc-600">
            블로그와 게시판은 같은 데이터 구조를 공유합니다. 카테고리, 태그, 고정 여부, Markdown 본문을
            한 번에 설정하면서 운영 흐름에 맞게 글을 작성할 수 있습니다.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
        >
          관리자 대시보드로 돌아가기
        </Link>
      </section>

      {!setupState.configured ? <NoticeBanner>{setupState.message}</NoticeBanner> : null}
      {error ? <NoticeBanner tone="error">{error}</NoticeBanner> : null}
      {categoryError ? <NoticeBanner tone="error">{categoryError}</NoticeBanner> : null}

      <PostForm
        action={createPostAction}
        submitLabel="게시글 저장"
        categories={categories}
        post={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          type: defaultType,
          status: PostStatus.DRAFT,
          isPinned: false,
          categoryId: defaultCategoryId,
          tags: "",
        }}
      />
    </main>
  );
}
