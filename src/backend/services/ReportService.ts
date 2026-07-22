import { IReportGenerator } from '../../domain/ports/IReportGenerator.js';
import { ReportRequestDTO, SaleReportRow, InventoryReportRow, SalesStatsDTO, SaleReceiptDTO, SaleReceiptItemDTO, CashCloseDTO } from '../../domain/dtos.js';
import { InventoryMetrics } from '../../domain/models.js';
import { DashboardService } from './DashboardService.js';
import { SaleService } from './SaleService.js';
import { ProductService } from './ProductService.js';
import { CashRegisterService } from './CashRegisterService.js';
import { SettingsService } from './SettingsService.js';
import { ValidationError } from '../../shared/errors.js';

export class ReportService {
  constructor(
    private pdfGenerator: IReportGenerator,
    private excelGenerator: IReportGenerator,
    private dashboardService: DashboardService,
    private saleService: SaleService,
    private productService: ProductService,
    private cashRegisterService: CashRegisterService,
    private settingsService: SettingsService,
  ) {}

  async generateReport(request: ReportRequestDTO): Promise<Uint8Array> {
    const generator = request.format === 'pdf' ? this.pdfGenerator : this.excelGenerator;
    const title = request.title ?? this.getDefaultTitle(request.type);

    switch (request.type) {
      case 'daily_sales':
        return this.generateSalesReport(generator, request, title, true);
      case 'sales_summary':
        return this.generateSalesReport(generator, request, title, true);
      case 'profit_summary':
        return this.generateProfitReport(generator, request, title);
      case 'inventory':
        return this.generateInventoryReport(generator, false, title);
      case 'low_stock':
        return this.generateInventoryReport(generator, true, title);
      case 'top_products':
        return this.generateTopProductsReport(generator, request, title);
      case 'sale_receipt':
        return this.generateSaleReceipt(request);
      case 'cash_close':
        return this.generateCashCloseReport(generator, request, title);
    }
  }

  private async generateSalesReport(generator: IReportGenerator, request: ReportRequestDTO, title: string, showTable = true): Promise<Uint8Array> {
    const sales = await this.saleService.getAllSales(request.startDate, request.endDate);
    const stats = await this.saleService.getSalesStats(request.startDate, request.endDate);
    const paymentBreakdown = await this.dashboardService.getSalesByPaymentMethod(request.startDate, request.endDate);

    const cash = paymentBreakdown.find(p => (p as any).payment_method === 'CASH');
    const card = paymentBreakdown.find(p => (p as any).payment_method === 'CARD');
    const totals: SalesStatsDTO = {
      totalSales: stats.totalSales,
      totalRevenue: stats.totalRevenue,
      averageSale: stats.averageSale,
      cashSales: (cash as any)?._count?.id ?? 0,
      cashRevenue: (cash as any)?._sum?.total ?? 0,
      cardSales: (card as any)?._count?.id ?? 0,
      cardRevenue: (card as any)?._sum?.total ?? 0,
    };

    const rows: SaleReportRow[] = sales.map(s => {
      const date = s.created_at instanceof Date ? s.created_at : new Date(s.created_at);
      const saleWithItems = s as any;
      const items = (saleWithItems.items || []).map((i: any) => ({
        productName: i.product?.name ?? 'Producto',
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
        totalPrice: Number(i.unit_price) * i.quantity,
      }));
      return {
        date: date.toLocaleDateString('es-PE'),
        invoiceNumber: s.id,
        client: s.client?.name ?? 'N/A',
        clientDni: s.client?.dni ?? '',
        itemsCount: items.length,
        items,
        subtotal: Number(s.subtotal),
        tax: Number(s.tax_amount),
        total: Number(s.total),
        paymentMethod: s.payment_method ?? 'N/A',
      };
    });

    return generator.generateSalesReport(rows, totals, title, showTable);
  }

  private async generateProfitReport(generator: IReportGenerator, request: ReportRequestDTO, title: string): Promise<Uint8Array> {
    const stats = await this.dashboardService.getStats(request.startDate, request.endDate);

    const totals: SalesStatsDTO = {
      totalSales: stats.totalSales,
      totalRevenue: stats.totalRevenue,
      averageSale: stats.averageSale,
    };

    const rows: SaleReportRow[] = [{
      date: `${request.startDate?.toLocaleDateString('es-PE') ?? 'Inicio'} - ${request.endDate?.toLocaleDateString('es-PE') ?? 'Hoy'}`,
      invoiceNumber: 0,
      client: '-',
      clientDni: '',
      itemsCount: 0,
      items: [],
      subtotal: 0,
      tax: 0,
      total: stats.totalRevenue,
      paymentMethod: '-',
    }];

    return generator.generateSalesReport(rows, totals, title);
  }

  private async generateInventoryReport(generator: IReportGenerator, lowStockOnly: boolean, title: string): Promise<Uint8Array> {
    const products = await this.productService.getAllProducts();
    const metrics = await this.dashboardService.getInventoryMetrics();

    const filtered = lowStockOnly
      ? products.filter(p => (p.stock <= (p.min_stock ?? 5)) || p.stock === 0)
      : products;

    const rows: InventoryReportRow[] = filtered.map(p => ({
      sku: p.sku,
      name: p.name,
      category: p.category?.name ?? 'Sin categoría',
      stock: p.stock,
      minStock: p.min_stock,
      purchasePrice: Number(p.price_purchase),
      salePrice: Number(p.price_sale),
      status: p.stock === 0 ? 'out' : (p.min_stock !== null && p.stock <= p.min_stock) ? 'low' : 'ok',
    }));

    return generator.generateInventoryReport(rows, metrics, title);
  }

  private async generateTopProductsReport(generator: IReportGenerator, request: ReportRequestDTO, title: string): Promise<Uint8Array> {
    const topProducts = await this.dashboardService.getTopProducts(50, request.startDate, request.endDate);
    const metrics = await this.dashboardService.getInventoryMetrics();

    const rows: InventoryReportRow[] = topProducts.map(p => ({
      sku: p.product_sku,
      name: p.product_name,
      category: p.category,
      stock: p.total_quantity,
      minStock: null,
      purchasePrice: 0,
      salePrice: p.avg_price,
      status: 'ok',
    }));

    return generator.generateInventoryReport(rows, metrics, title);
  }

  private async generateSaleReceipt(request: ReportRequestDTO): Promise<Uint8Array> {
    if (!request.saleId) throw new ValidationError('Se requiere saleId para generar un comprobante');
    const sale = await this.saleService.getSaleDetails(request.saleId);
    const settings = await this.settingsService.getSettings();

    const items: SaleReceiptItemDTO[] = (sale.items || []).map(item => ({
      quantity: item.quantity,
      productName: item.product?.name ?? 'Producto',
      unitPrice: Number(item.unit_price),
      totalPrice: Number(item.unit_price) * item.quantity,
      discountName: item.discount_name ?? null,
      discountAmount: item.discount_amount != null ? Number(item.discount_amount) : null,
      finalPrice: item.final_unit_price != null ? Number(item.final_unit_price) * item.quantity : null,
    }));

    const taxSettings = await this.settingsService.getTaxSettings();

    const receiptData: SaleReceiptDTO = {
      saleId: sale.id,
      businessName: settings.business_name || 'INVENTARIO-POS',
      businessAddress: settings.business_address || '',
      businessPhone: settings.business_phone || '',
      businessTaxId: settings.business_tax_id || '',
      ticketFooter: settings.ticket_footer || 'Gracias por su compra',
      logoBase64: settings.business_logo || undefined,
      clientName: sale.client?.name ?? 'Cliente General',
      clientDni: sale.client?.dni ?? '',
      clientTaxId: sale.client?.tax_id ?? null,
      createdAt: sale.created_at,
      paymentMethod: sale.payment_method ?? 'CASH',
      items,
      subtotal: Number(sale.subtotal),
      discountTotal: sale.discount_total != null ? Number(sale.discount_total) : undefined,
      taxAmount: Number(sale.tax_amount),
      taxType: taxSettings.taxType || 'iva',
      taxRate: taxSettings.taxRate || 0,
      total: Number(sale.total),
    };

    return this.pdfGenerator.generateSaleReceipt(receiptData);
  }

  private async generateCashCloseReport(generator: IReportGenerator, request: ReportRequestDTO, title: string): Promise<Uint8Array> {
    if (!request.registerId) throw new ValidationError('Se requiere registerId para generar reporte de cierre');
    const details = await this.cashRegisterService.getRegisterDetails(request.registerId);
    const settings = await this.settingsService.getSettings();

    const totalCash = details.sales
      ?.filter(s => s.payment_method === 'CASH')
      .reduce((sum, s) => sum + Number(s.total), 0) ?? 0;
    const totalCard = details.sales
      ?.filter(s => s.payment_method === 'CARD')
      .reduce((sum, s) => sum + Number(s.total), 0) ?? 0;

    const expectedCash = Number(details.opening_amount) + Number(details.total_sales);

    const cashCloseData: CashCloseDTO = {
      registerId: details.id,
      openDate: details.opened_at,
      closeDate: details.closed_at || details.updated_at,
      openingAmount: Number(details.opening_amount),
      totalSales: Number(details.total_sales),
      cashSales: totalCash,
      cardSales: totalCard,
      salesCount: details.sales?.length ?? 0,
      expectedCash,
      realCash: Number(details.closing_amount) || expectedCash,
      difference: Number(details.difference) || 0,
      status: details.status || 'PERFECT',
      businessName: settings.business_name || 'INVENTARIO-POS',
    };

    return generator.generateCashCloseReport(cashCloseData);
  }

  private getDefaultTitle(type: string): string {
    const titles: Record<string, string> = {
      daily_sales: 'Reporte de Ventas del Día',
      sales_summary: 'Resumen de Ventas',
      profit_summary: 'Reporte de Ganancias',
      inventory: 'Reporte de Inventario',
      low_stock: 'Productos con Stock Bajo',
      top_products: 'Productos Más Vendidos',
      sale_receipt: 'Comprobante de Venta',
      cash_close: 'Reporte de Cierre de Caja',
    };
    return titles[type] ?? 'Reporte';
  }
}
