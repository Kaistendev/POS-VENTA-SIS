import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
});

const PRODUCTS = [
  { sku: 'PROD-001', name: 'Arroz Blanco 1kg', description: 'Arroz blanco grano largo', price_purchase: 2.50, price_sale: 4.00, stock: 100, min_stock: 10 },
  { sku: 'PROD-002', name: 'Azúcar Blanca 1kg', description: 'Azúcar refinada blanca', price_purchase: 1.80, price_sale: 3.00, stock: 80, min_stock: 10 },
  { sku: 'PROD-003', name: 'Aceite Vegetal 1L', description: 'Aceite de girasol', price_purchase: 3.50, price_sale: 5.50, stock: 60, min_stock: 5 },
  { sku: 'PROD-004', name: 'Leche Entera 1L', description: 'Leche pasteurizada entera', price_purchase: 1.20, price_sale: 2.00, stock: 50, min_stock: 10 },
  { sku: 'PROD-005', name: 'Pan de Molde', description: 'Pan de molde blanco 500g', price_purchase: 1.00, price_sale: 1.80, stock: 40, min_stock: 5 },
  { sku: 'PROD-006', name: 'Huevos Docena', description: 'Huevos blancos docena', price_purchase: 2.00, price_sale: 3.50, stock: 30, min_stock: 5 },
  { sku: 'PROD-007', name: 'Pollo 1kg', description: 'Pollo entero fresco', price_purchase: 4.00, price_sale: 6.50, stock: 25, min_stock: 5 },
  { sku: 'PROD-008', name: 'Carne Res 1kg', description: 'Carne de res molida', price_purchase: 6.00, price_sale: 9.50, stock: 20, min_stock: 3 },
  { sku: 'PROD-009', name: 'Pescado 1kg', description: 'Filete de pescado fresco', price_purchase: 5.00, price_sale: 8.00, stock: 15, min_stock: 3 },
  { sku: 'PROD-010', name: 'Papas 1kg', description: 'Papas blancas', price_purchase: 0.80, price_sale: 1.50, stock: 100, min_stock: 10 },
  { sku: 'PROD-011', name: 'Cebolla 1kg', description: 'Cebolla amarilla', price_purchase: 0.70, price_sale: 1.30, stock: 80, min_stock: 10 },
  { sku: 'PROD-012', name: 'Tomate 1kg', description: 'Tomate rojo maduro', price_purchase: 1.00, price_sale: 1.80, stock: 60, min_stock: 5 },
  { sku: 'PROD-013', name: 'Zanahoria 1kg', description: 'Zanahoria naranja', price_purchase: 0.60, price_sale: 1.20, stock: 70, min_stock: 5 },
  { sku: 'PROD-014', name: 'Lechuga Unidad', description: 'Lechuga crespa', price_purchase: 0.50, price_sale: 1.00, stock: 40, min_stock: 5 },
  { sku: 'PROD-015', name: 'Plátano 1kg', description: 'Plátano maduro', price_purchase: 0.90, price_sale: 1.50, stock: 50, min_stock: 5 },
  { sku: 'PROD-016', name: 'Manzana 1kg', description: 'Manzana roja', price_purchase: 1.50, price_sale: 2.50, stock: 45, min_stock: 5 },
  { sku: 'PROD-017', name: 'Naranja 1kg', description: 'Naranja para jugo', price_purchase: 1.00, price_sale: 1.80, stock: 55, min_stock: 5 },
  { sku: 'PROD-018', name: 'Yogur Natural 1L', description: 'Yogur natural sin azúcar', price_purchase: 1.80, price_sale: 3.00, stock: 35, min_stock: 5 },
  { sku: 'PROD-019', name: 'Queso Fresco 500g', description: 'Queso fresco tipo campesino', price_purchase: 2.50, price_sale: 4.50, stock: 30, min_stock: 3 },
  { sku: 'PROD-020', name: 'Mantequilla 250g', description: 'Mantequilla con sal', price_purchase: 1.50, price_sale: 2.80, stock: 25, min_stock: 3 },
  { sku: 'PROD-021', name: 'Café Molido 500g', description: 'Café tostado molido', price_purchase: 4.00, price_sale: 7.00, stock: 20, min_stock: 3 },
  { sku: 'PROD-022', name: 'Té Negro 20 bolsas', description: 'Té negro en bolsitas', price_purchase: 1.20, price_sale: 2.50, stock: 40, min_stock: 5 },
  { sku: 'PROD-023', name: 'Galletas Saladas 200g', description: 'Galletas tipo soda', price_purchase: 0.80, price_sale: 1.50, stock: 60, min_stock: 5 },
  { sku: 'PROD-024', name: 'Galletas Dulces 300g', description: 'Galletas con chispas de chocolate', price_purchase: 1.00, price_sale: 2.00, stock: 50, min_stock: 5 },
  { sku: 'PROD-025', name: 'Chocolate 100g', description: 'Chocolate amargo 70%', price_purchase: 1.50, price_sale: 3.00, stock: 30, min_stock: 3 },
  { sku: 'PROD-026', name: 'Mermelada Fresa 400g', description: 'Mermelada de fresa natural', price_purchase: 1.20, price_sale: 2.50, stock: 25, min_stock: 3 },
  { sku: 'PROD-027', name: 'Miel 500g', description: 'Miel de abeja pura', price_purchase: 3.00, price_sale: 5.50, stock: 15, min_stock: 2 },
  { sku: 'PROD-028', name: 'Sal 1kg', description: 'Sal de mesa yodada', price_purchase: 0.30, price_sale: 0.60, stock: 100, min_stock: 10 },
  { sku: 'PROD-029', name: 'Pimienta 50g', description: 'Pimienta negra molida', price_purchase: 1.00, price_sale: 2.00, stock: 40, min_stock: 5 },
  { sku: 'PROD-030', name: 'Comino 50g', description: 'Comino molido', price_purchase: 0.80, price_sale: 1.50, stock: 35, min_stock: 5 },
  { sku: 'PROD-031', name: 'Pasta Espagueti 500g', description: 'Pasta de trigo duro', price_purchase: 0.70, price_sale: 1.30, stock: 80, min_stock: 10 },
  { sku: 'PROD-032', name: 'Fideos 500g', description: 'Fideos para sopa', price_purchase: 0.60, price_sale: 1.20, stock: 70, min_stock: 10 },
  { sku: 'PROD-033', name: 'Lentejas 1kg', description: 'Lentejas pardinas', price_purchase: 1.50, price_sale: 2.80, stock: 40, min_stock: 5 },
  { sku: 'PROD-034', name: 'Frijoles Negros 1kg', description: 'Frijoles negros secos', price_purchase: 1.80, price_sale: 3.00, stock: 35, min_stock: 5 },
  { sku: 'PROD-035', name: 'Garbanzos 1kg', description: 'Garbanzos secos', price_purchase: 1.60, price_sale: 2.80, stock: 30, min_stock: 5 },
  { sku: 'PROD-036', name: 'Atún en Lata', description: 'Atún en aceite vegetal 170g', price_purchase: 1.20, price_sale: 2.20, stock: 50, min_stock: 5 },
  { sku: 'PROD-037', name: 'Sardinas en Lata', description: 'Sardinas en salsa de tomate', price_purchase: 0.90, price_sale: 1.80, stock: 45, min_stock: 5 },
  { sku: 'PROD-038', name: 'Maíz en Lata', description: 'Granos de maíz dulce', price_purchase: 0.70, price_sale: 1.30, stock: 60, min_stock: 5 },
  { sku: 'PROD-039', name: 'Champiñones en Lata', description: 'Champiñones laminados', price_purchase: 1.00, price_sale: 1.80, stock: 35, min_stock: 3 },
  { sku: 'PROD-040', name: 'Aceitunas Verdes 300g', description: 'Aceitunas verdes sin hueso', price_purchase: 1.50, price_sale: 2.80, stock: 25, min_stock: 3 },
];

const CLIENTS = [
  { dni: '12345678', name: 'Juan Pérez García', phone: '555-0101', code: 'CLI-001', tax_id: '12345678-1' },
  { dni: '23456789', name: 'María González López', phone: '555-0202', code: 'CLI-002', tax_id: '23456789-2' },
  { dni: '34567890', name: 'Carlos Rodríguez Martín', phone: '555-0303', code: 'CLI-003', tax_id: '34567890-3' },
  { dni: '45678901', name: 'Ana Fernández Ruiz', phone: '555-0404', code: 'CLI-004', tax_id: '45678901-4' },
];

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱 Starting comprehensive seed...');

  // Check if admin user already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { username: 'admin' },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.create({
      data: {
        username: 'admin',
        password_hash: hashedPassword,
        role: 'admin',
      },
    });
    console.log('✅ Admin user created:', { id: adminUser.id, username: adminUser.username });
  } else {
    console.log('✅ Admin user already exists');
  }

  // Create categories first
  const categoriesData = [
    { name: 'Granos y Cereales' },
    { name: 'Carnes y Pescados' },
    { name: 'Lácteos y Huevos' },
    { name: 'Frutas y Verduras' },
    { name: 'Despensa y Conservas' },
    { name: 'Condimentos y Especias' },
    { name: 'Panadería y Repostería' },
    { name: 'Bebidas' },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const existing = await prisma.category.findFirst({ where: { name: cat.name } });
    if (existing) {
      categories.push(existing);
    } else {
      const created = await prisma.category.create({ data: cat });
      categories.push(created);
    }
  }
  console.log(`✅ ${categories.length} categories ready`);

  // Create products with categories
  const products = [];
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    let categoryId: number | null = null;
    
    if (i < 6) categoryId = categories[0].id; // Granos
    else if (i < 10) categoryId = categories[1].id; // Carnes
    else if (i < 14) categoryId = categories[2].id; // Lácteos
    else if (i < 22) categoryId = categories[3].id; // Frutas/Verduras
    else if (i < 30) categoryId = categories[4].id; // Despensa
    else if (i < 34) categoryId = categories[5].id; // Condimentos
    else if (i < 37) categoryId = categories[6].id; // Panadería
    else categoryId = categories[7].id; // Bebidas

    const existing = await prisma.product.findFirst({ where: { sku: p.sku } });
    if (existing) {
      products.push(existing);
    } else {
      const created = await prisma.product.create({
        data: {
          ...p,
          category_id: categoryId,
        },
      });
      products.push(created);
    }
  }
  console.log(`✅ ${products.length} products created`);

  // Create clients
  const clients = [];
  for (const c of CLIENTS) {
    const existing = await prisma.client.findFirst({ where: { dni: c.dni } });
    if (existing) {
      clients.push(existing);
    } else {
      const created = await prisma.client.create({ data: c });
      clients.push(created);
    }
  }
  console.log(`✅ ${clients.length} clients created`);

  // Create a cash register for sales
  const cashRegister = await prisma.cashRegister.create({
    data: {
      opening_amount: 500.00,
      status: 'PERFECT',
    },
  });
  console.log('✅ Cash register created:', cashRegister.id);

  // Generate 35 sales on different days (spanning ~2 months)
  const startDate = new Date('2026-05-01');
  const endDate = new Date('2026-07-20');
  
  // Create 35 distinct dates
  const saleDates: Date[] = [];
  for (let i = 0; i < 35; i++) {
    const date = getRandomDate(startDate, endDate);
    // Set to random time during business hours (8am - 8pm)
    date.setHours(getRandomInt(8, 20), getRandomInt(0, 59), 0, 0);
    saleDates.push(date);
  }
  // Sort dates chronologically
  saleDates.sort((a, b) => a.getTime() - b.getTime());

  let totalSales = 0;
  for (let i = 0; i < 35; i++) {
    const saleDate = saleDates[i];
    const client = clients[getRandomInt(0, clients.length - 1)];
    
    // Random number of items per sale (1-8)
    const numItems = getRandomInt(1, 8);
    const shuffledProducts = [...products].sort(() => 0.5 - Math.random());
    const selectedProducts = shuffledProducts.slice(0, numItems);

    let subtotal = 0;
    const saleItems = [];

    for (const product of selectedProducts) {
      const quantity = getRandomInt(1, 5);
      const unitPrice = product.price_sale;
      const purchasePrice = product.price_purchase;
      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      saleItems.push({
        product_id: product.id,
        quantity,
        unit_price: unitPrice,
        purchase_price: purchasePrice,
        discount_amount: 0,
        final_unit_price: unitPrice,
      });
    }

    const taxAmount = subtotal * 0.13; // 13% tax
    const total = subtotal + taxAmount;

    const sale = await prisma.sale.create({
      data: {
        cash_register_id: cashRegister.id,
        client_id: client.id,
        subtotal,
        tax_amount: taxAmount,
        discount_total: 0,
        total,
        payment_method: ['CASH', 'CARD', 'TRANSFER'][getRandomInt(0, 2)],
        created_at: saleDate,
        items: {
          create: saleItems,
        },
      },
      include: { items: true },
    });

    totalSales += total;
    console.log(`✅ Sale ${i + 1}/35 created - ${saleDate.toLocaleDateString()} - $${total.toFixed(2)} - ${sale.items.length} items`);

    // Update product stock
    for (const item of sale.items) {
      await prisma.product.update({
        where: { id: item.product_id },
        data: { stock: { decrement: item.quantity } },
      });
      
      // Create inventory movement for the sale
      await prisma.inventoryMovement.create({
        data: {
          product_id: item.product_id,
          type: 'SALIDA',
          quantity: item.quantity,
          reason: 'VENTA',
          created_at: saleDate,
        },
      });
    }
  }

  // Update cash register totals
  await prisma.cashRegister.update({
    where: { id: cashRegister.id },
    data: { total_sales: totalSales },
  });

  console.log(`\n🎉 Seed completed successfully!`);
  console.log(`   - ${products.length} products`);
  console.log(`   - ${clients.length} clients`);
  console.log(`   - 35 sales across ${new Set(saleDates.map(d => d.toDateString())).size} different days`);
  console.log(`   - Total sales: $${totalSales.toFixed(2)}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });