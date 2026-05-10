import { SaleReportRow, InventoryReportRow, SaleReceiptDTO, CashCloseDTO } from '../dtos.js';
import { SalesStatsDTO } from '../dtos.js';
import { InventoryMetrics } from '../models.js';

export interface IReportGenerator {
  generateSalesReport(rows: SaleReportRow[], totals: SalesStatsDTO, title?: string): Promise<Uint8Array>;
  generateInventoryReport(rows: InventoryReportRow[], metrics: InventoryMetrics, title?: string): Promise<Uint8Array>;
  generateSaleReceipt(data: SaleReceiptDTO): Promise<Uint8Array>;
  generateCashCloseReport(data: CashCloseDTO): Promise<Uint8Array>;
}
