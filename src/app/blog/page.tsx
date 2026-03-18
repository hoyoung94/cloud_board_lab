import Link from "next/link";
import { PostType } from "@prisma/client";
import { CollectionExplorer } from "@/components/content/collection-explorer";
import { PaginationNav } from "@/components/content/pagination-nav";
import { NoticeBanner } from "@/components/notice-banner";
import { PostCard } from "@/components/post-card";
import { getCollectionExploreData, getDatabaseSetupState, listPublishedPosts } from "@/lib/content";
import { getCollectionHref, readPositivePageParam, readSearchParam } from "@/lib/format";

export const dynamic = "force-dynamic";

type BlogPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const setupState = getDatabaseSetupState();
  const resolvedSearchParams = await searchParams;
  const filters = {
    categorySlug: readSearchParam(resolvedSearchParams.category),
    tagSlug: readSearchParam(resolvedSearchParams.tag),
    searchQuery: readSearchParam(resolvedSearchParams.q),
    page: readPositivePageParam(resolvedSearchParams.page),
  };

  const [{ data: paginatedPosts, error }, { data: explore, error: exploreError }] =
    await Promise.all([
      listPublishedPosts(PostType.BLOG, filters),
      getCollectionExploreData(PostType.BLOG, filters),
    ]);

  const { items: posts, pagination } = paginatedPosts;
  const hasActiveFilters = Boolean(
    explore.activeCategory || explore.activeTag || filters.searchQuery?.trim(),
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10">
      <section className="rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-[0_20px_70px_rgba(73,41,17,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">Blog</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
          학습 과정과 시행착오를 기록하는 블로그
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
          로컬 PostgreSQL 연결, Prisma 마이그레이션, CRUD 구현, 서버 배포 실습까지 이어지는
          기록을 카테고리와 태그, 검색 기준으로 탐색할 수 있도록 정리했습니다.
        </p>
      </section>

      {!setupState.configured ? <NoticeBanner>{setupState.message}</NoticeBanner> : null}
      {error ? <NoticeBanner tone="error">{error}</NoticeBanner> : null}
      {exploreError ? <NoticeBanner tone="error">{exploreError}</NoticeBanner> : null}

      <section className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <CollectionExplorer
          type={PostType.BLOG}
          title="학습 흐름 따라가기"
          description="카테고리와 인기 태그를 기준으로 지금 필요한 학습 기록만 빠르게 좁혀볼 수 있습니다."
          totalCount={pagination.totalCount}
          activeSearchQuery={filters.searchQuery}
          categories={explore.categories}
          tags={explore.tags}
          activeCategory={explore.activeCategory}
          activeTag={explore.activeTag}
        />

        <div className="space-y-5">
          <section className="rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(25,20,15,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                  Filtered Result
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                  {hasActiveFilters ? "선택한 주제의 글만 모아보기" : "전체 블로그 글"}
                </h2>
              </div>
              {hasActiveFilters ? (
                <Link
                  href={getCollectionHref(PostType.BLOG)}
                  className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
                >
                  필터 초기화
                </Link>
              ) : null}
            </div>

            <form action="/blog" className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
              {explore.activeCategory ? (
                <input type="hidden" name="category" value={explore.activeCategory.slug} />
              ) : null}
              {explore.activeTag ? (
                <input type="hidden" name="tag" value={explore.activeTag.slug} />
              ) : null}
              <input
                type="search"
                name="q"
                defaultValue={filters.searchQuery ?? ""}
                placeholder="제목, 본문, 태그를 검색해 보세요."
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
              />
              <button
                type="submit"
                className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
              >
                검색
              </button>
              <Link
                href={getCollectionHref(PostType.BLOG, {
                  categorySlug: explore.activeCategory?.slug,
                  tagSlug: explore.activeTag?.slug,
                })}
                className="rounded-full border border-zinc-200 px-5 py-3 text-center text-sm font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
              >
                검색어 지우기
              </Link>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {explore.activeCategory ? (
                <span className="rounded-full bg-orange-100 px-3 py-2 text-sm font-medium text-orange-950">
                  카테고리: {explore.activeCategory.name}
                </span>
              ) : null}
              {explore.activeTag ? (
                <span className="rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700">
                  태그: #{explore.activeTag.name}
                </span>
              ) : null}
              {filters.searchQuery?.trim() ? (
                <span className="rounded-full bg-zinc-950 px-3 py-2 text-sm font-medium text-white">
                  검색어: {filters.searchQuery}
                </span>
              ) : null}
              <span className="rounded-full border border-zinc-200 px-3 py-2 text-sm text-zinc-500">
                총 {pagination.totalCount}개
              </span>
            </div>
          </section>

          {posts.length > 0 ? (
            <>
              <section className="grid gap-5">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </section>
              <PaginationNav
                type={PostType.BLOG}
                pagination={pagination}
                filters={{
                  categorySlug: filters.categorySlug,
                  tagSlug: filters.tagSlug,
                  searchQuery: filters.searchQuery,
                }}
              />
            </>
          ) : (
            <section className="rounded-[1.8rem] border border-dashed border-zinc-300 bg-white/60 p-8 text-zinc-600">
              {hasActiveFilters ? (
                <>
                  선택한 조건에 맞는 글이 아직 없습니다. 필터를 조정하거나 관리자 화면에서 같은
                  카테고리와 태그의 글을 발행해 보세요.
                </>
              ) : (
                <>
                  아직 발행된 블로그 글이 없습니다. 관리자 화면에서 글을 만들고 상태를
                  `발행`으로 바꿔 보세요.
                </>
              )}
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
