import { Sale, SaleWithItems } from '../models.js';
import { RegisterSaleDTO, SaleFilterDTO, SalesStatsDTO } from '../dtos.js';

export interface ISaleRepository {
  findAll(filter?: SaleFilterDTO): Promise<Sale[]>;
  findById(id: number): Promise<SaleWithItems | null>;
  findToday(): Promise<Sale[]>;
  findLast(): Promise<SaleWithItems | null>;
  getStats(startDate?: Date, endDate?: Date): Promise<SalesStatsDTO>;
  registerSale(input: RegisterSaleDTO): Promise<number>;
  cancelSale(saleId: number): Promise<void>;
}
