import ExcelJS from 'exceljs';
import { IReportGenerator } from '../../domain/ports/IReportGenerator.js';
import { SaleReportRow, InventoryReportRow, SalesStatsDTO, SaleReceiptDTO, CashCloseDTO } from '../../domain/dtos.js';
import { InventoryMetrics } from '../../domain/models.js';

export class ExcelReportGenerator implements IReportGenerator {
  async generateSalesReport(rows: SaleReportRow[], totals: SalesStatsDTO, title = 'Reporte de Ventas', _showTable = true): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POS Venta SIS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Ventas');

    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { size: 16, bold: true };

    sheet.getCell('A2').value = `Generado: ${new Date().toLocaleDateString('es-PE')}`;
    sheet.getCell('A2').font = { size: 10, italic: true };

    sheet.columns = [
      { header: 'Fecha', key: 'date', width: 14 },
      { header: '# Factura', key: 'invoiceNumber', width: 12 },
      { header: 'Cliente', key: 'client', width: 30 },
      { header: 'Items', key: 'itemsCount', width: 8 },
      { header: 'Subtotal', key: 'subtotal', width: 14 },
      { header: 'Impuesto', key: 'tax', width: 14 },
      { header: 'Total', key: 'total', width: 14 },
      { header: 'Pago', key: 'paymentMethod', width: 16 },
    ];

    const headerRow = sheet.getRow(4);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } };
    headerRow.alignment = { horizontal: 'center' };

    rows.forEach(r => {
      sheet.addRow({
        date: r.date,
        invoiceNumber: r.invoiceNumber,
        client: r.client,
        itemsCount: r.itemsCount,
        subtotal: r.subtotal,
        tax: r.tax,
        total: r.total,
        paymentMethod: r.paymentMethod,
      });
    });

    const dataStartRow = 5;
    const dataEndRow = dataStartRow + rows.length - 1;

    sheet.addRow({});
    const summaryRow = sheet.addRow({
      date: 'TOTALES',
      itemsCount: totals.totalSales,
      subtotal: { formula: `SUM(E${dataStartRow}:E${dataEndRow})` },
      tax: { formula: `SUM(F${dataStartRow}:F${dataEndRow})` },
      total: { formula: `SUM(G${dataStartRow}:G${dataEndRow})` },
    });
    summaryRow.font = { bold: true };
    summaryRow.getCell(1).font = { bold: true, size: 11 };

    const avgRow = sheet.addRow({
      date: 'Promedio',
      total: totals.averageSale,
    });
    avgRow.font = { italic: true };

    if (totals.cashSales !== undefined || totals.cardSales !== undefined) {
      sheet.addRow({});
      sheet.addRow({
        date: 'Efectivo',
        itemsCount: totals.cashSales ?? 0,
        total: totals.cashRevenue ?? 0,
      });
      sheet.addRow({
        date: 'Tarjeta',
        itemsCount: totals.cardSales ?? 0,
        total: totals.cardRevenue ?? 0,
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  }

  async generateInventoryReport(rows: InventoryReportRow[], metrics: InventoryMetrics, title = 'Reporte de Inventario'): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POS Venta SIS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Inventario');

    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { size: 16, bold: true };

    sheet.getCell('A2').value = `Generado: ${new Date().toLocaleDateString('es-PE')}`;
    sheet.getCell('A2').font = { size: 10, italic: true };

    sheet.columns = [
      { header: 'SKU', key: 'sku', width: 16 },
      { header: 'Producto', key: 'name', width: 35 },
      { header: 'Categoría', key: 'category', width: 20 },
      { header: 'Stock', key: 'stock', width: 10 },
      { header: 'Stock Min', key: 'minStock', width: 12 },
      { header: 'P. Compra', key: 'purchasePrice', width: 14 },
      { header: 'P. Venta', key: 'salePrice', width: 14 },
      { header: 'Estado', key: 'status', width: 14 },
    ];

    const headerRow = sheet.getRow(4);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF27AE60' } };
    headerRow.alignment = { horizontal: 'center' };

    rows.forEach(r => {
      const row = sheet.addRow({
        sku: r.sku,
        name: r.name,
        category: r.category,
        stock: r.stock,
        minStock: r.minStock ?? '-',
        purchasePrice: r.purchasePrice,
        salePrice: r.salePrice,
        status: r.status === 'ok' ? 'OK' : r.status === 'low' ? 'Stock Bajo' : 'Sin Stock',
      });

      const statusCell = row.getCell(8);
      if (r.status === 'out') {
        statusCell.font = { color: { argb: 'FFFF0000' }, bold: true };
      } else if (r.status === 'low') {
        statusCell.font = { color: { argb: 'FFFFA500' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'FF008000' } };
      }
    });

    sheet.addRow({});
    const summaryRow = sheet.addRow({
      sku: 'RESUMEN',
      stock: metrics.totalProducts,
      purchasePrice: metrics.totalPurchaseValue,
      salePrice: metrics.totalSaleValue,
    });
    summaryRow.font = { bold: true };

    sheet.addRow({
      sku: 'Con Stock',
      stock: metrics.productsWithStock,
    });
    sheet.addRow({
      sku: 'Sin Stock',
      stock: metrics.productsWithoutStock,
    });
    sheet.addRow({
      sku: 'Stock Bajo',
      stock: metrics.lowStockProducts,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  }

  async generateSaleReceipt(data: SaleReceiptDTO): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POS Venta SIS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Comprobante');

    sheet.mergeCells('A1:D1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `${data.businessName} - Ticket #${data.saleId}`;
    titleCell.font = { size: 14, bold: true };

    sheet.getCell('A2').value = `Fecha: ${data.createdAt.toLocaleString('es-PE')}`;
    sheet.getCell('A2').font = { size: 10, italic: true };
    sheet.getCell('A3').value = `Cliente: ${data.clientName}`;
    sheet.getCell('A4').value = `Pago: ${data.paymentMethod === 'CASH' ? 'EFECTIVO' : 'TARJETA'}`;

    sheet.columns = [
      { header: 'Cant.', key: 'quantity', width: 8 },
      { header: 'Producto', key: 'productName', width: 35 },
      { header: 'P. Unit.', key: 'unitPrice', width: 14 },
      { header: 'Total', key: 'totalPrice', width: 14 },
    ];

    const headerRow = sheet.getRow(6);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2980B9' } };

    data.items.forEach(item => {
      sheet.addRow({
        quantity: item.quantity,
        productName: item.productName,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      });
    });

    const dataEndRow = 6 + data.items.length;
    const summaryRow = dataEndRow + 1;
    sheet.addRow({});
    sheet.getCell(`A${summaryRow + 1}`).value = 'Subtotal:';
    sheet.getCell(`D${summaryRow + 1}`).value = data.subtotal;
    sheet.getCell(`D${summaryRow + 1}`).numFmt = '#,##0.00';

    if (data.taxAmount > 0) {
      sheet.getCell(`A${summaryRow + 2}`).value = `${data.taxType.toUpperCase()} (${(data.taxRate * 100).toFixed(1)}%):`;
      sheet.getCell(`D${summaryRow + 2}`).value = data.taxAmount;
      sheet.getCell(`D${summaryRow + 2}`).numFmt = '#,##0.00';
    }

    const totalRow = data.taxAmount > 0 ? summaryRow + 3 : summaryRow + 2;
    sheet.getCell(`A${totalRow}`).value = 'TOTAL:';
    sheet.getCell(`A${totalRow}`).font = { bold: true, size: 12 };
    sheet.getCell(`D${totalRow}`).value = data.total;
    sheet.getCell(`D${totalRow}`).font = { bold: true, size: 12 };
    sheet.getCell(`D${totalRow}`).numFmt = '#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  }

  async generateCashCloseReport(data: CashCloseDTO): Promise<Uint8Array> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'POS Venta SIS';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Cierre de Caja');

    sheet.mergeCells('A1:B1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `${data.businessName} - Cierre de Caja #${data.registerId}`;
    titleCell.font = { size: 14, bold: true };

    sheet.getCell('A3').value = `Apertura: ${data.openDate.toLocaleString('es-PE')}`;
    sheet.getCell('A4').value = `Cierre: ${data.closeDate.toLocaleString('es-PE')}`;

    sheet.columns = [
      { header: 'Concepto', key: 'concept', width: 30 },
      { header: 'Valor', key: 'value', width: 20 },
    ];

    sheet.addRow({});
    const summaryHeaderRow = sheet.addRow({ concept: 'RESUMEN', value: '' });
    summaryHeaderRow.font = { bold: true, size: 11 };

    const rows = [
      { concept: 'Ventas Realizadas', value: data.salesCount },
      { concept: 'Ventas Efectivo', value: data.cashSales },
      { concept: 'Ventas Tarjeta', value: data.cardSales },
      { concept: '', value: '' },
      { concept: 'Fondo Inicial', value: data.openingAmount },
      { concept: 'Total Ventas', value: data.totalSales },
      { concept: 'Esperado', value: data.expectedCash },
      { concept: 'Real (Declarado)', value: data.realCash },
    ];

    rows.forEach(r => {
      const row = sheet.addRow({ concept: r.concept, value: typeof r.value === 'number' ? r.value : r.value });
      if (typeof r.value === 'number' && r.concept) {
        row.getCell(2).numFmt = r.concept.includes('Realizadas') ? '#,##0' : '#,##0.00';
      }
    });

    const diffRow = sheet.addRow({ concept: data.difference >= 0 ? 'SOBRANTE' : 'FALTANTE', value: Math.abs(data.difference) });
    diffRow.font = { bold: true, size: 12, color: { argb: data.difference === 0 ? 'FF008000' : 'FFC80000' } };
    diffRow.getCell(2).numFmt = '#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  }
}
