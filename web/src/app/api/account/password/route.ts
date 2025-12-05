import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value || '';
    const session = await getSession(token);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const password: string = body?.password;
    if (!password || password.length < 6) return NextResponse.json({ error: 'Mot de passe trop court' }, { status: 400 });
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({ where: { id: session.userId }, data: { passwordHash: hash } });
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
