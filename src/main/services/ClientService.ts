import { IClientRepository } from '../../domain/ports/IClientRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { CreateClientDTO, UpdateClientDTO } from '../../domain/dtos.js';
import { NotFoundError, ConflictError, BusinessRuleError } from '../../shared/errors.js';
import { findOrThrow } from '../../shared/helpers.js';
import { clientSchema } from '../../common/schemas.js';

export class ClientService {
  constructor(
    private clientRepo: IClientRepository,
    private auditLogRepo: IAuditLogRepository,
  ) {}

  async getAllClients(search?: string) {
    return this.clientRepo.findAll(search);
  }

  async getClientById(id: number) {
    return await findOrThrow(() => this.clientRepo.findById(id), 'Cliente', id);
  }

  async createClient(data: CreateClientDTO, userId: number = 1) {
    const validated = clientSchema.parse(data);

    const existingDni = await this.clientRepo.findByDni(validated.dni);
    if (existingDni) throw new ConflictError(`El DNI ${validated.dni} ya se encuentra registrado.`);

    const existingCode = await this.clientRepo.findByCode(validated.code);
    if (existingCode) throw new ConflictError(`El código ${validated.code} ya se encuentra registrado.`);

    if (validated.tax_id) {
      const existingTaxId = await this.clientRepo.findByTaxId(validated.tax_id);
      if (existingTaxId) throw new ConflictError(`El RUC ${validated.tax_id} ya se encuentra registrado.`);
    }

    const client = await this.clientRepo.create(validated);

    await this.auditLogRepo.create({
      userId,
      action: 'CREATE_CLIENT',
      entity: 'clients',
      entity_id: client.id,
    });

    return { success: true, id: client.id };
  }

  async updateClient(id: number, data: UpdateClientDTO, userId: number = 1) {
    await findOrThrow(() => this.clientRepo.findById(id), 'Cliente', id);

    const validated = clientSchema.parse(data);

    const existingDni = await this.clientRepo.findByDni(validated.dni);
    if (existingDni && existingDni.id !== id) throw new ConflictError(`El DNI ${validated.dni} ya se encuentra registrado.`);

    const existingCode = await this.clientRepo.findByCode(validated.code);
    if (existingCode && existingCode.id !== id) throw new ConflictError(`El código ${validated.code} ya se encuentra registrado.`);

    if (validated.tax_id) {
      const existingTaxId = await this.clientRepo.findByTaxId(validated.tax_id);
      if (existingTaxId && existingTaxId.id !== id) throw new ConflictError(`El RUC ${validated.tax_id} ya se encuentra registrado.`);
    }

    const client = await this.clientRepo.update(id, validated);

    await this.auditLogRepo.create({
      userId,
      action: 'UPDATE_CLIENT',
      entity: 'clients',
      entity_id: client.id,
    });

    return { success: true, client };
  }

  async deleteClient(id: number, userId: number = 1) {
    await findOrThrow(() => this.clientRepo.findById(id), 'Cliente', id);

    const salesCount = await this.clientRepo.getSalesCount(id);
    if (salesCount > 0) {
      throw new BusinessRuleError(`No se puede eliminar el cliente porque tiene ${salesCount} venta(s) asociada(s).`);
    }

    await this.clientRepo.delete(id);

    await this.auditLogRepo.create({
      userId,
      action: 'DELETE_CLIENT',
      entity: 'clients',
      entity_id: id,
    });

    return { success: true };
  }
}
