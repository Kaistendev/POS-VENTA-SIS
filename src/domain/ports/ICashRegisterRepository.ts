import { CashRegister, CashRegisterWithSales } from '../models.js';

export interface ICashRegisterRepository {
  findOpen(): Promise<CashRegister | null>;
  findById(id: number): Promise<CashRegisterWithSales | null>;
  findAll(startDate?: Date, endDate?: Date): Promise<(CashRegister & { _count?: { sales: number } })[]>;
  create(openingAmount: number): Promise<CashRegister>;
  close(id: number, closingAmount: number, difference: number, status: string): Promise<void>;
  updateTotalSales(id: number, delta: number): Promise<void>;
  getSalesCount(id: number, since: Date): Promise<number>;
  getDailySummary(registerId: number): Promise<any>;
}
