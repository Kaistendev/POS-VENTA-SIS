import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;

console.log('🌱 Starting seed...');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
      dni: '12345678',
      name: 'Cliente Genérico',
      code: 'GEN-001',
      phone: '+51999999999',
      tax_id: '20123456789',
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
