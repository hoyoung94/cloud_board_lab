"use client";

import { useState } from "react";
import { PostStatus, PostType } from "@prisma/client";
import { MarkdownRenderer } from "@/components/content/markdown-renderer";
import type { CategoryOption } from "@/lib/content";
import { getPostTypeLabel } from "@/lib/format";

const postTypeOptions = [
  { value: PostType.BLOG, label: "블로그" },
  { value: PostType.BOARD, label: "게시판" },
];

const postStatusOptions = [
  { value: PostStatus.DRAFT, label: "초안" },
  { value: PostStatus.PUBLISHED, label: "발행" },
  { value: PostStatus.ARCHIVED, label: "보관" },
];

export type PostFormValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  type: PostType;
  status: PostStatus;
  isPinned: boolean;
  categoryId: string;
  tags: string;
};

type PostFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  post: PostFormValues;
  categories: CategoryOption[];
};

function getDefaultCategoryId(categories: CategoryOption[], type: PostType) {
  return (
    categories.find((category) => category.type === type && category.isDefault)?.id ??
    categories.find((category) => category.type === type)?.id ??
    ""
  );
}

export function PostForm({ action, submitLabel, post, categories }: PostFormProps) {
  const [selectedType, setSelectedType] = useState(post.type);
  const [selectedCategoryId, setSelectedCategoryId] = useState(post.categoryId);
  const [titlePreview, setTitlePreview] = useState(post.title);
  const [excerptPreview, setExcerptPreview] = useState(post.excerpt);
  const [contentPreview, setContentPreview] = useState(post.content);
  const [isPinned, setIsPinned] = useState(post.isPinned);

  const visibleCategories = categories.filter((category) => category.type === selectedType);

  function handleTypeChange(nextType: PostType) {
    setSelectedType(nextType);

    const isCurrentCategoryValid = categories.some(
      (category) => category.id === selectedCategoryId && category.type === nextType,
    );

    if (!isCurrentCategoryValid) {
      setSelectedCategoryId(getDefaultCategoryId(categories, nextType));
    }
  }

  return (
    <form
      action={action}
      className="grid gap-6 rounded-[1.8rem] border border-black/5 bg-white/85 p-6 shadow-[0_18px_60px_rgba(73,41,17,0.06)]"
    >
      {post.id ? <input type="hidden" name="id" value={post.id} /> : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="title" className="text-sm font-semibold text-zinc-800">
            제목
          </label>
          <input
            id="title"
            name="title"
            value={titlePreview}
            onChange={(event) => setTitlePreview(event.target.value)}
            required
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
            placeholder="예: Ubuntu에서 PostgreSQL 연결하고 첫 CRUD 글 작성하기"
          />
        </div>

        <div className="grid gap-2">
          <label htmlFor="slug" className="text-sm font-semibold text-zinc-800">
            슬러그
          </label>
          <input
            id="slug"
            name="slug"
            defaultValue={post.slug}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
            placeholder="비워 두면 제목 기준으로 자동 생성됩니다."
          />
          <p className="text-sm text-zinc-500">한글과 영문 슬러그를 모두 사용할 수 있습니다.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="grid gap-2">
          <label htmlFor="type" className="text-sm font-semibold text-zinc-800">
            글 유형
          </label>
          <select
            id="type"
            name="type"
            value={selectedType}
            onChange={(event) => handleTypeChange(event.target.value as PostType)}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
          >
            {postTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="status" className="text-sm font-semibold text-zinc-800">
            상태
          </label>
          <select
            id="status"
            name="status"
            defaultValue={post.status}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
          >
            {postStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <label htmlFor="categoryId" className="text-sm font-semibold text-zinc-800">
            카테고리
          </label>
          <select
            id="categoryId"
            name="categoryId"
            value={selectedCategoryId}
            onChange={(event) => setSelectedCategoryId(event.target.value)}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
          >
            <option value="">카테고리 없음</option>
            {visibleCategories.map((category) => (
              <option key={category.id} value={category.id}>
                [{getPostTypeLabel(category.type)}] {category.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-zinc-500">
            현재 글 유형과 맞는 카테고리만 보여 줍니다.
          </p>
        </div>

        <label className="flex items-center gap-3 rounded-[1.3rem] border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm font-medium text-zinc-700">
          <input
            type="checkbox"
            name="isPinned"
            checked={isPinned}
            onChange={(event) => setIsPinned(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-400"
          />
          목록 상단에 고정
        </label>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <label htmlFor="tags" className="text-sm font-semibold text-zinc-800">
            태그
          </label>
          <input
            id="tags"
            name="tags"
            defaultValue={post.tags}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
            placeholder="nextjs, prisma, postgresql"
          />
          <p className="text-sm text-zinc-500">
            쉼표로 구분해서 최대 8개까지 입력할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-2">
          <label htmlFor="excerpt" className="text-sm font-semibold text-zinc-800">
            요약
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            value={excerptPreview}
            onChange={(event) => setExcerptPreview(event.target.value)}
            rows={3}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
            placeholder="목록 화면에서 먼저 보일 짧은 소개를 작성합니다."
          />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="grid gap-3">
          <label htmlFor="content" className="text-sm font-semibold text-zinc-800">
            본문
          </label>
          <textarea
            id="content"
            name="content"
            value={contentPreview}
            onChange={(event) => setContentPreview(event.target.value)}
            required
            rows={20}
            className="min-h-[28rem] rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none transition focus:border-orange-400"
            placeholder={"# 제목\n\n- 전달 사항\n- 학습 내용\n\n```bash\nnpm run dev\n```"}
          />
          <div className="rounded-[1.3rem] border border-dashed border-orange-200 bg-orange-50/80 px-4 py-3 text-sm leading-7 text-zinc-700">
            Markdown을 지원합니다. `# 제목`, `## 소제목`, `- 목록`, `**강조**`, 코드 블록, 체크리스트를
            그대로 사용할 수 있습니다. 저장 후 첨부파일을 업로드하면 URL과 Markdown 문법을 바로 복사할 수
            있습니다.
          </div>
        </div>

        <section className="grid gap-4 rounded-[1.6rem] border border-black/5 bg-zinc-50/90 p-5">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
              Live Preview
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950">
              {titlePreview.trim() || "미리보기 제목"}
            </h2>
            <p className="text-sm leading-7 text-zinc-500">
              {excerptPreview.trim() || "요약을 입력하면 이 영역에 함께 표시됩니다."}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700">
                {getPostTypeLabel(selectedType)}
              </span>
              {isPinned ? (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-950">
                  고정글
                </span>
              ) : null}
            </div>
          </div>

          <MarkdownRenderer
            content={contentPreview}
            emptyMessage="본문을 입력하면 이 영역에 Markdown 렌더링 결과가 바로 보입니다."
          />
        </section>
      </div>

      <button
        type="submit"
        className="inline-flex w-fit items-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"
      >
        {submitLabel}
      </button>
    </form>
  );
}
