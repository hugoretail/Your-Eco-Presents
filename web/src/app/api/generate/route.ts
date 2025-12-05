// Legacy LLM route disabled. Use /api/recommend instead.
export const dynamic = 'force-static';
export async function POST() {
  return new Response(JSON.stringify({ error: 'Route disabled. Use /api/recommend.' }), { status: 410, headers: { 'Content-Type': 'application/json' } });
}
