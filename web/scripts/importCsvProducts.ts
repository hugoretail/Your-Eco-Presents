import { PrismaClient } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import 'dotenv/config';
import fs from 'fs';
import path from 'path';

type Row = {
  name: string;
  description: string;
  brand?: string;
  url?: string;
  priceCents?: string;
  currency?: string;
  labels?: string; // JSON array string
  origin?: string;
  materials?: string; // JSON array string
  repairScore?: string; // number or '-'
  packaging?: string;
  image?: string;
  keywords?: string; // JSON array string
  categories?: string; // JSON array string
  popularity?: string;
  ecoScore?: string;
};

const prisma = new PrismaClient();

function parseMaybeJsonArray(value?: string): string[] | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('[')) return null;
  try {
    const arr = JSON.parse(trimmed);
    return Array.isArray(arr) ? arr.map(String) : null;
  } catch {
    return null;
  }
}

function parseIntOrNull(v?: string): number | null {
  if (!v) return null;
  const t = v.trim();
  if (t === '-' || t === '') return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

async function upsertProductFromRow(row: Row, index: number) {
  // Required fields
  if (!row.name || !row.description) {
    throw new Error(`Row ${index}: missing name/description`);
  }

  const url = row.url?.trim();

  // Numeric fields
  const priceCents = parseIntOrNull(row.priceCents);
  const repairScoreRaw = parseIntOrNull(row.repairScore);
  const popularity = parseIntOrNull(row.popularity);
  const ecoScoreRaw = parseIntOrNull(row.ecoScore);

  const ecoScore = ecoScoreRaw == null ? null : clamp(ecoScoreRaw, 0, 100);
  const repairScore = repairScoreRaw == null ? null : clamp(repairScoreRaw, 0, 10);

  // Arrays
  const labels = parseMaybeJsonArray(row.labels);
  const materials = parseMaybeJsonArray(row.materials);
  const keywords = parseMaybeJsonArray(row.keywords);
  const categories = parseMaybeJsonArray(row.categories);

  // Basic validation for image: accept / path or http(s)
  const image = row.image?.trim();
  if (image && !(image.startsWith('/') || image.startsWith('http'))) {
    throw new Error(`Row ${index}: image must start with '/' or http(s)`);
  }

  const data = {
    name: row.name.trim(),
    description: row.description.trim(),
    brand: row.brand?.trim() || null,
    url: url || null,
    priceCents: priceCents ?? null,
    currency: (row.currency?.trim() || 'EUR'),
    labels: labels ? JSON.stringify(labels) : null,
    origin: row.origin?.trim() || null,
    materials: materials ? JSON.stringify(materials) : null,
    repairScore,
    packaging: row.packaging?.trim() || null,
    image: image || null,
    keywords: keywords ? JSON.stringify(keywords) : null,
    categories: categories ? JSON.stringify(categories) : null,
    popularity: popularity ?? null,
    ecoScore: ecoScore ?? null,
  } as const;

  if (url) {
    // Use URL as the de-facto unique key
    const existing = await prisma.product.findFirst({ where: { url } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data });
      return { action: 'update' as const };
    }
  }
  await prisma.product.create({ data });
  return { action: 'create' as const };
}

async function main() {
  const cwd = process.cwd();
  const csvPath = process.env.CSV_PATH
    ? path.resolve(cwd, process.env.CSV_PATH)
    : path.resolve(cwd, '..', 'tmp', 'articles.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const records: Row[] = parse(content, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    trim: true,
  });

  let created = 0;
  let updated = 0;
  const errors: { index: number; name?: string; error: string }[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    try {
      const res = await upsertProductFromRow(row, i + 2 /* 1-based with header */);
      if (res.action === 'create') created++;
      else updated++;
    } catch (e: any) {
      errors.push({ index: i + 2, name: row.name, error: e?.message || String(e) });
    }
  }

  console.log(`Imported products from ${path.relative(cwd, csvPath)}`);
  console.log(`Created: ${created}, Updated: ${updated}, Errors: ${errors.length}`);
  if (errors.length) {
    const reportPath = path.resolve(cwd, 'tmp_import_errors.json');
    fs.writeFileSync(reportPath, JSON.stringify(errors, null, 2), 'utf8');
    console.log(`Wrote error report: ${reportPath}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
