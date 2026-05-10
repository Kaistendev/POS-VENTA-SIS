import { ISupplierRepository } from '../../domain/ports/ISupplierRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { CreateSupplierDTO, UpdateSupplierDTO } from '../../domain/dtos.js';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../shared/errors.js';

export class SupplierService {
  constructor(
    private supplierRepo: ISupplierRepository,
    private auditLogRepo: IAuditLogRepository,
  ) {}

  async getAllSuppliers(search?: string) {
    try {
      return await this.supplierRepo.findAll(search);
    } catch (error: any) {
      console.error('Get all suppliers error:', error);
      throw new Error('Error al obtener proveedores');
    }
  }

  async getSupplierById(id: number) {
    try {
      const supplier = await this.supplierRepo.findById(id);
      if (!supplier) throw new NotFoundError('Proveedor');
      return supplier;
    } catch (error: any) {
      console.error('Get supplier by ID error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Proveedor');
      throw error;
    }
  }

  async createSupplier(data: CreateSupplierDTO, createdBy: number) {
    try {
      if (data.ruc) {
        const exists = await this.supplierRepo.findByRuc(data.ruc);
        if (exists) throw new ConflictError(`El RUC ${data.ruc} ya está registrado`);
      }

      const supplier = await this.supplierRepo.create(data);

      await this.auditLogRepo.create({
        userId: createdBy,
        action: 'CREATE_SUPPLIER',
        entity: 'suppliers',
        entity_id: supplier.id,
      });

      return supplier;
    } catch (error: any) {
      console.error('Create supplier error:', error);
      if (error.code === 'P2002') throw new ConflictError('El RUC ya está en uso');
      throw error;
    }
  }

  async updateSupplier(id: number, data: UpdateSupplierDTO, updatedBy: number) {
    try {
      const existing = await this.supplierRepo.findById(id);
      if (!existing) throw new NotFoundError('Proveedor');

      if (data.ruc && data.ruc !== existing.ruc) {
        const rucExists = await this.supplierRepo.findByRuc(data.ruc);
        if (rucExists) throw new ConflictError(`El RUC ${data.ruc} ya está registrado`);
      }

      const supplier = await this.supplierRepo.update(id, data);

      await this.auditLogRepo.create({
        userId: updatedBy,
        action: 'UPDATE_SUPPLIER',
        entity: 'suppliers',
        entity_id: id,
      });

      return supplier;
    } catch (error: any) {
      console.error('Update supplier error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Proveedor');
      throw error;
    }
  }

  async deleteSupplier(id: number, deletedBy: number) {
    try {
      const supplier = await this.supplierRepo.findById(id);
      if (!supplier) throw new NotFoundError('Proveedor');

      const hasProducts = await this.supplierRepo.hasProducts(id);
      if (hasProducts) throw new BusinessRuleError('No se puede eliminar el proveedor porque tiene producto(s) asociado(s)');

      const hasPurchases = await this.supplierRepo.hasPurchases(id);
      if (hasPurchases) throw new BusinessRuleError('No se puede eliminar el proveedor porque tiene compra(s) asociada(s)');

      await this.supplierRepo.delete(id);

      await this.auditLogRepo.create({
        userId: deletedBy,
        action: 'DELETE_SUPPLIER',
        entity: 'suppliers',
        entity_id: id,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Delete supplier error:', error);
      if (error.code === 'P2025') throw new NotFoundError('Proveedor');
      throw error;
    }
  }
}
