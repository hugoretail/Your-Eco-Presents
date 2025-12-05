import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, destroySession } from '@/lib/auth';

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value || '';
    const session = await getSession(token);
    if (!session?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userId = session.userId;
    // Delete children: saved gifts, articles authored, sessions; then user
    await prisma.$transaction(async(tx)=>{
      await tx.savedGift.deleteMany({ where: { userId } }).catch(()=>{});
      await tx.article.deleteMany({ where: { authorId: userId } }).catch(()=>{});
      await tx.session.deleteMany({ where: { userId } }).catch(()=>{});
      await tx.user.delete({ where: { id: userId } });
    });

    await destroySession(token);
    const res = NextResponse.json({ ok: true });
    res.cookies.set('auth_token', '', { httpOnly: true, path: '/', maxAge: 0 });
    return res;
  } catch (e:any) {
    return NextResponse.json({ error: e.message || 'Bad request' }, { status: 400 });
  }
}
