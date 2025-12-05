import { getSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function requireAuth(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const session = token ? await getSession(token) : null;
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}

export async function requireAdmin(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  if (session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return session;
}
