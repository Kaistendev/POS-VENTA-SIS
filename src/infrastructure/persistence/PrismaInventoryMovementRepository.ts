import type { PrismaClient } from '@prisma/client';
import { IInventoryMovementRepository, InventoryMovementFilter } from '../../domain/ports/IInventoryMovementRepository.js';
import { InventoryMovement } from '../../domain/models.js';
import { PaginatedResult } from '../../domain/dtos.js';
import { buildDateFilter } from '../../shared/helpers.js';

export class PrismaInventoryMovementRepository implements IInventoryMovementRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(filter?: InventoryMovementFilter): Promise<PaginatedResult<InventoryMovement> | InventoryMovement[]> {
    const where: any = {};
    Object.assign(where, buildDateFilter('created_at', filter?.startDate, filter?.endDate));
    if (filter?.productId) where.product_id = filter.productId;
    if (filter?.type) where.type = filter.type;
    if (filter?.reason) where.reason = filter.reason;

    const page = filter?.page ?? 1;
    const pageSize = filter?.pageSize ?? 50;
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [data, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
        skip,
        take,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);

    return {
      data: data as unknown as InventoryMovement[],
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async count(filter?: InventoryMovementFilter): Promise<number> {
    const where: any = {};
    Object.assign(where, buildDateFilter('created_at', filter?.startDate, filter?.endDate));
    if (filter?.productId) where.product_id = filter.productId;
    if (filter?.type) where.type = filter.type;
    if (filter?.reason) where.reason = filter.reason;

    return this.prisma.inventoryMovement.count({ where });
  }
}
