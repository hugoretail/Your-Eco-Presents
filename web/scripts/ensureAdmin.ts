import { prisma } from "../src/lib/prisma";
import bcrypt from "bcrypt";

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "adminpass";
  const hash = await bcrypt.hash(password, 12);
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hash, role: "ADMIN", confirmed: true, confirmToken: null }
    });
    console.log("Admin mis à jour et confirmé.");
  } else {
    await prisma.user.create({
      data: { email, passwordHash: hash, role: "ADMIN", confirmed: true }
    });
    console.log("Admin créé et confirmé.");
  }
  process.exit(0);
}

ensureAdmin();
