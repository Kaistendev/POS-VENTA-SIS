import { IProductRepository } from '../../domain/ports/IProductRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { ICategoryRepository } from '../../domain/ports/ICategoryRepository.js';
import { CreateProductDTO, UpdateProductDTO } from '../../domain/dtos.js';
import { NotFoundError, ConflictError, BusinessRuleError, ValidationError } from '../../shared/errors.js';
import { productSchema } from '../../common/schemas.js';

export class ProductService {
  constructor(
    private productRepo: IProductRepository,
    private categoryRepo: ICategoryRepository,
    private auditLogRepo: IAuditLogRepository,
  ) {}

  async getAllProducts(search?: string, categoryId?: number) {
    return this.productRepo.findAll(search, categoryId);
  }

  async getProductById(id: number) {
    const product = await this.productRepo.findById(id);
    if (!product) throw new NotFoundError('Producto');
    return product;
  }

  async getLowStockProducts(threshold?: number) {
    return this.productRepo.findLowStock();
  }

  async createProduct(data: CreateProductDTO, userId: number = 1) {
    const validated = productSchema.parse(data);

    const existing = await this.productRepo.findBySku(validated.sku);
    if (existing) throw new ConflictError(`El SKU ${validated.sku} ya se encuentra registrado.`);

    if (validated.category_id) {
      const category = await this.categoryRepo.findById(validated.category_id);
      if (!category) throw new NotFoundError('Categoría');
    }

    const initialStock = validated.stock || 0;
    const product = await this.productRepo.create(validated);

    if (initialStock > 0) {
      await this.productRepo.createMovement({
        product_id: product.id,
        type: 'ENTRADA',
        quantity: initialStock,
        reason: 'INICIAL',
      });
    }

    await this.auditLogRepo.create({
      userId,
      action: 'CREATE_PRODUCT',
      entity: 'products',
      entity_id: product.id,
    });

    return { success: true, id: product.id };
  }

  async updateProduct(id: number, data: UpdateProductDTO, userId: number = 1) {
    const existingProduct = await this.productRepo.findById(id);
    if (!existingProduct) throw new NotFoundError('Producto');

    const validated = productSchema.parse(data);

    if (validated.sku !== existingProduct.sku) {
      const skuExists = await this.productRepo.findBySku(validated.sku);
      if (skuExists) throw new ConflictError(`El SKU ${validated.sku} ya se encuentra registrado.`);
    }

    if (validated.category_id) {
      const category = await this.categoryRepo.findById(validated.category_id);
      if (!category) throw new NotFoundError('Categoría');
    }

    const product = await this.productRepo.update(id, validated);

    await this.auditLogRepo.create({
      userId,
      action: 'UPDATE_PRODUCT',
      entity: 'products',
      entity_id: product.id,
    });

    return { success: true, product };
  }

  async deleteProduct(id: number, userId: number = 1) {
    const existingProduct = await this.productRepo.findById(id);
    if (!existingProduct) throw new NotFoundError('Producto');

    const salesCount = await this.productRepo.getSalesCount(id);
    if (salesCount > 0) {
      throw new BusinessRuleError(`No se puede eliminar el producto porque tiene ${salesCount} venta(s) asociada(s).`);
    }

    await this.productRepo.delete(id);

    await this.auditLogRepo.create({
      userId,
      action: 'DELETE_PRODUCT',
      entity: 'products',
      entity_id: id,
    });

    return { success: true };
  }

  async addStock(productId: number, quantity: number, userId: number = 1, reason: string = 'AJUSTE') {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundError('Producto');
    if (quantity <= 0) throw new ValidationError('La cantidad debe ser mayor a cero.');

    await this.productRepo.updateStock(productId, quantity);

    await this.productRepo.createMovement({
      product_id: productId,
      type: 'ENTRADA',
      quantity,
      reason,
    });

    await this.auditLogRepo.create({
      userId,
      action: 'STOCK_ENTRADA',
      entity: 'products',
      entity_id: productId,
    });

    return { success: true };
  }

  async removeStock(productId: number, quantity: number, userId: number = 1, reason: string = 'AJUSTE') {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundError('Producto');
    if (quantity <= 0) throw new ValidationError('La cantidad debe ser mayor a cero.');
    if (product.stock < quantity) {
      throw new BusinessRuleError(`Stock insuficiente. Stock actual: ${product.stock}, Cantidad solicitada: ${quantity}`);
    }

    await this.productRepo.updateStock(productId, -quantity);

    const updated = await this.productRepo.findById(productId);
    if (updated && updated.stock < 0) {
      throw new BusinessRuleError('Error interno: el stock no puede ser negativo');
    }

    await this.productRepo.createMovement({
      product_id: productId,
      type: 'SALIDA',
      quantity,
      reason,
    });

    await this.auditLogRepo.create({
      userId,
      action: 'STOCK_SALIDA',
      entity: 'products',
      entity_id: productId,
    });

    return { success: true };
  }

  async getInventoryMovements(productId: number, limit: number = 50) {
    const product = await this.productRepo.findById(productId);
    if (!product) throw new NotFoundError('Producto');

    return this.productRepo.getMovements(productId, limit);
  }
}
