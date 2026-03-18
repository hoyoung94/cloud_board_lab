import Link from "next/link";
import { PostType } from "@prisma/client";
import type { CategoryExploreItem, TagExploreItem } from "@/lib/content";
import { getCollectionHref, getPostTypeLabel } from "@/lib/format";

type CollectionExplorerProps = {
  type: PostType;
  title: string;
  description: string;
  totalCount: number;
  activeSearchQuery?: string | null;
  categories: CategoryExploreItem[];
  tags: TagExploreItem[];
  activeCategory: CategoryExploreItem | null;
  activeTag: TagExploreItem | null;
};

function getAccentClasses(type: PostType) {
  if (type === PostType.BLOG) {
    return {
      label: "text-orange-700",
      soft: "border-orange-200 bg-orange-50 text-orange-950",
      active: "border-orange-300 bg-orange-100 text-orange-950",
      hover: "hover:border-orange-300 hover:bg-orange-50 hover:text-orange-950",
      subtle: "bg-orange-100 text-orange-950",
      link: "text-orange-700 hover:text-orange-900",
    };
  }

  return {
    label: "text-sky-700",
    soft: "border-sky-200 bg-sky-50 text-sky-950",
    active: "border-sky-300 bg-sky-100 text-sky-950",
    hover: "hover:border-sky-300 hover:bg-sky-50 hover:text-sky-950",
    subtle: "bg-sky-100 text-sky-950",
    link: "text-sky-700 hover:text-sky-900",
  };
}

export function CollectionExplorer({
  type,
  title,
  description,
  totalCount,
  activeSearchQuery,
  categories,
  tags,
  activeCategory,
  activeTag,
}: CollectionExplorerProps) {
  const accent = getAccentClasses(type);
  const hasActiveFilters = Boolean(activeCategory || activeTag);

  return (
    <aside className="space-y-5 lg:sticky lg:top-24">
      <section className="rounded-[1.8rem] border border-black/5 bg-white/88 p-6 shadow-[0_18px_60px_rgba(25,20,15,0.06)]">
        <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${accent.label}`}>
          {getPostTypeLabel(type)} Explorer
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">{title}</h2>
        <p className="mt-3 text-[0.98rem] leading-7 text-zinc-600">{description}</p>

        <div className="mt-5 flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${accent.subtle}`}>
            결과 {totalCount}개
          </span>
          <Link
            href={getCollectionHref(type, { searchQuery: activeSearchQuery })}
            className={`text-sm font-semibold ${accent.link}`}
          >
            전체 보기
          </Link>
        </div>
      </section>

      {hasActiveFilters ? (
        <section className={`rounded-[1.8rem] border p-6 ${accent.soft}`}>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em]">활성 필터</p>
            <Link
              href={getCollectionHref(type)}
              className="text-sm font-semibold underline underline-offset-4"
            >
              초기화
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            {activeCategory ? (
              <span className="rounded-full bg-white/80 px-3 py-2 font-medium">
                카테고리: {activeCategory.name}
              </span>
            ) : null}
            {activeTag ? (
              <span className="rounded-full bg-white/80 px-3 py-2 font-medium">
                태그: #{activeTag.name}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(25,20,15,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Categories
          </p>
          <span className="text-sm text-zinc-400">{categories.length}</span>
        </div>

        <div className="mt-4 grid gap-2">
          <Link
            href={getCollectionHref(type, {
              tagSlug: activeTag?.slug,
              searchQuery: activeSearchQuery,
            })}
            className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
              !activeCategory
                ? accent.active
                : `border-zinc-200 text-zinc-700 ${accent.hover}`
            }`}
          >
            <span>전체 카테고리</span>
            <span>{totalCount}</span>
          </Link>

          {categories.map((category) => {
            const isActive = activeCategory?.slug === category.slug;

            return (
              <Link
                key={category.id}
                href={getCollectionHref(type, {
                  categorySlug: category.slug,
                  tagSlug: activeTag?.slug,
                  searchQuery: activeSearchQuery,
                })}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? accent.active
                    : `border-zinc-200 text-zinc-700 ${accent.hover}`
                }`}
              >
                <span className="pr-3">{category.name}</span>
                <span className="text-xs text-zinc-500">{category.postCount}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(25,20,15,0.06)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
            Popular Tags
          </p>
          <span className="text-sm text-zinc-400">{tags.length}</span>
        </div>

        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag) => {
              const isActive = activeTag?.slug === tag.slug;

              return (
                <Link
                  key={tag.id}
                  href={getCollectionHref(type, {
                    categorySlug: activeCategory?.slug,
                    tagSlug: tag.slug,
                    searchQuery: activeSearchQuery,
                  })}
                  className={`rounded-full border px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? accent.active
                      : `border-zinc-200 text-zinc-700 ${accent.hover}`
                  }`}
                >
                  #{tag.name} <span className="text-zinc-400">({tag.postCount})</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-zinc-500">
            아직 태그가 없어 카테고리 중심으로 콘텐츠를 탐색할 수 있습니다.
          </p>
        )}
      </section>
    </aside>
  );
}
