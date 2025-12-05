import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/middleware/authGuard';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const UpdateSchema = z.object({
  title: z.string().min(3).optional(),
  excerpt: z.string().optional(),
  content: z.string().min(10).optional(),
  coverImage: z.string().url().optional(),
  sources: z.array(z.string().url()).optional(),
  published: z.boolean().optional()
});

export async function GET(_: NextRequest, context: any) {
  const slug: string | undefined = context?.params?.slug;
  const article = await prisma.article.findUnique({ where: { slug: slug as string } });
  if (!article || (!article.published)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ article });
}

export async function PATCH(req: NextRequest, context: any) {
  const slug: string | undefined = context?.params?.slug;
  const session = await requireAdmin(req);
  if (session instanceof NextResponse) return session;
  try {
    const body = await req.json();
    const data = UpdateSchema.parse(body);
    const updated = await prisma.article.update({
  where: { slug: slug as string },
      data: {
        ...data,
        sources: data.sources ? JSON.stringify(data.sources) : undefined,
        publishedAt: data.published ? new Date() : undefined
      }
    });
    return NextResponse.json({ article: updated });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  const slug: string | undefined = context?.params?.slug;
  const session = await requireAdmin(req);
  if (session instanceof NextResponse) return session;
  try {
    await prisma.article.delete({ where: { slug: slug as string } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
