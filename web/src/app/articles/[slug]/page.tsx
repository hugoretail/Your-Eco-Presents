import { notFound } from 'next/navigation';

interface Props { params: Promise<{ slug: string }> }

export default async function ArticleDetail({ params }: Props) {
  const resolved = await params;
  try {
    const { prisma } = await import('@/lib/prisma');
    const article = await prisma.article.findUnique({ where: { slug: resolved.slug } });
    if (!article || !article.published) return notFound();
  return (
    <article className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-10 md:pt-12">
      <header className="mb-10 space-y-5">
        <h1 className="text-4xl font-extrabold tracking-tight leading-tight title-gradient">{article.title}</h1>
        {article.excerpt && <p className="text-base leading-relaxed text-neutral-600">{article.excerpt}</p>}
        <div className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          <span>{new Date(article.createdAt).toLocaleDateString('fr-FR')}</span>
        </div>
      </header>
  <div className="prose prose-neutral prose-headings:tracking-tight prose-p:leading-relaxed max-w-3xl">
        <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800">{article.content}</div>
      </div>
      {article.sources && (
        <div className="mt-12 rounded-lg border border-emerald-100 bg-emerald-50/50 p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-emerald-700">Sources / Pour aller plus loin</h2>
          <ul className="space-y-1 text-sm">
            {JSON.parse(article.sources).map((s: string) => (
              <li key={s} className="truncate">
                <a href={s} target="_blank" className="text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800 hover:decoration-emerald-500">{s}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
  } catch {
    // On static export or if DB is unavailable, treat as not found
    return notFound();
  }
}

// For static export, enumerate published article slugs
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  // In GH Pages build we moved APIs out; Prisma may still work, but if it doesn't, return empty list
  try {
    const { prisma } = await import('@/lib/prisma');
    const slugs = await prisma.article.findMany({ where: { published: true }, select: { slug: true } });
    return slugs.map((a) => ({ slug: a.slug }));
  } catch {
    // On GH Pages export, DB may be unavailable. Return no slugs to export none.
    // If you want to force at least one static page, uncomment the next line and ensure a matching MD/static page exists.
    // return [{ slug: 'demo' }];
    return [] as { slug: string }[];
  }
}

// Indicate there are no additional dynamic params at runtime
export const dynamicParams = false;
export const dynamic = 'force-static';
