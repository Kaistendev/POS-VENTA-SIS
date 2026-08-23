import { Purchase } from '../models.js';
import { CreatePurchaseDTO } from '../dtos.js';

export interface IPurchaseRepository {
  findAll(supplierId?: number, status?: string): Promise<Purchase[]>;
  findById(id: number): Promise<Purchase | null>;
  create(data: CreatePurchaseDTO): Promise<Purchase>;
  createReceivedWithoutStock(data: CreatePurchaseDTO): Promise<Purchase>;
  receive(purchaseId: number): Promise<void>;
  cancel(purchaseId: number): Promise<void>;
  updatePaymentStatus(purchaseId: number, paymentStatus: string): Promise<void>;
}
