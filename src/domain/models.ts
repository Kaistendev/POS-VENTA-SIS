// ─── Product ───
export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category_id: number | null;
  supplier_id: number | null;
  price_purchase: number;
  price_sale: number;
  stock: number;
  min_stock: number | null;
  created_at: Date;
  updated_at: Date;
  category?: { id: number; name: string } | null;
  supplier?: { id: number; name: string } | null;
}

export interface ProductWithRelations extends Product {
  category: { id: number; name: string } | null;
  supplier: { id: number; name: string } | null;
  inventory_movements?: InventoryMovement[];
  sale_items?: SaleItem[];
}

// ─── Client ───
export interface Client {
  id: number;
  dni: string;
  name: string;
  phone: string | null;
  code: string;
  tax_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ClientWithSales extends Client {
  sales?: Sale[];
}

// ─── Category ───
export interface Category {
  id: number;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryWithProducts extends Category {
  products?: Pick<Product, 'id' | 'name' | 'sku' | 'stock'>[];
}

// ─── Supplier ───
export interface Supplier {
  id: number;
  name: string;
  ruc: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SupplierWithRelations extends Supplier {
  products?: Pick<Product, 'id' | 'name' | 'sku' | 'stock'>[];
  purchases?: Purchase[];
  payments?: SupplierPayment[];
}

// ─── SupplierPayment ───
export interface SupplierPayment {
  id: number;
  supplier_id: number;
  purchase_id: number | null;
  amount: number;
  note: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

// ─── Accounts Payable ───
export interface SupplierAccountPayable {
  supplier_id: number;
  name: string;
  ruc: string | null;
  total_owed: number;
  unpaid_purchases: number;
}

export interface CashPosition {
  total_inflow: number;
  paid_to_suppliers: number;
  available: number;
}

// ─── Contabilidad ───
export interface InventoryProjection {
  units_in_stock: number;
  inventory_cost_value: number;
  potential_revenue: number;
  projected_gross_profit: number;
}

export interface AccountingSummary {
  cashPosition: CashPosition;
  total_debt: number;
  payables: SupplierAccountPayable[];
  projection: InventoryProjection;
}

// ─── User ───
export interface User {
  id: number;
  username: string;
  role: string;
  security_question?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithPassword extends User {
  password_hash: string;
  security_answer_hash?: string | null;
}

// ─── CashRegister ───
export interface CashRegister {
  id: number;
  opening_amount: number;
  total_sales: number;
  opened_at: Date;
  closed_at?: Date | null;
  closing_amount?: number | null;
  difference?: number | null;
  status?: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CashRegisterWithSales extends CashRegister {
  sales?: SaleWithItems[];
}

// ─── Sale ───
export interface Sale {
  id: number;
  cash_register_id: number;
  client_id: number;
  total: number;
  subtotal: number;
  tax_amount: number;
  discount_total?: number | null;
  payment_method: string | null;
  exchange_rate: number;
  created_at: Date;
  updated_at: Date;
  client?: Pick<Client, 'id' | 'name' | 'dni'> | null;
  cash_register?: Pick<CashRegister, 'id' | 'opened_at' | 'opening_amount'> | null;
}

export interface SaleWithItems extends Sale {
  items: SaleItemWithProduct[];
  client?: Client | null;
  cash_register?: CashRegister | null;
}

// ─── Discount ───
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type DiscountApplicableTo = 'ALL' | 'CATEGORY' | 'SPECIFIC';

export interface Discount {
  id: number;
  name: string;
  type: DiscountType;
  value: number;
  is_active: boolean;
  applicable_to: DiscountApplicableTo;
  category_id: number | null;
  min_purchase_amount: number | null;
  created_at: Date;
  updated_at: Date;
  category?: { id: number; name: string } | null;
  products?: ProductDiscount[];
}

export interface DiscountWithRelations extends Discount {
  category: { id: number; name: string } | null;
  products: ProductDiscount[];
}

export interface ProductDiscount {
  product_id: number;
  discount_id: number;
  product?: Product | null;
  discount?: Discount | null;
}

// ─── SaleItem ───
export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  purchase_price: number;
  discount_name?: string | null;
  discount_type?: string | null;
  discount_value?: number | null;
  discount_amount?: number | null;
  final_unit_price?: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface SaleItemWithProduct extends SaleItem {
  product?: Product | null;
}

// ─── Purchase ───
export interface Purchase {
  id: number;
  supplier_id: number;
  total_amount: number;
  paid_amount: number;
  status: string;
  payment_status: string;
  created_at: Date;
  updated_at: Date;
  supplier?: Pick<Supplier, 'id' | 'name' | 'ruc'> | null;
  items?: PurchaseItemWithProduct[];
  payments?: SupplierPayment[];
}

// ─── PurchaseItem ───
export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  quantity: number;
  unit_cost: number;
}

export interface PurchaseItemWithProduct extends PurchaseItem {
  product?: Pick<Product, 'id' | 'name' | 'sku'> | null;
}

// ─── InventoryMovement ───
export interface InventoryMovement {
  id: number;
  product_id: number;
  type: 'ENTRADA' | 'SALIDA';
  quantity: number;
  reason: string | null;
  created_at: Date;
  updated_at: Date;
  product?: Pick<Product, 'name' | 'sku'> | null;
}

// ─── Setting ───
export interface Setting {
  id: number;
  key: string;
  value: string;
}

// ─── AuditLog ───
export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity: string;
  entity_id: number;
  created_at: Date;
  updated_at: Date;
}

// ─── Dashboard Types ───
export interface DashboardStats {
  todayRevenue: number;
  todayProfit: number;
  todaySalesCount: number;
  totalRevenue: number;
  totalProfit: number;
  totalSales: number;
  activeProducts: number;
  totalClients: number;
  lowStockProducts: number;
  averageSale: number;
}

export interface WeeklySalesEntry {
  date: string;
  total: number;
  count: number;
}

export interface SalesByPaymentEntry {
  payment_method: string;
  _count: { id: number };
  _sum: { total: number | null };
  _avg: { total: number | null };
}

export interface TopProductEntry {
  product_id: number;
  product_name: string;
  product_sku: string;
  category: string;
  total_quantity: number;
  avg_price: number;
  times_sold: number;
}

export interface TopClientEntry {
  client_id: number | null;
  client_name: string;
  client_dni: string;
  total_purchases: number;
  total_spent: number;
  avg_purchase: number;
}

export interface SalesByHourEntry {
  hour: number;
  total: number;
  count: number;
}

export interface CashRegisterSummary {
  registers: Pick<CashRegister, 'id' | 'opened_at' | 'opening_amount' | 'total_sales'>[];
  summary: {
    totalRegisters: number;
    totalOpening: number;
    totalSales: number;
  };
}

export interface InventoryMetrics {
  totalProducts: number;
  productsWithStock: number;
  productsWithoutStock: number;
  lowStockProducts: number;
  totalPurchaseValue: number;
  totalSaleValue: number;
  potentialProfit: number;
  recentMovements: InventoryMovement[];
}

export interface LowStockProduct {
  id: number;
  sku: string;
  name: string;
  stock: number;
  min_stock: number | null;
  category: { name: string } | null;
}

// ─── Backup Types ───
export interface BackupEntry {
  filename: string;
  path: string;
  size: number;
  created: Date;
}

export interface BackupResult {
  success: boolean;
  path?: string;
  message?: string;
}
