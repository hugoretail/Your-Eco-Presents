// Deterministic recommender: score products against user prefs and diversify with MMR
// Inputs: prefs from generate form; products from DB

export type RawProduct = {
  id: string;
  name: string;
  description: string;
  brand?: string | null;
  url?: string | null;
  priceCents?: number | null;
  currency?: string | null;
  labels?: string | null; // JSON string
  origin?: string | null; // FR/EU
  materials?: string | null; // JSON string
  repairScore?: number | null; // 0..10
  packaging?: string | null;
  image?: string | null;
  keywords?: string | null; // JSON string
  categories?: string | null; // JSON string
  popularity?: number | null;
  ecoScore?: number | null; // 0..100
};

export type Prefs = {
  recipient: string;
  occasion: string;
  age: string | number;
  giftType: string;
  giftNumber: string; // "Un seul" | "Plusieurs"
  categories: string[];
  exclude: string[];
  criteria: string[];
  interests: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  ideas?: string; // free text
  info?: string; // free text
  personInfo?: string; // free text
};

export type Idea = {
  title: string;
  description: string;
  price?: number; // euros
  __score: number; // internal score for debugging
  __product: RawProduct & {
    parsed: ParsedProduct;
  };
};

type ParsedProduct = {
  labels: string[];
  materials: string[];
  keywords: string[];
  categories: string[];
  tokens: string[]; // tokenized name+description+keywords
};

function parseArray(jsonLike?: string | null): string[] {
  if (!jsonLike) return [];
  try {
    const v = JSON.parse(jsonLike);
    if (Array.isArray(v)) return v.map(String);
  } catch {}
  return [];
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const A = new Set(a);
  const B = new Set(b);
  let inter = 0;
  for (const t of A) if (B.has(t)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

function overlapCount(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const B = new Set(b);
  let count = 0;
  for (const t of a) if (B.has(t)) count++;
  return count;
}

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

function scoreBudget(priceCents: number | null | undefined, min: number | null, max: number | null): number {
  if (!priceCents || priceCents <= 0) return 0.5; // unknown
  const price = priceCents / 100;
  if (min == null && max == null) return 0.6;
  if (min != null && max != null) {
    if (price >= min && price <= max) return 1;
    if (price < min) {
      // Strongly penalize under minimal budget (avoid "cadeau trop cheap")
      return clamp01(price / min);
    }
    // over max: linear decay relative to range beyond max
    const dist = price - max;
    const range = Math.max(1, max - min);
    return clamp01(1 - dist / (range * 1.0));
  }
  if (min != null) {
    if (price >= min) return 1;
    return clamp01(price / Math.max(1, min));
  }
  // max only
  if (price <= (max as number)) return 1;
  const dist = price - (max as number);
  return clamp01(1 - dist / Math.max(1, max as number));
}

function scoreEco(prod: RawProduct): number {
  const eco = (prod.ecoScore ?? 0) / 100; // 0..1
  const localBoost = prod.origin?.toUpperCase() === 'FR' ? 0.2 : prod.origin?.toUpperCase() === 'EU' ? 0.1 : 0;
  const repair = (prod.repairScore ?? 0) / 10 * 0.2; // up to +0.2
  return clamp01(eco + localBoost + repair);
}

function scorePopularity(pop?: number | null): number {
  if (typeof pop !== 'number') return 0.3;
  // simple logistic-ish normalization assuming 0..1000 typical
  const n = Math.min(1, pop / 1000);
  return 0.3 + 0.7 * n;
}

function parseProduct(p: RawProduct): ParsedProduct {
  const labels = parseArray(p.labels);
  const materials = parseArray(p.materials);
  const keywords = parseArray(p.keywords);
  const categories = parseArray(p.categories);
  const tokens = Array.from(new Set([
    ...tokenize(p.name || ''),
    ...tokenize(p.description || ''),
    ...keywords.flatMap(tokenize),
    ...categories.flatMap(tokenize),
  ]));
  return { labels, materials, keywords, categories, tokens };
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function tokenizeCats(arr: string[]): string[] {
  const out: string[] = [];
  for (const c of arr) {
    const t = normalize(c).split(/[^a-z0-9]+/).filter(Boolean);
    out.push(...t);
  }
  return Array.from(new Set(out));
}

function fuzzyCategoryMatch(prodCats: string[], prefCats: string[]): number {
  if (!prodCats.length || !prefCats.length) return 0;
  const prodTokens = tokenizeCats(prodCats);
  const prefTokensBase = tokenizeCats(prefCats);
  // Add simple synonyms/expansions
  const synonyms: Record<string, string[]> = {
    sport: ['sports','glisse','outdoor','skate','surf','ski','velo','vélo','running'],
    voyage: ['travel','trip','randonnée','outdoor'],
    bijoux: ['bijou','joaillerie','bracelet','collier','bague'],
  };
  const prefTokens: string[] = [];
  for (const t of prefTokensBase) {
    prefTokens.push(t);
    if (synonyms[t]) prefTokens.push(...synonyms[t]);
  }
  return jaccard(prodTokens, prefTokens);
}

function penaltyExclusions(prodCats: string[], exclude: string[]): number {
  if (exclude.length === 0) return 0;
  const inter = overlapCount(prodCats.map(s=>normalize(s)), exclude.map(s=>normalize(s)));
  return inter > 0 ? -0.5 : 0; // strong penalty if excluded
}

function scoreCriteriaBonus(criteria: string[], prod: RawProduct, parsed: ParsedProduct): number {
  if (criteria.length === 0) return 0;
  const normalized = criteria.map(c => c.toLowerCase().trim());
  const set = new Set(normalized.map(c=>{
    if (c.includes('local')) return 'fabrication locale';
    if (c.includes('durab')) return 'durabilité';
    if (c.includes('utile')) return 'utilité';
    if (c.includes('eco') || c.includes('éco') || c.includes('eth')) return 'eco-responsable';
    return c;
  }));
  let bonus = 0;
  if (set.has('eco-responsable') || set.has('ethique')) {
    bonus += scoreEco(prod) * 0.2;
  }
  if (set.has('fabrication locale')) {
    if (prod.origin?.toUpperCase() === 'FR') bonus += 0.2; else if (prod.origin?.toUpperCase() === 'EU') bonus += 0.1;
  }
  if (set.has('durabilité')) {
    bonus += ((prod.repairScore ?? 0) / 10) * 0.2;
  }
  if (set.has('utilité')) {
    // Light boost for practical items: detect via keywords/categories tokens
    const utilTokens = ['outil','ustensile','quotidien','cuisine','bricolage','réparable','durable','utilitaire'];
    const has = parsed.tokens.some(t => utilTokens.includes(t));
    if (has) bonus += 0.1;
  }
  if (set.has('prix raisonnable')) {
    // prefer cheaper when this criterion is set
    bonus += prod.priceCents ? clamp01(1 - (prod.priceCents / 100) / 500) * 0.2 : 0.05;
  }
  return bonus;
}

function parseAge(age: string | number): number | null {
  if (typeof age === 'number' && !isNaN(age)) return age;
  const m = String(age).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

function scoreAgeCompatibility(age: string | number, parsed: ParsedProduct): number {
  const n = parseAge(age);
  if (n == null) return 0; // unknown
  // Penalize kids-focused items for adults, and vice versa for minors
  const kidTokens = ['enfant','enfants','bébé','bebe','ado','jouet','naissance'];
  const adultTokens = ['vin','bière','café','whisky','barista'];
  const hasKid = parsed.tokens.some(t => kidTokens.includes(t));
  const hasAdult = parsed.tokens.some(t => adultTokens.includes(t));
  let adj = 0;
  if (n >= 18 && hasKid) adj -= 0.4;
  if (n < 18 && hasAdult) adj -= 0.4;
  return adj;
}

function detectExperience(parsed: ParsedProduct): boolean {
  const expTokens = ['expérience','experience','atelier','cours','stage','week-end','weekend','séjour','sejour','abonnement','billet','spectacle','coffret','box','carte','cadeau'];
  return parsed.tokens.some(t => expTokens.includes(t));
}

function detectGiftCard(parsed: ParsedProduct): boolean {
  const cardTokens = ['carte','cadeau','gift','card'];
  return parsed.tokens.some(t => cardTokens.includes(t)) || parsed.categories.some(c => c.toLowerCase().includes('carte'));
}

function scoreGiftTypePreference(giftType: string, parsed: ParsedProduct): number {
  const gt = giftType.toLowerCase();
  const isExp = detectExperience(parsed);
  if (gt.includes('exp')) {
    return isExp ? 0.3 : -0.15;
  }
  if (gt.includes('objet') || gt.includes('matéri') || gt.includes('materi')) {
    return isExp ? -0.35 : 0.05;
  }
  return 0;
}

function ageCategoryPenalty(age: string | number, prodCats: string[], parsed: ParsedProduct): number {
  const n = parseAge(age);
  if (n == null) return 0;
  const cats = tokenizeCats(prodCats);
  // For younger recipients, slightly penalize categories often perçues comme "adultes" s'il n'y a pas d'intérêt fort
  const adultish = ['jardin','jardinage','cuisine','maison','menage','ménage','vaisselle'];
  const hasAdultish = cats.some(c => adultish.includes(c));
  if (n <= 22 && hasAdultish) {
    // reduce penalty if tokens indicate strong interest match to sports/glisse
    const glisseTokens = ['surf','skate','glisse','roller','rollers'];
    const hasGlisse = parsed.tokens.some(t => glisseTokens.includes(t));
    return hasGlisse ? -0.1 : -0.35;
  }
  return 0;
}

function hasExcludedCategory(prodCats: string[], exclude: string[]): boolean {
  if (!exclude.length || !prodCats.length) return false;
  const cats = prodCats.map(c => normalize(c));
  const ex = exclude.map(e => normalize(e));
  for (const c of cats) {
    for (const e of ex) {
      if (c.includes(e)) return true;
    }
  }
  return false;
}

export function scoreProduct(prefs: Prefs, prod: RawProduct): { score: number; parsed: ParsedProduct } {
  const parsed = parseProduct(prod);
  const budget = scoreBudget(prod.priceCents ?? null, prefs.budgetMin, prefs.budgetMax); // 0..1
  const catMatch = fuzzyCategoryMatch(parsed.categories, prefs.categories);
  const ideaTokens = prefs.ideas ? tokenize(prefs.ideas) : [];
  const infoTokens = prefs.info ? tokenize(prefs.info) : [];
  const personInfoTokens = prefs.personInfo ? tokenize(prefs.personInfo) : [];
  const interestTokens = Array.from(new Set([
    ...prefs.interests.flatMap(tokenize),
    ...ideaTokens,
    ...infoTokens,
    ...personInfoTokens,
  ]));
  const interest = interestTokens.length ? jaccard(parsed.tokens, interestTokens) : 0.0;
  const eco = scoreEco(prod);
  const pop = scorePopularity(prod.popularity ?? null);
  const exclPen = penaltyExclusions(parsed.categories, prefs.exclude);
  const critBonus = scoreCriteriaBonus(prefs.criteria, prod, parsed);
  const ageAdj = scoreAgeCompatibility(prefs.age, parsed);
  const ageCatPen = ageCategoryPenalty(prefs.age, parsed.categories, parsed);
  const giftTypeAdj = scoreGiftTypePreference(prefs.giftType, parsed);
  // Strong penalty if gift cards excluded
  const giftCardExcluded = prefs.exclude.map(s=>s.toLowerCase()).some(s => s.includes('carte') && s.includes('cadeau'));
  const giftCardPen = giftCardExcluded && detectGiftCard(parsed) ? -0.6 : 0;
  // Over-budget penalty (if max provided)
  let overBudgetPen = 0;
  if (prefs.budgetMax != null && prod.priceCents && prod.priceCents > prefs.budgetMax * 100) {
    const price = prod.priceCents / 100;
    const over = (price - prefs.budgetMax) / Math.max(1, prefs.budgetMax);
    overBudgetPen = -clamp01(over) * 0.7;
  }

  // Weighted sum
  let score = (
    budget * 0.3 +
    catMatch * 0.3 +
    interest * 0.35 +
    eco * 0.15 +
    pop * 0.05 +
    critBonus
  );
  score += exclPen + ageAdj + ageCatPen + giftTypeAdj + giftCardPen + overBudgetPen;
  score = clamp01(score);
  return { score, parsed };
}

function cosineSimTokens(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const map = new Map<string, number>();
  for (const t of a) map.set(t, (map.get(t) ?? 0) + 1);
  const map2 = new Map<string, number>();
  for (const t of b) map2.set(t, (map2.get(t) ?? 0) + 1);
  let dot = 0, normA = 0, normB = 0;
  for (const v of map.values()) normA += v * v;
  for (const v of map2.values()) normB += v * v;
  for (const [t, v] of map) dot += v * (map2.get(t) ?? 0);
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function recommend(prefs: Prefs, products: RawProduct[], k = 5): Idea[] {
  // Parse and pre-filter exclusions strictly
  const parsedAll = products.map(p => ({ p, parsed: parseProduct(p) }));
  const giftCardExcluded = prefs.exclude.map(s=>normalize(s)).some(s => s.includes('carte') && s.includes('cadeau'));
  const candidates = parsedAll.filter(({ parsed }) => {
    if (hasExcludedCategory(parsed.categories, prefs.exclude)) return false;
    if (giftCardExcluded && detectGiftCard(parsed)) return false;
    return true;
  });

  // Pre-score remaining
  const scored = candidates.map(({ p }) => {
    const { score, parsed } = scoreProduct(prefs, p);
    return { p, score, parsed };
  }).sort((a, b) => b.score - a.score);

  // Maximal Marginal Relevance diversification
  const lambda = 0.7; // relevance vs diversity
  const selected: typeof scored = [];
  const remaining = [...scored];
  while (selected.length < k && remaining.length > 0) {
    let bestIdx = 0;
    let bestVal = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const cand = remaining[i];
      const relevance = cand.score;
      let diversityPenalty = 0;
      if (selected.length > 0) {
        let maxSim = 0;
        for (const s of selected) {
          const sim = cosineSimTokens(cand.parsed.tokens, s.parsed.tokens);
          if (sim > maxSim) maxSim = sim;
        }
        diversityPenalty = maxSim; // 0..1
      }
      const mmr = lambda * relevance - (1 - lambda) * diversityPenalty;
      if (mmr > bestVal) { bestVal = mmr; bestIdx = i; }
    }
    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected.map(({ p, score, parsed }) => ({
    title: p.name,
    description: p.description,
    price: p.priceCents ? Math.round(p.priceCents / 100) : undefined,
    __score: score,
    __product: { ...p, parsed },
  }));
}
