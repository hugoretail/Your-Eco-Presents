"use client";
import { useCallback, useEffect, useState } from 'react';

interface ArticleFormState { title: string; slug: string; excerpt: string; content: string; published: boolean; sources: string; }
interface ProductFormState { name: string; description: string; brand: string; url: string; priceCents: string; labels: string; origin: string; materials: string; repairScore: string; packaging: string; image: string; keywords: string; categories: string; popularity: string; ecoScore: string; }
interface ArticleListItem { id: string; title: string; slug: string; published: boolean; createdAt: string; }
interface ProductListItem { id: string; name: string; brand?: string | null; createdAt: string; priceCents?: number | null; popularity?: number | null; ecoScore?: number | null; categories?: string | null; purchaseLinks?: string | null; }

export default function AdminPage() {
  const inputBase = "w-full rounded-lg border border-neutral-400 bg-white px-4 py-2 text-base text-neutral-900 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition";
  const labelCls = "block text-sm font-bold text-neutral-900 mb-1";
  const [session, setSession] = useState<{ email: string; role: string } | null>(null);
  const [article, setArticle] = useState<ArticleFormState>({ title: '', slug: '', excerpt: '', content: '', published: false, sources: '' });
  const [product, setProduct] = useState<ProductFormState>({ name:'', description:'', brand:'', url:'', priceCents:'', labels:'', origin:'', materials:'', repairScore:'', packaging:'', image:'', keywords:'', categories:'', popularity:'', ecoScore:'' });
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [message, setMessage] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productQuery, setProductQuery] = useState('');
  const [productSort, setProductSort] = useState<'createdAt'|'price'|'eco'|'pop'>('createdAt');
  const [productFilterCat, setProductFilterCat] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [editLinks, setEditLinks] = useState<string>('');
  

  // Session check
  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(j=>{ if (j.authenticated) setSession(j.user); });
  }, []);

  // Auto slug generation unless manual override
  useEffect(() => {
    if (!slugManual) {
      const base = article.title
        .normalize('NFD').replace(/\p{Diacritic}/gu,'')
        .toLowerCase().replace(/[^a-z0-9\s-]/g,'')
        .trim().replace(/\s+/g,'-').replace(/-+/g,'-');
      setArticle(a => ({ ...a, slug: base }));
    }
  }, [article.title, slugManual]);

  function resetArticle() {
    setArticle({ title:'', slug:'', excerpt:'', content:'', published:false, sources:'' });
    setSlugManual(false);
  }

  const refreshLists = useCallback(async () => {
    setLoadingArticles(true);
    const a = await fetch('/api/articles?all=1').then(r=>r.json()).catch(()=>({articles:[]}));
    setArticles(a.articles || []);
    setLoadingArticles(false);
    setLoadingProducts(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    if (productQuery.trim()) params.set('q', productQuery.trim());
    if (productFilterCat.trim()) params.set('cat', productFilterCat.trim());
    params.set('sort', productSort);
    params.set('order', productSort === 'createdAt' ? 'desc' : 'desc');
    const p = await fetch('/api/products?'+params.toString()).then(r=>r.json()).catch(()=>({products:[], total:0}));
    setProducts(p.products || []);
    setTotal(p.total || 0);
    setLoadingProducts(false);
  }, [page, pageSize, productQuery, productFilterCat, productSort]);

  useEffect(() => { if (session) refreshLists(); }, [session, refreshLists]);

  // Charger automatiquement les liens d'achat existants dans l'éditeur quand un produit est sélectionné
  useEffect(() => {
    if (!selectedProduct) { setEditLinks(''); return; }
    try {
      const links = selectedProduct.purchaseLinks ? JSON.parse(selectedProduct.purchaseLinks) : null;
      setEditLinks(links ? JSON.stringify(links, null, 2) : '');
    } catch { setEditLinks(''); }
  }, [selectedProduct]);

  async function createArticle(e: React.FormEvent) {
    e.preventDefault(); setMessage('');
    const res = await fetch('/api/articles', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
      ...article,
      sources: article.sources ? article.sources.split(/\n+/).map(s=>s.trim()).filter(Boolean) : [],
    }) });
    const data = await res.json();
    if (!res.ok) { setMessage('Erreur article: '+(data.error||'')); return; }
    setMessage('Article créé');
    resetArticle();
    refreshLists();
  }

  async function togglePublish(slug: string, published: boolean) {
    await fetch(`/api/articles/${slug}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ published: !published }) });
    refreshLists();
  }

  async function deleteArticle(slug: string) {
    if (!confirm('Supprimer définitivement ?')) return;
    await fetch(`/api/articles/${slug}`, { method:'DELETE' });
    refreshLists();
  }

  async function createProduct(e: React.FormEvent) {
    e.preventDefault(); setMessage('');
    // Convert prix en euros -> cents (entier)
    const priceCents = product.priceCents ? Math.round(Number(product.priceCents) * 100) : undefined;

    const res = await fetch('/api/products', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({
      name: product.name,
      description: product.description,
      brand: product.brand || undefined,
      url: product.url || undefined,
      priceCents,
      labels: product.labels ? product.labels.split(',').map(s=>s.trim()).filter(Boolean) : [],
      keywords: product.keywords ? product.keywords.split(',').map(s=>s.trim()).filter(Boolean) : [],
      categories: product.categories ? product.categories.split(',').map(s=>s.trim()).filter(Boolean) : [],
      materials: product.materials ? product.materials.split(',').map(s=>s.trim()).filter(Boolean) : [],
      repairScore: product.repairScore ? Number(product.repairScore) : undefined,
      popularity: product.popularity ? Number(product.popularity) : undefined,
      ecoScore: product.ecoScore ? Number(product.ecoScore) : undefined,
    }) });
    const data = await res.json();
    if (!res.ok) { setMessage('Erreur produit: '+(data.error||'')); return; }
    setMessage('Produit créé');
  setProduct({ name:'', description:'', brand:'', url:'', priceCents:'', labels:'', origin:'', materials:'', repairScore:'', packaging:'', image:'', keywords:'', categories:'', popularity:'', ecoScore:'' });
    refreshLists();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method:'POST' });
    setSession(null);
  }

  if (!session) {
  return <div className="space-y-4"><h1 className="text-2xl font-bold title-gradient">Espace admin</h1><p className="text-sm text-neutral-800">Chargement ou non authentifié… (une redirection vers /login devrait intervenir).</p></div>;
  }

  return (
  <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 pt-10 md:pt-12 space-y-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight title-gradient">Espace admin</h1>
          <p className="text-sm text-neutral-800 max-w-xl">Gestion des articles et du catalogue produits. Optimise le contenu pour améliorer la pertinence des recommandations.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="rounded-full bg-neutral-100 px-4 py-1.5 font-medium text-neutral-700 shadow-inner">{session.email} <span className="text-emerald-600 font-semibold">({session.role})</span></span>
          <button onClick={logout} className="rounded-full bg-red-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-red-500">Déconnexion</button>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-700">{message}</p>}

  <section className="grid gap-12 lg:grid-cols-2">
    <form onSubmit={createArticle} className="space-y-5 rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-emerald-700 tracking-wide">Nouvel article</h2>
            <span className="text-[11px] text-neutral-700">Rédige et publie du contenu</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Titre</label>
              <input placeholder="Titre de l'article" value={article.title} onChange={e=>setArticle(a=>({...a,title:e.target.value}))} className={inputBase} />
              <div className="mt-1 text-[11px] text-neutral-700">Le slug est généré automatiquement. <button type="button" onClick={()=>setSlugManual(s=>!s)} className="underline hover:text-neutral-800 transition">{slugManual ? 'Automatique' : 'Modifier manuellement'}</button></div>
            </div>
            {slugManual && (
              <div>
                <label className={labelCls}>Slug</label>
                <input placeholder="slug-optimise" value={article.slug} onChange={e=>setArticle(a=>({...a,slug:e.target.value}))} className={inputBase} />
              </div>
            )}
            <div>
              <label className={labelCls}>Contenu</label>
              <textarea placeholder="Corps de l'article (markdown)" value={article.content} onChange={e=>setArticle(a=>({...a,content:e.target.value}))} className={inputBase+" h-40 resize-vertical"} />
            </div>
            <div>
              <label className={labelCls}>Sources (optionnel)</label>
              <textarea placeholder="Une URL par ligne" value={article.sources} onChange={e=>setArticle(a=>({...a,sources:e.target.value}))} className={inputBase+" h-24 resize-vertical"} />
            </div>
            <label className="flex items-center gap-2 text-sm text-neutral-700"><input type="checkbox" className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500" checked={article.published} onChange={e=>setArticle(a=>({...a,published:e.target.checked}))} /> Publier maintenant</label>
          </div>
          <div className="flex gap-3 pt-3">
            <button className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500">Créer</button>
            <button type="button" onClick={resetArticle} className="rounded-full bg-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-400">Réinitialiser</button>
          </div>
        </form>
  <form onSubmit={createProduct} className="space-y-5 rounded-2xl border border-neutral-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-emerald-700 tracking-wide">Nouveau produit</h2>
            <span className="text-[11px] text-neutral-700">Catalogue interne</span>
          </div>
          <p className="text-[12px] text-neutral-800">Astuce: pensez à remplir <strong>labels</strong>, <strong>keywords</strong>, <strong>categories</strong>, <strong>origin</strong>, <strong>ecoScore</strong> et <strong>popularity</strong> pour améliorer les recommandations.</p>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Nom</label>
              <input placeholder="Nom du produit" value={product.name} onChange={e=>setProduct(p=>({...p,name:e.target.value}))} className={inputBase} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea placeholder="Description concise" value={product.description} onChange={e=>setProduct(p=>({...p,description:e.target.value}))} className={inputBase+" h-28 resize-vertical"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Marque</label>
                <input placeholder="Marque" value={product.brand} onChange={e=>setProduct(p=>({...p,brand:e.target.value}))} className={inputBase} />
              </div>
              <div>
                <label className={labelCls}>URL produit</label>
                <input placeholder="https://..." value={product.url} onChange={e=>setProduct(p=>({...p,url:e.target.value}))} className={inputBase} />
                <p className="mt-1 text-[11px] text-neutral-600">Utilisée pour le bouton « Acheter ».</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-1">
                  Prix (€)
                  <span className="ml-2 relative inline-block group align-middle select-none">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] text-neutral-700">i</span>
                    <span className="invisible group-hover:visible absolute left-0 z-10 mt-2 w-64 rounded-md border border-neutral-200 bg-white p-2 text-[11px] text-neutral-700 shadow-lg">
                      Saisir en euros (ex: 129). Converti automatiquement en centimes pour le stockage.
                    </span>
                  </span>
                </label>
                <input placeholder="Ex: 129" value={product.priceCents} onChange={e=>setProduct(p=>({...p,priceCents:e.target.value}))} className={inputBase} />
              </div>
              <div>
                <label className={labelCls}>Réparabilité (0-10)</label>
                <input placeholder="Ex: 7" value={product.repairScore} onChange={e=>setProduct(p=>({...p,repairScore:e.target.value}))} className={inputBase} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-1">
                  Labels (virgules)
                  <span className="ml-2 relative inline-block group align-middle select-none">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] text-neutral-700">i</span>
                    <span className="invisible group-hover:visible absolute left-0 z-10 mt-2 w-64 rounded-md border border-neutral-200 bg-white p-2 text-[11px] text-neutral-700 shadow-lg">
                      Format: liste séparée par des virgules. Exemple: « Bio, FSC ». Utilisé pour les filtres et l’éco-score.
                    </span>
                  </span>
                </label>
                <input placeholder="Bio, FSC" value={product.labels} onChange={e=>setProduct(p=>({...p,labels:e.target.value}))} className={inputBase} />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-1">
                  Matériaux (virgules)
                  <span className="ml-2 relative inline-block group align-middle select-none">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] text-neutral-700">i</span>
                    <span className="invisible group-hover:visible absolute left-0 z-10 mt-2 w-64 rounded-md border border-neutral-200 bg-white p-2 text-[11px] text-neutral-700 shadow-lg">
                      Exemple: « Bois, Métal, Liège ». Sert à valoriser l’éco-conception et l’origine.
                    </span>
                  </span>
                </label>
                <input placeholder="Bois, Métal" value={product.materials} onChange={e=>setProduct(p=>({...p,materials:e.target.value}))} className={inputBase} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-1">
                  Mots-clés (virgules)
                  <span className="ml-2 relative inline-block group align-middle select-none">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] text-neutral-700">i</span>
                    <span className="invisible group-hover:visible absolute left-0 z-10 mt-2 w-64 rounded-md border border-neutral-200 bg-white p-2 text-[11px] text-neutral-700 shadow-lg">
                      Exemple: « vélo, café, nature ». Améliore la pertinence de la recherche et des reco.
                    </span>
                  </span>
                </label>
                <input placeholder="vélo, café, nature" value={product.keywords} onChange={e=>setProduct(p=>({...p,keywords:e.target.value}))} className={inputBase} />
              </div>
              <div>
                <label className="block text-sm font-bold text-neutral-900 mb-1">
                  Catégories (virgules)
                  <span className="ml-2 relative inline-block group align-middle select-none">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200 text-[10px] text-neutral-700">i</span>
                    <span className="invisible group-hover:visible absolute left-0 z-10 mt-2 w-64 rounded-md border border-neutral-200 bg-white p-2 text-[11px] text-neutral-700 shadow-lg">
                      Exemple: « Sport, Bien-être, Cuisine ». Utilisé pour le filtrage et la couverture thématique.
                    </span>
                  </span>
                </label>
                <input placeholder="Sport, Bien-être" value={product.categories} onChange={e=>setProduct(p=>({...p,categories:e.target.value}))} className={inputBase} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Origine</label>
                <input placeholder="FR / EU" value={product.origin} onChange={e=>setProduct(p=>({...p,origin:e.target.value}))} className={inputBase} />
              </div>
              <div>
                <label className={labelCls}>Packaging</label>
                <input placeholder="Recyclé, minimaliste" value={product.packaging} onChange={e=>setProduct(p=>({...p,packaging:e.target.value}))} className={inputBase} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Popularité (nombre)</label>
                <input placeholder="Ex: 120" value={product.popularity} onChange={e=>setProduct(p=>({...p,popularity:e.target.value}))} className={inputBase} />
              </div>
              <div>
                <label className={labelCls}>EcoScore (0-100)</label>
                <input placeholder="Ex: 80" value={product.ecoScore} onChange={e=>setProduct(p=>({...p,ecoScore:e.target.value}))} className={inputBase} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Image</label>
              <input placeholder="https://... ou skateboard_fnac.png" value={product.image} onChange={e=>setProduct(p=>({...p,image:e.target.value}))} className={inputBase} />
              <p className="mt-1 text-[11px] text-neutral-600">Accepte une URL https:// ou un nom de fichier (ex: <span className="font-mono">skateboard_fnac.png</span>).</p>
            </div>
            {/* Les liens d'achat sont générés automatiquement : si l'URL du produit est renseignée, un lien "Acheter" est créé. */}
          </div>
          <div className="flex gap-3 pt-3">
            <button className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500">Créer</button>
            <button type="button" onClick={()=>setProduct({ name:'', description:'', brand:'', url:'', priceCents:'', labels:'', origin:'', materials:'', repairScore:'', packaging:'', image:'', keywords:'', categories:'', popularity:'', ecoScore:'' })} className="rounded-full bg-neutral-200 px-5 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-400">Vider</button>
          </div>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between"><h2 className="font-semibold text-neutral-800 tracking-wide">Articles</h2><button onClick={refreshLists} className="text-xs font-medium text-emerald-700 hover:underline">Rafraîchir</button></div>
        {loadingArticles && <p className="text-sm text-neutral-600">Chargement…</p>}
        <ul className="divide-y rounded-xl border border-neutral-200 bg-white/90 backdrop-blur shadow-sm">
          {articles.map(a=> (
            <li key={a.id} className="flex items-center justify-between gap-4 p-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium truncate text-neutral-800">{a.title}</p>
                <p className="text-xs text-neutral-500">/{a.slug} · {a.published ? 'Publié' : 'Brouillon'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={()=>togglePublish(a.slug, a.published)} className="rounded-full bg-neutral-200 px-3 py-1 text-[11px] font-medium text-neutral-800 hover:bg-neutral-300">{a.published ? 'Dépublier' : 'Publier'}</button>
                <button onClick={()=>deleteArticle(a.slug)} className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-red-500">Suppr</button>
              </div>
            </li>
          ))}
          {articles.length === 0 && !loadingArticles && <li className="p-3 text-xs text-neutral-500">Aucun article.</li>}
        </ul>
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-800 tracking-wide">Produits</h2>
          <div className="flex items-center gap-2">
            <input value={productQuery} onChange={e=>setProductQuery(e.target.value)} placeholder="Rechercher… (nom, marque)" className="rounded-md border border-neutral-300 px-3 py-1 text-sm" />
            <input value={productFilterCat} onChange={e=>setProductFilterCat(e.target.value)} placeholder="Catégorie contient…" className="rounded-md border border-neutral-300 px-3 py-1 text-sm" />
            <select value={productSort} onChange={e=>setProductSort(e.target.value as any)} className="rounded-md border border-neutral-300 px-2 py-1 text-sm">
              <option value="createdAt">Plus récents</option>
              <option value="price">Prix</option>
              <option value="eco">EcoScore</option>
              <option value="pop">Popularité</option>
            </select>
            <button onClick={refreshLists} className="text-xs font-medium text-emerald-700 hover:underline">Rafraîchir</button>
          </div>
        </div>
        {loadingProducts && <p className="text-sm text-neutral-600">Chargement…</p>}
        <ul className="divide-y rounded-xl border border-neutral-200 bg-white/90 backdrop-blur shadow-sm">
          {products.map(p=> (
            <li key={p.id} className="flex items-center justify-between gap-4 p-3 text-sm hover:bg-neutral-50 cursor-pointer" onClick={()=>setSelectedProduct(p)}>
              <div className="min-w-0">
                <p className="font-medium truncate text-neutral-800">{p.name}</p>
                <p className="text-xs text-neutral-500">{p.brand || '—'}</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-600">
                {typeof p.priceCents === 'number' && <span>{Math.round((p.priceCents||0)/100)}€</span>}
                {typeof p.ecoScore === 'number' && <span>Eco {p.ecoScore}</span>}
                {typeof p.popularity === 'number' && <span>Pop {p.popularity}</span>}
              </div>
            </li>
          ))}
          {products.length === 0 && !loadingProducts && <li className="p-3 text-xs text-neutral-500">Aucun produit.</li>}
        </ul>
        <div className="flex items-center justify-between text-xs text-neutral-600">
          <div>Page {page} / {totalPages} · {total} éléments</div>
          <div className="flex items-center gap-2">
            <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded bg-neutral-200 px-2 py-1 disabled:opacity-50">Préc.</button>
            <button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))} className="rounded bg-neutral-200 px-2 py-1 disabled:opacity-50">Suiv.</button>
            <select value={pageSize} onChange={e=>{setPage(1); setPageSize(parseInt(e.target.value));}} className="rounded border border-neutral-300 px-2 py-1">
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        {selectedProduct && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={()=>setSelectedProduct(null)}>
            <div className="relative max-w-2xl w-full rounded-xl bg-white p-6" onClick={(e)=>e.stopPropagation()}>
              <button className="absolute right-3 top-3 rounded bg-neutral-100 px-2 py-1 text-xs" onClick={()=>setSelectedProduct(null)}>Fermer</button>
              <h3 className="text-lg font-bold text-neutral-900">{selectedProduct.name}</h3>
              <p className="text-xs text-neutral-500">{selectedProduct.brand || '—'}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>Prix: {typeof selectedProduct.priceCents==='number' ? Math.round((selectedProduct.priceCents||0)/100)+'€' : '—'}</div>
                <div>EcoScore: {selectedProduct.ecoScore ?? '—'}</div>
                <div>Popularité: {selectedProduct.popularity ?? '—'}</div>
                <div>Créé le: {new Date(selectedProduct.createdAt).toLocaleString()}</div>
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-neutral-800">Liens d’achat</h4>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(() => { try {
                    const links = selectedProduct.purchaseLinks ? JSON.parse(selectedProduct.purchaseLinks) : [];
                    if (!Array.isArray(links) || links.length===0) return <span className="text-xs text-neutral-500">Aucun lien.</span>;
                    return links.map((l:any, idx:number)=> <a key={idx} href={l.url} target="_blank" rel="noopener noreferrer" className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100">{l.label||'Acheter'}</a>);
                  } catch { return <span className="text-xs text-neutral-500">Aucun lien.</span>; } })()}
                </div>
                <div className="mt-4">
                  <label className="block text-xs text-neutral-600 mb-1">Modifier les liens (JSON array de {`{ label, url }`})</label>
                  <textarea className="w-full rounded border border-neutral-300 p-2 text-xs h-28" value={editLinks} onChange={e=>setEditLinks(e.target.value)} placeholder='[
  { "label": "Acheter", "url": "https://..." }
]'/>
                  <div className="mt-2 flex items-center gap-2">
                    <button className="rounded bg-emerald-600 px-3 py-1 text-xs font-semibold text-white" onClick={async()=>{
                      try {
                        const parsed = editLinks.trim() ? JSON.parse(editLinks) : null;
                        if (parsed && !Array.isArray(parsed)) throw new Error('Doit être un tableau');
                        await fetch('/api/products', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: selectedProduct.id, purchaseLinks: parsed }) });
                        setMessage('Liens mis à jour');
                        setSelectedProduct(null);
                        refreshLists();
                      } catch (e:any) {
                        alert('JSON invalide: '+(e.message||e));
                      }
                    }}>Enregistrer</button>
                    <button className="rounded bg-neutral-200 px-3 py-1 text-xs" onClick={()=>{
                      try { const links = selectedProduct.purchaseLinks ? JSON.parse(selectedProduct.purchaseLinks) : null; setEditLinks(links ? JSON.stringify(links, null, 2) : ''); } catch { setEditLinks(''); }
                    }}>Charger existants</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      {/* TODO: Vérifier si la logique rôle admin doit utiliser user.isAdmin plutôt que role==='ADMIN' */}
    </div>
  );
}

