import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const prisma = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! }) });

const SUPPLIERS = [
  { name: 'Distribuidora Central S.A.', ruc: '20123456789', phone: '555-1001', email: 'ventas@distcentral.com', address: 'Av. Principal 123, Centro' },
  { name: 'Alimentos del Norte SAC', ruc: '20234567890', phone: '555-1002', email: 'pedidos@alimentosnorte.com', address: 'Calle Comercial 456, Norte' },
  { name: 'Lácteos La Vaquita', ruc: '20345678901', phone: '555-1003', email: 'comercial@lavequita.com', address: 'Jr. Ganadero 789, Este' },
  { name: 'Carnes Premium SRL', ruc: '20456789012', phone: '555-1004', email: 'ventas@carnespremium.pe', address: 'Av. Industrial 321, Sur' },
  { name: 'Bebidas Refrescantes SA', ruc: '20567890123', phone: '555-1005', email: 'distribucion@bebidasrefres.com', address: 'Carretera Central Km 25' },
];

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱 Starting purchases seed...');

  // Get existing products
  const products = await prisma.product.findMany({
    where: { stock: { lt: 50 } }, // Products that need restocking
    take: 30,
  });

  if (products.length === 0) {
    console.log('❌ No products found');
    return;
  }

  console.log(`📦 Found ${products.length} products to restock`);

  // Create suppliers
  const suppliers = [];
  for (const s of SUPPLIERS) {
    const existing = await prisma.supplier.findFirst({ where: { ruc: s.ruc } });
    if (existing) {
      suppliers.push(existing);
    } else {
      const created = await prisma.supplier.create({ data: s });
      suppliers.push(created);
    }
  }
  console.log(`✅ ${suppliers.length} suppliers ready`);

  // Generate 10 purchases across different dates (May - July 2026)
  const startDate = new Date('2026-05-01');
  const endDate = new Date('2026-07-20');
  
  const purchaseDates: Date[] = [];
  for (let i = 0; i < 10; i++) {
    const date = getRandomDate(startDate, endDate);
    date.setHours(getRandomInt(8, 16), getRandomInt(0, 59), 0, 0);
    purchaseDates.push(date);
  }
  purchaseDates.sort((a, b) => a.getTime() - b.getTime());

  let totalPurchasesAmount = 0;
  let totalItemsReceived = 0;

  for (let i = 0; i < 10; i++) {
    const purchaseDate = purchaseDates[i];
    const supplier = suppliers[getRandomInt(0, suppliers.length - 1)];
    
    // Select 3-8 random products for this purchase
    const numProducts = getRandomInt(3, 8);
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
    const selectedProducts = shuffledProducts.slice(0, numProducts);

    let totalAmount = 0;
    const purchaseItems = [];

    for (const product of selectedProducts) {
      const quantity = getRandomInt(10, 50); // Restock quantities
      const unitCost = product.price_purchase * (0.9 + Math.random() * 0.2); // ±10% variation
      const itemTotal = unitCost * quantity;
      totalAmount += itemTotal;

      purchaseItems.push({
        product_id: product.id,
        quantity,
        unit_cost: parseFloat(unitCost.toFixed(2)),
      });
    }

    // Create purchase
    const purchase = await prisma.purchase.create({
      data: {
        supplier_id: supplier.id,
        total_amount: parseFloat(totalAmount.toFixed(2)),
        status: 'RECEIVED',
        payment_status: ['PAID', 'UNPAID'][getRandomInt(0, 1)],
        created_at: purchaseDate,
        items: {
          create: purchaseItems,
        },
      },
      include: { items: true },
    });

    totalPurchasesAmount += totalAmount;
    totalItemsReceived += purchase.items.length;

    // Update product stock and create inventory movements
    for (const item of purchase.items) {
      await prisma.product.update({
        where: { id: item.product_id },
        data: { stock: { increment: item.quantity } },
      });

      await prisma.inventoryMovement.create({
        data: {
          product_id: item.product_id,
          type: 'ENTRADA',
          quantity: item.quantity,
          reason: 'COMPRA',
          created_at: purchaseDate,
        },
      });
    }

    console.log(`✅ Purchase ${i + 1}/10 - ${purchaseDate.toLocaleDateString()} - ${supplier.name} - $${totalAmount.toFixed(2)} - ${purchase.items.length} products - ${purchase.items.reduce((sum, i) => sum + i.quantity, 0)} units`);
  }

  console.log(`\n🎉 Purchases seed completed!`);
  console.log(`   - 10 purchases created`);
  console.log(`   - ${totalItemsReceived} items received across purchases`);
  console.log(`   - Total purchase amount: $${totalPurchasesAmount.toFixed(2)}`);
  console.log(`   - Inventory updated for restocked products`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });