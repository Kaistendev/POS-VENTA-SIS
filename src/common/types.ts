/**
 * @deprecated Use domain models from `src/domain/models.ts` instead.
 * These legacy types are kept for frontend compatibility and will be
 * migrated in a future sprint. Differences from domain models:
 * - `id?: number` (optional, for new entities)
 * - Dates allow `string` for ISO serialization
 */
export interface User {
  id?: number;
  username: string;
  password_hash: string;
  role: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Client {
  id?: number;
  dni: string;
  name: string;
  phone?: string;
  code: string;
  tax_id?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Category {
  id?: number;
  name: string;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Product {
  id?: number;
  sku: string;
  name: string;
  description?: string;
  category_id?: number;
  price_purchase: number;
  price_sale: number;
  stock?: number;
  min_stock?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface CashRegister {
  id?: number;
  opened_at?: Date | string;
  opening_amount: number;
  total_sales?: number;
  cash_sales?: number;
  card_sales?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface Sale {
  id?: number;
  cash_register_id: number;
  client_id: number;
  total: number;
  subtotal?: number;
  tax_amount?: number;
  payment_method?: string;
  created_at?: Date | string;
  updated_at?: Date | string;
  client?: any;
  items?: any[];
}

export interface SaleItem {
  id?: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  purchase_price: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface InventoryMovement {
  id?: number;
  product_id: number;
  type: 'ENTRADA' | 'SALIDA';
  quantity: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export interface AuditLog {
  id?: number;
  user_id: number;
  action: string;
  entity: string;
  entity_id: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}
