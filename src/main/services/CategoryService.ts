import { ICategoryRepository } from '../../domain/ports/ICategoryRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../../domain/dtos.js';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../shared/errors.js';
import { findOrThrow } from '../../shared/helpers.js';

export class CategoryService {
  constructor(
    private categoryRepo: ICategoryRepository,
    private auditLogRepo: IAuditLogRepository,
  ) {}

  async getAllCategories(search?: string) {
    return await this.categoryRepo.findAll(search);
  }

  async getCategoryById(id: number) {
    return await findOrThrow(() => this.categoryRepo.findById(id), 'Categoría', id);
  }

  async createCategory(data: CreateCategoryDTO, createdBy: number) {
    const existing = await this.categoryRepo.findByName(data.name);
    if (existing) throw new ConflictError(`La categoría "${data.name}" ya existe.`);
    const category = await this.categoryRepo.create(data);
    await this.auditLogRepo.create({
      userId: createdBy,
      action: 'CREATE_CATEGORY',
      entity: 'categories',
      entity_id: category.id,
    });
    return category;
  }

  async updateCategory(id: number, data: UpdateCategoryDTO, updatedBy: number) {
    await findOrThrow(() => this.categoryRepo.findById(id), 'Categoría', id);
    const duplicate = await this.categoryRepo.findByName(data.name);
    if (duplicate && duplicate.id !== id) throw new ConflictError(`La categoría "${data.name}" ya existe.`);
    const category = await this.categoryRepo.update(id, data);
    await this.auditLogRepo.create({
      userId: updatedBy,
      action: 'UPDATE_CATEGORY',
      entity: 'categories',
      entity_id: id,
    });
    return category;
  }

  async deleteCategory(id: number, deletedBy: number) {
    await findOrThrow(() => this.categoryRepo.findById(id), 'Categoría', id);
    const productCount = await this.categoryRepo.getProductCount(id);
    if (productCount > 0) {
      throw new BusinessRuleError(`No se puede eliminar la categoría porque tiene ${productCount} producto(s) asociado(s).`);
    }
    await this.categoryRepo.delete(id);
    await this.auditLogRepo.create({
      userId: deletedBy,
      action: 'DELETE_CATEGORY',
      entity: 'categories',
      entity_id: id,
    });
    return { success: true };
  }
}
