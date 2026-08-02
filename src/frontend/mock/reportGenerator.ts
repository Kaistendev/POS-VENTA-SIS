import jsPDF from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'
applyPlugin(jsPDF)
import type { ReportRequestDTO } from '../../domain/dtos'
import type { AppData } from './seed'

function fmt(n: number): string {
  return `$${n.toFixed(2)}`
}

function dmy(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function dmyh(d: Date): string {
  return d.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function bizInfo(data: AppData) {
  const g = (k: string) => data.settings.find(x => x.key === k)?.value || ''
  return { name: g('business_name') || 'Mi Empresa', address: g('business_address'), phone: g('business_phone'), taxId: g('business_tax_id'), footer: g('ticket_footer') }
}

function header(doc: jsPDF, biz: ReturnType<typeof bizInfo>, title: string, subtitle?: string) {
  const pageW = doc.internal.pageSize.getWidth()
  doc.setFontSize(18)
  doc.text(biz.name, pageW / 2, 20, { align: 'center' })
  if (biz.taxId) {
    doc.setFontSize(9)
    doc.text(`RIF: ${biz.taxId}${biz.phone ? ` | Tel: ${biz.phone}` : ''}`, pageW / 2, 27, { align: 'center' })
  }
  if (biz.address) {
    doc.setFontSize(8)
    doc.text(biz.address, pageW / 2, 32, { align: 'center' })
  }
  doc.setFontSize(14)
  doc.text(title, pageW / 2, subtitle ? 40 : 44, { align: 'center' })
  if (subtitle) {
    doc.setFontSize(10)
    doc.text(subtitle, pageW / 2, 47, { align: 'center' })
  }
  doc.setFontSize(8)
  doc.text(`Generado: ${dmyh(new Date())}`, pageW / 2, subtitle ? 53 : 49, { align: 'center' })
}

function footer(doc: jsPDF, biz: ReturnType<typeof bizInfo>, y: number) {
  if (biz.footer) {
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(biz.footer, doc.internal.pageSize.getWidth() / 2, y + 10, { align: 'center' })
  }
}

function download(doc: jsPDF, filename: string) {
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

function filterSales(data: AppData, start?: Date, end?: Date) {
  return data.sales.filter(s => {
    const d = new Date(s.created_at)
    if (start && d < start) return false
    if (end && d > new Date(end.getTime() + 86400000)) return false
    return true
  })
}

function productName(data: AppData, pid: number): string {
  const p = data.products.find(x => x.id === pid)
  return p?.name || `ID: ${pid}`
}

function clientName(data: AppData, cid: number): string {
  const c = data.clients.find(x => x.id === cid)
  return c?.name || '—'
}

export function generateDailySalesPDF(request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()

  const startStr = request.startDate ? dmy(request.startDate) : '—'
  const endStr = request.endDate ? dmy(request.endDate) : '—'
  header(doc, biz, 'Reporte de Ventas del Día', `Período: ${startStr} - ${endStr}`)

  const sales = filterSales(data, request.startDate, request.endDate)
  const rows = sales.map(s => [
    `#${s.id}`,
    dmyh(s.created_at),
    clientName(data, s.client_id),
    fmt(s.subtotal ?? 0),
    fmt(s.tax_amount ?? 0),
    s.discount_total ? fmt(s.discount_total) : '-',
    fmt(s.total),
    s.payment_method || 'EFECTIVO',
  ])

  if (rows.length > 0) {
    doc.autoTable({
      startY: 58,
      head: [['Venta', 'Fecha/Hora', 'Cliente', 'Subtotal', 'IVA', 'Desc.', 'Total', 'Pago']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontSize: 7 },
      bodyStyles: { fontSize: 6.5 },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      columnStyles: {
        0: { cellWidth: 14 }, 1: { cellWidth: 28 }, 2: { cellWidth: 40 },
        3: { cellWidth: 22 }, 4: { cellWidth: 18 }, 5: { cellWidth: 18 },
        6: { cellWidth: 22 }, 7: { cellWidth: 22 },
      },
    })
  } else {
    doc.setFontSize(10)
    doc.text('No se encontraron ventas en el período seleccionado.', pageW / 2, 68, { align: 'center' })
  }

  const finalY = (doc as any).lastAutoTable?.finalY || 68
  const totalSub = sales.reduce((a, s) => a + (s.subtotal ?? 0), 0)
  const totalTax = sales.reduce((a, s) => a + (s.tax_amount ?? 0), 0)
  const totalDisc = sales.reduce((a, s) => a + (s.discount_total ?? 0), 0)
  const totalRev = sales.reduce((a, s) => a + s.total, 0)

  let y = finalY + 8
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)
  doc.text(`Ventas: ${sales.length}`, 20, y)
  doc.text(`Subtotal: ${fmt(totalSub)}`, 20, y + 5)
  doc.text(`IVA: ${fmt(totalTax)}`, 20, y + 10)
  doc.text(`Descuentos: ${fmt(totalDisc)}`, 20, y + 15)
  doc.setFontSize(11)
  doc.setTextColor(0, 0, 0)
  doc.text(`TOTAL: ${fmt(totalRev)}`, 20, y + 23)

  footer(doc, biz, y + 25)

  const filename = `ventas-diarias-${(request.startDate || new Date()).toISOString().split('T')[0]}.pdf`
  download(doc, filename)
  return { success: true, path: filename }
}

export function generateSalesSummaryPDF(request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()

  const startStr = request.startDate ? dmy(request.startDate) : '—'
  const endStr = request.endDate ? dmy(request.endDate) : '—'
  header(doc, biz, 'Resumen de Ventas', `Período: ${startStr} - ${endStr}`)

  const sales = filterSales(data, request.startDate, request.endDate)
  const totalSales = sales.length
  const totalRevenue = sales.reduce((a, s) => a + s.total, 0)
  const totalSub = sales.reduce((a, s) => a + (s.subtotal ?? 0), 0)
  const totalTax = sales.reduce((a, s) => a + (s.tax_amount ?? 0), 0)
  const totalDisc = sales.reduce((a, s) => a + (s.discount_total ?? 0), 0)
  const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0
  const cashSales = sales.filter(s => !s.payment_method || s.payment_method === 'EFECTIVO')
  const cardSales = sales.filter(s => s.payment_method && s.payment_method !== 'EFECTIVO')

  let y = 58
  doc.setFontSize(10)
  const leftX = 25
  const lineH = 7

  const items = [
    ['Total de Ventas:', `${totalSales}`],
    ['Ingresos Totales:', fmt(totalRevenue)],
    ['Subtotal:', fmt(totalSub)],
    ['IVA Total:', fmt(totalTax)],
    ['Descuentos:', fmt(totalDisc)],
    ['', ''],
    ['Venta Promedio:', fmt(avgSale)],
    ['', ''],
    ['Efectivo:', `${cashSales.length} ventas — ${fmt(cashSales.reduce((a, s) => a + s.total, 0))}`],
    ['Tarjeta/Débito/Crédito:', `${cardSales.length} ventas — ${fmt(cardSales.reduce((a, s) => a + s.total, 0))}`],
  ]

  items.forEach(([label, val]) => {
    if (label) {
      doc.text(label, leftX, y)
      doc.text(val, pageW - leftX, y, { align: 'right' })
    }
    y += lineH
  })

  footer(doc, biz, y + 10)

  const filename = `resumen-ventas-${(request.startDate || new Date()).toISOString().split('T')[0]}.pdf`
  download(doc, filename)
  return { success: true, path: filename }
}

export function generateInventoryPDF(_request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  header(doc, biz, 'Inventario Completo')

  const rows = data.products.map(p => {
    const cat = data.categories.find(c => c.id === p.category_id)
    const status = p.stock <= 0 ? 'SIN STOCK' : (p.min_stock && p.stock <= p.min_stock) ? 'BAJO' : 'OK'
    return [p.sku, p.name, cat?.name || '—', p.stock.toString(), p.min_stock?.toString() || '—', fmt(p.price_purchase), fmt(p.price_sale), status]
  })

  const statusColors: Record<string, [number, number, number]> = {
    'SIN STOCK': [220, 38, 38],
    'BAJO': [234, 88, 12],
    'OK': [22, 163, 74],
  }

  doc.autoTable({
    startY: 48,
    head: [['SKU', 'Producto', 'Categoría', 'Stock', 'Stk Mín', 'Costo', 'Precio', 'Estado']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontSize: 7 },
    bodyStyles: { fontSize: 6.5 },
    alternateRowStyles: { fillColor: [245, 245, 250] },
    columnStyles: {
      0: { cellWidth: 20 }, 1: { cellWidth: 55 }, 2: { cellWidth: 25 },
      3: { cellWidth: 12 }, 4: { cellWidth: 12 }, 5: { cellWidth: 18 },
      6: { cellWidth: 18 }, 7: { cellWidth: 14 },
    },
    didParseCell: (data: any) => {
      const colIndex = data.column.index
      if (colIndex === 7) {
        const status = data.cell.text[0]
        const color = statusColors[status]
        if (color) {
          data.cell.styles.textColor = color
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  const finalY = (doc as any).lastAutoTable?.finalY || 48
  const totalValue = data.products.reduce((sum, p) => sum + p.price_purchase * p.stock, 0)

  let y = finalY + 8
  doc.setFontSize(9)
  doc.text(`Total productos: ${data.products.length}`, 20, y)
  doc.text(`Valor inventario: ${fmt(totalValue)}`, 20, y + 5)

  footer(doc, biz, y + 10)

  const filename = `inventario-${new Date().toISOString().split('T')[0]}.pdf`
  download(doc, filename)
  return { success: true, path: filename }
}

export function generateLowStockPDF(_request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  header(doc, biz, 'Productos con Stock Bajo')

  const lowStock = data.products.filter(p => p.min_stock && p.stock <= p.min_stock)
  const rows = lowStock.map(p => {
    const cat = data.categories.find(c => c.id === p.category_id)
    return [p.sku, p.name, cat?.name || '—', p.stock.toString(), p.min_stock?.toString() || '—', fmt(p.price_sale)]
  })

  if (rows.length > 0) {
    doc.autoTable({
      startY: 48,
      head: [['SKU', 'Producto', 'Categoría', 'Stock', 'Stk Mín', 'Precio Venta']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      columnStyles: {
        0: { cellWidth: 22 }, 1: { cellWidth: 65 }, 2: { cellWidth: 30 },
        3: { cellWidth: 15 }, 4: { cellWidth: 15 }, 5: { cellWidth: 25 },
      },
    })
  } else {
    doc.setFontSize(10)
    doc.text('No hay productos con stock bajo.', doc.internal.pageSize.getWidth() / 2, 58, { align: 'center' })
  }

  const finalY = (doc as any).lastAutoTable?.finalY || 58
  let y = finalY + 8
  doc.setFontSize(9)
  doc.text(`Productos críticos: ${lowStock.length}`, 20, y)

  footer(doc, biz, y + 10)

  const filename = `stock-bajo-${new Date().toISOString().split('T')[0]}.pdf`
  download(doc, filename)
  return { success: true, path: filename }
}

export function generateTopProductsPDF(_request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  header(doc, biz, 'Productos Más Vendidos')

  const counts: Record<number, { qty: number; total: number }> = {}
  for (const sale of data.sales) {
    if (sale.items) {
      for (const item of sale.items) {
        const pid = item.product_id
        if (!counts[pid]) counts[pid] = { qty: 0, total: 0 }
        counts[pid].qty += item.quantity
        counts[pid].total += (item.final_unit_price ?? item.unit_price) * item.quantity
      }
    }
  }

  const sorted = Object.entries(counts)
    .map(([pid, v]) => ({ ...v, product: data.products.find(p => p.id === Number(pid)) }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 20)

  const rows = sorted.map((s, i) => [
    (i + 1).toString(),
    s.product?.sku || '—',
    s.product?.name || '—',
    s.qty.toString(),
    fmt(s.total),
  ])

  if (rows.length > 0) {
    doc.autoTable({
      startY: 48,
      head: [['#', 'SKU', 'Producto', 'Cantidad', 'Total']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      alternateRowStyles: { fillColor: [245, 245, 250] },
      columnStyles: {
        0: { cellWidth: 8 }, 1: { cellWidth: 22 }, 2: { cellWidth: 80 },
        3: { cellWidth: 20 }, 4: { cellWidth: 25 },
      },
    })
  } else {
    doc.setFontSize(10)
    doc.text('Aún no hay ventas registradas.', doc.internal.pageSize.getWidth() / 2, 58, { align: 'center' })
  }

  const finalY = (doc as any).lastAutoTable?.finalY || 58
  footer(doc, biz, finalY + 10)

  const filename = `productos-mas-vendidos-${new Date().toISOString().split('T')[0]}.pdf`
  download(doc, filename)
  return { success: true, path: filename }
}

export function generateProfitSummaryPDF(request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()

  const startStr = request.startDate ? dmy(request.startDate) : '—'
  const endStr = request.endDate ? dmy(request.endDate) : '—'
  header(doc, biz, 'Reporte de Ganancias', `Período: ${startStr} - ${endStr}`)

  const sales = filterSales(data, request.startDate, request.endDate)
  let totalCost = 0
  let totalRevenue = 0
  let totalDiscount = 0
  for (const sale of sales) {
    totalRevenue += sale.total
    totalDiscount += sale.discount_total ?? 0
    if (sale.items) {
      for (const item of sale.items) {
        totalCost += (item.purchase_price ?? 0) * item.quantity
      }
    }
  }

  const grossProfit = totalRevenue - totalCost
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const totalTax = sales.reduce((a, s) => a + (s.tax_amount ?? 0), 0)

  let y = 58
  doc.setFontSize(10)
  const leftX = 25
  const lineH = 7

  const items = [
    ['Ingresos Totales:', fmt(totalRevenue)],
    ['Costo de Ventas:', fmt(totalCost)],
    ['Descuentos:', fmt(totalDiscount)],
    ['IVA Cobrado:', fmt(totalTax)],
    ['', ''],
    ['GANANCIA BRUTA:', fmt(grossProfit)],
    ['Margen de Ganancia:', `${margin.toFixed(1)}%`],
  ]

  items.forEach(([label, val]) => {
    if (label) {
      doc.text(label, leftX, y)
      doc.text(val, pageW - leftX, y, { align: 'right' })
    }
    y += lineH
  })

  footer(doc, biz, y + 10)

  const filename = `ganancias-${(request.startDate || new Date()).toISOString().split('T')[0]}.pdf`
  download(doc, filename)
  return { success: true, path: filename }
}

export function generateCashClosePDF(registerId: number, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const reg = data.cashRegisters.find(r => r.id === registerId)
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()

  header(doc, biz, 'Cierre de Caja', reg ? `Caja #${reg.id}` : undefined)

  let y = 58
  const leftX = 25
  const lineH = 7

  if (reg) {
    const sales = data.sales.filter(s => s.cash_register_id === registerId)
    const totalSales = sales.length
    const cashSales = sales.filter(s => !s.payment_method || s.payment_method === 'EFECTIVO')
    const cardSales = sales.filter(s => s.payment_method && s.payment_method !== 'EFECTIVO')
    const cashTotal = cashSales.reduce((a, s) => a + s.total, 0)
    const cardTotal = cardSales.reduce((a, s) => a + s.total, 0)
    const totalRevenue = sales.reduce((a, s) => a + s.total, 0)
    const expectedCash = (reg.opening_amount ?? 0) + cashTotal

    doc.setFontSize(10)
    doc.text(`Apertura:`, leftX, y)
    doc.text(dmyh(reg.opened_at), leftX + 35, y)
    doc.text(fmt(reg.opening_amount ?? 0), pageW - leftX, y, { align: 'right' })
    y += lineH
    doc.text(`Cierre:`, leftX, y)
    doc.text(reg.closed_at ? dmyh(reg.closed_at) : '—', leftX + 35, y)
    y += lineH * 1.5

    doc.setFontSize(11)
    doc.text('Resumen de Ventas', leftX, y)
    y += lineH + 2
    doc.setFontSize(10)

    const ventas = [
      ['Total Ventas:', `${totalSales}`, fmt(totalRevenue)],
      ['Efectivo:', `${cashSales.length}`, fmt(cashTotal)],
      ['Tarjeta:', `${cardSales.length}`, fmt(cardTotal)],
    ]
    ventas.forEach(([label, count, amount]) => {
      doc.text(label, leftX, y)
      doc.text(count, leftX + 45, y)
      doc.text(amount, pageW - leftX, y, { align: 'right' })
      y += lineH
    })

    y += lineH * 0.5
    doc.setFontSize(11)
    doc.text('Efectivo en Caja', leftX, y)
    y += lineH + 2
    doc.setFontSize(10)

    const caja = [
      ['Monto Apertura:', fmt(reg.opening_amount ?? 0)],
      ['+ Total Efectivo:', fmt(cashTotal)],
      ['Efectivo Esperado:', fmt(expectedCash)],
      ['Efectivo Real:', reg.closing_amount != null ? fmt(reg.closing_amount) : '—'],
    ]
    caja.forEach(([label, val]) => {
      doc.text(label, leftX, y)
      doc.text(val, pageW - leftX, y, { align: 'right' })
      y += lineH
    })

    if (reg.difference != null) {
      doc.setTextColor(reg.difference === 0 ? 0 : 200, reg.difference === 0 ? 150 : 0, 0)
      doc.setFontSize(12)
      doc.text(`Diferencia: ${fmt(reg.difference)}`, leftX, y + lineH)
      doc.setTextColor(0, 0, 0)
    }

    y += lineH * 2
    doc.text(`Estado: ${reg.status || 'ABIERTO'}`, leftX, y)
  }

  footer(doc, biz, y + 10)

  const filename = `cierre-caja-${registerId}-${new Date().toISOString().split('T')[0]}.pdf`
  download(doc, filename)
  return { success: true, path: filename }
}

export function generateSaleReceiptPDF(saleId: number, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const sale = data.sales.find(s => s.id === saleId)
  const doc = new jsPDF({ unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()

  header(doc, biz, 'Comprobante de Venta', sale ? `#${sale.id}` : 'No encontrada')

  let y = 58
  const leftX = 25
  const lineH = 7

  if (sale) {
    const client = data.clients.find(c => c.id === sale.client_id)
    doc.setFontSize(9)
    doc.text(`Cliente: ${client?.name || '—'}`, leftX, y)
    y += lineH
    doc.text(`Documento: ${client?.dni || '—'}${client?.tax_id ? ` | RIF: ${client.tax_id}` : ''}`, leftX, y)
    y += lineH
    doc.text(`Pago: ${sale.payment_method || 'EFECTIVO'}`, leftX, y)
    y += lineH
    doc.text(`Fecha: ${dmyh(sale.created_at)}`, leftX, y)
    y += lineH + 2

    const items = sale.items || []
    const itemRows = items.map((item: any) => {
      const unitPrice = item.final_unit_price ?? item.unit_price
      const lineTotal = unitPrice * item.quantity
      return [
        productName(data, item.product_id),
        item.quantity.toString(),
        fmt(unitPrice),
        fmt(lineTotal),
      ]
    })

    doc.autoTable({
      startY: y,
      head: [['Producto', 'Cant.', 'P/U', 'Total']],
      body: itemRows,
      theme: 'grid',
      headStyles: { fillColor: [109, 40, 217], textColor: [255, 255, 255], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
      columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 15 }, 2: { cellWidth: 20 }, 3: { cellWidth: 25 } },
    })

    y = ((doc as any).lastAutoTable?.finalY || y) + 6
    doc.setFontSize(10)
    doc.text(`Subtotal:`, pageW - 70, y)
    doc.text(fmt(sale.subtotal ?? 0), pageW - leftX, y, { align: 'right' })
    y += lineH
    if (sale.discount_total) {
      doc.text(`Descuento:`, pageW - 70, y)
      doc.text(`-${fmt(sale.discount_total)}`, pageW - leftX, y, { align: 'right' })
      y += lineH
    }
    doc.text(`IVA:`, pageW - 70, y)
    doc.text(fmt(sale.tax_amount ?? 0), pageW - leftX, y, { align: 'right' })
    y += lineH + 2
    doc.setFontSize(13)
    doc.text(`TOTAL:`, pageW - 70, y)
    doc.text(fmt(sale.total), pageW - leftX, y, { align: 'right' })
  }

  footer(doc, biz, y + 15)

  const filename = `comprobante-venta-${saleId}.pdf`
  download(doc, filename)
  return { success: true, path: filename }
}
