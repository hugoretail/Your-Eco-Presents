import { buildConfirmationEmail } from '@/lib/emailTemplates';
import { sendMail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: 'Mot de passe trop court' }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 409 });
    const hash = await bcrypt.hash(password, 12);
    const token = cryptoRandom();
    await prisma.user.create({ data: { email, passwordHash: hash, role: 'USER', confirmed: false, confirmToken: token } });
    // Build absolute URL from the incoming request to avoid wrong BASE_URL in production
    const base = (req as any).nextUrl?.origin || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : process.env.BASE_URL || 'http://localhost:3000');
    const confirmUrl = `${base}/api/auth/confirm?token=${token}`;
    const support = process.env.SUPPORT_EMAIL || process.env.SMTP_FROM || process.env.ADMIN_EMAIL || undefined;
    const tpl = buildConfirmationEmail({ confirmUrl, userEmail: email, supportEmail: support });
    await sendMail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 });
  }
}

function cryptoRandom() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}