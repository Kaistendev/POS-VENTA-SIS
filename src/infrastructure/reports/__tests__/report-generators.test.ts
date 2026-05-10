import { describe, it, expect } from 'vitest';
import { PDFReportGenerator } from '../PDFReportGenerator.js';
import { ExcelReportGenerator } from '../ExcelReportGenerator.js';
import { SaleReportRow, InventoryReportRow, SalesStatsDTO } from '../../../domain/dtos.js';
import { InventoryMetrics } from '../../../domain/models.js';

const mockSalesRows: SaleReportRow[] = [
  { date: '10/05/2026', invoiceNumber: 1, client: 'Juan Perez', itemsCount: 3, subtotal: 100, tax: 18, total: 118, paymentMethod: 'Efectivo' },
  { date: '10/05/2026', invoiceNumber: 2, client: 'Maria Lopez', itemsCount: 1, subtotal: 50, tax: 9, total: 59, paymentMethod: 'Tarjeta' },
];

const mockSalesTotals: SalesStatsDTO = {
  totalSales: 2,
  totalRevenue: 177,
  averageSale: 88.5,
};

const mockInventoryRows: InventoryReportRow[] = [
  { sku: 'PROD-001', name: 'Producto A', category: 'Categoria 1', stock: 50, minStock: 5, purchasePrice: 10, salePrice: 25, status: 'ok' },
  { sku: 'PROD-002', name: 'Producto B', category: 'Categoria 1', stock: 3, minStock: 10, purchasePrice: 15, salePrice: 35, status: 'low' },
  { sku: 'PROD-003', name: 'Producto C', category: 'Categoria 2', stock: 0, minStock: 5, purchasePrice: 20, salePrice: 45, status: 'out' },
];

const mockInventoryMetrics: InventoryMetrics = {
  totalProducts: 3,
  productsWithStock: 1,
  productsWithoutStock: 1,
  lowStockProducts: 1,
  totalPurchaseValue: 45,
  totalSaleValue: 105,
  potentialProfit: 60,
  recentMovements: [],
};

describe('PDFReportGenerator', () => {
  const generator = new PDFReportGenerator();

  it('generates a sales report as Uint8Array', async () => {
    const result = await generator.generateSalesReport(mockSalesRows, mockSalesTotals, 'Ventas del Dia');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('generates a sales report with default title', async () => {
    const result = await generator.generateSalesReport(mockSalesRows, mockSalesTotals);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('generates an inventory report as Uint8Array', async () => {
    const result = await generator.generateInventoryReport(mockInventoryRows, mockInventoryMetrics, 'Inventario General');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('generates an inventory report with default title', async () => {
    const result = await generator.generateInventoryReport(mockInventoryRows, mockInventoryMetrics);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('generates valid PDF starting with PDF header', async () => {
    const result = await generator.generateSalesReport(mockSalesRows, mockSalesTotals);
    const header = new TextDecoder().decode(result.slice(0, 5));
    expect(header).toBe('%PDF-');
  });
});

describe('ExcelReportGenerator', () => {
  const generator = new ExcelReportGenerator();

  it('generates a sales report as Uint8Array', async () => {
    const result = await generator.generateSalesReport(mockSalesRows, mockSalesTotals, 'Ventas del Dia');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('generates a sales report with default title', async () => {
    const result = await generator.generateSalesReport(mockSalesRows, mockSalesTotals);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('generates an inventory report as Uint8Array', async () => {
    const result = await generator.generateInventoryReport(mockInventoryRows, mockInventoryMetrics, 'Inventario General');
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('generates an inventory report with default title', async () => {
    const result = await generator.generateInventoryReport(mockInventoryRows, mockInventoryMetrics);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('generates valid xlsx file signature', async () => {
    const result = await generator.generateSalesReport(mockSalesRows, mockSalesTotals);
    const header = new TextDecoder().decode(result.slice(0, 4));
    expect(header).toBe('PK\u0003\u0004');
  });
});
