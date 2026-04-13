import { prisma } from '../prisma/client.js';

export class ClientService {
  /**
   * Obtiene todos los clientes
   */
  static async getAllClients() {
    return prisma.client.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Crea un cliente y deja la trazabilidad de la creación
   */
  static async createClient(clientData: any, userId: number = 1) {
    const existing = await prisma.client.findFirst({
      where: { dni: clientData.dni },
    });

    if (existing) {
      throw new Error(`El DNI ${clientData.dni} ya se encuentra registrado.`);
    }

    const client = await prisma.client.create({
      data: clientData,
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

    return client.id;
  }
}
