import type { PrismaClient } from '@prisma/client';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { AuditLogEntryDTO } from '../../domain/dtos.js';

export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(entry: AuditLogEntryDTO): Promise<void> {
    try {
      let finalUserId: number | undefined = entry.userId;

      if (finalUserId) {
        const user = await this.prisma.user.findUnique({
          where: { id: finalUserId },
          select: { id: true },
        });
        if (!user) {
          const adminId = await this.getDefaultAdminUserId();
          if (!adminId) {
            console.warn(`User ${entry.userId} not found and no admin available, skipping audit log`);
            return;
          }
          finalUserId = adminId;
        }
      } else {
        const adminId = await this.getDefaultAdminUserId();
        if (!adminId) {
          console.warn('No userId provided and no admin user found, skipping audit log');
          return;
        }
        finalUserId = adminId;
      }

      await this.prisma.auditLog.create({
        data: {
          user_id: finalUserId,
          action: entry.action,
          entity: entry.entity,
          entity_id: entry.entity_id,
        },
      });
    } catch (error) {
      console.warn('Failed to create audit log:', error);
    }
  }

  private async getDefaultAdminUserId(): Promise<number | null> {
    try {
      const admin = await this.prisma.user.findFirst({
        where: { role: 'ADMIN' },
        select: { id: true },
        orderBy: { id: 'asc' },
      });
      return admin?.id ?? null;
    } catch {
      return null;
    }
  }
}
