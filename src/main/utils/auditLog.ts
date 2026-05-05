import { prisma } from '../prisma/client.js';

/**
 * Gets the first admin user from the database.
 * Used as a fallback when no userId is provided.
 */
async function getDefaultAdminUserId(): Promise<number | null> {
  try {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    return admin?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Safely creates an audit log entry.
 * Verifies the user exists before creating the log to avoid foreign key errors.
 */
export async function createAuditLog({
  userId,
  action,
  entity,
  entity_id,
}: {
  userId?: number;
  action: string;
  entity: string;
  entity_id: number;
}): Promise<void> {
  // If no userId provided, try to get the first admin user
  let finalUserId = userId;
  if (!finalUserId) {
    finalUserId = await getDefaultAdminUserId();
    if (!finalUserId) {
      console.warn('No userId provided and no admin user found, skipping audit log');
      return;
    }
  }

  try {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: finalUserId },
      select: { id: true },
    });

    if (!user) {
      console.warn(`User ${finalUserId} not found, skipping audit log`);
      return;
    }

    await prisma.auditLog.create({
      data: {
        user_id: finalUserId,
        action,
        entity,
        entity_id,
      },
    });
  } catch (error) {
    console.warn('Failed to create audit log:', error);
    // Don't throw - audit log failure shouldn't break the main operation
  }
}
