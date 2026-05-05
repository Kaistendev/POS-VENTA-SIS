import { prisma } from '../prisma/client.js';
import { createAuditLog } from '../utils/auditLog.js';

export class SupplierService {
  /**
   * Get all suppliers with optional search
   */
  static async getAllSuppliers(search?: string) {
    try {
      const where: any = {};
      
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { ruc: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      
      return await prisma.supplier.findMany({
        where,
        include: {
          _count: {
            select: { products: true, purchases: true },
          },
        },
        orderBy: { name: 'asc' },
      });
    } catch (error: any) {
      console.error('Get all suppliers error:', error);
      throw new Error('Error al obtener proveedores');
    }
  }

  /**
   * Get supplier by ID
   */
  static async getSupplierById(id: number) {
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          products: {
            select: { id: true, name: true, sku: true, stock: true },
          },
          purchases: {
            orderBy: { created_at: 'desc' },
            take: 10,
          },
        },
      });
      
      if (!supplier) {
        throw new Error('Proveedor no encontrado');
      }
      
      return supplier;
    } catch (error: any) {
      console.error('Get supplier by ID error:', error);
      if (error.code === 'P2025') {
        throw new Error('Proveedor no encontrado');
      }
      throw new Error('Error al obtener proveedor');
    }
  }

  /**
   * Create a new supplier
   */
  static async createSupplier(data: { name: string; ruc?: string; phone?: string; email?: string; address?: string }, createdBy: number) {
    try {
      // Check if RUC already exists (if provided)
      if (data.ruc) {
        const exists = await prisma.supplier.findFirst({
          where: { ruc: data.ruc },
        });
        if (exists) {
          throw new Error(`El RUC ${data.ruc} ya está registrado`);
        }
      }

      const supplier = await prisma.supplier.create({
        data: {
          name: data.name,
          ruc: data.ruc,
          phone: data.phone,
          email: data.email,
          address: data.address,
        },
      });

      // Log audit
      await createAuditLog({
        userId: createdBy,
        action: 'CREATE_SUPPLIER',
        entity: 'suppliers',
        entity_id: supplier.id,
      });

      return supplier;
    } catch (error: any) {
      console.error('Create supplier error:', error);
      if (error.code === 'P2002') {
        throw new Error('El RUC ya está en uso');
      }
      throw error;
    }
  }

  /**
   * Update an existing supplier
   */
  static async updateSupplier(id: number, data: { name?: string; ruc?: string; phone?: string; email?: string; address?: string }, updatedBy: number) {
    try {
      // Check if supplier exists
      const existing = await prisma.supplier.findUnique({
        where: { id },
      });
      
      if (!existing) {
        throw new Error('Proveedor no encontrado');
      }

      // Check if RUC is being changed and if it's already taken
      if (data.ruc && data.ruc !== existing.ruc) {
        const rucExists = await prisma.supplier.findFirst({
          where: { ruc: data.ruc, NOT: { id } },
        });
        if (rucExists) {
          throw new Error(`El RUC ${data.ruc} ya está registrado`);
        }
      }

      const supplier = await prisma.supplier.update({
        where: { id },
        data: {
          name: data.name,
          ruc: data.ruc,
          phone: data.phone,
          email: data.email,
          address: data.address,
        },
      });

      // Log audit
      await createAuditLog({
        userId: updatedBy,
        action: 'UPDATE_SUPPLIER',
        entity: 'suppliers',
        entity_id: id,
      });

      return supplier;
    } catch (error: any) {
      console.error('Update supplier error:', error);
      if (error.code === 'P2025') {
        throw new Error('Proveedor no encontrado');
      }
      throw error;
    }
  }

  /**
   * Delete a supplier
   */
  static async deleteSupplier(id: number, deletedBy: number) {
    try {
      // Check if supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: { products: true, purchases: true },
      });

      if (!supplier) {
        throw new Error('Proveedor no encontrado');
      }

      // Check if supplier has products
      if (supplier.products.length > 0) {
        throw new Error(
          `No se puede eliminar el proveedor porque tiene ${supplier.products.length} producto(s) asociado(s)`
        );
      }

      // Check if supplier has purchases
      if (supplier.purchases.length > 0) {
        throw new Error(
          `No se puede eliminar el proveedor porque tiene ${supplier.purchases.length} compra(s) asociada(s)`
        );
      }

      await prisma.supplier.delete({
        where: { id },
      });

      // Log audit
      await createAuditLog({
        userId: deletedBy,
        action: 'DELETE_SUPPLIER',
        entity: 'suppliers',
        entity_id: id,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Delete supplier error:', error);
      if (error.code === 'P2025') {
        throw new Error('Proveedor no encontrado');
      }
      throw error;
    }
  }
}
