"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";

type SignInFormProps = {
  callbackUrl: string;
};

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (!result || result.error) {
        setError("이메일 또는 비밀번호를 다시 확인해 주세요.");
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-5 rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(73,41,17,0.06)]"
    >
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm font-semibold text-zinc-800">
          관리자 이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
          placeholder="admin@cloudboard.local"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm font-semibold text-zinc-800">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
          placeholder=".env의 LOCAL_ADMIN_PASSWORD 값"
        />
      </div>

      {error ? (
        <p className="rounded-[1.2rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {isPending ? "로그인 중..." : "관리자 로그인"}
      </button>
    </form>
  );
}
