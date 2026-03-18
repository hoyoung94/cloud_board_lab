import Image from "next/image";
import { deleteAttachmentAction, uploadAttachmentsAction } from "@/app/admin/actions";
import { AttachmentClipboardActions } from "@/components/admin/attachment-clipboard-actions";
import { NoticeBanner } from "@/components/notice-banner";
import type { AttachmentSummary } from "@/lib/content";
import { formatDate, formatFileSize } from "@/lib/format";
import { getStorageProviderLabel, getStorageSetupState, UPLOAD_LIMITS } from "@/lib/storage";

type AttachmentManagerProps = {
  postId: string;
  attachments: AttachmentSummary[];
};

function getMarkdownSnippet(attachment: AttachmentSummary) {
  if (!attachment.publicUrl) {
    return "";
  }

  const label = attachment.originalName ?? attachment.fileName;

  if (attachment.kind === "IMAGE") {
    return `![${label}](${attachment.publicUrl})`;
  }

  return `[${label}](${attachment.publicUrl})`;
}

export function AttachmentManager({ postId, attachments }: AttachmentManagerProps) {
  const storageState = getStorageSetupState();

  return (
    <section className="grid gap-5 rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(73,41,17,0.06)]">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">첨부파일 관리</h2>
        <p className="text-sm leading-7 text-zinc-500">
          현재 저장소는 <strong>{getStorageProviderLabel()}</strong>입니다. 업로드한 이미지와 파일의
          공개 URL을 복사해서 본문 Markdown에 바로 붙여 넣을 수 있습니다.
        </p>
      </div>

      {!storageState.configured ? <NoticeBanner tone="error">{storageState.message}</NoticeBanner> : null}

      <form
        action={uploadAttachmentsAction}
        className="grid gap-4 rounded-[1.4rem] border border-dashed border-orange-200 bg-orange-50/80 p-5"
      >
        <input type="hidden" name="postId" value={postId} />
        <div className="grid gap-2">
          <label htmlFor="files" className="text-sm font-semibold text-zinc-800">
            파일 업로드
          </label>
          <input
            id="files"
            name="files"
            type="file"
            multiple
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700"
          />
          <p className="text-sm text-zinc-500">
            한 번에 최대 {UPLOAD_LIMITS.maxFilesPerRequest}개, 파일당 최대{" "}
            {(UPLOAD_LIMITS.maxFileSize / (1024 * 1024)).toFixed(0)}MB까지 업로드할 수 있습니다.
          </p>
        </div>
        <button
          type="submit"
          className="inline-flex w-fit items-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
        >
          첨부파일 업로드
        </button>
      </form>

      {attachments.length > 0 ? (
        <div className="grid gap-4">
          {attachments.map((attachment) => (
            <article
              key={attachment.id}
              className="grid gap-4 rounded-[1.4rem] border border-zinc-200 bg-white/70 p-4"
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="space-y-3">
                  {attachment.kind === "IMAGE" && attachment.publicUrl ? (
                    <Image
                      src={attachment.publicUrl}
                      alt={attachment.originalName ?? attachment.fileName}
                      width={1200}
                      height={800}
                      className="max-h-64 rounded-2xl border border-zinc-200 object-cover"
                      unoptimized
                    />
                  ) : null}
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-zinc-900">
                      {attachment.originalName ?? attachment.fileName}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {attachment.kind === "IMAGE" ? "이미지" : "파일"} ·{" "}
                      {formatFileSize(attachment.fileSize)} · {formatDate(attachment.createdAt)}
                    </p>
                    <p className="text-sm text-zinc-500">{attachment.mimeType}</p>
                    <p className="text-xs text-zinc-400">
                      {attachment.storageBucket} / {attachment.storagePath}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-2 md:justify-end">
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
                  <form action={deleteAttachmentAction}>
                    <input type="hidden" name="attachmentId" value={attachment.id} />
                    <button
                      type="submit"
                      className="rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
                    >
                      삭제
                    </button>
                  </form>
                </div>
              </div>

              {attachment.publicUrl ? (
                <AttachmentClipboardActions
                  label={attachment.originalName ?? attachment.fileName}
                  publicUrl={attachment.publicUrl}
                  markdownSnippet={getMarkdownSnippet(attachment)}
                />
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.4rem] border border-dashed border-zinc-300 bg-white/60 p-6 text-zinc-600">
          아직 업로드한 첨부파일이 없습니다. 글을 먼저 저장한 뒤 이미지와 파일을 올려 보세요.
        </div>
      )}
    </section>
  );
}
