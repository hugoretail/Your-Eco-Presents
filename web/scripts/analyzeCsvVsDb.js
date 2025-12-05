require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { PrismaClient } = require('../src/generated/prisma');

const prisma = new PrismaClient();

async function main() {
  const csvPath = process.env.CSV_PATH
    ? path.resolve(process.cwd(), process.env.CSV_PATH)
    : path.resolve(process.cwd(), '..', 'tmp', 'articles.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found at', csvPath);
    process.exit(1);
  }
  const input = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(input, { columns: true, skip_empty_lines: true, bom: true, trim: true });
  const csvUrls = new Set(rows.map(r => (r.url || '').trim()).filter(Boolean));

  const dbProducts = await prisma.product.findMany({ select: { url: true } });
  const dbUrls = new Set(dbProducts.map(p => (p.url || '').trim()).filter(Boolean));

  let present = 0, newOnes = 0;
  for (const u of csvUrls) {
    if (dbUrls.has(u)) present++; else newOnes++;
  }
  console.log(`Distinct CSV URLs: ${csvUrls.size}`);
  console.log(`DB URLs: ${dbUrls.size}`);
  console.log(`Already in DB: ${present}`);
  console.log(`New (not in DB): ${newOnes}`);
}

main().catch(e=>{console.error(e); process.exit(1);}).finally(async()=>{await prisma.$disconnect();});
