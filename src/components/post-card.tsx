import Link from "next/link";
import type { PublicPostSummary } from "@/lib/content";
import {
  formatDate,
  formatViewCount,
  getCollectionHref,
  getPostHref,
  getPostTypeLabel,
} from "@/lib/format";

type PostCardProps = {
  post: PublicPostSummary;
};

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="rounded-[1.6rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(73,41,17,0.06)]">
      <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        <span className="rounded-full bg-orange-100 px-3 py-1 font-medium text-orange-950">
          {getPostTypeLabel(post.type)}
        </span>
        {post.isPinned ? (
          <span className="rounded-full bg-zinc-950 px-3 py-1 font-medium text-white">고정글</span>
        ) : null}
        <span>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
        <span>{post.authorName ?? "관리자"}</span>
      </div>

      <div className="mt-4 space-y-3">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
          <Link
            href={getPostHref(post.type, post.id)}
            prefetch={false}
            className="hover:text-orange-700"
          >
            {post.title}
          </Link>
        </h2>
        <p className="leading-7 text-zinc-600">{post.excerpt}</p>
      </div>

      {post.category || post.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.category ? (
            <Link
              href={getCollectionHref(post.type, { categorySlug: post.category.slug })}
              className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950"
            >
              {post.category.name}
            </Link>
          ) : null}
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={getCollectionHref(post.type, { tagSlug: tag.slug })}
              className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-800"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
        <span>조회 {formatViewCount(post.viewCount)}</span>
        <span>첨부 {post.attachmentCount}</span>
      </div>

      <Link
        href={getPostHref(post.type, post.id)}
        prefetch={false}
        className="mt-6 inline-flex items-center rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
      >
        상세 보기
      </Link>
    </article>
  );
}
