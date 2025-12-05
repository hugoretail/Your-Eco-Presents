import { destroySession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (token) await destroySession(token);
  const res = NextResponse.json({ success: true });
  res.cookies.set('auth_token', '', { httpOnly: true, expires: new Date(0) });
  return res;
}
