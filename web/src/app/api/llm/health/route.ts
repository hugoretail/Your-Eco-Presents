import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

async function probe(endpoint: string, model: string) {
  const started = Date.now();
  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: 'ping', stream: false, options: { num_predict: 4 } })
    });
    const dur = Date.now() - started;
    const text = await resp.text();
    // Detect NDJSON vs single JSON
    const lines = text.split(/\r?\n/).filter(l=>l.trim());
    let responseSample: string | null = null;
    if (lines.length > 1) {
      const parts: string[] = [];
      for (const l of lines) { try { const pj = JSON.parse(l); if (pj.response) parts.push(pj.response); } catch {/*ignore*/} }
      responseSample = parts.join('').slice(0,200) || null;
    } else {
      try { const one = JSON.parse(text); responseSample = one.response?.slice?.(0,200) ?? null; } catch { responseSample = text.slice(0,200); }
    }
    return { endpoint, ok: resp.ok, status: resp.status, latencyMs: dur, responseSample };
  } catch (e: any) {
    return { endpoint, ok: false, error: e.message };
  }
}

export async function GET(_req: NextRequest) {
  const primary = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
  const model = process.env.LLM_MODEL || 'mistral';
  const candidates = Array.from(new Set([
    primary,
    primary.replace('localhost','127.0.0.1'),
    'http://127.0.0.1:11434/api/generate',
    'http://localhost:11434/api/generate'
  ]));
  const results = [] as any[];
  for (const ep of candidates) {
    const r = await probe(ep, model);
    results.push(r);
    if (r.ok) {
      return NextResponse.json({ ok: true, model, attempts: results });
    }
  }
  return NextResponse.json({ ok: false, model, attempts: results }, { status: 502 });
}
