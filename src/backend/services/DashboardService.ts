import { IDashboardRepository } from '../../domain/ports/IDashboardRepository.js';
import { CacheService } from './CacheService.js';
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
} from '../../domain/models.js';

const CACHE_KEY_STATS = 'dashboard:stats';

export class DashboardService {
  constructor(
    private readonly repo: IDashboardRepository,
    private readonly cache: CacheService,
  ) {}

  async getStats(startDate?: Date, endDate?: Date): Promise<DashboardStats> {
    if (startDate || endDate) {
      return this.repo.getStats(startDate, endDate);
    }
    return this.cache.getOrSet(CACHE_KEY_STATS, () => this.repo.getStats());
  }

  async getWeeklySales(days?: number): Promise<WeeklySalesEntry[]> {
    return this.repo.getWeeklySales(days);
  }

  async getLowStockProducts(limit?: number): Promise<LowStockProduct[]> {
    return this.repo.getLowStockProducts(limit);
  }

  async getSalesByPaymentMethod(startDate?: Date, endDate?: Date): Promise<SalesByPaymentEntry[]> {
    return this.repo.getSalesByPaymentMethod(startDate, endDate);
  }

  async getTopProducts(limit?: number, startDate?: Date, endDate?: Date): Promise<TopProductEntry[]> {
    return this.repo.getTopProducts(limit, startDate, endDate);
  }

  async getTopClients(limit?: number, startDate?: Date, endDate?: Date): Promise<TopClientEntry[]> {
    return this.repo.getTopClients(limit, startDate, endDate);
  }

  async getSalesByHour(startDate?: Date, endDate?: Date): Promise<SalesByHourEntry[]> {
    return this.repo.getSalesByHour(startDate, endDate);
  }

  async getCashRegisterSummary(startDate?: Date, endDate?: Date): Promise<CashRegisterSummary> {
    return this.repo.getCashRegisterSummary(startDate, endDate);
  }

  async getInventoryMetrics(): Promise<InventoryMetrics> {
    return this.repo.getInventoryMetrics();
  }

  async getLastSaleWithClient(): Promise<LastSaleClient | null> {
    return this.repo.getLastSaleWithClient();
  }

  invalidateCache(): void {
    this.cache.invalidate();
  }
}
