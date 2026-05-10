import { Category, CategoryWithProducts } from '../models.js';
import { CreateCategoryDTO, UpdateCategoryDTO } from '../dtos.js';

export interface ICategoryRepository {
  findAll(search?: string): Promise<Category[]>;
  findById(id: number): Promise<CategoryWithProducts | null>;
  findByName(name: string): Promise<Category | null>;
  create(data: CreateCategoryDTO): Promise<Category>;
  update(id: number, data: UpdateCategoryDTO): Promise<Category>;
  delete(id: number): Promise<void>;
  getProductCount(id: number): Promise<number>;
}
