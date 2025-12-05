import { createSession, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    // Read "confirmed" defensively in case client types are outdated
    const isConfirmed = (user as any).confirmed === true;
    // Skip email confirmation verification for ADMIN accounts (seeded admin)
    if (!isConfirmed && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Compte non confirmé' }, { status: 403 });
    }
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const { token, expiresAt } = await createSession(user.id);
    const res = NextResponse.json({ success: true, role: user.role });
    res.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Bad request' }, { status: 400 });
  }
}
