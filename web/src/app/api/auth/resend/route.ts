import { buildConfirmationEmail } from '@/lib/emailTemplates';
import { sendMail } from '@/lib/mailer';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ResendSchema = z.object({ email: z.string().email() });

function newToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const { email } = ResendSchema.parse(json);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: true }); // do not leak existence
    if ((user as any).confirmed) return NextResponse.json({ ok: true });

    const token = newToken();
    await prisma.user.update({ where: { id: user.id }, data: { confirmToken: token } });
    const base = (req as any).nextUrl?.origin || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : process.env.BASE_URL || 'http://localhost:3000');
    const confirmUrl = `${base}/api/auth/confirm?token=${token}`;
    const support = process.env.SUPPORT_EMAIL || process.env.SMTP_FROM || process.env.ADMIN_EMAIL || undefined;
    const tpl = buildConfirmationEmail({ confirmUrl, userEmail: email, supportEmail: support });
    await sendMail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message ?? 'Bad request' }, { status: 400 });
  }
}
