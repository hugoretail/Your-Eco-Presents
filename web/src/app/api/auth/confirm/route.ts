import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
  const user = await prisma.user.findFirst({ where: { confirmToken: token } });
  if (!user) return NextResponse.json({ error: 'Token invalide' }, { status: 400 });
  const origin = (req as any).nextUrl?.origin || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : process.env.BASE_URL || 'http://localhost:3000');
  if ((user as any).confirmed) return NextResponse.redirect(origin + '/login?already=1');
  await prisma.user.update({ where: { id: user.id }, data: { confirmToken: null, confirmed: true } });
    return NextResponse.redirect(origin + '/login?confirmed=1');
  } catch (e: any) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}