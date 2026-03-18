import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-16 text-center lg:px-10">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">404</p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
        요청한 페이지를 찾지 못했습니다
      </h1>
      <p className="text-lg leading-8 text-zinc-600">
        아직 발행되지 않은 글이거나, 슬러그가 바뀌었을 수 있습니다.
      </p>
      <div className="flex justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
        >
          홈으로 이동
        </Link>
        <Link
          href="/admin"
          className="rounded-full border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
        >
          관리자 화면
        </Link>
      </div>
    </main>
  );
}
