import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { prisma } from './prisma';

// Dashboard sessions stay short by default but we allow longer TTLs when "remember me" is checked.
const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const REMEMBER_ME_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, opts?: { remember?: boolean; durationMs?: number }) {
  const token = crypto.randomBytes(32).toString('hex');
  const duration = typeof opts?.durationMs === 'number'
    ? Math.max(1 * 60 * 1000, opts.durationMs) // keep a defensive floor so cookies cannot linger forever
    : (opts?.remember ? REMEMBER_ME_DURATION_MS : DEFAULT_SESSION_DURATION_MS);
  const expiresAt = new Date(Date.now() + duration);
  await prisma.session.create({ data: { userId, token, expiresAt } });
  return { token, expiresAt, duration };
}

export async function getSession(token: string) {
  if (!token) return null;
  // Always hydrate the related user so API routes have access to the role/email without another round-trip.
  const session = await prisma.session.findUnique({ where: { token }, include: { user: true } });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { token } });
    return null;
  }
  return session;
}

export async function destroySession(token: string) {
  if (!token) return;
  // Ignore delete errors because the cookie may already be gone client side.
  await prisma.session.delete({ where: { token } }).catch(() => {});
}
