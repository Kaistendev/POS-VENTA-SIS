import 'dotenv/config';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! })
});

const categories = [
  { name: 'Bebidas' },
  { name: 'Lácteos' },
  { name: 'Panadería' },
  { name: 'Limpieza' },
  { name: 'Despensa' },
];

const products = [
  { name: 'Coca-Cola 2L', sku: 'BEB-001', cat: 'Bebidas', pCompra: 8.50, pVenta: 14.00, stock: 50 },
  { name: 'Agua Mineral 1.5L', sku: 'BEB-002', cat: 'Bebidas', pCompra: 3.20, pVenta: 6.00, stock: 80 },
  { name: 'Jugo de Naranja 1L', sku: 'BEB-003', cat: 'Bebidas', pCompra: 5.00, pVenta: 9.50, stock: 40 },
  { name: 'Cerveza IPA 330ml', sku: 'BEB-004', cat: 'Bebidas', pCompra: 12.00, pVenta: 22.00, stock: 30 },
  { name: 'Energizante Monster 500ml', sku: 'BEB-005', cat: 'Bebidas', pCompra: 10.00, pVenta: 18.00, stock: 25 },
  { name: 'Leche Entera 1L', sku: 'LAC-001', cat: 'Lácteos', pCompra: 6.00, pVenta: 11.00, stock: 60 },
  { name: 'Yogurt Natural 200g', sku: 'LAC-002', cat: 'Lácteos', pCompra: 4.50, pVenta: 8.00, stock: 45 },
  { name: 'Queso Fresco 500g', sku: 'LAC-003', cat: 'Lácteos', pCompra: 15.00, pVenta: 26.00, stock: 20 },
  { name: 'Mantequilla 250g', sku: 'LAC-004', cat: 'Lácteos', pCompra: 7.00, pVenta: 13.00, stock: 35 },
  { name: 'Crema de Leche 200ml', sku: 'LAC-005', cat: 'Lácteos', pCompra: 5.50, pVenta: 10.00, stock: 30 },
  { name: 'Pan de Molde Blanco', sku: 'PAN-001', cat: 'Panadería', pCompra: 4.00, pVenta: 7.50, stock: 40 },
  { name: 'Pan Integral 500g', sku: 'PAN-002', cat: 'Panadería', pCompra: 5.00, pVenta: 9.00, stock: 35 },
  { name: 'Galletas de Chocolate 200g', sku: 'PAN-003', cat: 'Panadería', pCompra: 6.50, pVenta: 12.00, stock: 50 },
  { name: 'Bizcocho 400g', sku: 'PAN-004', cat: 'Panadería', pCompra: 8.00, pVenta: 15.00, stock: 20 },
  { name: 'Pan Frances (unidad)', sku: 'PAN-005', cat: 'Panadería', pCompra: 0.80, pVenta: 1.50, stock: 100 },
  { name: 'Detergente Líquido 1L', sku: 'LIM-001', cat: 'Limpieza', pCompra: 11.00, pVenta: 19.00, stock: 30 },
  { name: 'Cloro 1L', sku: 'LIM-002', cat: 'Limpieza', pCompra: 4.00, pVenta: 7.00, stock: 40 },
  { name: 'Lavavajillas 500ml', sku: 'LIM-003', cat: 'Limpieza', pCompra: 7.50, pVenta: 14.00, stock: 25 },
  { name: 'Desinfectante Aerosol 400ml', sku: 'LIM-004', cat: 'Limpieza', pCompra: 9.00, pVenta: 16.00, stock: 20 },
  { name: 'Esponja Multiusos 3pk', sku: 'LIM-005', cat: 'Limpieza', pCompra: 3.00, pVenta: 5.50, stock: 60 },
  { name: 'Arroz 1kg', sku: 'DES-001', cat: 'Despensa', pCompra: 4.50, pVenta: 8.00, stock: 80 },
  { name: 'Fideos Spaghetti 500g', sku: 'DES-002', cat: 'Despensa', pCompra: 3.00, pVenta: 5.50, stock: 70 },
  { name: 'Aceite Vegetal 1L', sku: 'DES-003', cat: 'Despensa', pCompra: 10.00, pVenta: 18.00, stock: 40 },
  { name: 'Azúcar Blanca 1kg', sku: 'DES-004', cat: 'Despensa', pCompra: 4.00, pVenta: 7.00, stock: 60 },
  { name: 'Sal 500g', sku: 'DES-005', cat: 'Despensa', pCompra: 1.50, pVenta: 3.00, stock: 90 },
  { name: 'Café Molido 250g', sku: 'DES-006', cat: 'Despensa', pCompra: 14.00, pVenta: 25.00, stock: 25 },
  { name: 'Atún en Lata 180g', sku: 'DES-007', cat: 'Despensa', pCompra: 5.00, pVenta: 9.00, stock: 50 },
  { name: 'Galletas Soda 130g', sku: 'DES-008', cat: 'Despensa', pCompra: 2.50, pVenta: 4.50, stock: 65 },
  { name: 'Harina de Trigo 1kg', sku: 'DES-009', cat: 'Despensa', pCompra: 3.50, pVenta: 6.50, stock: 45 },
  { name: 'Lentejas 500g', sku: 'DES-010', cat: 'Despensa', pCompra: 4.00, pVenta: 7.50, stock: 55 },
];

async function main() {
  console.log('Insertando categorías...');
  const catMap: Record<string, number> = {};
  for (const c of categories) {
    let cat = await prisma.category.findFirst({ where: { name: c.name } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: c.name } });
    }
    catMap[c.name] = cat.id;
    console.log(`  ✅ Categoría: ${cat.name} (id: ${cat.id})`);
  }

  console.log('\nInsertando productos...');
  let count = 0;
  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (existing) {
      console.log(`  ⏭️  ${p.name} (${p.sku}) ya existe, saltando`);
      continue;
    }
    await prisma.product.create({
      data: {
        sku: p.sku,
        name: p.name,
        category_id: catMap[p.cat],
        price_purchase: p.pCompra,
        price_sale: p.pVenta,
        stock: p.stock,
        min_stock: 5,
        description: `Producto de prueba: ${p.name}`,
      },
    });
    count++;
    console.log(`  ✅ ${p.name} — S/ ${p.pVenta.toFixed(2)} (compra: S/ ${p.pCompra.toFixed(2)}) — stock: ${p.stock}`);
  }

  console.log(`\n🎉 ${count} productos insertados correctamente.`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
