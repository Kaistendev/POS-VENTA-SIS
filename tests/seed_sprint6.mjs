import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('./dev.sqlite3');

const NOW = new Date();
const TODAY_START = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate());

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return parseFloat((Math.random() * (max - min) + min).toFixed(2)); }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }

try {
  // 1. CREATE 4 NEW CLIENTS
  const newClients = [
    { dni: '12345678', name: 'María García López', phone: '04121234567', code: `CLI-${Date.now()}-1`, tax_id: '12345678' },
    { dni: '23456789', name: 'Carlos Mendoza Rivas', phone: '04162345678', code: `CLI-${Date.now()}-2`, tax_id: '23456789' },
    { dni: '34567890', name: 'Ana Torres Huerta', phone: '04243456789', code: `CLI-${Date.now()}-3`, tax_id: '34567890' },
    { dni: '45678901', name: 'Pedro Sánchez Vega', phone: '04124567890', code: `CLI-${Date.now()}-4`, tax_id: '45678901' },
  ];

  const insertClient = db.prepare('INSERT INTO clients (dni, name, phone, code, tax_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const c of newClients) {
    insertClient.run(c.dni, c.name, c.phone, c.code, c.tax_id, NOW.toISOString(), NOW.toISOString());
  }
  console.log(`✓ Creados ${newClients.length} clientes`);

  // 2. READ EXISTING DATA
  const products = db.prepare('SELECT id, price_sale, price_purchase, stock FROM products').all();
  const registers = db.prepare('SELECT id FROM cash_registers').all();
  const allClients = db.prepare('SELECT id FROM clients').all();

  if (registers.length === 0) {
    console.error('No hay caja registradora abierta. Abre una caja primero.');
    process.exit(1);
  }

  const CASH_REGISTER_ID = registers[0].id;
  const TOTAL_SALES = 40;

  const insertSale = db.prepare(`INSERT INTO sales (cash_register_id, client_id, total, subtotal, tax_amount, discount_total, payment_method, exchange_rate, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertItem = db.prepare(`INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, purchase_price, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?');
  const insertMovement = db.prepare(`INSERT INTO inventory_movements (product_id, type, quantity, reason, created_at, updated_at) VALUES (?, 'SALIDA', ?, 'VENTA', ?, ?)`);

  let grandTotal = 0;
  let saleId;
  let itemsInserted = 0;

  for (let i = 0; i < TOTAL_SALES; i++) {
    const clientId = pick(allClients).id;
    const saleTime = new Date(TODAY_START.getTime() + rand(0, 86400000));
    const paymentMethods = ['CASH', 'CASH', 'CASH', 'CARD', 'CARD', 'YAPE', 'PLIN'];
    const paymentMethod = pick(paymentMethods);
    const numItems = rand(1, 4);

    let subtotal = 0;
    let saleItems = [];

    for (let j = 0; j < numItems; j++) {
      const product = pick(products);
      const qty = rand(1, 3);
      if (product.stock < qty) continue;

      const unitPrice = product.price_sale;
      const purchasePrice = product.price_purchase;
      subtotal += unitPrice * qty;
      saleItems.push({ productId: product.id, qty, unitPrice, purchasePrice });
    }

    if (saleItems.length === 0) {
      i--;
      continue;
    }

    const taxAmount = parseFloat((subtotal * 0.18).toFixed(2));
    const total = parseFloat((subtotal + taxAmount).toFixed(2));
    const discountTotal = 0;
    const exchangeRate = paymentMethod === 'CASH' ? 0 : parseFloat((Math.random() * 1 + 3.5).toFixed(3));
    grandTotal += total;

    const saleResult = insertSale.run(
      CASH_REGISTER_ID, clientId, total, subtotal, taxAmount, discountTotal,
      paymentMethod, exchangeRate, saleTime.toISOString(), saleTime.toISOString(),
    );
    saleId = saleResult.lastInsertRowid;

    for (const item of saleItems) {
      insertItem.run(saleId, item.productId, item.qty, item.unitPrice, item.purchasePrice, saleTime.toISOString(), saleTime.toISOString());
      updateStock.run(item.qty, item.productId, item.qty);
      insertMovement.run(item.productId, item.qty, saleTime.toISOString(), saleTime.toISOString());
      itemsInserted++;
    }
  }

  // Update cash register total
  const currentTotal = db.prepare('SELECT total_sales FROM cash_registers WHERE id = ?').get(CASH_REGISTER_ID);
  const newTotal = parseFloat((currentTotal.total_sales + grandTotal).toFixed(2));
  db.prepare('UPDATE cash_registers SET total_sales = ?, updated_at = ? WHERE id = ?').run(newTotal, NOW.toISOString(), CASH_REGISTER_ID);

  console.log(`✓ Creadas ${TOTAL_SALES} ventas con ${itemsInserted} items`);
  console.log(`✓ Total ventas del día: S/ ${grandTotal.toFixed(2)}`);
  console.log(`✓ Nuevo total en caja: S/ ${newTotal.toFixed(2)}`);
  console.log('\n✅ Seed completado exitosamente');

} catch (e) {
  console.error('Error:', e.message);
  process.exit(1);
} finally {
  db.close();
}
