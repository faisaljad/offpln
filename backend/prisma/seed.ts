import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admin user only — no sample properties, investments, or investors
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@offplan.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@offplan.com',
      password: adminPassword,
      role: Role.SUPER_ADMIN,
      isVerified: true,
    },
  });

  console.log('Seed complete!');
  console.log('Admin: admin@offplan.com / Admin@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
