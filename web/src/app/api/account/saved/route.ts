import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value || '';
  const session = await getSession(token);
  if (!session?.userId) return NextResponse.json({ items: [] });
  const items = await prisma.savedGift.findMany({ where: { userId: session.userId }, include: { product: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value || '';
    const session = await getSession(token);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { productId, note } = body || {};
    if (!productId) return NextResponse.json({ error: 'productId requis' }, { status: 400 });
    const created = await prisma.savedGift.upsert({
      where: { userId_productId: { userId: session.userId, productId } },
      update: { note: note ?? undefined },
      create: { userId: session.userId, productId, note: note ?? undefined },
      include: { product: true },
    });
    return NextResponse.json({ item: created });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value || '';
    const session = await getSession(token);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    if (!productId) return NextResponse.json({ error: 'productId requis' }, { status: 400 });
    await prisma.savedGift.delete({ where: { userId_productId: { userId: session.userId, productId } } }).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
