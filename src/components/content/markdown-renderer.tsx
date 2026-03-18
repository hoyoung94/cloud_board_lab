"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownRendererProps = {
  content: string;
  className?: string;
  emptyMessage?: string;
};

function joinClassNames(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function MarkdownRenderer({
  content,
  className,
  emptyMessage = "아직 작성된 내용이 없습니다.",
}: MarkdownRendererProps) {
  const normalized = content.trim();

  if (!normalized) {
    return (
      <div className="rounded-[1.4rem] border border-dashed border-zinc-300 bg-zinc-50/80 px-5 py-6 text-sm leading-7 text-zinc-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={joinClassNames("markdown-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            const isExternal = typeof href === "string" && href.startsWith("http");

            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noreferrer" : undefined}
                {...props}
              >
                {children}
              </a>
            );
          },
          img: ({ alt, src, ...props }) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={alt ?? ""} src={src ?? ""} loading="lazy" {...props} />
          ),
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
