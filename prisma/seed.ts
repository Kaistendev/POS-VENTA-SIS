import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists. Skipping seed.');
    return;
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      password_hash: hashedPassword,
      role: 'admin',
    },
  });

  console.log('✅ Admin user created:', {
    id: adminUser.id,
    username: adminUser.username,
    role: adminUser.role,
  });

  // Create a sample client
  const sampleClient = await prisma.client.create({
    data: {
      dni: '00000000',
      name: 'Cliente General',
      code: 'CLI-GENERAL',
    },
  });

  console.log('✅ Sample client created:', {
    id: sampleClient.id,
    name: sampleClient.name,
    code: sampleClient.code,
  });

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
