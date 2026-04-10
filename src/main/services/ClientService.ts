import { ClientRepository } from '../repositories/ClientRepository.js';
import { AuditRepository } from '../repositories/AuditRepository.js';
import { Client } from '../../common/types.js';

export class ClientService {
  /**
   * Obtiene todos los clientes
   */
  static async getAllClients() {
    return ClientRepository.findAll();
  }

  /**
   * Crea un cliente y deja la trazabilidad de la creación
   */
  static async createClient(clientData: Omit<Client, 'id' | 'created_at' | 'updated_at'>, userId: number = 1) {
    const existing = await ClientRepository.findByDni(clientData.dni);
    if (existing) {
      throw new Error(`El DNI ${clientData.dni} ya se encuentra registrado.`);
    }

    const [idRow] = await ClientRepository.create(clientData);
    const newId = typeof idRow === 'object' ? (idRow as any).id : idRow;

    // Registrar en auditoría (hardcoded user 1 for now unless user auth is active)
    await AuditRepository.create({
      user_id: userId,
      action: 'CREATE_CLIENT',
      entity: 'clients',
      entity_id: newId
    });

    return newId;
  }
}
