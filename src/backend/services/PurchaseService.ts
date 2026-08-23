import { IPurchaseRepository } from '../../domain/ports/IPurchaseRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';
import { CreatePurchaseDTO, PurchaseInvoiceDTO } from '../../domain/dtos.js';
import { NotFoundError } from '../../shared/errors.js';
import { logger } from '../../shared/logger.js';

export class PurchaseService {
  constructor(
    private purchaseRepo: IPurchaseRepository,
    private supplierRepo: ISupplierRepository,
    private productRepo: IProductRepository,
    private auditLogRepo: IAuditLogRepository,
  ) {}

  async getAllPurchases(supplierId?: number, status?: string) {
    try {
      return await this.purchaseRepo.findAll(supplierId, status);
    } catch (error: any) {
      logger.error('Get all purchases error:', error);
      throw new Error('Error al obtener compras');
    }
  }

  async getPurchaseById(id: number) {
    try {
      const purchase = await this.purchaseRepo.findById(id);
      if (!purchase) throw new NotFoundError('Compra');
      return purchase;
    } catch (error: any) {
      logger.error('Get purchase by ID error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Compra');
      throw error;
    }
  }

  async createPurchase(data: CreatePurchaseDTO, createdBy: number) {
    try {
      const supplier = await this.supplierRepo.findById(data.supplier_id);
      if (!supplier) throw new NotFoundError('Proveedor');

      const productIds = data.items.map((item) => item.product_id);
      const products = await this.productRepo.findByIds(productIds);
      if (products.length !== productIds.length) throw new NotFoundError('Producto', 'uno o más productos no existen');

      const purchase = await this.purchaseRepo.create(data);

      await this.auditLogRepo.create({
        userId: createdBy,
        action: 'CREATE_PURCHASE',
        entity: 'purchases',
        entity_id: purchase.id,
      });

      return purchase;
    } catch (error: any) {
      logger.error('Create purchase error:', error);
      throw error;
    }
  }

  async receivePurchase(purchaseId: number, receivedBy: number) {
    try {
      await this.purchaseRepo.receive(purchaseId);

      await this.auditLogRepo.create({
        userId: receivedBy,
        action: 'RECEIVE_PURCHASE',
        entity: 'purchases',
        entity_id: purchaseId,
      });

      return { success: true };
    } catch (error: any) {
      logger.error('Receive purchase error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Compra');
      throw error;
    }
  }

  async updatePaymentStatus(purchaseId: number, paymentStatus: string) {
    try {
      await this.purchaseRepo.updatePaymentStatus(purchaseId, paymentStatus);
      return { success: true };
    } catch (error: any) {
      logger.error('Update payment status error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Compra');
      throw error;
    }
  }

  async cancelPurchase(purchaseId: number, cancelledBy: number) {
    try {
      await this.purchaseRepo.cancel(purchaseId);

      await this.auditLogRepo.create({
        userId: cancelledBy,
        action: 'CANCEL_PURCHASE',
        entity: 'purchases',
        entity_id: purchaseId,
      });

      return { success: true };
    } catch (error: any) {
      logger.error('Cancel purchase error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Compra');
      throw error;
    }
  }

  /**
   * Datos completos para la factura de compra a proveedor:
   * qué se compró, cuándo y el estado de los pagos.
   */
  async getPurchaseInvoiceData(purchaseId: number): Promise<PurchaseInvoiceDTO> {
    const purchase = await this.purchaseRepo.findById(purchaseId);
    if (!purchase) throw new NotFoundError('Compra');

    const supplier = purchase.supplier;
    if (!supplier) throw new NotFoundError('Proveedor');

    const payments = await this.supplierRepo.getPaymentsByPurchase(purchaseId);

    const round = (n: number) => Math.round(n * 100) / 100;

    return {
      purchaseId: purchase.id,
      supplierName: supplier.name,
      supplierRuc: supplier.ruc ?? null,
      supplierPhone: (supplier as any).phone ?? null,
      supplierEmail: (supplier as any).email ?? null,
      createdAt: purchase.created_at,
      status: purchase.status,
      items: (purchase.items || []).map((item) => ({
        productName: item.product?.name ?? `Producto #${item.product_id}`,
        sku: item.product?.sku ?? null,
        quantity: item.quantity,
        unitCost: Number(item.unit_cost),
        totalPrice: round(item.quantity * Number(item.unit_cost)),
      })),
      totalAmount: round(Number(purchase.total_amount)),
      paidAmount: round(Number(purchase.paid_amount ?? 0)),
      remainingAmount: round(Number(purchase.total_amount) - Number(purchase.paid_amount ?? 0)),
      payments: payments.map((p) => ({
        date: p.created_at,
        amount: Number(p.amount),
        note: p.note,
      })),
    };
  }
}
