import {
  DashboardStats,
  LastSaleClient,
  WeeklySalesEntry,
  LowStockProduct,
  SalesByPaymentEntry,
  TopProductEntry,
  TopClientEntry,
  SalesByHourEntry,
  CashRegisterSummary,
  InventoryMetrics,
} from '../models.js';

export interface IDashboardRepository {
  getStats(startDate?: Date, endDate?: Date): Promise<DashboardStats>;
  getWeeklySales(days?: number): Promise<WeeklySalesEntry[]>;
  getLowStockProducts(limit?: number): Promise<LowStockProduct[]>;
  getSalesByPaymentMethod(startDate?: Date, endDate?: Date): Promise<SalesByPaymentEntry[]>;
  getTopProducts(limit?: number, startDate?: Date, endDate?: Date): Promise<TopProductEntry[]>;
  getTopClients(limit?: number, startDate?: Date, endDate?: Date): Promise<TopClientEntry[]>;
  getSalesByHour(startDate?: Date, endDate?: Date): Promise<SalesByHourEntry[]>;
  getCashRegisterSummary(startDate?: Date, endDate?: Date): Promise<CashRegisterSummary>;
  getInventoryMetrics(): Promise<InventoryMetrics>;
  getLastSaleWithClient(): Promise<LastSaleClient | null>;
}
