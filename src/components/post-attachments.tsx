import Image from "next/image";
import type { AttachmentSummary } from "@/lib/content";
import { formatDate, formatFileSize } from "@/lib/format";

type PostAttachmentsProps = {
  attachments: AttachmentSummary[];
};

export function PostAttachments({ attachments }: PostAttachmentsProps) {
  if (attachments.length === 0) {
    return null;
  }

  const imageAttachments = attachments.filter(
    (attachment) => attachment.kind === "IMAGE" && attachment.publicUrl,
  );

  return (
    <section className="mt-10 space-y-6 border-t border-zinc-200 pt-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">첨부파일</h2>
        <p className="text-sm leading-7 text-zinc-500">
          글과 함께 업로드한 이미지와 파일을 이 영역에서 바로 확인할 수 있습니다.
        </p>
      </div>

      {imageAttachments.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {imageAttachments.map((attachment) => (
            <figure
              key={attachment.id}
              className="overflow-hidden rounded-[1.4rem] border border-zinc-200 bg-zinc-50"
            >
              <Image
                src={attachment.publicUrl ?? ""}
                alt={attachment.originalName ?? attachment.fileName}
                width={1200}
                height={800}
                className="h-64 w-full object-cover"
                unoptimized
              />
              <figcaption className="grid gap-1 px-4 py-3 text-sm text-zinc-600">
                <span className="font-medium text-zinc-900">
                  {attachment.originalName ?? attachment.fileName}
                </span>
                <span>
                  {formatFileSize(attachment.fileSize)} · {formatDate(attachment.createdAt)}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3">
        {attachments.map((attachment) => (
          <article
            key={attachment.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[1.2rem] border border-zinc-200 bg-white/80 px-4 py-3"
          >
            <div className="space-y-1">
              <p className="font-medium text-zinc-900">
                {attachment.originalName ?? attachment.fileName}
              </p>
              <p className="text-sm text-zinc-500">
                {attachment.kind === "IMAGE" ? "이미지" : "파일"} ·{" "}
                {formatFileSize(attachment.fileSize)} · {formatDate(attachment.createdAt)}
              </p>
            </div>

            {attachment.publicUrl ? (
              <a
                href={attachment.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:text-zinc-950"
              >
                열기
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
