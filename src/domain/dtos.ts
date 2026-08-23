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
  discount_id?: number;
  discount_name?: string | null;
  discount_type?: string | null;
  discount_value?: number | null;
  discount_amount?: number | null;
  final_unit_price?: number | null;
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
  discount_total?: number;
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

// ─── Discount DTOs ───
export type DiscountTypeDTO = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type DiscountApplicableToDTO = 'ALL' | 'CATEGORY' | 'SPECIFIC';

export interface CreateDiscountDTO {
  name: string;
  type: DiscountTypeDTO;
  value: number;
  is_active?: boolean;
  applicable_to?: DiscountApplicableToDTO;
  category_id?: number | null;
  product_ids?: number[];
  min_purchase_amount?: number | null;
}

export interface UpdateDiscountDTO {
  name?: string;
  type?: DiscountTypeDTO;
  value?: number;
  is_active?: boolean;
  applicable_to?: DiscountApplicableToDTO;
  category_id?: number | null;
  product_ids?: number[];
  min_purchase_amount?: number | null;
}

// ─── Report DTOs ───
export type ReportFormat = 'pdf' | 'xlsx';
export type ReportType = 'daily_sales' | 'sales_summary' | 'inventory' | 'low_stock' | 'top_products' | 'profit_summary' | 'sale_receipt' | 'cash_close' | 'purchase_invoice' | 'payment_receipt';

export interface ReportRequestDTO {
  type: ReportType;
  format: ReportFormat;
  startDate?: Date;
  endDate?: Date;
  title?: string;
  saleId?: number;
  registerId?: number;
  purchaseId?: number;
  paymentIds?: number[];
  logoBase64?: string;
}

export interface SaleReportRow {
  date: string;
  invoiceNumber: number;
  client: string;
  clientDni: string;
  itemsCount: number;
  items: { productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
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
  discountTotal?: number;
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
  discountName?: string | null;
  discountAmount?: number | null;
  finalPrice?: number | null;
}

export interface PurchaseInvoiceItemDTO {
  productName: string;
  sku: string | null;
  quantity: number;
  unitCost: number;
  totalPrice: number;
}

export interface PurchasePaymentRecordDTO {
  date: Date;
  amount: number;
  note?: string | null;
}

export interface PurchaseInvoiceDTO {
  purchaseId: number;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessTaxId?: string;
  supplierName: string;
  supplierRuc: string | null;
  supplierPhone?: string | null;
  supplierEmail?: string | null;
  createdAt: Date;
  status: string;
  items: PurchaseInvoiceItemDTO[];
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  payments: PurchasePaymentRecordDTO[];
}

export interface PaymentAllocationDTO {
  paymentId: number;
  purchaseId: number;
  purchaseDate: Date;
  amount: number;
  note?: string | null;
}

export interface PaymentReceiptDTO {
  businessName: string;
  supplierName: string;
  supplierRuc: string | null;
  date: Date;
  allocations: PaymentAllocationDTO[];
  totalPaid: number;
  remainingDebt: number;
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
