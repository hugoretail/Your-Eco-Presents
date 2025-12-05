require('dotenv').config();
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    const products = await prisma.product.findMany({ select: { id: true, name: true, url: true } });
    const counts = new Map();
    for (const p of products) {
      const key = p.url || 'NULL';
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    const dupes = [...counts.entries()]
      .filter(([k, c]) => k !== 'NULL' && c > 1)
      .sort((a, b) => b[1] - a[1]);
    const nullCount = counts.get('NULL') || 0;

    console.log(`Total products: ${products.length}`);
    console.log(`URLs with duplicates: ${dupes.length}`);

    if (dupes.length) {
      console.log('Top 10 duplicate URLs:');
      const urlToNames = new Map();
      for (const p of products) {
        if (p.url && (counts.get(p.url) || 0) > 1) {
          const arr = urlToNames.get(p.url) || [];
          if (arr.length < 5) arr.push(p.name);
          urlToNames.set(p.url, arr);
        }
      }
      dupes.slice(0, 10).forEach(([url, c]) => {
        const sample = (urlToNames.get(url) || []).join(' | ');
        console.log(`- ${url} -> ${c} items (e.g., ${sample})`);
      });
    }

    console.log(`Products with null URL: ${nullCount}`);
  } catch (e) {
    console.error('Audit failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
