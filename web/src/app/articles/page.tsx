import Link from 'next/link';

export const dynamic = 'force-static';

export default async function ArticlesList() {
  try {
    const { prisma } = await import('@/lib/prisma');
    const articles = await prisma.article.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, slug: true, excerpt: true, createdAt: true }
    });

    return (
  <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-10 md:pt-12 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight title-gradient">Le Blog</h1>
          <p className="text-base text-neutral-700">Actus, inspirations et coulisses d’Eco‑Presents.</p>
        </header>
        {articles.length === 0 ? (
          <p className="text-neutral-500">Aucun article publié pour le moment.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {articles.map((a) => (
              <article key={a.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                <header className="mb-3 space-y-2">
                  <h2 className="text-xl font-bold leading-snug tracking-tight">
                    <Link href={`/articles/${a.slug}`} className="text-neutral-900 hover:underline underline-offset-4">
                      {a.title}
                    </Link>
                  </h2>
                  <div className="text-[11px] uppercase tracking-wide text-neutral-400 font-medium">
                    {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </header>
                {a.excerpt && (<p className="text-sm text-neutral-700 leading-relaxed">{a.excerpt}</p>)}
                <div className="mt-4">
                  <Link href={`/articles/${a.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800">
                    Lire l’article
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    );
  } catch {
    // En export statique ou si la DB est indisponible
    return (
      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6 space-y-6">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight title-gradient">Le Blog</h1>
        <p className="text-neutral-500">Le contenu du blog n’est pas disponible pour le moment.</p>
      </section>
    );
  }
}
