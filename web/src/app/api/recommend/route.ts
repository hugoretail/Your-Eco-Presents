import { prisma } from '@/lib/prisma';
import { Prefs, recommend } from '@/lib/reco';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Minimal validation/coercion
    const prefs: Prefs = {
      recipient: String(body.recipient || ''),
      occasion: String(body.occasion || ''),
      age: typeof body.age === 'number' ? body.age : String(body.age || ''),
      giftType: String(body.giftType || ''),
      giftNumber: String(body.giftNumber || 'Un seul'),
      categories: Array.isArray(body.categories) ? body.categories.map(String) : [],
      exclude: Array.isArray(body.exclude) ? body.exclude.map(String) : [],
      criteria: Array.isArray(body.criteria) ? body.criteria.map(String) : [],
      interests: Array.isArray(body.interests) ? body.interests.map(String) : [],
      budgetMin: body.budgetMin == null ? null : Number(body.budgetMin),
      budgetMax: body.budgetMax == null ? null : Number(body.budgetMax),
      ideas: typeof body.ideas === 'string' ? body.ideas : '',
      info: typeof body.info === 'string' ? body.info : '',
      personInfo: typeof body.personInfo === 'string' ? body.personInfo : '',
    };

    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    const ideas = recommend(prefs, products, 5);
    return NextResponse.json({ ideas });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid payload' }, { status: 400 });
  }
}
