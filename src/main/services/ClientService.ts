import { prisma } from '../prisma/client.js';
import { clientSchema } from '../../common/schemas.js';

export class ClientService {
  /**
   * Obtiene todos los clientes con búsqueda opcional
   */
  static async getAllClients(search?: string) {
    const where = search
      ? {
          OR: [
            { dni: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
            { code: { contains: search, mode: 'insensitive' as const } },
            { tax_id: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return prisma.client.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Obtiene un cliente por ID
   */
  static async getClientById(id: number) {
    const client = await prisma.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new Error('Cliente no encontrado');
    }

    return client;
  }

  /**
   * Crea un cliente y deja la trazabilidad de la creación
   */
  static async createClient(clientData: any, userId: number = 1) {
    // Validar con Zod
    const validated = clientSchema.parse(clientData);

    // Verificar DNI duplicado
    const existingDni = await prisma.client.findFirst({
      where: { dni: validated.dni },
    });

    if (existingDni) {
      throw new Error(`El DNI ${validated.dni} ya se encuentra registrado.`);
    }

    // Verificar código duplicado
    const existingCode = await prisma.client.findFirst({
      where: { code: validated.code },
    });

    if (existingCode) {
      throw new Error(`El código ${validated.code} ya se encuentra registrado.`);
    }

    // Verificar tax_id duplicado (si existe)
    if (validated.tax_id) {
      const existingTaxId = await prisma.client.findFirst({
        where: { tax_id: validated.tax_id },
      });

      if (existingTaxId) {
        throw new Error(`El RUC ${validated.tax_id} ya se encuentra registrado.`);
      }
    }

    const client = await prisma.client.create({
      data: validated,
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'CREATE_CLIENT',
        entity: 'clients',
        entity_id: client.id,
      },
    });

    return { success: true, id: client.id };
  }

  /**
   * Actualiza un cliente y deja la trazabilidad de la actualización
   */
  static async updateClient(id: number, clientData: any, userId: number = 1) {
    // Verificar que el cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new Error('Cliente no encontrado');
    }

    // Validar datos de entrada
    const validated = clientSchema.parse(clientData);

    // Verificar DNI duplicado (excluyendo el cliente actual)
    const existingDni = await prisma.client.findFirst({
      where: {
        dni: validated.dni,
        NOT: { id },
      },
    });

    if (existingDni) {
      throw new Error(`El DNI ${validated.dni} ya se encuentra registrado.`);
    }

    // Verificar código duplicado (excluyendo el cliente actual)
    const existingCode = await prisma.client.findFirst({
      where: {
        code: validated.code,
        NOT: { id },
      },
    });

    if (existingCode) {
      throw new Error(`El código ${validated.code} ya se encuentra registrado.`);
    }

    // Verificar tax_id duplicado (si existe y excluyendo el cliente actual)
    if (validated.tax_id) {
      const existingTaxId = await prisma.client.findFirst({
        where: {
          tax_id: validated.tax_id,
          NOT: { id },
        },
      });

      if (existingTaxId) {
        throw new Error(`El RUC ${validated.tax_id} ya se encuentra registrado.`);
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: validated,
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'UPDATE_CLIENT',
        entity: 'clients',
        entity_id: client.id,
      },
    });

    return { success: true, client };
  }

  /**
   * Elimina un cliente y deja la trazabilidad de la eliminación
   */
  static async deleteClient(id: number, userId: number = 1) {
    // Verificar que el cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      throw new Error('Cliente no encontrado');
    }

    // Verificar si el cliente tiene ventas asociadas
    const salesCount = await prisma.sale.count({
      where: { client_id: id },
    });

    if (salesCount > 0) {
      throw new Error(`No se puede eliminar el cliente porque tiene ${salesCount} venta(s) asociada(s).`);
    }

    await prisma.client.delete({
      where: { id },
    });

    // Registrar en auditoría
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'DELETE_CLIENT',
        entity: 'clients',
        entity_id: id,
      },
    });

    return { success: true };
  }
}
