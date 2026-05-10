/**
 * Helpers DRY para evitar patrones repetidos en servicios y repositorios.
 */

/**
 * Construye un filtro de fecha para consultas Prisma.
 * Ej: buildDateFilter(startDate, endDate) => { created_at: { gte: ..., lte: ... } }
 */
export function buildDateFilter(
  field: string,
  startDate?: Date,
  endDate?: Date,
): Record<string, any> {
  if (!startDate && !endDate) return {};
  const filter: Record<string, any> = {};
  if (startDate) filter[field] = { ...(filter[field] || {}), gte: startDate };
  if (endDate) filter[field] = { ...(filter[field] || {}), lte: endDate };
  return filter;
}

/**
 * Busca una entidad por su función finder y lanza NotFoundError si no existe.
 */
export async function findOrThrow<T>(
  finder: () => Promise<T | null>,
  entityName: string,
  id?: number | string,
): Promise<T> {
  const result = await finder();
  if (!result) {
    const { NotFoundError } = await import('./errors.js');
    throw new NotFoundError(entityName, id);
  }
  return result;
}
