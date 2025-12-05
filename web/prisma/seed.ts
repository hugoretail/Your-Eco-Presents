import bcrypt from 'bcrypt';
import { PrismaClient, UserRole } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD env vars');
    process.exit(1);
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin already exists:', email);
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: UserRole.ADMIN,
    }
  });
  console.log('Admin created:', email);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
