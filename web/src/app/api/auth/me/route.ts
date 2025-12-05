import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ authenticated: false });
  const session = await getSession(token);
  if (!session || !session.user) return NextResponse.json({ authenticated: false });
  const { id, email, role, displayName, newsletterOptIn, preferences } = session.user as any;
  return NextResponse.json({ authenticated: true, user: { id, email, role, displayName: displayName ?? null, newsletterOptIn: !!newsletterOptIn, preferences: preferences ?? null } });
}

