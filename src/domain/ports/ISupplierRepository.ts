import { Supplier, SupplierWithRelations } from '../models.js';
import { CreateSupplierDTO, UpdateSupplierDTO } from '../dtos.js';

export interface ISupplierRepository {
  findAll(search?: string): Promise<(Supplier & { _count?: { products: number; purchases: number } })[]>;
  findById(id: number): Promise<SupplierWithRelations | null>;
  findByRuc(ruc: string): Promise<Supplier | null>;
  create(data: CreateSupplierDTO): Promise<Supplier>;
  update(id: number, data: UpdateSupplierDTO): Promise<Supplier>;
  delete(id: number): Promise<void>;
  hasProducts(id: number): Promise<boolean>;
  hasPurchases(id: number): Promise<boolean>;
}
