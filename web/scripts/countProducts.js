require('dotenv').config();
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

(async () => {
  try {
    const count = await prisma.product.count();
    console.log('Product count:', count);
    const latest = await prisma.product.findFirst({ orderBy: { createdAt: 'desc' } });
    if (latest) {
      console.log('Latest product:', latest.name, latest.url || 'no-url');
    }
  } catch (e) {
    console.error('Error counting products:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
