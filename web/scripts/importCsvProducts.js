require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('../src/generated/prisma');

/** @typedef {{
 *  name: string; description: string; brand?: string; url?: string; priceCents?: string; currency?: string;
 *  labels?: string; origin?: string; materials?: string; repairScore?: string; packaging?: string; image?: string;
 *  keywords?: string; categories?: string; popularity?: string; ecoScore?: string; purchaseLinks?: string;
 * }} Row
 */

const prisma = new PrismaClient();

function parseMaybeJsonArray(value) {
  if (!value) return null;
  const t = String(value).trim();
  if (!t.startsWith('[')) return null;
  try {
    const v = JSON.parse(t);
    return Array.isArray(v) ? v.map(String) : null;
  } catch {
    return null;
  }
}

function parseIntOrNull(v) {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  if (!t || t === '-') return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function clamp(n, min, max) { return Math.min(max, Math.max(min, n)); }

async function upsertProductFromRow(row, index) {
  if (!row.name || !row.description) throw new Error(`Row ${index}: missing name/description`);

  const url = row.url ? String(row.url).trim() : null;
  const priceCents = parseIntOrNull(row.priceCents);
  const repairScoreRaw = parseIntOrNull(row.repairScore);
  const popularity = parseIntOrNull(row.popularity);
  const ecoScoreRaw = parseIntOrNull(row.ecoScore);
  const ecoScore = ecoScoreRaw == null ? null : clamp(ecoScoreRaw, 0, 100);
  const repairScore = repairScoreRaw == null ? null : clamp(repairScoreRaw, 0, 10);

  const labels = parseMaybeJsonArray(row.labels);
  const materials = parseMaybeJsonArray(row.materials);
  const keywords = parseMaybeJsonArray(row.keywords);
  const categories = parseMaybeJsonArray(row.categories);
  const purchaseLinks = parseMaybeJsonArray(row.purchaseLinks);

  const image = row.image ? String(row.image).trim() : null;
  if (image && !(image.startsWith('/') || image.startsWith('http'))) {
    throw new Error(`Row ${index}: image must start with '/' or http(s)`);
  }

  const data = {
    name: String(row.name).trim(),
    description: String(row.description).trim(),
    brand: row.brand ? String(row.brand).trim() : null,
    url,
    priceCents: priceCents ?? null,
    currency: (row.currency ? String(row.currency).trim() : 'EUR'),
    labels: labels ? JSON.stringify(labels) : null,
    origin: row.origin ? String(row.origin).trim() : null,
    materials: materials ? JSON.stringify(materials) : null,
    repairScore,
    packaging: row.packaging ? String(row.packaging).trim() : null,
    image,
    keywords: keywords ? JSON.stringify(keywords) : null,
    categories: categories ? JSON.stringify(categories) : null,
    popularity: popularity ?? null,
    ecoScore: ecoScore ?? null,
    purchaseLinks: purchaseLinks ? JSON.stringify(purchaseLinks) : (url ? JSON.stringify([{ label: 'Acheter', url }]) : null),
  };

  if (url) {
    // Prefer matching by (url + name) to allow multiple distinct products sharing the same domain/root page
    const existingSamePair = await prisma.product.findFirst({ where: { url, name: data.name } });
    if (existingSamePair) {
      await prisma.product.update({ where: { id: existingSamePair.id }, data });
      return 'update';
    }
    // If a record exists with same URL but different name, create a new one to keep items distinct
    const existingSameUrl = await prisma.product.findFirst({ where: { url } });
    if (existingSameUrl) {
      await prisma.product.create({ data });
      return 'create';
    }
  }
  await prisma.product.create({ data });
  return 'create';
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
  let records = parse(content, { columns: true, skip_empty_lines: true, bom: true, trim: true });
  const max = process.env.CSV_MAX ? parseInt(process.env.CSV_MAX, 10) : null;
  if (max && Number.isFinite(max)) {
    records = records.slice(0, max);
  }

  console.log(`Found ${records.length} records in ${path.relative(cwd, csvPath)}. Starting import...`);
  const started = Date.now();

  let created = 0, updated = 0;
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    try {
      const res = await upsertProductFromRow(row, i + 2);
      if (res === 'create') created++; else updated++;
    } catch (e) {
      errors.push({ index: i + 2, name: row?.name, error: e?.message || String(e) });
    }
    if (i > 0 && i % 100 === 0) {
      const elapsed = Math.round((Date.now() - started) / 1000);
      console.log(`Progress: ${i}/${records.length} rows... Created=${created}, Updated=${updated}, Errors=${errors.length} (elapsed ${elapsed}s)`);
    }
  }

  const totalElapsed = Math.round((Date.now() - started) / 1000);
  console.log(`Imported products from ${path.relative(cwd, csvPath)} in ${totalElapsed}s`);
  console.log(`Created: ${created}, Updated: ${updated}, Errors: ${errors.length}`);
  if (errors.length) {
    const reportPath = path.resolve(cwd, 'tmp_import_errors.json');
    fs.writeFileSync(reportPath, JSON.stringify(errors, null, 2), 'utf8');
    console.log(`Wrote error report: ${reportPath}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
