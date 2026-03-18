import Link from "next/link";
import { PostType } from "@prisma/client";
import { notFound } from "next/navigation";
import { MarkdownRenderer } from "@/components/content/markdown-renderer";
import { NoticeBanner } from "@/components/notice-banner";
import { PostAttachments } from "@/components/post-attachments";
import { getPublishedPostBySlug } from "@/lib/content";
import { formatDate, formatViewCount, getCollectionHref } from "@/lib/format";

export const dynamic = "force-dynamic";

type BoardDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function BoardDetailPage({ params }: BoardDetailPageProps) {
  const { slug } = await params;
  const { data: post, error } = await getPublishedPostBySlug(PostType.BOARD, slug);

  if (error) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 lg:px-10">
        <NoticeBanner tone="error">{error}</NoticeBanner>
      </main>
    );
  }

  if (!post) {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10 lg:px-10">
      <article className="rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-[0_20px_70px_rgba(73,41,17,0.08)]">
        <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
          <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-950">
            게시판
          </span>
          {post.isPinned ? (
            <span className="rounded-full bg-zinc-950 px-3 py-1 font-medium text-white">고정글</span>
          ) : null}
          <span>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
          <span>{post.authorName ?? "관리자"}</span>
          <span>조회 {formatViewCount(post.viewCount)}</span>
        </div>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-zinc-600">{post.excerpt}</p>

        {post.category || post.tags.length > 0 ? (
          <div className="mt-6 flex flex-wrap gap-2">
            {post.category ? (
              <Link
                href={getCollectionHref(PostType.BOARD, { categorySlug: post.category.slug })}
                className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950"
              >
                {post.category.name}
              </Link>
            ) : null}
            {post.tags.map((tag) => (
              <Link
                key={tag.id}
                href={getCollectionHref(PostType.BOARD, { tagSlug: tag.slug })}
                className="rounded-full border border-zinc-200 px-3 py-1 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-800"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        ) : null}

        <div className="mt-8">
          <MarkdownRenderer content={post.content} />
        </div>

        <PostAttachments attachments={post.attachments} />
      </article>
    </main>
  );
}
