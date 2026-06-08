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
  exchange_rate?: number;
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
  cashSales?: number;
  cashRevenue?: number;
  cardSales?: number;
  cardRevenue?: number;
}

// ─── User DTOs ───
export interface CreateUserDTO {
  username: string;
  password_hash: string;
  role: string;
  security_question?: string | null;
  security_answer_hash?: string | null;
}

export interface UpdateUserDTO {
  username?: string;
  password_hash?: string;
  role?: string;
  security_question?: string | null;
  security_answer_hash?: string | null;
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
  payment_status?: string;
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

// ─── Report DTOs ───
export type ReportFormat = 'pdf' | 'xlsx';
export type ReportType = 'daily_sales' | 'sales_summary' | 'inventory' | 'low_stock' | 'top_products' | 'profit_summary' | 'sale_receipt' | 'cash_close';

export interface ReportRequestDTO {
  type: ReportType;
  format: ReportFormat;
  startDate?: Date;
  endDate?: Date;
  title?: string;
  saleId?: number;
  registerId?: number;
  logoBase64?: string;
}

export interface SaleReportRow {
  date: string;
  invoiceNumber: number;
  client: string;
  itemsCount: number;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: string;
}

export interface InventoryReportRow {
  sku: string;
  name: string;
  category: string;
  stock: number;
  minStock: number | null;
  purchasePrice: number;
  salePrice: number;
  status: 'ok' | 'low' | 'out';
}

export interface SaleReceiptDTO {
  saleId: number;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessTaxId: string;
  ticketFooter: string;
  logoBase64?: string;
  clientName: string;
  clientDni: string;
  clientTaxId: string | null;
  createdAt: Date;
  paymentMethod: string;
  items: SaleReceiptItemDTO[];
  subtotal: number;
  taxAmount: number;
  taxType: string;
  taxRate: number;
  total: number;
}

export interface SaleReceiptItemDTO {
  quantity: number;
  productName: string;
  unitPrice: number;
  totalPrice: number;
}

export interface CashCloseDTO {
  registerId: number;
  openDate: Date;
  closeDate: Date;
  openingAmount: number;
  totalSales: number;
  cashSales: number;
  cardSales: number;
  salesCount: number;
  expectedCash: number;
  realCash: number;
  difference: number;
  status: string;
  businessName: string;
}
