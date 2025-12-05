import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
  if (!email.match(/^[^@]+@[^@]+\.[^@]+$/)) return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ error: 'Mot de passe trop court' }, { status: 400 });
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: 'Email déjà utilisé' }, { status: 400 });
  const hash = await bcrypt.hash(password, 12);
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  await prisma.user.create({ data: { email, passwordHash: hash, role: 'USER', confirmed: false, confirmToken: token } });
  // Envoi mail
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Confirmation de votre compte Eco-Presents',
    html: `<p>Bienvenue ! Cliquez pour confirmer : <a href="${process.env.BASE_URL}/api/auth/confirm?token=${token}">Confirmer mon compte</a></p>`
  });
  return NextResponse.json({ success: true });
}
