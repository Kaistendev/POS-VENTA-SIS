import { TaxSettingsDTO } from '../dtos.js';

export interface ISettingsRepository {
  getAll(): Promise<Record<string, string>>;
  get(key: string, defaultValue?: string): Promise<string>;
  upsert(key: string, value: string): Promise<void>;
  upsertMany(settings: Record<string, string>): Promise<void>;
  getTaxSettings(): Promise<TaxSettingsDTO>;
  updateTaxSettings(taxRate: number, taxType: string, taxIncluded: boolean): Promise<void>;
}
