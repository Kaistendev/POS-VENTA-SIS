// ─── Product DTOs ───
export interface CreateProductDTO {
  sku: string;
  name: string;
  description?: string | null;
  category_id?: number | null;
  supplier_id?: number | null;
  price_purchase: number;
  price_sale: number;
  stock?: number;
  min_stock?: number;
}

export interface UpdateProductDTO {
  sku?: string;
  name?: string;
  description?: string | null;
  category_id?: number | null;
  supplier_id?: number | null;
  price_purchase?: number;
  price_sale?: number;
  min_stock?: number;
}

export interface StockMovementDTO {
  product_id: number;
  type: 'ENTRADA' | 'SALIDA';
  quantity: number;
  reason: string;
}

// ─── Client DTOs ───
export interface CreateClientDTO {
  dni: string;
  name: string;
  phone?: string | null;
  code: string;
  tax_id?: string | null;
}

export interface UpdateClientDTO {
  dni?: string;
  name?: string;
  phone?: string | null;
  code?: string;
  tax_id?: string | null;
}

// ─── Sale DTOs ───
export interface SaleItemInputDTO {
  product_id: number;
  quantity: number;
  unit_price: number;
  purchase_price: number;
}

export interface RegisterSaleDTO {
  cash_register_id: number;
  client_id: number;
  total: number;
  subtotal: number;
  tax_amount: number;
  items: SaleItemInputDTO[];
  payment_method?: string;
}

export interface SaleFilterDTO {
  startDate?: Date;
  endDate?: Date;
  clientId?: number;
  cashRegisterId?: number;
}

export interface SalesStatsDTO {
  totalSales: number;
  totalRevenue: number;
  averageSale: number;
}

// ─── User DTOs ───
export interface CreateUserDTO {
  username: string;
  password_hash: string;
  role: string;
}

export interface UpdateUserDTO {
  username?: string;
  password_hash?: string;
  role?: string;
}

export interface LoginDTO {
  username: string;
  password: string;
}

// ─── Supplier DTOs ───
export interface CreateSupplierDTO {
  name: string;
  ruc?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

export interface UpdateSupplierDTO {
  name?: string;
  ruc?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}

// ─── Purchase DTOs ───
export interface PurchaseItemInputDTO {
  product_id: number;
  quantity: number;
  unit_cost: number;
}

export interface CreatePurchaseDTO {
  supplier_id: number;
  items: PurchaseItemInputDTO[];
}

// ─── Category DTOs ───
export interface CreateCategoryDTO {
  name: string;
}

export interface UpdateCategoryDTO {
  name: string;
}

// ─── Audit Log DTO ───
export interface AuditLogEntryDTO {
  userId?: number;
  action: string;
  entity: string;
  entity_id: number;
}

// ─── Tax Settings DTO ───
export interface TaxSettingsDTO {
  taxRate: number;
  taxType: string;
  taxIncluded: boolean;
}
