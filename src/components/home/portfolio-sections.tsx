import { portfolioSections } from "@/lib/portfolio";

export function PortfolioSections() {
  return (
    <div className="space-y-8">
      {portfolioSections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="rounded-[2rem] border border-black/5 bg-white/88 p-7 shadow-[0_24px_80px_rgba(25,20,15,0.08)] scroll-mt-28"
        >
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">
              {section.title}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950">
              {section.titleKo}
            </h2>
          </div>

          <div className="mt-6 grid gap-4">
            {section.items.map((item) => (
              <article
                key={`${section.id}-${item.heading}`}
                className="rounded-[1.6rem] border border-zinc-100 bg-zinc-50/90 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold tracking-tight text-zinc-950">
                    {item.heading}
                  </h3>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-medium text-zinc-500">
                    {item.period}
                  </span>
                </div>
                <p className="mt-3 text-[1rem] leading-8 text-zinc-600">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-600"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
