import { ReactNode } from "react";

type NoticeBannerProps = {
  tone?: "info" | "success" | "error";
  children: ReactNode;
};

const toneClasses = {
  info: "border-amber-200 bg-amber-50 text-amber-950",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-rose-200 bg-rose-50 text-rose-950",
};

export function NoticeBanner({
  tone = "info",
  children,
}: NoticeBannerProps) {
  return (
    <div className={`rounded-[1.4rem] border px-5 py-4 text-sm leading-7 ${toneClasses[tone]}`}>
      {children}
    </div>
  );
}
