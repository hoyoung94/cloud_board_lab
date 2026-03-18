import Link from "next/link";
import { notFound } from "next/navigation";
import { MarkdownRenderer } from "@/components/content/markdown-renderer";
import { NoticeBanner } from "@/components/notice-banner";
import { PostAttachments } from "@/components/post-attachments";
import { requireAdminSession } from "@/lib/auth";
import { getPreviewPostById } from "@/lib/content";
import { formatDate, formatViewCount, getPostStatusLabel, getPostTypeLabel } from "@/lib/format";

export const dynamic = "force-dynamic";

type PreviewPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { id } = await params;
  await requireAdminSession(`/admin/posts/${id}/preview`);
  const { data: post, error } = await getPreviewPostById(id);

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
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">
            Draft Preview
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
            관리자 미리보기
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/posts/${post.id}/edit`}
            className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
          >
            수정 화면으로 돌아가기
          </Link>
        </div>
      </section>

      <article className="rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-[0_20px_70px_rgba(73,41,17,0.08)]">
        <div className="flex flex-wrap gap-3 text-sm text-zinc-500">
          <span className="rounded-full bg-orange-100 px-3 py-1 font-medium text-orange-950">
            {getPostTypeLabel(post.type)}
          </span>
          <span className="rounded-full bg-zinc-950 px-3 py-1 font-medium text-white">
            {getPostStatusLabel(post.status)}
          </span>
          {post.isPinned ? (
            <span className="rounded-full border border-zinc-200 px-3 py-1 font-medium text-zinc-700">
              고정글
            </span>
          ) : null}
          <span>업데이트 {formatDate(post.updatedAt)}</span>
          <span>조회 {formatViewCount(post.viewCount)}</span>
        </div>

        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
          {post.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-zinc-600">{post.excerpt}</p>

        <div className="mt-8">
          <MarkdownRenderer content={post.content} />
        </div>

        <PostAttachments attachments={post.attachments} />
      </article>
    </main>
  );
}
