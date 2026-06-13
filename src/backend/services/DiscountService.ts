import { IDiscountRepository } from '../../domain/ports/IDiscountRepository.js';
import { Discount, Product } from '../../domain/models.js';
import { CreateDiscountDTO, UpdateDiscountDTO } from '../../domain/dtos.js';
import { NotFoundError } from '../../shared/errors.js';

export class DiscountService {
  constructor(
    private discountRepo: IDiscountRepository,
  ) {}

  async getAllDiscounts(activeOnly?: boolean) {
    return this.discountRepo.findAll(activeOnly);
  }

  async getDiscountById(id: number) {
    const discount = await this.discountRepo.findById(id);
    if (!discount) throw new NotFoundError('Descuento');
    return discount;
  }

  async createDiscount(data: CreateDiscountDTO, userId: number = 1) {
    const discount = await this.discountRepo.create(data);
    return { success: true, id: discount.id };
  }

  async updateDiscount(id: number, data: UpdateDiscountDTO) {
    await this.getDiscountById(id);
    const discount = await this.discountRepo.update(id, data);
    return { success: true, discount };
  }

  async deleteDiscount(id: number) {
    await this.getDiscountById(id);
    await this.discountRepo.delete(id);
    return { success: true };
  }

  async getApplicableDiscounts(productId: number, totalAmount?: number) {
    return this.discountRepo.findApplicableToProduct(productId, totalAmount);
  }

  calculateDiscount(
    product: { price_sale: number },
    discount: { type: string; value: number },
    quantity: number,
  ): { finalUnitPrice: number; discountAmount: number } {
    const lineTotal = product.price_sale * quantity;
    let discountAmount: number;

    if (discount.type === 'PERCENTAGE') {
      discountAmount = lineTotal * (discount.value / 100);
    } else {
      discountAmount = Math.min(discount.value, lineTotal);
    }

    discountAmount = parseFloat(discountAmount.toFixed(2));
    const finalLineTotal = lineTotal - discountAmount;
    const finalUnitPrice = parseFloat((finalLineTotal / quantity).toFixed(2));

    return { finalUnitPrice, discountAmount };
  }
}
