import Link from "next/link";
import { PostStatus, PostType } from "@prisma/client";
import {
  deletePostAction,
  migrateLocalAttachmentsToSupabaseAction,
} from "@/app/admin/actions";
import { AdminPaginationNav } from "@/components/admin/admin-pagination-nav";
import { NoticeBanner } from "@/components/notice-banner";
import { requireAdminSession } from "@/lib/auth";
import { getAdminDashboardData, getDatabaseSetupState } from "@/lib/content";
import {
  formatDate,
  formatViewCount,
  getPostHref,
  getPostStatusLabel,
  getPostTypeLabel,
  readPositivePageParam,
  readSearchParam,
} from "@/lib/format";
import { getStorageProviderLabel, getStorageSetupState } from "@/lib/storage";

export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const typeOptions = [
  { value: "", label: "전체 유형" },
  { value: PostType.BLOG, label: "블로그" },
  { value: PostType.BOARD, label: "게시판" },
];

const statusOptions = [
  { value: "", label: "전체 상태" },
  { value: PostStatus.DRAFT, label: "초안" },
  { value: PostStatus.PUBLISHED, label: "발행" },
  { value: PostStatus.ARCHIVED, label: "보관" },
];

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await requireAdminSession("/admin");
  const resolvedSearchParams = await searchParams;
  const setupState = getDatabaseSetupState();
  const storageState = getStorageSetupState();
  const filters = {
    searchQuery: readSearchParam(resolvedSearchParams.q),
    status:
      readSearchParam(resolvedSearchParams.status) === PostStatus.DRAFT ||
      readSearchParam(resolvedSearchParams.status) === PostStatus.PUBLISHED ||
      readSearchParam(resolvedSearchParams.status) === PostStatus.ARCHIVED
        ? (readSearchParam(resolvedSearchParams.status) as PostStatus)
        : undefined,
    type:
      readSearchParam(resolvedSearchParams.type) === PostType.BLOG ||
      readSearchParam(resolvedSearchParams.type) === PostType.BOARD
        ? (readSearchParam(resolvedSearchParams.type) as PostType)
        : undefined,
    page: readPositivePageParam(resolvedSearchParams.page),
  };

  const { data, error } = await getAdminDashboardData(filters);
  const message = readSearchParam(resolvedSearchParams.message);
  const pageError = readSearchParam(resolvedSearchParams.error);
  const hasActiveFilters = Boolean(filters.searchQuery || filters.status || filters.type);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-[0_20px_70px_rgba(73,41,17,0.08)] md:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">
            Admin
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
            글 관리 대시보드
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-zinc-600">
            {session.user.name ?? "관리자"} 계정으로 로그인한 상태입니다. 검색, 필터, 페이지네이션으로
            게시글을 관리하고 첨부파일 저장소 상태까지 함께 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-3 rounded-[1.5rem] border border-orange-200/70 bg-orange-50 p-5">
          <Link
            href="/admin/posts/new?type=BLOG"
            className="rounded-full bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700"
          >
            새 블로그 글 작성
          </Link>
          <Link
            href="/admin/posts/new?type=BOARD"
            className="rounded-full border border-zinc-200 px-4 py-3 text-center text-sm font-semibold text-zinc-800 hover:border-zinc-400 hover:text-zinc-950"
          >
            새 게시판 글 작성
          </Link>
        </div>
      </section>

      {!setupState.configured ? <NoticeBanner>{setupState.message}</NoticeBanner> : null}
      {!storageState.configured ? <NoticeBanner>{storageState.message}</NoticeBanner> : null}
      {message ? <NoticeBanner tone="success">{message}</NoticeBanner> : null}
      {pageError ? <NoticeBanner tone="error">{pageError}</NoticeBanner> : null}
      {error ? <NoticeBanner tone="error">{error}</NoticeBanner> : null}

      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-8">
        {[
          { label: "전체 글", value: data.stats.total },
          { label: "발행", value: data.stats.published },
          { label: "초안", value: data.stats.drafts },
          { label: "보관", value: data.stats.archived },
          { label: "고정글", value: data.stats.pinned },
          { label: "블로그", value: data.stats.blog },
          { label: "게시판", value: data.stats.board },
          { label: "Supabase 첨부", value: data.stats.supabaseAttachments },
        ].map((item) => (
          <article
            key={item.label}
            className="rounded-[1.4rem] border border-black/5 bg-white/80 p-5 shadow-[0_16px_48px_rgba(73,41,17,0.05)]"
          >
            <p className="text-sm text-zinc-500">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950">
              {item.value}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(25,20,15,0.06)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Filtered Result
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                {hasActiveFilters ? "조건에 맞는 게시글" : "전체 게시글"}
              </h2>
            </div>
            {hasActiveFilters ? (
              <Link
                href="/admin"
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
              >
                필터 초기화
              </Link>
            ) : null}
          </div>

          <form action="/admin" className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
            <input
              type="search"
              name="q"
              defaultValue={filters.searchQuery ?? ""}
              placeholder="제목, 슬러그, 본문, 태그 검색"
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
            />
            <select
              name="type"
              defaultValue={filters.type ?? ""}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
            >
              {typeOptions.map((option) => (
                <option key={option.value || "all-type"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={filters.status ?? ""}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
            >
              {statusOptions.map((option) => (
                <option key={option.value || "all-status"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
            >
              검색
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {filters.type ? (
              <span className="rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700">
                유형: {getPostTypeLabel(filters.type)}
              </span>
            ) : null}
            {filters.status ? (
              <span className="rounded-full bg-orange-100 px-3 py-2 text-sm font-medium text-orange-950">
                상태: {getPostStatusLabel(filters.status)}
              </span>
            ) : null}
            {filters.searchQuery?.trim() ? (
              <span className="rounded-full bg-zinc-950 px-3 py-2 text-sm font-medium text-white">
                검색어: {filters.searchQuery}
              </span>
            ) : null}
            <span className="rounded-full border border-zinc-200 px-3 py-2 text-sm text-zinc-500">
              총 {data.pagination.totalCount}개
            </span>
          </div>
        </section>

        <section className="grid gap-4 rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(25,20,15,0.06)]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Storage
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">첨부파일 저장소</h2>
            <p className="text-sm leading-7 text-zinc-500">
              현재 저장소는 <strong>{getStorageProviderLabel()}</strong>입니다.
            </p>
          </div>

          <div className="grid gap-3 rounded-[1.4rem] border border-zinc-200 bg-zinc-50/80 p-4 text-sm text-zinc-600">
            <p>로컬 첨부파일 {data.stats.localAttachments}개</p>
            <p>Supabase 첨부파일 {data.stats.supabaseAttachments}개</p>
          </div>

          {data.stats.localAttachments > 0 ? (
            <form action={migrateLocalAttachmentsToSupabaseAction}>
              <button
                type="submit"
                className="w-full rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
              >
                로컬 첨부파일을 Supabase로 이전
              </button>
            </form>
          ) : (
            <div className="rounded-[1.4rem] border border-dashed border-zinc-300 bg-white/60 p-4 text-sm text-zinc-500">
              현재 이전할 로컬 첨부파일이 없습니다.
            </div>
          )}
        </section>
      </section>

      <section className="grid gap-4">
        {data.posts.length > 0 ? (
          <>
            {data.posts.map((post) => (
              <article
                key={post.id}
                className="grid gap-4 rounded-[1.5rem] border border-black/5 bg-white/85 p-5 shadow-[0_14px_40px_rgba(73,41,17,0.05)] lg:grid-cols-[1fr_auto]"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 font-medium text-zinc-800">
                      {getPostTypeLabel(post.type)}
                    </span>
                    <span className="rounded-full bg-orange-100 px-3 py-1 font-medium text-orange-950">
                      {getPostStatusLabel(post.status)}
                    </span>
                    {post.isPinned ? (
                      <span className="rounded-full bg-zinc-950 px-3 py-1 font-medium text-white">
                        고정글
                      </span>
                    ) : null}
                    <span>업데이트 {formatDate(post.updatedAt)}</span>
                    <span>조회 {formatViewCount(post.viewCount)}</span>
                    <span>첨부 {post.attachmentCount}</span>
                  </div>

                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
                      {post.title}
                    </h2>
                    <p className="mt-2 leading-7 text-zinc-600">{post.excerpt}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {post.category ? (
                      <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700">
                        {post.category.name}
                      </span>
                    ) : (
                      <span className="rounded-full border border-dashed border-zinc-200 px-3 py-1 text-sm text-zinc-400">
                        카테고리 없음
                      </span>
                    )}
                    {post.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-500"
                      >
                        #{tag.name}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-zinc-500">
                    slug: <code>{post.slug}</code>
                  </p>
                </div>

                <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                  <Link
                    href={`/admin/posts/${post.id}/preview`}
                    className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
                  >
                    미리보기
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
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
                  >
                    수정
                  </Link>
                  <form action={deletePostAction}>
                    <input type="hidden" name="id" value={post.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                    >
                      삭제
                    </button>
                  </form>
                </div>
              </article>
            ))}

            <AdminPaginationNav
              pagination={data.pagination}
              filters={{
                searchQuery: filters.searchQuery,
                status: filters.status,
                type: filters.type,
              }}
            />
          </>
        ) : (
          <article className="rounded-[1.6rem] border border-dashed border-zinc-300 bg-white/60 p-8 text-zinc-600">
            {hasActiveFilters ? (
              <>선택한 조건에 맞는 게시글이 없습니다. 검색어와 필터를 조정해 보세요.</>
            ) : (
              <>아직 작성한 게시글이 없습니다. 첫 글을 만들어 운영 흐름을 시작해 보세요.</>
            )}
          </article>
        )}
      </section>
    </main>
  );
}
