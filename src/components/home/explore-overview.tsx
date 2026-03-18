import Link from "next/link";
import { PostType } from "@prisma/client";
import type { CollectionExploreData } from "@/lib/content";
import { getCollectionHref, getPostTypeLabel } from "@/lib/format";

type ExploreOverviewProps = {
  blog: CollectionExploreData;
  board: CollectionExploreData;
};

function ExploreCard({
  type,
  data,
}: {
  type: PostType;
  data: CollectionExploreData;
}) {
  const accent =
    type === PostType.BLOG
      ? {
          label: "text-orange-700",
          surface: "border-orange-100 bg-orange-50/80",
          chip: "bg-orange-100 text-orange-950",
          link: "text-orange-700 hover:text-orange-900",
        }
      : {
          label: "text-sky-700",
          surface: "border-sky-100 bg-sky-50/80",
          chip: "bg-sky-100 text-sky-950",
          link: "text-sky-700 hover:text-sky-900",
        };

  return (
    <article className={`rounded-[1.8rem] border p-6 ${accent.surface}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.28em] ${accent.label}`}>
            {getPostTypeLabel(type)} Navigation
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-950">
            {type === PostType.BLOG ? "학습 기록 따라가기" : "운영 메모 한눈에 보기"}
          </h3>
        </div>
        <Link href={getCollectionHref(type)} className={`text-sm font-semibold ${accent.link}`}>
          전체 보기
        </Link>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">
          Categories
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.categories.slice(0, 4).map((category) => (
            <Link
              key={category.id}
              href={getCollectionHref(type, { categorySlug: category.slug })}
              className="rounded-full border border-white/80 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-950"
            >
              {category.name} <span className="text-zinc-400">({category.postCount})</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Tags</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {data.tags.slice(0, 6).map((tag) => (
            <Link
              key={tag.id}
              href={getCollectionHref(type, { tagSlug: tag.slug })}
              className={`rounded-full px-3 py-2 text-sm font-medium ${accent.chip}`}
            >
              #{tag.name}
            </Link>
          ))}
          {data.tags.length === 0 ? (
            <span className="text-sm leading-7 text-zinc-500">
              아직 태그가 없어 첫 태그 구성을 기다리고 있습니다.
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function ExploreOverview({ blog, board }: ExploreOverviewProps) {
  return (
    <section className="rounded-[2rem] border border-black/5 bg-white/88 p-7 shadow-[0_24px_80px_rgba(25,20,15,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
            Explore Collections
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
            카테고리와 태그로 바로 탐색하기
          </h2>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ExploreCard type={PostType.BLOG} data={blog} />
        <ExploreCard type={PostType.BOARD} data={board} />
      </div>
    </section>
  );
}
