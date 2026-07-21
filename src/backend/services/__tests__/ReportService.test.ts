import { describe, it, expect, vi } from 'vitest';
import { ReportService } from '../ReportService.js';
import { IReportGenerator } from '../../../domain/ports/IReportGenerator.js';
import { ReportRequestDTO, SaleReportRow, InventoryReportRow, SalesStatsDTO } from '../../../domain/dtos.js';
import { DashboardStats, InventoryMetrics, Sale, Product } from '../../../domain/models.js';
import { DashboardService } from '../DashboardService.js';
import { SaleService } from '../SaleService.js';
import { ProductService } from '../ProductService.js';

function createMockGenerator(): IReportGenerator {
  return {
    generateSalesReport: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
    generateInventoryReport: vi.fn().mockResolvedValue(new Uint8Array([4, 5, 6])),
  };
}

function createMockDashboardService(): DashboardService {
  return {
    getStats: vi.fn().mockResolvedValue({
      todayRevenue: 1000,
      todayProfit: 200,
      todaySalesCount: 10,
      totalRevenue: 50000,
      totalProfit: 10000,
      totalSales: 500,
      activeProducts: 100,
      totalClients: 50,
      lowStockProducts: 5,
      averageSale: 100,
    } as DashboardStats),
    getWeeklySales: vi.fn(),
    getLowStockProducts: vi.fn(),
    getSalesByPaymentMethod: vi.fn().mockResolvedValue([
      { payment_method: 'CASH', _count: { id: 5 }, _sum: { total: 500 } },
      { payment_method: 'CARD', _count: { id: 3 }, _sum: { total: 400 } },
    ]),
    getTopProducts: vi.fn().mockResolvedValue([
      { product_id: 1, product_name: 'Prod A', product_sku: 'SKU-001', category: 'Cat1', total_quantity: 50, avg_price: 25, times_sold: 30 },
    ]),
    getTopClients: vi.fn(),
    getSalesByHour: vi.fn(),
    getCashRegisterSummary: vi.fn(),
    getInventoryMetrics: vi.fn().mockResolvedValue({
      totalProducts: 100,
      productsWithStock: 80,
      productsWithoutStock: 15,
      lowStockProducts: 5,
      totalPurchaseValue: 25000,
      totalSaleValue: 50000,
      potentialProfit: 25000,
      recentMovements: [],
    } as InventoryMetrics),
    invalidateCache: vi.fn(),
  } as unknown as DashboardService;
}

function createMockSaleService(): SaleService {
  return {
    getAllSales: vi.fn().mockResolvedValue([
      {
        id: 1,
        total: 118,
        subtotal: 100,
        tax_amount: 18,
        payment_method: 'Efectivo',
        created_at: new Date('2026-05-10'),
        client: { id: 1, name: 'Juan Perez', dni: '12345678' },
        items: [
          {
            id: 1,
            quantity: 2,
            unit_price: 25,
            product: { id: 1, name: 'Producto A' },
          },
          {
            id: 2,
            quantity: 1,
            unit_price: 50,
            product: { id: 2, name: 'Producto B' },
          },
        ],
      } as unknown as Sale,
    ]),
    getSalesStats: vi.fn().mockResolvedValue({
      totalSales: 1,
      totalRevenue: 118,
      averageSale: 118,
    } as SalesStatsDTO),
    getSaleDetails: vi.fn(),
    getTodaySales: vi.fn(),
    getLastSale: vi.fn(),
    registerSale: vi.fn(),
    cancelSale: vi.fn(),
  } as unknown as SaleService;
}

function createMockProductService(): ProductService {
  return {
    getAllProducts: vi.fn().mockResolvedValue([
      {
        id: 1,
        sku: 'PROD-001',
        name: 'Producto A',
        stock: 50,
        min_stock: 5,
        price_purchase: 10,
        price_sale: 25,
        category: { id: 1, name: 'Categoria 1' },
      } as unknown as Product,
      {
        id: 2,
        sku: 'PROD-002',
        name: 'Producto B',
        stock: 0,
        min_stock: 10,
        price_purchase: 15,
        price_sale: 35,
        category: { id: 1, name: 'Categoria 1' },
      } as unknown as Product,
    ]),
    getProductById: vi.fn(),
    getLowStockProducts: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getSalesCount: vi.fn(),
    addStock: vi.fn(),
    removeStock: vi.fn(),
    getInventoryMovements: vi.fn(),
  } as unknown as ProductService;
}

describe('ReportService', () => {
  function createService() {
    const pdfGen = createMockGenerator();
    const excelGen = createMockGenerator();
    const dashboard = createMockDashboardService();
    const sales = createMockSaleService();
    const products = createMockProductService();
    const service = new ReportService(pdfGen, excelGen, dashboard, sales, products);
    return { service, pdfGen, excelGen, dashboard, sales, products };
  }

  it('generates daily sales report using PDF generator', async () => {
    const { service, pdfGen } = createService();
    const request: ReportRequestDTO = { type: 'daily_sales', format: 'pdf' };
    const result = await service.generateReport(request);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(pdfGen.generateSalesReport).toHaveBeenCalledOnce();
  });

  it('generates sales summary using Excel generator', async () => {
    const { service, excelGen } = createService();
    const request: ReportRequestDTO = { type: 'sales_summary', format: 'xlsx', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31') };
    const result = await service.generateReport(request);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(excelGen.generateSalesReport).toHaveBeenCalledOnce();
  });

  it('generates profit summary report', async () => {
    const { service, pdfGen, dashboard } = createService();
    const request: ReportRequestDTO = { type: 'profit_summary', format: 'pdf' };
    const result = await service.generateReport(request);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(dashboard.getStats).toHaveBeenCalledOnce();
    expect(pdfGen.generateSalesReport).toHaveBeenCalledOnce();
  });

  it('generates full inventory report', async () => {
    const { service, pdfGen, products } = createService();
    const request: ReportRequestDTO = { type: 'inventory', format: 'pdf' };
    const result = await service.generateReport(request);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(products.getAllProducts).toHaveBeenCalledOnce();
    expect(pdfGen.generateInventoryReport).toHaveBeenCalledOnce();
  });

  it('generates low stock report', async () => {
    const { service, pdfGen, products } = createService();
    const request: ReportRequestDTO = { type: 'low_stock', format: 'pdf' };
    const result = await service.generateReport(request);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(products.getAllProducts).toHaveBeenCalledOnce();
    expect(pdfGen.generateInventoryReport).toHaveBeenCalledOnce();
  });

  it('generates top products report', async () => {
    const { service, pdfGen, dashboard } = createService();
    const request: ReportRequestDTO = { type: 'top_products', format: 'pdf' };
    const result = await service.generateReport(request);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(dashboard.getTopProducts).toHaveBeenCalledOnce();
    expect(pdfGen.generateInventoryReport).toHaveBeenCalledOnce();
  });

  it('applies custom title', async () => {
    const { service, pdfGen } = createService();
    const request: ReportRequestDTO = { type: 'daily_sales', format: 'pdf', title: 'Mis Ventas' };
    await service.generateReport(request);
    const callArgs = (pdfGen.generateSalesReport as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(callArgs[2]).toBe('Mis Ventas');
  });

  it('uses Excel generator for xlsx format', async () => {
    const { service, pdfGen, excelGen } = createService();
    const request: ReportRequestDTO = { type: 'inventory', format: 'xlsx' };
    await service.generateReport(request);
    expect(pdfGen.generateInventoryReport).not.toHaveBeenCalled();
    expect(excelGen.generateInventoryReport).toHaveBeenCalledOnce();
  });

  it('maps sales data to SaleReportRow correctly', async () => {
    const { service, pdfGen, sales } = createService();
    const request: ReportRequestDTO = { type: 'daily_sales', format: 'pdf' };
    await service.generateReport(request);
    const rows = (pdfGen.generateSalesReport as ReturnType<typeof vi.fn>).mock.calls[0][0] as SaleReportRow[];
    expect(rows).toHaveLength(1);
    expect(rows[0].client).toBe('Juan Perez');
    expect(rows[0].clientDni).toBe('12345678');
    expect(rows[0].total).toBe(118);
    expect(rows[0].items).toHaveLength(2);
    expect(rows[0].items[0].productName).toBe('Producto A');
    expect(rows[0].items[0].quantity).toBe(2);
    expect(rows[0].items[1].productName).toBe('Producto B');
  });

  it('maps product data to InventoryReportRow correctly', async () => {
    const { service, pdfGen } = createService();
    const request: ReportRequestDTO = { type: 'inventory', format: 'pdf' };
    await service.generateReport(request);
    const rows = (pdfGen.generateInventoryReport as ReturnType<typeof vi.fn>).mock.calls[0][0] as InventoryReportRow[];
    expect(rows).toHaveLength(2);
    expect(rows[0].status).toBe('ok');
    expect(rows[1].status).toBe('out');
  });
});
