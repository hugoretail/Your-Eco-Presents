// Plain CommonJS seed script to avoid ts-node ESM loader issues
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
// IMPORTANT: Prisma client is generated to src/generated/prisma (custom output) in this project
const { PrismaClient } = require('../src/generated/prisma');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars');
    process.exit(1);
  }
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    // Use string values for enum fields to avoid requiring enum imports in CJS
    update: { passwordHash, role: 'ADMIN', confirmed: true },
    create: { email, passwordHash, role: 'ADMIN', confirmed: true },
  });

  console.log(user.createdAt ? 'Admin created:' : 'Admin upserted:', email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
