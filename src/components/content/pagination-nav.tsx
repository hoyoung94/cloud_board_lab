import Link from "next/link";
import { PostType } from "@prisma/client";
import type { PaginationInfo } from "@/lib/content";
import { getCollectionHref } from "@/lib/format";

type PaginationNavProps = {
  type: PostType;
  pagination: PaginationInfo;
  filters?: {
    categorySlug?: string;
    tagSlug?: string;
    searchQuery?: string;
  };
};

function getVisiblePages(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  if (currentPage <= 2) {
    pages.add(2);
    pages.add(3);
  }

  if (currentPage >= totalPages - 1) {
    pages.add(totalPages - 1);
    pages.add(totalPages - 2);
  }

  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((left, right) => left - right);
}

export function PaginationNav({ type, pagination, filters }: PaginationNavProps) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(pagination.currentPage, pagination.totalPages);

  return (
    <nav
      aria-label="페이지 이동"
      className="rounded-[1.8rem] border border-black/5 bg-white/85 p-5 shadow-[0_18px_60px_rgba(25,20,15,0.06)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-zinc-500">
          총 {pagination.totalCount}개 중 {pagination.currentPage} / {pagination.totalPages} 페이지
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={getCollectionHref(type, {
              ...filters,
              page: pagination.currentPage - 1,
            })}
            aria-disabled={!pagination.hasPreviousPage}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              pagination.hasPreviousPage
                ? "border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
                : "pointer-events-none border-zinc-100 text-zinc-300"
            }`}
          >
            이전
          </Link>

          {visiblePages.map((page, index) => {
            const previousPage = visiblePages[index - 1];
            const needsGap = previousPage && page - previousPage > 1;

            return (
              <span key={page} className="contents">
                {needsGap ? (
                  <span className="px-1 text-sm text-zinc-400" aria-hidden="true">
                    ...
                  </span>
                ) : null}
                <Link
                  href={getCollectionHref(type, {
                    ...filters,
                    page,
                  })}
                  aria-current={page === pagination.currentPage ? "page" : undefined}
                  className={`rounded-full px-4 py-2 text-sm font-medium ${
                    page === pagination.currentPage
                      ? "bg-zinc-950 text-white"
                      : "border border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
                  }`}
                >
                  {page}
                </Link>
              </span>
            );
          })}

          <Link
            href={getCollectionHref(type, {
              ...filters,
              page: pagination.currentPage + 1,
            })}
            aria-disabled={!pagination.hasNextPage}
            className={`rounded-full border px-4 py-2 text-sm font-medium ${
              pagination.hasNextPage
                ? "border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
                : "pointer-events-none border-zinc-100 text-zinc-300"
            }`}
          >
            다음
          </Link>
        </div>
      </div>
    </nav>
  );
}
