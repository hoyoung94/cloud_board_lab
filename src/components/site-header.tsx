import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { auth } from "@/lib/auth";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/blog", label: "블로그" },
  { href: "/board", label: "게시판" },
  { href: "/admin", label: "관리자" },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-white/78 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-10">
        <div>
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-950">
            Cloud Board Lab
          </Link>
          <p className="text-sm text-zinc-500">포트폴리오형 홈과 CRUD 블로그를 함께 운영하는 실습 프로젝트</p>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-transparent px-4 py-2 text-sm font-medium text-zinc-600 hover:border-zinc-200 hover:bg-white hover:text-zinc-950"
            >
              {item.label}
            </Link>
          ))}
          {session?.user ? (
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-2">
              <span className="px-2 text-sm font-medium text-zinc-600">
                {session.user.name ?? "관리자"}
              </span>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
