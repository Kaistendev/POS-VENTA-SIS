import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { IReportGenerator } from '../../domain/ports/IReportGenerator.js';
import { SaleReportRow, InventoryReportRow, SalesStatsDTO, SaleReceiptDTO, CashCloseDTO } from '../../domain/dtos.js';
import { InventoryMetrics } from '../../domain/models.js';

export class PDFReportGenerator implements IReportGenerator {
  async generateSalesReport(rows: SaleReportRow[], totals: SalesStatsDTO, title = 'Reporte de Ventas', showTable = true): Promise<Uint8Array> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 28);

    let finalY = 34;
    if (showTable && rows.length > 0) {
      const head = [['Fecha', '# Factura', 'Cliente', 'Items', 'Subtotal', 'Impuesto', 'Total', 'Pago']];
      const body = rows.map(r => [
        r.date,
        String(r.invoiceNumber),
        r.client,
        String(r.itemsCount),
        `$ ${r.subtotal.toFixed(2)}`,
        `$ ${r.tax.toFixed(2)}`,
        `$ ${r.total.toFixed(2)}`,
        r.paymentMethod,
      ]);

      autoTable(doc, {
        head,
        body,
        startY: 34,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [41, 128, 185] },
        tableWidth: 'auto',
      });

      finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.setFontSize(10);
    doc.text(`Total Ventas: ${totals.totalSales}`, 14, finalY);
    doc.text(`Ingreso Total: $ ${totals.totalRevenue.toFixed(2)}`, 14, finalY + 6);
    doc.text(`Promedio: $ ${totals.averageSale.toFixed(2)}`, 14, finalY + 12);
    if (totals.cashSales !== undefined || totals.cardSales !== undefined) {
      doc.text(`Efectivo: ${totals.cashSales ?? 0} ventas  |  $ ${(totals.cashRevenue ?? 0).toFixed(2)}`, 14, finalY + 18);
      doc.text(`Tarjeta: ${totals.cardSales ?? 0} ventas  |  $ ${(totals.cardRevenue ?? 0).toFixed(2)}`, 14, finalY + 24);
    }

    return new Uint8Array(doc.output('arraybuffer'));
  }

  async generateInventoryReport(rows: InventoryReportRow[], metrics: InventoryMetrics, title = 'Reporte de Inventario'): Promise<Uint8Array> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, 28);

    const head = [['SKU', 'Producto', 'Categoría', 'Stock', 'Stock Min', 'P. Compra', 'P. Venta', 'Estado']];
    const body = rows.map(r => [
      r.sku,
      r.name,
      r.category,
      String(r.stock),
      r.minStock !== null ? String(r.minStock) : '-',
      `$ ${r.purchasePrice.toFixed(2)}`,
      `$ ${r.salePrice.toFixed(2)}`,
      r.status === 'ok' ? 'OK' : r.status === 'low' ? 'Stock Bajo' : 'Sin Stock',
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 34,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [39, 174, 96] },
      tableWidth: 'auto',
      didParseCell: (data: any) => {
        if (data.section === 'body' && data.column.index === 7) {
          const status = data.cell.raw as string;
          if (status === 'Sin Stock') data.cell.styles.textColor = [255, 0, 0];
          else if (status === 'Stock Bajo') data.cell.styles.textColor = [255, 165, 0];
          else data.cell.styles.textColor = [0, 128, 0];
        }
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10 || 50;

    doc.setFontSize(10);
    doc.text(`Total Productos: ${metrics.totalProducts}`, 14, finalY);
    doc.text(`Con Stock: ${metrics.productsWithStock}  |  Sin Stock: ${metrics.productsWithoutStock}  |  Stock Bajo: ${metrics.lowStockProducts}`, 14, finalY + 6);
    doc.text(`Valor Compra: $ ${metrics.totalPurchaseValue.toFixed(2)}  |  Valor Venta: $ ${metrics.totalSaleValue.toFixed(2)}`, 14, finalY + 12);
    doc.text(`Ganancia Potencial: $ ${metrics.potentialProfit.toFixed(2)}`, 14, finalY + 18);

    return new Uint8Array(doc.output('arraybuffer'));
  }

  async generateSaleReceipt(data: SaleReceiptDTO): Promise<Uint8Array> {
    const doc = new jsPDF({ unit: 'mm', format: [80, 120 + data.items.length * 6] });

    let y = 10;

    if (data.logoBase64) {
      try {
        doc.addImage(data.logoBase64, 'PNG', 30, y, 20, 20);
        y += 22;
      } catch {
      }
    }

    doc.setFontSize(10);
    doc.text(data.businessName, 40, y, { align: 'center' });
    y += 5;
    doc.setFontSize(7);
    if (data.businessAddress) {
      doc.text(data.businessAddress, 40, y, { align: 'center' });
      y += 4;
    }
    if (data.businessPhone) {
      doc.text(`Tel: ${data.businessPhone}`, 40, y, { align: 'center' });
      y += 4;
    }
    if (data.businessTaxId) {
      doc.text(`RUC: ${data.businessTaxId}`, 40, y, { align: 'center' });
      y += 4;
    }

    y += 3;
    doc.setFontSize(8);
    doc.text('='.repeat(32), 5, y);
    y += 4;
    doc.text(`Ticket: #${data.saleId}`, 5, y);
    y += 4;
    doc.text(`Fecha: ${data.createdAt.toLocaleString('es-PE')}`, 5, y);
    y += 4;
    doc.text(`Cliente: ${data.clientName}`, 5, y);
    y += 4;
    if (data.clientDni) {
      doc.text(`DNI: ${data.clientDni}`, 5, y);
      y += 4;
    }
    if (data.clientTaxId) {
      doc.text(`RUC: ${data.clientTaxId}`, 5, y);
      y += 4;
    }
    doc.text(`Pago: ${data.paymentMethod === 'CASH' ? 'EFECTIVO' : 'TARJETA'}`, 5, y);
    y += 4;
    doc.text('-'.repeat(32), 5, y);
    y += 5;

    data.items.forEach(item => {
      doc.text(`${item.quantity} x ${item.productName}`, 5, y);
      doc.text(`$ ${item.totalPrice.toFixed(2)}`, 75, y, { align: 'right' });
      y += 5;
    });

    doc.text('-'.repeat(32), 5, y + 2);
    y += 6;
    doc.setFontSize(8);
    doc.text(`Subtotal:`, 5, y);
    doc.text(`$ ${data.subtotal.toFixed(2)}`, 75, y, { align: 'right' });
    y += 5;
    if (data.taxAmount > 0) {
      doc.text(`${data.taxType.toUpperCase()} (${(data.taxRate * 100).toFixed(1)}%):`, 5, y);
      doc.text(`$ ${data.taxAmount.toFixed(2)}`, 75, y, { align: 'right' });
      y += 5;
    }
    doc.setFontSize(10);
    doc.text(`TOTAL:`, 5, y + 2);
    doc.text(`$ ${data.total.toFixed(2)}`, 75, y + 2, { align: 'right' });

    y += 8;
    doc.setFontSize(7);
    doc.text(data.ticketFooter || 'Gracias por su compra', 40, y, { align: 'center' });

    return new Uint8Array(doc.output('arraybuffer'));
  }

  async generateCashCloseReport(data: CashCloseDTO): Promise<Uint8Array> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    let y = 20;
    doc.setFontSize(16);
    doc.text('Reporte de Cierre de Caja', 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(data.businessName, 14, y);
    y += 6;
    doc.setFontSize(8);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 14, y);
    y += 6;

    doc.text(`Caja #${data.registerId}`, 14, y);
    y += 5;
    doc.text(`Apertura: ${data.openDate.toLocaleString('es-PE')}`, 14, y);
    y += 5;
    doc.text(`Cierre: ${data.closeDate.toLocaleString('es-PE')}`, 14, y);
    y += 8;

    const leftX = 14;
    const rightX = 100;
    const rowH = 7;

    doc.setFontSize(9);
    const items = [
      ['Ventas Realizadas', String(data.salesCount)],
      ['Ventas Efectivo', `$ ${data.cashSales.toFixed(2)}`],
      ['Ventas Tarjeta', `$ ${data.cardSales.toFixed(2)}`],
    ];
    items.forEach(([label, value]) => {
      doc.text(label, leftX, y);
      doc.text(value, rightX, y);
      y += rowH;
    });

    y += 4;
    doc.setDrawColor(100, 100, 100);
    doc.line(leftX, y, 190, y);
    y += 6;

    doc.setFontSize(10);
    doc.text('RESUMEN', leftX, y);
    y += 6;

    const summaryItems = [
      ['Fondo Inicial', `$ ${data.openingAmount.toFixed(2)}`],
      ['Total Ventas', `$ ${data.totalSales.toFixed(2)}`],
      ['Esperado (Fondo + Ventas)', `$ ${data.expectedCash.toFixed(2)}`],
      ['Real (Declarado)', `$ ${data.realCash.toFixed(2)}`],
    ];
    summaryItems.forEach(([label, value]) => {
      doc.text(label, leftX, y);
      doc.text(value, rightX, y);
      y += rowH;
    });

    y += 3;
    doc.setDrawColor(100, 100, 100);
    doc.line(leftX, y, 190, y);
    y += 6;

    const diffLabel = data.difference >= 0 ? 'SOBRANTE' : 'FALTANTE';
    const diffColor: [number, number, number] = data.difference === 0 ? [0, 128, 0] : [200, 0, 0];
    doc.setTextColor(...diffColor);
    doc.setFontSize(12);
    doc.text(`${diffLabel}: $ ${Math.abs(data.difference).toFixed(2)}`, leftX, y);
    doc.setTextColor(0, 0, 0);
    y += 8;

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Estado: ${data.status === 'PERFECT' ? 'Cuadra Perfectamente' : data.status === 'SURPLUS' ? 'Sobrante detectado' : 'Faltante detectado'}`, leftX, y);
    y += 6;
    doc.text(`Firma del responsable: _______________________________`, leftX, y);

    return new Uint8Array(doc.output('arraybuffer'));
  }
}
