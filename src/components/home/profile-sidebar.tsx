import Link from "next/link";
import { portfolioProfile, portfolioToc } from "@/lib/portfolio";

type ProfileSidebarProps = {
  publishedCount: number;
  blogCount: number;
  boardCount: number;
};

export function ProfileSidebar({
  publishedCount,
  blogCount,
  boardCount,
}: ProfileSidebarProps) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      <section className="rounded-[2rem] border border-black/5 bg-white/88 p-7 shadow-[0_24px_80px_rgba(25,20,15,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
          Portfolio Blog
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">
          {portfolioProfile.brand}
        </h1>
        <p className="mt-3 text-lg leading-8 text-zinc-700">{portfolioProfile.role}</p>
        <div className="mt-5 space-y-3 text-[0.98rem] leading-7 text-zinc-600">
          {portfolioProfile.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-zinc-950 px-4 py-3 text-sm leading-6 text-zinc-100">
          {portfolioProfile.englishIntro}
        </p>
      </section>

      <section className="rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(25,20,15,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Contents</p>
        <nav className="mt-4 grid gap-2">
          {portfolioToc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-950"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </section>

      <section className="rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(25,20,15,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Current Snapshot</p>
        <div className="mt-4 grid gap-3">
          {[
            { label: "발행 글", value: publishedCount },
            { label: "블로그", value: blogCount },
            { label: "게시판", value: boardCount },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-4"
            >
              <p className="text-sm text-zinc-500">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(25,20,15,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Links</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {portfolioProfile.contactLinks.map((link) =>
            link.href.startsWith("http") ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
              >
                {link.label}
              </Link>
            ),
          )}
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(25,20,15,0.06)]">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">Stack</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {portfolioProfile.quickFacts.map((fact) => (
            <span
              key={fact}
              className="rounded-full bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700"
            >
              {fact}
            </span>
          ))}
        </div>
      </section>
    </aside>
  );
}
