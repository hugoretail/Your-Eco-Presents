require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

function main() {
  const csvPath = process.env.CSV_PATH
    ? path.resolve(process.cwd(), process.env.CSV_PATH)
    : path.resolve(process.cwd(), '..', 'tmp', 'articles.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('CSV not found at', csvPath);
    process.exit(1);
  }
  const input = fs.readFileSync(csvPath, 'utf8');
  const rows = parse(input, { columns: true, skip_empty_lines: true, bom: true, trim: true });
  const total = rows.length;
  const urls = rows.map(r => (r.url || '').trim()).filter(u => u.length > 0);
  const blanks = total - urls.length;
  const set = new Set(urls);
  const distinct = set.size;
  const freq = new Map();
  for (const u of urls) freq.set(u, (freq.get(u) || 0) + 1);
  const dups = Array.from(freq.entries()).filter(([,c]) => c > 1).sort((a,b)=>b[1]-a[1]).slice(0,20);
  console.log(`CSV rows: ${total}`);
  console.log(`URLs (non-empty): ${urls.length}`);
  console.log(`Distinct URLs: ${distinct}`);
  console.log(`Blank URLs: ${blanks}`);
  if (dups.length) {
    console.log('Top duplicate URLs (first 20):');
    for (const [u,c] of dups) console.log(`  ${c}x ${u}`);
  } else {
    console.log('No duplicate URLs in CSV.');
  }
}

main();
