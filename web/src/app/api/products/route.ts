import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/middleware/authGuard';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  brand: z.string().optional(),
  url: z.string().url().optional(),
  priceCents: z.number().int().optional(),
  labels: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  origin: z.string().optional(),
  materials: z.array(z.string()).optional(),
  repairScore: z.number().int().min(0).max(10).optional(),
  packaging: z.string().optional(),
  image: z.string().regex(/^(\/|https?:)/, 'image doit être un chemin absolu / ou URL http(s)') .optional(),
  popularity: z.number().int().optional(),
  ecoScore: z.number().int().min(0).max(100).optional(),
  purchaseLinks: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).optional(),
});

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
  const pageSize = Math.max(1, Math.min(200, parseInt(url.searchParams.get('pageSize') || '25', 10)));
  const q = (url.searchParams.get('q') || '').trim();
  const cat = (url.searchParams.get('cat') || '').trim();
  const sort = (url.searchParams.get('sort') || 'createdAt') as 'createdAt'|'price'|'eco'|'pop';
  const order = (url.searchParams.get('order') || 'desc') as 'asc'|'desc';

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { brand: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (cat) {
    // categories is stored as JSON string; simple text contains works well enough
    where.categories = { contains: cat, mode: 'insensitive' };
  }

  const orderBy = (() => {
    switch (sort) {
      case 'price': return { priceCents: order } as const;
      case 'eco': return { ecoScore: order } as const;
      case 'pop': return { popularity: order } as const;
      default: return { createdAt: order } as const;
    }
  })();

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
  ]);
  return NextResponse.json({ products, total, page, pageSize });
}

const PatchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  brand: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  priceCents: z.number().int().nullable().optional(),
  labels: z.array(z.string()).nullable().optional(),
  keywords: z.array(z.string()).nullable().optional(),
  categories: z.array(z.string()).nullable().optional(),
  origin: z.string().nullable().optional(),
  materials: z.array(z.string()).nullable().optional(),
  repairScore: z.number().int().min(0).max(10).nullable().optional(),
  packaging: z.string().nullable().optional(),
  image: z.string().regex(/^(\/|https?:)/, 'image doit être un chemin absolu / ou URL http(s)').nullable().optional(),
  popularity: z.number().int().nullable().optional(),
  ecoScore: z.number().int().min(0).max(100).nullable().optional(),
  purchaseLinks: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).nullable().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin(req);
  if (session instanceof NextResponse) return session;
  try {
    const body: any = await req.json();
    // Autoriser un simple nom de fichier pour l'image en le mappant vers /products/<fichier>
    if (typeof body.image === 'string' && body.image.trim() && !/^(\/|https?:)/.test(body.image)) {
      body.image = '/products/' + body.image.replace(/^\/+/, '');
    }
    const data = PatchSchema.parse(body);
    const { id, ...rest } = data as any;
    const toUpdate: any = {};
    if ('name' in rest) toUpdate.name = rest.name;
    if ('description' in rest) toUpdate.description = rest.description;
    if ('brand' in rest) toUpdate.brand = rest.brand ?? null;
    if ('url' in rest) toUpdate.url = rest.url ?? null;
    if ('priceCents' in rest) toUpdate.priceCents = rest.priceCents ?? null;
    if ('labels' in rest) toUpdate.labels = rest.labels ? JSON.stringify(rest.labels) : null;
    if ('keywords' in rest) toUpdate.keywords = rest.keywords ? JSON.stringify(rest.keywords) : null;
    if ('categories' in rest) toUpdate.categories = rest.categories ? JSON.stringify(rest.categories) : null;
    if ('origin' in rest) toUpdate.origin = rest.origin ?? null;
    if ('materials' in rest) toUpdate.materials = rest.materials ? JSON.stringify(rest.materials) : null;
    if ('repairScore' in rest) toUpdate.repairScore = rest.repairScore ?? null;
    if ('packaging' in rest) toUpdate.packaging = rest.packaging ?? null;
    if ('image' in rest) toUpdate.image = rest.image ?? null;
    if ('popularity' in rest) toUpdate.popularity = rest.popularity ?? null;
    if ('ecoScore' in rest) toUpdate.ecoScore = rest.ecoScore ?? null;
    if ('purchaseLinks' in rest) toUpdate.purchaseLinks = rest.purchaseLinks ? JSON.stringify(rest.purchaseLinks) : null;

    const updated = await prisma.product.update({ where: { id }, data: toUpdate });
    return NextResponse.json({ product: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (session instanceof NextResponse) return session;
  try {
    const body: any = await req.json();
    // Autoriser un simple nom de fichier pour l'image en le mappant vers /products/<fichier>
    if (typeof body.image === 'string' && body.image.trim() && !/^(\/|https?:)/.test(body.image)) {
      body.image = '/products/' + body.image.replace(/^\/+/, '');
    }
    const data = CreateSchema.parse(body);
    const toSave: any = {
      ...data,
      labels: data.labels ? JSON.stringify(data.labels) : null,
      materials: data.materials ? JSON.stringify(data.materials) : null,
      image: data.image || null,
    };
    if (data.keywords) toSave.keywords = JSON.stringify(data.keywords);
    if (data.categories) toSave.categories = JSON.stringify(data.categories);
    if (data.purchaseLinks) toSave.purchaseLinks = JSON.stringify(data.purchaseLinks);
    // Fallback auto: si pas de purchaseLinks fournis mais une URL est présente
    if (!data.purchaseLinks && data.url) {
      toSave.purchaseLinks = JSON.stringify([{ label: 'Acheter', url: data.url }]);
    }
    if (typeof data.popularity === 'number') toSave.popularity = data.popularity;
    if (typeof data.ecoScore === 'number') toSave.ecoScore = data.ecoScore;
    const created = await prisma.product.create({ data: toSave });
    return NextResponse.json({ product: created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
