import { InventoryMovement } from '../models.js';
import { PaginatedResult } from '../dtos.js';

export interface InventoryMovementFilter {
  productId?: number;
  type?: string;
  reason?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface IInventoryMovementRepository {
  findAll(filter?: InventoryMovementFilter): Promise<PaginatedResult<InventoryMovement> | InventoryMovement[]>;
  count(filter?: InventoryMovementFilter): Promise<number>;
}
