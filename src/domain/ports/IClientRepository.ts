import { Client } from '../models.js';
import { CreateClientDTO, UpdateClientDTO } from '../dtos.js';

export interface IClientRepository {
  findAll(search?: string): Promise<Client[]>;
  findById(id: number): Promise<Client | null>;
  findByDni(dni: string): Promise<Client | null>;
  findByCode(code: string): Promise<Client | null>;
  findByTaxId(taxId: string): Promise<Client | null>;
  create(data: CreateClientDTO): Promise<Client>;
  update(id: number, data: UpdateClientDTO): Promise<Client>;
  delete(id: number): Promise<void>;
  getSalesCount(id: number): Promise<number>;
}
