import { createSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password, remember } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.confirmed) return NextResponse.json({ error: 'Compte non trouvé ou non confirmé' }, { status: 401 });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });

  const { token, duration } = await createSession(user.id, { remember: !!remember });
  const isProd = process.env.NODE_ENV === 'production';
  const parts = [
    `auth_token=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (remember) parts.push(`Max-Age=${Math.floor(duration / 1000)}`);
  if (isProd) parts.push('Secure');

  return NextResponse.json(
    { success: true, role: user.role },
    { headers: { 'Set-Cookie': parts.join('; ') } }
  );
}
