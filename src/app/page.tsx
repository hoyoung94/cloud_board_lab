import Link from "next/link";
import { ExploreOverview } from "@/components/home/explore-overview";
import { ProfileSidebar } from "@/components/home/profile-sidebar";
import { PortfolioSections } from "@/components/home/portfolio-sections";
import { NoticeBanner } from "@/components/notice-banner";
import { PostCard } from "@/components/post-card";
import { getDatabaseSetupState, getHomeExploreData, getHomeSnapshot } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const setupState = getDatabaseSetupState();
  const [snapshot, explore] = await Promise.all([getHomeSnapshot(), getHomeExploreData()]);

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:px-10">
      <ProfileSidebar
        publishedCount={snapshot.counts.publishedCount}
        blogCount={snapshot.counts.blogCount}
        boardCount={snapshot.counts.boardCount}
      />

      <div className="space-y-8">
        {!setupState.configured ? <NoticeBanner>{setupState.message}</NoticeBanner> : null}
        {snapshot.error ? <NoticeBanner tone="error">{snapshot.error}</NoticeBanner> : null}
        {explore.error ? <NoticeBanner tone="error">{explore.error}</NoticeBanner> : null}

        <section className="rounded-[2rem] border border-black/5 bg-[linear-gradient(135deg,#fffaf1_0%,#fff4dc_55%,#f6ecde_100%)] p-8 shadow-[0_28px_90px_rgba(25,20,15,0.1)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-700">
            Introduction
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-950 md:text-6xl">
            포트폴리오형 블로그와 운영 게시판을 한 화면에서 탐색하는 개발 기록 공간
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-zinc-600">
            참고 사이트의 포트폴리오형 구조를 가져오되, 현재 프로젝트의 목표인 CRUD 블로그,
            게시판, 관리자, 첨부파일 흐름이 자연스럽게 이어지도록 재구성하고 있습니다.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/blog"
              className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
            >
              최신 글 보기
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-zinc-200 bg-white/85 px-5 py-3 text-sm font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
            >
              관리자 열기
            </Link>
            <Link
              href="/board"
              className="rounded-full border border-zinc-200 bg-white/85 px-5 py-3 text-sm font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
            >
              게시판 보기
            </Link>
          </div>
        </section>

        <PortfolioSections />
        <ExploreOverview blog={explore.data.blog} board={explore.data.board} />

        <section className="rounded-[2rem] border border-black/5 bg-white/88 p-7 shadow-[0_24px_80px_rgba(25,20,15,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Recent Blog Posts
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                최근 블로그 글
              </h2>
            </div>
            <Link href="/blog" className="text-sm font-semibold text-orange-700 hover:text-orange-900">
              전체 보기
            </Link>
          </div>

          {snapshot.recentBlogPosts.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {snapshot.recentBlogPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.4rem] border border-dashed border-zinc-300 bg-zinc-50/70 p-6 text-zinc-600">
              아직 발행된 블로그 글이 없습니다. 관리자 화면에서 첫 글을 발행하면 이 영역에
              바로 반영됩니다.
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-black/5 bg-white/88 p-7 shadow-[0_24px_80px_rgba(25,20,15,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
                Recent Board Posts
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
                최근 게시판 글
              </h2>
            </div>
            <Link href="/board" className="text-sm font-semibold text-sky-700 hover:text-sky-900">
              전체 보기
            </Link>
          </div>

          {snapshot.recentBoardPosts.length > 0 ? (
            <div className="mt-6 grid gap-4">
              {snapshot.recentBoardPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.4rem] border border-dashed border-zinc-300 bg-zinc-50/70 p-6 text-zinc-600">
              운영 메모나 공지 성격의 글을 게시판으로 발행하면 이 영역에 최근 글이 모입니다.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
