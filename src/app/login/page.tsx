import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { NoticeBanner } from "@/components/notice-banner";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function mapAuthError(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "CredentialsSignin") {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }

  return "로그인 과정에서 문제가 발생했습니다.";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = readSearchParam(resolvedSearchParams.callbackUrl) ?? "/admin";
  const errorMessage = mapAuthError(readSearchParam(resolvedSearchParams.error));
  const session = await auth();

  if (session?.user.role === UserRole.ADMIN) {
    redirect(callbackUrl);
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 lg:px-10">
      <section className="grid gap-6 rounded-[2rem] border border-black/5 bg-white/85 p-8 shadow-[0_20px_70px_rgba(73,41,17,0.08)] md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-700">
            Admin Sign In
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 md:text-5xl">
            관리자 로그인
          </h1>
          <p className="text-lg leading-8 text-zinc-600">
            이제 `/admin`은 로그인한 관리자만 접근할 수 있습니다. 로컬 계정은 `.env`의
            `LOCAL_ADMIN_EMAIL`, `LOCAL_ADMIN_PASSWORD` 값을 사용합니다.
          </p>
          <div className="rounded-[1.4rem] border border-dashed border-orange-200 bg-orange-50 px-4 py-4 text-sm leading-7 text-zinc-700">
            현재 기본 이메일은 <code>admin@cloudboard.local</code> 입니다. 비밀번호는
            필요하면 <code>.env</code>의 <code>LOCAL_ADMIN_PASSWORD</code>에서 바꿀 수
            있습니다.
          </div>
        </div>

        <div className="grid gap-4">
          {errorMessage ? <NoticeBanner tone="error">{errorMessage}</NoticeBanner> : null}
          <SignInForm callbackUrl={callbackUrl} />
        </div>
      </section>
    </main>
  );
}
