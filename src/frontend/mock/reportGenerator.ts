import jsPDF from 'jspdf'
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

function drawTable(doc: jsPDF, headers: string[], rows: (string | number)[][], startY: number, opts?: { headBg?: number[]; headColor?: number[]; fontSize?: number; colWidths?: number[] }) {
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20
  const availW = pageW - margin * 2
  const fs = opts?.fontSize || 7
  const rowH = fs * 2.5
  const colW = opts?.colWidths || headers.map(() => availW / headers.length)
  const headBg = opts?.headBg || [109, 40, 217]
  const headColor = opts?.headColor || [255, 255, 255]

  let y = startY

  function drawRow(cells: string[], yPos: number, isHead: boolean, rowIdx: number) {
    let x = margin
    const maxH = rowH

    if (isHead) {
      doc.setFillColor(headBg[0], headBg[1], headBg[2])
      doc.setTextColor(headColor[0], headColor[1], headColor[2])
    } else {
      if (rowIdx % 2 === 0) doc.setFillColor(245, 245, 250)
      else doc.setFillColor(255, 255, 255)
      doc.setTextColor(50, 50, 50)
    }

    doc.rect(x, yPos, availW, maxH, 'F')

    doc.setFontSize(fs)
    cells.forEach((cell, i) => {
      const cw = colW[i]
      const align = (i === 0 || isHead) ? 'left' : (i < headers.length - 1 ? 'left' : 'right')
      if (align === 'right') {
        doc.text(cell, x + cw - 2, yPos + maxH * 0.7, { align: 'right' })
      } else {
        doc.text(cell, x + 2, yPos + maxH * 0.7)
      }
      x += cw
    })
  }

  // Header
  drawRow(headers, y, true, 0)
  y += rowH

  // Body
  rows.forEach((row, i) => {
    const strRow = row.map(c => String(c))
    drawRow(strRow, y, false, i)
    y += rowH
  })

  // Footer separator
  y += 2
  return y
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

  const titulos = ['Venta', 'Fecha/Hora', 'Cliente', 'Subtotal', 'IVA', 'Desc.', 'Total', 'Pago']
  const anchos = [14, 28, 40, 22, 18, 18, 22, 22]

  let y = 58
  if (rows.length > 0) {
    y = drawTable(doc, titulos, rows, y, { colWidths: anchos, fontSize: 6.5 })
  } else {
    doc.setFontSize(10)
    doc.text('No se encontraron ventas en el período seleccionado.', pageW / 2, y + 10, { align: 'center' })
    y += 20
  }

  // Totals
  const totalSub = sales.reduce((a, s) => a + (s.subtotal ?? 0), 0)
  const totalTax = sales.reduce((a, s) => a + (s.tax_amount ?? 0), 0)
  const totalDisc = sales.reduce((a, s) => a + (s.discount_total ?? 0), 0)
  const totalRev = sales.reduce((a, s) => a + s.total, 0)

  y += 8
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

  doc.setFontSize(10)
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

  const titulos = ['SKU', 'Producto', 'Categoría', 'Stock', 'Stk Mín', 'Costo', 'Precio', 'Estado']
  const anchos = [20, 55, 25, 12, 12, 18, 18, 14]

  let y = 48
  y = drawTable(doc, titulos, rows, y, { colWidths: anchos, fontSize: 6.5 })

  const totalValue = data.products.reduce((sum, p) => sum + p.price_purchase * p.stock, 0)
  y += 8
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

  const titulos = ['SKU', 'Producto', 'Categoría', 'Stock', 'Stk Mín', 'Precio Venta']
  const anchos = [22, 65, 30, 15, 15, 25]

  let y = 48
  if (rows.length > 0) {
    y = drawTable(doc, titulos, rows, y, { colWidths: anchos, fontSize: 7, headBg: [220, 38, 38] })
  } else {
    doc.setFontSize(10)
    doc.text('No hay productos con stock bajo.', doc.internal.pageSize.getWidth() / 2, y + 10, { align: 'center' })
    y += 20
  }

  y += 8
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

  const titulos = ['#', 'SKU', 'Producto', 'Cantidad', 'Total']
  const anchos = [8, 22, 80, 20, 25]

  let y = 48
  if (rows.length > 0) {
    y = drawTable(doc, titulos, rows, y, { colWidths: anchos, fontSize: 7 })
  } else {
    doc.setFontSize(10)
    doc.text('Aún no hay ventas registradas.', doc.internal.pageSize.getWidth() / 2, y + 10, { align: 'center' })
    y += 20
  }

  footer(doc, biz, y + 10)

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
  const reg = data.cash_registers.find(r => r.id === registerId)
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

    const titulos = ['Producto', 'Cant.', 'P/U', 'Total']
    const anchos = [85, 15, 20, 25]
    y = drawTable(doc, titulos, itemRows, y, { colWidths: anchos, fontSize: 7 })

    y += 6
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
