import type { User, Product, Client, Category, Supplier, CashRegister, Sale, Discount, InventoryMovement, DashboardStats, WeeklySalesEntry, SalesByPaymentEntry, TopProductEntry, TopClientEntry, SalesByHourEntry, CashRegisterSummary, InventoryMetrics, LowStockProduct } from '../../domain/models';
import type { CreateProductDTO, UpdateProductDTO, CreateClientDTO, UpdateClientDTO, CreateCategoryDTO, UpdateCategoryDTO, CreateSupplierDTO, UpdateSupplierDTO, CreateDiscountDTO, UpdateDiscountDTO, CreatePurchaseDTO, TaxSettingsDTO, SalesStatsDTO, CashCloseDTO, SaleReceiptDTO, SaleReceiptItemDTO, ReportRequestDTO } from '../../domain/dtos';
import { getSeedData, type AppData } from './seed';
import { generateDailySalesPDF, generateSalesSummaryPDF, generateInventoryPDF, generateLowStockPDF, generateTopProductsPDF, generateProfitSummaryPDF, generateSaleReceiptPDF, generateCashClosePDF } from './reportGenerator';
import { kvGet, kvSet, migrateFromLocalStorage } from './db';

const STORAGE_KEY = 'pos-web-data';
const SESSION_KEY = 'pos-web-session';

let currentUser: User | null = null;
let currentSession: { id: number; username: string; role: string } | null = null;

function loadSession(data: AppData) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const user = data.users.find(u => u.id === parsed.id);
      if (user) {
        currentSession = parsed;
        currentUser = { id: user.id, username: user.username, role: user.role, security_question: user.security_question, created_at: user.created_at, updated_at: user.updated_at };
      } else {
        sessionStorage.removeItem(SESSION_KEY);
      }
    }
  } catch { }
}

async function loadData(): Promise<AppData> {
  try {
    const raw = await kvGet<AppData>(STORAGE_KEY);
    if (raw) {
      Object.keys(raw).forEach(k => {
        if (Array.isArray((raw as any)[k])) {
          (raw as any)[k] = (raw as any)[k].map((item: any) => ({
            ...item,
            created_at: item.created_at ? new Date(item.created_at) : new Date(),
            updated_at: item.updated_at ? new Date(item.updated_at) : new Date(),
            ...(item.opened_at ? { opened_at: new Date(item.opened_at) } : {}),
            ...(item.closed_at ? { closed_at: item.closed_at ? new Date(item.closed_at) : null } : {}),
          }));
        }
      });
      if (!raw.reportLogs) (raw as any).reportLogs = [];
      return raw;
    }
  } catch { }
  const seed = getSeedData();
  await kvSet(STORAGE_KEY, seed);
  return seed;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingData: AppData | null = null;

function saveData(data: AppData) {
  pendingData = data;
  if (!saveTimer) {
    saveTimer = setTimeout(() => {
      const d = pendingData;
      pendingData = null;
      saveTimer = null;
      if (d) kvSet(STORAGE_KEY, d).catch(() => {});
    }, 400);
  }
}

function flushSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  const d = pendingData;
  pendingData = null;
  if (d) {
    kvSet(STORAGE_KEY, d).catch(() => {});
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
  }
}

function ok<T>(data: T): T { return data; }

function ipcOk<T>(data?: T): { success: true; data?: T } & Record<string, any> {
  return { success: true, ...(data ? { data } : {}) };
}

function nextId(data: AppData, key: string): number {
  const id = data.nextId[key] || 1;
  data.nextId[key] = id + 1;
  return id;
}

function paginate<T>(items: T[], search?: string, searchFields?: (keyof T)[]): T[] {
  if (!search || !searchFields) return items;
  const q = search.toLowerCase();
  return items.filter(item => searchFields.some(f => String(item[f] ?? '').toLowerCase().includes(q)));
}

export async function setupMockApi() {
  await migrateFromLocalStorage();
  const data = await loadData();
  loadSession(data);

  window.addEventListener('beforeunload', flushSave);

  try { localStorage.removeItem(STORAGE_KEY); } catch {}

  window.api = {
    // ── Dialog ──
    showConfirmDialog: async (options) => window.confirm(options.message),

    // ── Health ──
    checkHealth: async () => ({ status: 'ok', timestamp: new Date().toISOString() }),

    // ── Setup ──
    checkSetupStatus: async () => ({ needsSetup: false }),
    completeSetup: async (input) => {
      const id = nextId(data, 'users');
      data.users.push({ id, username: input.user.username, role: 'ADMIN', password_hash: input.user.password, security_question: input.user.security_question || null, security_answer_hash: input.user.security_answer || null, created_at: new Date(), updated_at: new Date() });
      Object.entries(input.settings).forEach(([key, value]) => {
        const existing = data.settings.find(s => s.key === key);
        if (existing) existing.value = value;
        else data.settings.push({ id: nextId(data, 'settings'), key, value });
      });
      saveData(data);
      return { success: true };
    },

    // ── Auth ──
    login: async (username, password) => {
      const user = data.users.find(u => u.username === username && u.password_hash === password);
      if (!user) return { success: false, error: 'Credenciales inválidas', message: 'Usuario o contraseña incorrectos' };
      currentSession = { id: user.id, username: user.username, role: user.role };
      currentUser = { id: user.id, username: user.username, role: user.role, security_question: user.security_question, created_at: user.created_at, updated_at: user.updated_at };
      try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(currentSession)); } catch { }
      return { success: true, user: currentUser };
    },
    logout: async () => {
      currentSession = null;
      currentUser = null;
      try { sessionStorage.removeItem(SESSION_KEY); } catch { }
      return { success: true };
    },
    checkSession: async () => ({ authenticated: !!currentSession, user: currentUser }),
    getSecurityQuestion: async (username) => {
      const user = data.users.find(u => u.username === username);
      return user?.security_question || null;
    },
    verifySecurityAnswer: async (username, answer) => {
      const user = data.users.find(u => u.username === username);
      if (!user || !user.security_answer_hash) return { success: false, error: 'No configurado' };
      const valid = answer.toLowerCase().trim() === user.security_answer_hash.toLowerCase().trim();
      if (!valid) return { success: false, error: 'Respuesta incorrecta' };
      return { success: true, token: `demo-token-${Date.now()}` };
    },
    resetPassword: async (token, newPassword) => {
      if (!token.startsWith('demo-token-')) return { success: false, message: 'Token inválido o expirado' };
      const admin = data.users.find(u => u.username === 'admin');
      if (admin) { admin.password_hash = newPassword; saveData(data); }
      return { success: true };
    },
    setSecurityQuestion: async (userId, question, answer) => {
      const user = data.users.find(u => u.id === userId);
      if (user) { user.security_question = question; user.security_answer_hash = answer.toLowerCase().trim(); saveData(data); }
      return { success: true };
    },

    // ── Dashboard ──
    getDashboardStats: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const todaySales = data.sales.filter((s: any) => new Date(s.created_at) >= today);
      const totalRevenue = data.sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
      const todayRevenue = todaySales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
      return ok<DashboardStats>({
        todayRevenue, todayProfit: todayRevenue * 0.3, todaySalesCount: todaySales.length,
        totalRevenue, totalProfit: totalRevenue * 0.3, totalSales: data.sales.length,
        activeProducts: data.products.filter(p => p.stock > 0).length,
        totalClients: data.clients.length,
        lowStockProducts: data.products.filter(p => p.stock <= (p.min_stock ?? 0)).length,
        averageSale: data.sales.length > 0 ? totalRevenue / data.sales.length : 0,
      });
    },
    getWeeklySales: async (days = 7) => {
      const entries: WeeklySalesEntry[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0);
        const next = new Date(d); next.setDate(next.getDate() + 1);
        const daySales = data.sales.filter((s: any) => new Date(s.created_at) >= d && new Date(s.created_at) < next);
        entries.push({ date: d.toISOString().slice(0, 10), total: daySales.reduce((sum: number, s: any) => sum + (s.total || 0), 0), count: daySales.length });
      }
      return ok(entries);
    },
    getLowStock: async (limit = 10) => ok(data.products.filter(p => p.stock <= (p.min_stock ?? 0)).slice(0, limit).map(p => ({ id: p.id, sku: p.sku, name: p.name, stock: p.stock, min_stock: p.min_stock, category: data.categories.find(c => c.id === p.category_id) || null })) as LowStockProduct[]),
    getSalesByPayment: async () => {
      const methods = [...new Set(data.sales.map((s: any) => s.payment_method || 'CASH'))];
      return ok(methods.map(m => {
        const s = data.sales.filter((x: any) => (x.payment_method || 'CASH') === m);
        return { payment_method: m, _count: { id: s.length }, _sum: { total: s.reduce((sum: number, x: any) => sum + (x.total || 0), 0) }, _avg: { total: s.length > 0 ? s.reduce((sum: number, x: any) => sum + (x.total || 0), 0) / s.length : 0 } };
      }) as SalesByPaymentEntry[]);
    },
    getTopProducts: async (limit = 5) => {
      const counts: Record<number, { qty: number; times: number; sum: number }> = {};
      data.sales.forEach((s: any) => (s.items || []).forEach((item: any) => {
        if (!counts[item.product_id]) counts[item.product_id] = { qty: 0, times: 0, sum: 0 };
        counts[item.product_id].qty += item.quantity; counts[item.product_id].times++; counts[item.product_id].sum += item.unit_price * item.quantity;
      }));
      return ok(Object.entries(counts).sort((a, b) => b[1].qty - a[1].qty).slice(0, limit).map(([pid, c]) => {
        const p = data.products.find(x => x.id === Number(pid));
        return { product_id: Number(pid), product_name: p?.name || 'Unknown', product_sku: p?.sku || '', category: data.categories.find(cat => cat.id === p?.category_id)?.name || '', total_quantity: c.qty, avg_price: c.times > 0 ? c.sum / c.times : 0, times_sold: c.times };
      }) as TopProductEntry[]);
    },
    getTopClients: async (limit = 5) => {
      const totals: Record<number, { total: number; count: number }> = {};
      data.sales.forEach((s: any) => {
        if (!totals[s.client_id]) totals[s.client_id] = { total: 0, count: 0 };
        totals[s.client_id].total += s.total || 0; totals[s.client_id].count++;
      });
      return ok(Object.entries(totals).sort((a, b) => b[1].total - a[1].total).slice(0, limit).map(([cid, t]) => {
        const cl = data.clients.find(c => c.id === Number(cid));
        return { client_id: Number(cid), client_name: cl?.name || 'Consumidor Final', client_dni: cl?.dni || 'N/A', total_purchases: t.count, total_spent: t.total, avg_purchase: t.count > 0 ? t.total / t.count : 0 };
      }) as TopClientEntry[]);
    },
    getSalesByHour: async () => {
      const hours: Record<number, { total: number; count: number }> = {};
      data.sales.forEach((s: any) => {
        const h = new Date(s.created_at).getHours();
        if (!hours[h]) hours[h] = { total: 0, count: 0 };
        hours[h].total += s.total || 0; hours[h].count++;
      });
      return ok(Array.from({ length: 24 }, (_, i) => ({ hour: i, total: hours[i]?.total || 0, count: hours[i]?.count || 0 })) as SalesByHourEntry[]);
    },
    getCashSummary: async () => {
      const openRegisters = data.cashRegisters.filter(r => !r.closed_at);
      return ok({ registers: openRegisters.map(r => ({ id: r.id, opened_at: r.opened_at, opening_amount: r.opening_amount, total_sales: r.total_sales })), summary: { totalRegisters: openRegisters.length, totalOpening: openRegisters.reduce((s: number, r) => s + r.opening_amount, 0), totalSales: openRegisters.reduce((s: number, r) => s + r.total_sales, 0) } } as CashRegisterSummary);
    },
    getInventoryMetrics: async () => {
      const totalStock = data.products.reduce((s, p) => s + p.stock, 0);
      const purchaseVal = data.products.reduce((s, p) => s + p.price_purchase * p.stock, 0);
      const saleVal = data.products.reduce((s, p) => s + p.price_sale * p.stock, 0);
      return ok({ totalProducts: data.products.length, productsWithStock: data.products.filter(p => p.stock > 0).length, productsWithoutStock: data.products.filter(p => p.stock === 0).length, lowStockProducts: data.products.filter(p => p.stock <= (p.min_stock ?? 0)).length, totalPurchaseValue: purchaseVal, totalSaleValue: saleVal, potentialProfit: saleVal - purchaseVal, recentMovements: data.inventoryMovements.slice(-10).reverse() } as InventoryMetrics);
    },
    invalidateDashboardCache: async () => {},

    // ── Settings ──
    getSettings: async () => { const s: Record<string, string> = {}; data.settings.forEach(x => { s[x.key] = x.value; }); return ok(s); },
    updateSettings: async (settings) => { Object.entries(settings).forEach(([key, value]) => { const existing = data.settings.find(s => s.key === key); if (existing) existing.value = value; else data.settings.push({ id: nextId(data, 'settings'), key, value }); }); saveData(data); return { success: true }; },
    getTaxSettings: async () => {
      const rate = parseFloat(data.settings.find(s => s.key === 'tax_rate')?.value || '0');
      const type = data.settings.find(s => s.key === 'tax_type')?.value || 'percentage';
      const included = data.settings.find(s => s.key === 'tax_included')?.value === 'true';
      return ok({ taxRate: rate, taxType: type, taxIncluded: included } as TaxSettingsDTO);
    },
    updateTaxSettings: async (taxRate, taxType, taxIncluded) => {
      const upsert = (key: string, value: string) => { const e = data.settings.find(s => s.key === key); if (e) e.value = value; else data.settings.push({ id: nextId(data, 'settings'), key, value }); };
      upsert('tax_rate', String(taxRate)); upsert('tax_type', taxType); upsert('tax_included', String(taxIncluded)); saveData(data);
      return { success: true };
    },

    // ── Cash Registers ──
    getOpenRegister: async () => data.cashRegisters.find(r => !r.closed_at) || null,
    getAllRegisters: async () => ok(data.cashRegisters.map(r => ({ ...r, _count: { sales: data.sales.filter((s: any) => s.cash_register_id === r.id).length } }))),
    getRegisterDetails: async (id) => {
      const reg = data.cashRegisters.find(r => r.id === id);
      if (!reg) throw new Error('Register not found');
      return ok({ ...reg, sales: data.sales.filter((s: any) => s.cash_register_id === id).map((s: any) => ({ ...s, items: (s.items || []).map((i: any) => ({ ...i, product: data.products.find(p => p.id === i.product_id) || null })) })) });
    },
    getDailySummary: async (registerId) => {
      const reg = data.cashRegisters.find(r => r.id === registerId);
      const sales = data.sales.filter((s: any) => s.cash_register_id === registerId);
      return ok({ register: reg, salesCount: sales.length, totalSales: sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0), paymentMethods: [...new Set(sales.map((s: any) => s.payment_method || 'CASH'))] });
    },
    openRegister: async (amount) => {
      const open = data.cashRegisters.find(r => !r.closed_at);
      if (open) return { success: false, message: 'Ya hay una caja abierta' };
      const id = nextId(data, 'cashRegisters');
      data.cashRegisters.push({ id, opening_amount: amount, total_sales: 0, opened_at: new Date(), closed_at: null, closing_amount: null, difference: null, status: null, created_at: new Date(), updated_at: new Date() } as any);
      saveData(data);
      return { success: true, data: { id } };
    },
    closeRegister: async (id, amount) => {
      const reg = data.cashRegisters.find(r => r.id === id);
      if (!reg) return { success: false, message: 'Caja no encontrada' };
      const salesTotal = data.sales.filter((s: any) => s.cash_register_id === id).reduce((sum: number, s: any) => sum + (s.total || 0), 0);
      const expected = reg.opening_amount + salesTotal;
      const diff = amount - expected;
      reg.closed_at = new Date(); reg.closing_amount = amount; reg.difference = diff;
      reg.status = Math.abs(diff) < 0.01 ? 'PERFECT' : diff > 0 ? 'SURPLUS' : 'MISSING';
      reg.updated_at = new Date(); saveData(data);
      return { success: true, data: { registerId: id, openingAmount: reg.opening_amount, totalSales: salesTotal, expectedCash: expected, realCash: amount, difference: diff, status: reg.status, salesCount: data.sales.filter((s: any) => s.cash_register_id === id).length } };
    },

    // ── Clients ──
    getAllClients: async (search) => ok(paginate(data.clients, search, ['name', 'dni', 'code'])),
    getClientById: async (id) => { const c = data.clients.find(x => x.id === id); if (!c) throw new Error('Not found'); return ok(c); },
    createClient: async (clientData) => { const id = nextId(data, 'clients'); data.clients.push({ id, ...clientData, created_at: new Date(), updated_at: new Date() } as any); saveData(data); return { success: true, data: { id } }; },
    updateClient: async (id, clientData) => {
      const c = data.clients.find(x => x.id === id); if (!c) return { success: false, message: 'No encontrado' };
      Object.assign(c, clientData, { updated_at: new Date() }); saveData(data);
      return { success: true, data: { client: { ...c } } };
    },
    deleteClient: async (id) => { data.clients = data.clients.filter(x => x.id !== id); saveData(data); return { success: true }; },

    // ── Products ──
    getAllProducts: async (search, categoryId) => {
      let items = [...data.products];
      if (categoryId) items = items.filter(p => p.category_id === categoryId);
      if (search) { const q = search.toLowerCase(); items = items.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)); }
      return ok(items.map(p => ({ ...p, category: data.categories.find(c => c.id === p.category_id) || null, supplier: data.suppliers.find(s => s.id === p.supplier_id) || null })));
    },
    getProductById: async (id) => {
      const p = data.products.find(x => x.id === id); if (!p) throw new Error('Not found');
      return ok({ ...p, category: data.categories.find(c => c.id === p.category_id) || null, supplier: data.suppliers.find(s => s.id === p.supplier_id) || null, inventory_movements: data.inventoryMovements.filter((m: any) => m.product_id === id), sale_items: [] });
    },
    getLowStockProducts: async () => ok(data.products.filter(p => p.stock <= (p.min_stock ?? 0)).map(p => ({ ...p, category: data.categories.find(c => c.id === p.category_id) || null, supplier: data.suppliers.find(s => s.id === p.supplier_id) || null }))),
    createProduct: async (productData) => { const id = nextId(data, 'products'); data.products.push({ id, ...productData, stock: productData.stock ?? 0, min_stock: productData.min_stock ?? 10, created_at: new Date(), updated_at: new Date() } as any); saveData(data); return { success: true, data: { id } }; },
    updateProduct: async (id, productData) => {
      const p = data.products.find(x => x.id === id); if (!p) return { success: false, message: 'No encontrado' };
      Object.assign(p, productData, { updated_at: new Date() }); saveData(data);
      return { success: true, data: { product: { ...p, category: data.categories.find(c => c.id === p.category_id) || null, supplier: data.suppliers.find(s => s.id === p.supplier_id) || null } } };
    },
    deleteProduct: async (id) => { data.products = data.products.filter(x => x.id !== id); data.inventoryMovements = data.inventoryMovements.filter((m: any) => m.product_id !== id); saveData(data); return { success: true }; },
    addProductStock: async (productId, quantity, _userId, reason = 'COMPRA') => {
      const p = data.products.find(x => x.id === productId); if (!p) return { success: false, message: 'No encontrado' };
      p.stock += quantity; p.updated_at = new Date();
      data.inventoryMovements.push({ id: nextId(data, 'inventoryMovements'), product_id: productId, type: 'ENTRADA', quantity, reason, created_at: new Date(), updated_at: new Date() });
      saveData(data); return { success: true };
    },
    removeProductStock: async (productId, quantity, _userId, reason = 'AJUSTE') => {
      const p = data.products.find(x => x.id === productId); if (!p) return { success: false, message: 'No encontrado' };
      if (p.stock < quantity) return { success: false, message: 'Stock insuficiente' };
      p.stock -= quantity; p.updated_at = new Date();
      data.inventoryMovements.push({ id: nextId(data, 'inventoryMovements'), product_id: productId, type: 'SALIDA', quantity, reason, created_at: new Date(), updated_at: new Date() });
      saveData(data); return { success: true };
    },
    getProductMovements: async (productId, limit) => {
      let movs = data.inventoryMovements.filter((m: any) => m.product_id === productId);
      if (limit) movs = movs.slice(-limit);
      return ok(movs.reverse().map((m: any) => ({ ...m, product: (() => { const p = data.products.find(x => x.id === productId); return p ? { name: p.name, sku: p.sku } : null; })() })));
    },

    // ── Categories ──
    getAllCategories: async (search) => ok(paginate(data.categories, search, ['name'])),
    getCategoryById: async (id) => { const c = data.categories.find(x => x.id === id); if (!c) throw new Error('Not found'); return ok({ ...c, products: data.products.filter(p => p.category_id === id).map(p => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock })) }); },
    createCategory: async (catData) => { const id = nextId(data, 'categories'); data.categories.push({ id, ...catData, created_at: new Date(), updated_at: new Date() } as any); saveData(data); return { success: true, data: data.categories.find(c => c.id === id) }; },
    updateCategory: async (id, catData) => { const c = data.categories.find(x => x.id === id); if (!c) return { success: false }; Object.assign(c, catData, { updated_at: new Date() }); saveData(data); return { success: true, data: c }; },
    deleteCategory: async (id) => { data.categories = data.categories.filter(x => x.id !== id); data.products.forEach(p => { if (p.category_id === id) p.category_id = null; }); saveData(data); return { success: true }; },

    // ── Suppliers ──
    getAllSuppliers: async (search) => ok(paginate(data.suppliers, search, ['name', 'ruc']).map(s => ({ ...s, _count: { products: data.products.filter(p => p.supplier_id === s.id).length, purchases: data.purchases.filter((p: any) => p.supplier_id === s.id).length } }))),
    getSupplierById: async (id) => { const s = data.suppliers.find(x => x.id === id); if (!s) throw new Error('Not found'); return ok({ ...s, products: data.products.filter(p => p.supplier_id === id).map(p => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock })), purchases: data.purchases.filter((p: any) => p.supplier_id === id) }); },
    createSupplier: async (data_) => { const id = nextId(data, 'suppliers'); data.suppliers.push({ id, ...data_, created_at: new Date(), updated_at: new Date() } as any); saveData(data); return { success: true, supplier: data.suppliers.find(s => s.id === id)! }; },
    updateSupplier: async (id, data_) => { const s = data.suppliers.find(x => x.id === id); if (!s) return { success: false, message: 'No encontrado' }; Object.assign(s, data_, { updated_at: new Date() }); saveData(data); return { success: true, supplier: s }; },
    deleteSupplier: async (id) => { data.suppliers = data.suppliers.filter(x => x.id !== id); data.products.forEach(p => { if (p.supplier_id === id) p.supplier_id = null; }); saveData(data); return { success: true }; },

    // ── Users ──
    getAllUsers: async () => ok(data.users.map(u => ({ id: u.id, username: u.username, role: u.role, security_question: u.security_question, created_at: u.created_at, updated_at: u.updated_at }) as User)),
    getUserById: async (id) => { const u = data.users.find(x => x.id === id); if (!u) throw new Error('Not found'); return ok({ id: u.id, username: u.username, role: u.role, security_question: u.security_question, created_at: u.created_at, updated_at: u.updated_at } as User); },
    createUser: async (userData) => {
      if (data.users.find(u => u.username === userData.username)) return { success: false, message: 'El usuario ya existe' };
      const id = nextId(data, 'users');
      data.users.push({ id, username: userData.username, role: userData.role, password_hash: userData.password, security_question: userData.security_question || null, security_answer_hash: userData.security_answer_hash || null, created_at: new Date(), updated_at: new Date() });
      saveData(data);
      return { success: true, user: { id, username: userData.username, role: userData.role, created_at: new Date(), updated_at: new Date() } };
    },
    updateUser: async (id, userData) => {
      const u = data.users.find(x => x.id === id); if (!u) return { success: false, message: 'No encontrado' };
      if (userData.username) u.username = userData.username;
      if (userData.role) u.role = userData.role;
      if (userData.security_question !== undefined) u.security_question = userData.security_question;
      if (userData.security_answer_hash !== undefined) u.security_answer_hash = userData.security_answer_hash;
      u.updated_at = new Date(); saveData(data);
      return { success: true, user: { id: u.id, username: u.username, role: u.role, created_at: u.created_at, updated_at: u.updated_at } };
    },
    deleteUser: async (id) => { const u = data.users.find(x => x.id === id); data.users = data.users.filter(x => x.id !== id); saveData(data); return u as any; },
    changePassword: async (userId, newPassword) => { const u = data.users.find(x => x.id === userId); if (u) { u.password_hash = newPassword; saveData(data); } return { success: true }; },

    // ── Sales ──
    getAllSales: async (startDate, endDate, clientId, cashRegisterId) => {
      let items = [...data.sales];
      if (startDate) items = items.filter((s: any) => new Date(s.created_at) >= startDate);
      if (endDate) items = items.filter((s: any) => new Date(s.created_at) <= endDate);
      if (clientId) items = items.filter((s: any) => s.client_id === clientId);
      if (cashRegisterId) items = items.filter((s: any) => s.cash_register_id === cashRegisterId);
      return ok(items.map((s: any) => ({ ...s, client: data.clients.find(c => c.id === s.client_id) || null, cash_register: data.cashRegisters.find(r => r.id === s.cash_register_id) || null })));
    },
    getTodaySales: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return ok(data.sales.filter((s: any) => new Date(s.created_at) >= today).map((s: any) => ({ ...s, client: data.clients.find(c => c.id === s.client_id) || null, cash_register: data.cashRegisters.find(r => r.id === s.cash_register_id) || null })));
    },
    getLastSale: async () => { const s = data.sales[data.sales.length - 1]; if (!s) return null; return ok({ ...s, items: (s.items || []).map((i: any) => ({ ...i, product: data.products.find(p => p.id === i.product_id) || null })), client: data.clients.find(c => c.id === s.client_id) || null, cash_register: data.cashRegisters.find(r => r.id === s.cash_register_id) || null }); },
    getSalesStats: async () => {
      const total = data.sales.reduce((sum: number, s: any) => sum + (s.total || 0), 0);
      return ok({ totalSales: data.sales.length, totalRevenue: total, averageSale: data.sales.length > 0 ? total / data.sales.length : 0 } as SalesStatsDTO);
    },
    getSaleDetails: async (saleId) => {
      const s = data.sales.find((x: any) => x.id === saleId);
      if (!s) throw new Error('Not found');
      return ok({ ...s, items: (s.items || []).map((i: any) => ({ ...i, product: data.products.find(p => p.id === i.product_id) || null })), client: data.clients.find(c => c.id === s.client_id) || null, cash_register: data.cashRegisters.find(r => r.id === s.cash_register_id) || null });
    },
    registerSale: async (saleData, itemsData) => {
      const id = nextId(data, 'sales');
      const total = itemsData.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
      const subtotal = saleData.subtotal ?? total;
      const taxAmount = saleData.tax_amount ?? 0;
      const sale: any = {
        id, ...saleData, subtotal, tax_amount: taxAmount, total: saleData.total ?? (subtotal + taxAmount),
        discount_total: saleData.discount_total ?? 0, payment_method: saleData.payment_method || 'CASH',
        exchange_rate: saleData.exchange_rate || 0, created_at: new Date(), updated_at: new Date(),
        items: itemsData.map((item, idx) => {
          const p = data.products.find(x => x.id === item.product_id);
          const lineTotal = item.unit_price * item.quantity;
          if (p) { p.stock -= item.quantity; p.updated_at = new Date(); }
          data.inventoryMovements.push({ id: nextId(data, 'inventoryMovements'), product_id: item.product_id, type: 'SALIDA', quantity: item.quantity, reason: 'VENTA', created_at: new Date(), updated_at: new Date() });
          return {
            id: -(idx + 1), sale_id: id, product_id: item.product_id, quantity: item.quantity,
            unit_price: item.unit_price, purchase_price: p?.price_purchase || 0, discount_name: item.discount_name || null,
            discount_type: item.discount_type || null, discount_value: item.discount_value || null, discount_amount: item.discount_amount || 0,
            final_unit_price: item.final_unit_price ?? null, created_at: new Date(), updated_at: new Date(),
          };
        }),
      };
      data.sales.push(sale);
      const reg = data.cashRegisters.find(r => !r.closed_at);
      if (reg) { reg.total_sales += sale.total; reg.updated_at = new Date(); }
      saveData(data);
      return { success: true, data: { id } };
    },
    cancelSale: async (saleId) => {
      const idx = data.sales.findIndex((s: any) => s.id === saleId);
      if (idx === -1) return { success: false, message: 'Venta no encontrada' };
      const sale = data.sales[idx];
      (sale.items || []).forEach((item: any) => {
        const p = data.products.find(x => x.id === item.product_id);
        if (p) { p.stock += item.quantity; p.updated_at = new Date(); }
      });
      data.sales[idx] = { ...sale, status: 'CANCELED', updated_at: new Date() };
      saveData(data);
      return { success: true };
    },

    // ── Purchases ──
    getAllPurchases: async (supplierId, status) => {
      let items = [...data.purchases];
      if (supplierId) items = items.filter((p: any) => p.supplier_id === supplierId);
      if (status) items = items.filter((p: any) => p.status === status);
      return ok(items.map((p: any) => ({ ...p, supplier: data.suppliers.find(s => s.id === p.supplier_id) || null })));
    },
    getPurchaseById: async (id) => { const p = data.purchases.find((x: any) => x.id === id); if (!p) throw new Error('Not found'); return ok({ ...p, items: (p.items || []).map((i: any) => ({ ...i, product: data.products.find(pr => pr.id === i.product_id) ? { id: i.product_id, name: data.products.find(pr => pr.id === i.product_id)!.name, sku: data.products.find(pr => pr.id === i.product_id)!.sku } : null })), supplier: data.suppliers.find(s => s.id === p.supplier_id) || null }); },
    createPurchase: async (data_) => {
      const id = nextId(data, 'purchases');
      const total = data_.items.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0);
      const purchase: any = { id, supplier_id: data_.supplier_id, total_amount: total, status: 'PENDING', payment_status: data_.payment_status || 'PENDING', created_at: new Date(), updated_at: new Date(), items: data_.items.map((item, idx) => ({ id: -(idx + 1), purchase_id: id, product_id: item.product_id, quantity: item.quantity, unit_cost: item.unit_cost })) };
      data.purchases.push(purchase); saveData(data);
      return { success: true, purchase };
    },
    receivePurchase: async (purchaseId) => {
      const p = data.purchases.find((x: any) => x.id === purchaseId);
      if (!p) return { success: false };
      p.status = 'RECEIVED'; p.updated_at = new Date();
      (p.items || []).forEach((item: any) => {
        const prod = data.products.find(x => x.id === item.product_id);
        if (prod) { prod.stock += item.quantity; prod.updated_at = new Date(); }
        data.inventoryMovements.push({ id: nextId(data, 'inventoryMovements'), product_id: item.product_id, type: 'ENTRADA', quantity: item.quantity, reason: 'COMPRA', created_at: new Date(), updated_at: new Date() });
      });
      saveData(data); return { success: true };
    },
    cancelPurchase: async (purchaseId) => { const p = data.purchases.find((x: any) => x.id === purchaseId); if (p) { p.status = 'CANCELED'; p.updated_at = new Date(); saveData(data); } return { success: true }; },
    updatePurchasePaymentStatus: async (purchaseId, paymentStatus) => { const p = data.purchases.find((x: any) => x.id === purchaseId); if (p) { p.payment_status = paymentStatus; p.updated_at = new Date(); saveData(data); } return { success: true }; },

    // ── Inventory Movements ──
    getAllMovements: async () => ok(data.inventoryMovements.map((m: any) => ({ ...m, product: (() => { const p = data.products.find(x => x.id === m.product_id); return p ? { name: p.name, sku: p.sku } : null; })() }))),

    // ── Discounts ──
    getDiscounts: async (activeOnly) => {
      let items = [...data.discounts];
      if (activeOnly) items = items.filter(d => d.is_active);
      return ok(items.map(d => ({ ...d, category: data.categories.find(c => c.id === d.category_id) || null, products: [] })));
    },
    getDiscountById: async (id) => { const d = data.discounts.find(x => x.id === id); if (!d) throw new Error('Not found'); return ok({ ...d, category: data.categories.find(c => c.id === d.category_id) || null, products: [] }); },
    createDiscount: async (discData) => { const id = nextId(data, 'discounts'); data.discounts.push({ id, ...discData, is_active: discData.is_active ?? true, created_at: new Date(), updated_at: new Date() } as any); saveData(data); return { success: true, data: { id } }; },
    updateDiscount: async (id, discData) => { const d = data.discounts.find(x => x.id === id); if (!d) return { success: false, message: 'No encontrado' }; Object.assign(d, discData, { updated_at: new Date() }); saveData(data); return { success: true, data: { id } }; },
    deleteDiscount: async (id) => { data.discounts = data.discounts.filter(x => x.id !== id); saveData(data); return { success: true, data: { id } }; },
    getApplicableDiscounts: async (productId, totalAmount) => {
      const product = data.products.find(p => p.id === productId);
      if (!product) return ok([]);
      return ok(data.discounts.filter(d => {
        if (!d.is_active) return false;
        if (d.min_purchase_amount && totalAmount && totalAmount < d.min_purchase_amount) return false;
        if (d.applicable_to === 'ALL') return true;
        if (d.applicable_to === 'CATEGORY') return d.category_id === product.category_id;
        if (d.applicable_to === 'SPECIFIC') return data.products.some(p => p.id === productId && p.category_id === d.category_id) || d.category_id === product.category_id;
        return false;
      }).map(d => ({ ...d, category: data.categories.find(c => c.id === d.category_id) || null })));
    },

    // ── Backup (stub) ──
    createBackup: async () => ({ success: true, path: 'demo-backup.json', message: 'Demo: backup simulado' }),
    listBackups: async () => [],
    restoreBackup: async () => ({ success: false, message: 'No disponible en versión demo' }),
    deleteBackup: async () => ({ success: false, message: 'No disponible en versión demo' }),

    // ── Window ──
    windowFocus: async () => {},
    windowIsReady: async () => true,

    // ── Dialog (native stubs) ──
    dialog: {
      showMessageBox: async (options) => ({ response: 0 }),
      showOpenDialog: async (options) => ({ canceled: true, filePaths: [] }),
      showSaveDialog: async (options) => ({ canceled: true, filePath: '' }),
    },

    // ── Modal stubs ──
    modal: {
      create: async (options) => ({}),
      close: async (id) => {},
      focus: async (id) => {},
    },

    // ── Reports ──
    generateReport: async (request) => {
      const reportData = await loadData();
      let result: { success: true; path: string };
      switch (request.type) {
        case 'daily_sales':
          result = generateDailySalesPDF(request, reportData); break;
        case 'sales_summary':
          result = generateSalesSummaryPDF(request, reportData); break;
        case 'inventory':
          result = generateInventoryPDF(request, reportData); break;
        case 'low_stock':
          result = generateLowStockPDF(request, reportData); break;
        case 'top_products':
          result = generateTopProductsPDF(request, reportData); break;
        case 'profit_summary':
          result = generateProfitSummaryPDF(request, reportData); break;
        case 'sale_receipt':
          result = generateSaleReceiptPDF(request.saleId || 0, reportData); break;
        case 'cash_close':
          result = generateCashClosePDF(request.registerId || 0, reportData); break;
        default:
          result = { success: true, path: `reporte-${request.type}.pdf` };
      }
      reportData.reportLogs.push({ id: nextId(reportData, 'reportLogs'), type: request.type, filename: result.path, generatedAt: new Date().toISOString() });
      saveData(reportData);
      return result;
    },
    generateReceipt: async (saleId) => {
      const reportData = await loadData();
      const result = generateSaleReceiptPDF(saleId, reportData);
      reportData.reportLogs.push({ id: nextId(reportData, 'reportLogs'), type: 'sale_receipt', filename: result.path, generatedAt: new Date().toISOString() });
      saveData(reportData);
      return result;
    },
    generateCashClose: async (registerId) => {
      const reportData = await loadData();
      const result = generateCashClosePDF(registerId, reportData);
      reportData.reportLogs.push({ id: nextId(reportData, 'reportLogs'), type: 'cash_close', filename: result.path, generatedAt: new Date().toISOString() });
      saveData(reportData);
      return result;
    },
  };
}
