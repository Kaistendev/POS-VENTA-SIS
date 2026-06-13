import { Product, ProductWithRelations } from '../models.js';
import { CreateProductDTO, UpdateProductDTO, StockMovementDTO } from '../dtos.js';

export interface IProductRepository {
  findAll(search?: string, categoryId?: number): Promise<Product[]>;
  findById(id: number): Promise<ProductWithRelations | null>;
  findByIds(ids: number[]): Promise<Product[]>;
  findBySku(sku: string): Promise<Product | null>;
  findLowStock(): Promise<ProductWithRelations[]>;
  create(data: CreateProductDTO): Promise<Product>;
  update(id: number, data: UpdateProductDTO): Promise<ProductWithRelations>;
  delete(id: number): Promise<void>;
  getSalesCount(id: number): Promise<number>;
  updateStock(id: number, delta: number): Promise<void>;
  bulkUpdatePrice(percentage: number, categoryId?: number): Promise<number>;
  createMovement(data: StockMovementDTO): Promise<void>;
  getMovements(productId: number, limit?: number): Promise<any[]>;
}
