import { Discount, DiscountWithRelations, ProductDiscount } from '../models.js';
import { CreateDiscountDTO, UpdateDiscountDTO } from '../dtos.js';

export interface IDiscountRepository {
  findAll(activeOnly?: boolean): Promise<Discount[]>;
  findById(id: number): Promise<DiscountWithRelations | null>;
  findApplicableToProduct(productId: number, totalAmount?: number): Promise<Discount[]>;
  create(data: CreateDiscountDTO): Promise<Discount>;
  update(id: number, data: UpdateDiscountDTO): Promise<Discount>;
  delete(id: number): Promise<void>;
  addProducts(discountId: number, productIds: number[]): Promise<void>;
  removeProducts(discountId: number, productIds: number[]): Promise<void>;
}
