import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/middleware/authGuard';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateSchema = z.object({
  title: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  coverImage: z.string().url().optional(),
  sources: z.array(z.string().url()).optional(),
  published: z.boolean().optional()
});

export async function GET(req: NextRequest) {
  // If admin (valid session & role) and query param all=1 -> return all articles
  const url = new URL(req.url);
  const wantAll = url.searchParams.get('all') === '1';
  let isAdmin = false;
  if (wantAll) {
    const token = req.cookies.get('auth_token')?.value;
    if (token) {
      const session = await getSession(token);
      if (session?.user?.role === 'ADMIN') isAdmin = true;
    }
  }
  const where = isAdmin ? {} : { published: true };
  const articles = await prisma.article.findMany({ where, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ articles, all: isAdmin });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin(req);
  if (session instanceof NextResponse) return session;
  try {
    const body = await req.json();
    const data = CreateSchema.parse(body);
    const created = await prisma.article.create({
      data: {
        ...data,
        sources: data.sources ? JSON.stringify(data.sources) : null,
        authorId: session.user!.id,
        publishedAt: data.published ? new Date() : null
      }
    });
    return NextResponse.json({ article: created });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
