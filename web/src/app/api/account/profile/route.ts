import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value || '';
    const session = await getSession(token);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { displayName, preferences, newsletterOptIn } = body || {};
    const data: any = {
      displayName: displayName ?? null,
      preferences: preferences ? JSON.stringify(preferences) : null,
      newsletterOptIn: !!newsletterOptIn,
    };
    await prisma.user.update({ where: { id: session.userId }, data });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
