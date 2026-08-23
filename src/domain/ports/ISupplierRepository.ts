import { Supplier, SupplierWithRelations, SupplierPayment, SupplierAccountPayable, Purchase } from '../models.js';
import { CreateSupplierDTO, UpdateSupplierDTO } from '../dtos.js';

export interface RegisterPaymentData {
  supplier_id: number;
  purchase_id?: number | null;
  amount: number;
  note?: string | null;
  created_by?: number | null;
}

export interface ISupplierRepository {
  findAll(search?: string): Promise<(Supplier & { _count?: { products: number; purchases: number } })[]>;
  findById(id: number): Promise<SupplierWithRelations | null>;
  findByRuc(ruc: string): Promise<Supplier | null>;
  create(data: CreateSupplierDTO): Promise<Supplier>;
  update(id: number, data: UpdateSupplierDTO): Promise<Supplier>;
  delete(id: number): Promise<void>;
  hasProducts(id: number): Promise<boolean>;
  hasPurchases(id: number): Promise<boolean>;
  getOutstandingPurchases(supplierId: number): Promise<(Purchase & { paid_amount: number })[]>;
  getAccountsPayable(): Promise<SupplierAccountPayable[]>;
  registerPayment(data: RegisterPaymentData): Promise<SupplierPayment>;
  applyPaymentToPurchase(purchaseId: number, amount: number): Promise<boolean>;
  getTotalPaid(): Promise<number>;
  getPayments(supplierId: number, limit?: number): Promise<SupplierPayment[]>;
  getPaymentsByPurchase(purchaseId: number): Promise<SupplierPayment[]>;
  getPaymentsByIds(ids: number[]): Promise<(SupplierPayment & { purchase?: { id: number; created_at: Date } | null })[]>;
}
