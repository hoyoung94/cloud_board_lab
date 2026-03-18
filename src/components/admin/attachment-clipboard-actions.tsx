"use client";

import { useState, useTransition } from "react";

type AttachmentClipboardActionsProps = {
  label: string;
  publicUrl: string;
  markdownSnippet: string;
};

export function AttachmentClipboardActions({
  label,
  publicUrl,
  markdownSnippet,
}: AttachmentClipboardActionsProps) {
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function copyText(text: string, nextLabel: string) {
    await navigator.clipboard.writeText(text);
    setCopiedLabel(nextLabel);
    window.setTimeout(() => {
      setCopiedLabel((current) => (current === nextLabel ? null : current));
    }, 1800);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await copyText(publicUrl, "URL 복사됨");
          })
        }
        className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
      >
        URL 복사
      </button>
      <button
        type="button"
        onClick={() =>
          startTransition(async () => {
            await copyText(markdownSnippet, "Markdown 복사됨");
          })
        }
        className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
      >
        본문용 Markdown 복사
      </button>
      <span className="text-xs text-zinc-400">
        {isPending ? `${label} 복사 중...` : copiedLabel ?? "본문에 바로 붙여 넣을 수 있습니다."}
      </span>
    </div>
  );
}
