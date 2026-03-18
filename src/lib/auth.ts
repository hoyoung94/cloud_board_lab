import { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ensureLocalAdminUser } from "@/lib/content";
import { db } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.email("이메일 형식이 올바르지 않습니다."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "관리자 로그인",
      credentials: {
        email: {
          label: "이메일",
          type: "email",
        },
        password: {
          label: "비밀번호",
          type: "password",
        },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        await ensureLocalAdminUser();

        const user = await db.user.findUnique({
          where: {
            email: parsed.data.email,
          },
        });

        if (!user?.passwordHash || user.role !== UserRole.ADMIN) {
          return null;
        }

        const passwordMatches = await compare(parsed.data.password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? "로컬 관리자",
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as UserRole | undefined) ?? UserRole.EDITOR;
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}

export async function requireAdminSession(callbackUrl = "/admin") {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}
