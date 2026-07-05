import type { PrismaClient } from '@prisma/client';
import { IClientRepository } from '../../domain/ports/IClientRepository.js';
import { Client } from '../../domain/models.js';
import { CreateClientDTO, UpdateClientDTO } from '../../domain/dtos.js';

export class PrismaClientRepository implements IClientRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(search?: string): Promise<Client[]> {
    const where = search
      ? {
          OR: [
            { dni: { contains: search } },
            { name: { contains: search } },
            { code: { contains: search } },
            { tax_id: { contains: search } },
          ],
        }
      : {};

    return this.prisma.client.findMany({ where, orderBy: { created_at: 'desc' } }) as unknown as Client[];
  }

  async findById(id: number): Promise<Client | null> {
    return this.prisma.client.findUnique({ where: { id } }) as unknown as Client | null;
  }

  async findByDni(dni: string): Promise<Client | null> {
    return this.prisma.client.findFirst({ where: { dni } }) as unknown as Client | null;
  }

  async findByCode(code: string): Promise<Client | null> {
    return this.prisma.client.findFirst({ where: { code } }) as unknown as Client | null;
  }

  async findByTaxId(taxId: string): Promise<Client | null> {
    return this.prisma.client.findFirst({ where: { tax_id: taxId } }) as unknown as Client | null;
  }

  async create(data: CreateClientDTO): Promise<Client> {
    return this.prisma.client.create({ data }) as unknown as Client;
  }

  async update(id: number, data: UpdateClientDTO): Promise<Client> {
    return this.prisma.client.update({ where: { id }, data }) as unknown as Client;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.client.delete({ where: { id } });
  }

  async getSalesCount(id: number): Promise<number> {
    return this.prisma.sale.count({ where: { client_id: id } });
  }
}
