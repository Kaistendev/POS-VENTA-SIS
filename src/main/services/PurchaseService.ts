import { IPurchaseRepository } from '../../domain/ports/IPurchaseRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { ISupplierRepository } from '../../domain/ports/ISupplierRepository.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';
import { CreatePurchaseDTO } from '../../domain/dtos.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors.js';

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
      console.error('Get all purchases error:', error);
      throw new Error('Error al obtener compras');
    }
  }

  async getPurchaseById(id: number) {
    try {
      const purchase = await this.purchaseRepo.findById(id);
      if (!purchase) throw new NotFoundError('Compra');
      return purchase;
    } catch (error: any) {
      console.error('Get purchase by ID error:', error);
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
      console.error('Create purchase error:', error);
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
      console.error('Receive purchase error:', error);
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
      console.error('Cancel purchase error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Compra');
      throw error;
    }
  }
}
