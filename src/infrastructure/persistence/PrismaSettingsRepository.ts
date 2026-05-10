import { PrismaClient } from '@prisma/client';
import { ISettingsRepository } from '../../domain/ports/ISettingsRepository.js';
import { TaxSettingsDTO } from '../../domain/dtos.js';

export class PrismaSettingsRepository implements ISettingsRepository {
  constructor(private prisma: PrismaClient) {}

  async getAll(): Promise<Record<string, string>> {
    const settings = await this.prisma.setting.findMany();
    return settings.reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  }

  async get(key: string, defaultValue = ''): Promise<string> {
    const setting = await this.prisma.setting.findUnique({ where: { key } });
    return setting ? setting.value : defaultValue;
  }

  async upsert(key: string, value: string): Promise<void> {
    await this.prisma.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async upsertMany(settings: Record<string, string>): Promise<void> {
    const promises = Object.entries(settings).map(([key, value]) =>
      this.prisma.setting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }),
    );
    await Promise.all(promises);
  }

  async getTaxSettings(): Promise<TaxSettingsDTO> {
    const taxRate = await this.get('tax_rate', '0');
    const taxType = await this.get('tax_type', 'none');
    const taxIncluded = await this.get('tax_included', 'false');

    return {
      taxRate: parseFloat(taxRate) || 0,
      taxType,
      taxIncluded: taxIncluded === 'true',
    };
  }

  async updateTaxSettings(taxRate: number, taxType: string, taxIncluded: boolean): Promise<void> {
    await this.upsertMany({
      tax_rate: taxRate.toString(),
      tax_type: taxType,
      tax_included: taxIncluded.toString(),
    });
  }
}
