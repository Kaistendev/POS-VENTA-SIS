import ExcelJS from 'exceljs'
import type { ReportRequestDTO } from '../../domain/dtos'
import type { AppData } from './seed'

function fmt(n: number): string {
  return `$${n.toFixed(2)}`
}

function dmy(d: Date): string {
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function bizInfo(data: AppData) {
  const g = (k: string) => data.settings.find(x => x.key === k)?.value || ''
  return { name: g('business_name') || 'Mi Empresa', address: g('business_address'), phone: g('business_phone'), taxId: g('business_tax_id') }
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

function styleHeader(ws: ExcelJS.Worksheet, columns: number) {
  const header = ws.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6D28D9' } }
  header.alignment = { horizontal: 'center', vertical: 'middle' }
  header.height = 22
  for (let i = 1; i <= columns; i++) {
    const cell = header.getCell(i)
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    }
  }
}

function styleCell(ws: ExcelJS.Worksheet, rowNum: number, columns: number, alt: boolean) {
  const row = ws.getRow(rowNum)
  if (alt) {
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } }
  }
  row.alignment = { vertical: 'middle' }
  for (let i = 1; i <= columns; i++) {
    row.getCell(i).border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' },
    }
  }
}

function addTitle(ws: ExcelJS.Worksheet, title: string, subtitle: string | undefined, columns: number) {
  ws.getRow(1).values = [title]
  ws.mergeCells(`A1:${String.fromCharCode(64 + columns)}1`)
  const titleCell = ws.getCell('A1')
  titleCell.font = { bold: true, size: 14, color: { argb: 'FF1E1B4B' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 28

  if (subtitle) {
    ws.getRow(2).values = [subtitle]
    ws.mergeCells(`A2:${String.fromCharCode(64 + columns)}2`)
    const subCell = ws.getCell('A2')
    subCell.font = { size: 10, color: { argb: 'FF6B7280' } }
    subCell.alignment = { horizontal: 'center' }
  }
  ws.getRow(2).height = 18
}

function autoFitColumns(ws: ExcelJS.Worksheet, columns: number) {
  for (let i = 1; i <= columns; i++) {
    let maxLen = 12
    ws.getColumn(i).eachCell({ includeEmpty: true }, (cell) => {
      const val = cell.value?.toString() || ''
      maxLen = Math.max(maxLen, val.length + 2)
    })
    ws.getColumn(i).width = Math.min(maxLen, 40)
  }
}

function download(workbook: ExcelJS.Workbook, filename: string) {
  workbook.xlsx.writeBuffer().then((buffer) => {
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  })
}

export function generateDailySalesExcel(request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const wb = new ExcelJS.Workbook()
  wb.creator = biz.name
  const ws = wb.addWorksheet('Ventas del Día')

  const startStr = request.startDate ? dmy(request.startDate) : '—'
  const endStr = request.endDate ? dmy(request.endDate) : '—'
  addTitle(ws, 'Reporte de Ventas del Día', `Período: ${startStr} - ${endStr}`, 8)

  const sales = filterSales(data, request.startDate, request.endDate)

  const headerRow = 4
  const headers = ['Venta', 'Fecha/Hora', 'Cliente', 'Subtotal', 'IVA', 'Desc.', 'Total', 'Pago']
  ws.getRow(headerRow).values = headers
  styleHeader(ws, headers.length)

  let rowNum = headerRow + 1
  sales.forEach((s, i) => {
    ws.getRow(rowNum).values = [
      `#${s.id}`,
      dmy(s.created_at),
      clientName(data, s.client_id),
      s.subtotal ?? 0,
      s.tax_amount ?? 0,
      s.discount_total ?? 0,
      s.total,
      s.payment_method || 'EFECTIVO',
    ]
    styleCell(ws, rowNum, headers.length, i % 2 === 0)
    rowNum++
  })

  const totalRow = rowNum + 1
  const totalSub = sales.reduce((a, s) => a + (s.subtotal ?? 0), 0)
  const totalTax = sales.reduce((a, s) => a + (s.tax_amount ?? 0), 0)
  const totalDisc = sales.reduce((a, s) => a + (s.discount_total ?? 0), 0)
  const totalRev = sales.reduce((a, s) => a + s.total, 0)

  ws.getRow(totalRow).values = ['', '', '', totalSub, totalTax, totalDisc, totalRev, '']
  ws.getRow(totalRow).font = { bold: true, size: 11, color: { argb: 'FF1E1B4B' } }

  autoFitColumns(ws, headers.length)

  const filename = `ventas-diarias-${(request.startDate || new Date()).toISOString().split('T')[0]}.xlsx`
  download(wb, filename)
  return { success: true, path: filename }
}

export function generateSalesSummaryExcel(request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const wb = new ExcelJS.Workbook()
  wb.creator = biz.name
  const ws = wb.addWorksheet('Resumen de Ventas')

  const startStr = request.startDate ? dmy(request.startDate) : '—'
  const endStr = request.endDate ? dmy(request.endDate) : '—'
  addTitle(ws, 'Resumen de Ventas', `Período: ${startStr} - ${endStr}`, 2)

  const sales = filterSales(data, request.startDate, request.endDate)
  const totalSales = sales.length
  const totalRevenue = sales.reduce((a, s) => a + s.total, 0)
  const totalSub = sales.reduce((a, s) => a + (s.subtotal ?? 0), 0)
  const totalTax = sales.reduce((a, s) => a + (s.tax_amount ?? 0), 0)
  const totalDisc = sales.reduce((a, s) => a + (s.discount_total ?? 0), 0)
  const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0
  const cashSales = sales.filter(s => !s.payment_method || s.payment_method === 'EFECTIVO')
  const cardSales = sales.filter(s => s.payment_method && s.payment_method !== 'EFECTIVO')

  const items = [
    ['Total de Ventas', totalSales],
    ['Ingresos Totales', fmt(totalRevenue)],
    ['Subtotal', fmt(totalSub)],
    ['IVA Total', fmt(totalTax)],
    ['Descuentos', fmt(totalDisc)],
    ['Venta Promedio', fmt(avgSale)],
    ['Efectivo', `${cashSales.length} ventas — ${fmt(cashSales.reduce((a, s) => a + s.total, 0))}`],
    ['Tarjeta/Débito/Crédito', `${cardSales.length} ventas — ${fmt(cardSales.reduce((a, s) => a + s.total, 0))}`],
  ]

  const headerRow = 4
  ws.getRow(headerRow).values = ['Métrica', 'Valor']
  styleHeader(ws, 2)

  let rowNum = headerRow + 1
  items.forEach(([label, val], i) => {
    ws.getRow(rowNum).values = [label, val]
    styleCell(ws, rowNum, 2, i % 2 === 0)
    rowNum++
  })

  autoFitColumns(ws, 2)

  const filename = `resumen-ventas-${(request.startDate || new Date()).toISOString().split('T')[0]}.xlsx`
  download(wb, filename)
  return { success: true, path: filename }
}

export function generateInventoryExcel(_request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const wb = new ExcelJS.Workbook()
  wb.creator = biz.name
  const ws = wb.addWorksheet('Inventario')

  addTitle(ws, 'Inventario Completo', undefined, 8)

  const headerRow = 3
  const headers = ['SKU', 'Producto', 'Categoría', 'Stock', 'Stk Mín', 'Costo', 'Precio', 'Estado']
  ws.getRow(headerRow).values = headers
  styleHeader(ws, headers.length)

  let rowNum = headerRow + 1
  data.products.forEach((p, i) => {
    const cat = data.categories.find(c => c.id === p.category_id)
    const status = p.stock <= 0 ? 'SIN STOCK' : (p.min_stock && p.stock <= p.min_stock) ? 'BAJO' : 'OK'
    ws.getRow(rowNum).values = [p.sku, p.name, cat?.name || '—', p.stock, p.min_stock ?? '—', p.price_purchase, p.price_sale, status]
    styleCell(ws, rowNum, headers.length, i % 2 === 0)

    const statusCell = ws.getCell(rowNum, headers.length)
    if (status === 'SIN STOCK') { statusCell.font = { color: { argb: 'FFDC2626' }, bold: true } }
    else if (status === 'BAJO') { statusCell.font = { color: { argb: 'FFEA580C' }, bold: true } }
    else { statusCell.font = { color: { argb: 'FF16A34A' }, bold: true } }
    rowNum++
  })

  const totalValue = data.products.reduce((sum, p) => sum + p.price_purchase * p.stock, 0)
  ws.getRow(rowNum + 1).values = ['', '', '', '', '', '', '', '']
  ws.getRow(rowNum + 2).values = ['Total productos:', data.products.length]
  ws.getRow(rowNum + 3).values = ['Valor inventario:', fmt(totalValue)]

  autoFitColumns(ws, headers.length)

  const filename = `inventario-${new Date().toISOString().split('T')[0]}.xlsx`
  download(wb, filename)
  return { success: true, path: filename }
}

export function generateLowStockExcel(_request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const wb = new ExcelJS.Workbook()
  wb.creator = biz.name
  const ws = wb.addWorksheet('Stock Bajo')

  addTitle(ws, 'Productos con Stock Bajo', undefined, 6)

  const lowStock = data.products.filter(p => p.min_stock && p.stock <= p.min_stock)

  const headerRow = 3
  const headers = ['SKU', 'Producto', 'Categoría', 'Stock', 'Stk Mín', 'Precio Venta']
  ws.getRow(headerRow).values = headers
  styleHeader(ws, headers.length)

  let rowNum = headerRow + 1
  lowStock.forEach((p, i) => {
    const cat = data.categories.find(c => c.id === p.category_id)
    ws.getRow(rowNum).values = [p.sku, p.name, cat?.name || '—', p.stock, p.min_stock ?? '—', p.price_sale]
    styleCell(ws, rowNum, headers.length, i % 2 === 0)
    rowNum++
  })

  ws.getRow(rowNum + 1).values = ['Productos críticos:', lowStock.length]

  autoFitColumns(ws, headers.length)

  const filename = `stock-bajo-${new Date().toISOString().split('T')[0]}.xlsx`
  download(wb, filename)
  return { success: true, path: filename }
}

export function generateTopProductsExcel(_request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const wb = new ExcelJS.Workbook()
  wb.creator = biz.name
  const ws = wb.addWorksheet('Top Productos')

  addTitle(ws, 'Productos Más Vendidos', undefined, 5)

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

  const headerRow = 3
  const headers = ['#', 'SKU', 'Producto', 'Cantidad', 'Total']
  ws.getRow(headerRow).values = headers
  styleHeader(ws, headers.length)

  let rowNum = headerRow + 1
  sorted.forEach((s, i) => {
    ws.getRow(rowNum).values = [(i + 1), s.product?.sku || '—', s.product?.name || '—', s.qty, s.total]
    styleCell(ws, rowNum, headers.length, i % 2 === 0)
    rowNum++
  })

  autoFitColumns(ws, headers.length)

  const filename = `productos-mas-vendidos-${new Date().toISOString().split('T')[0]}.xlsx`
  download(wb, filename)
  return { success: true, path: filename }
}

export function generateProfitSummaryExcel(request: ReportRequestDTO, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const wb = new ExcelJS.Workbook()
  wb.creator = biz.name
  const ws = wb.addWorksheet('Ganancias')

  const startStr = request.startDate ? dmy(request.startDate) : '—'
  const endStr = request.endDate ? dmy(request.endDate) : '—'
  addTitle(ws, 'Reporte de Ganancias', `Período: ${startStr} - ${endStr}`, 2)

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

  const headerRow = 4
  ws.getRow(headerRow).values = ['Métrica', 'Valor']
  styleHeader(ws, 2)

  const items = [
    ['Ingresos Totales', fmt(totalRevenue)],
    ['Costo de Ventas', fmt(totalCost)],
    ['Descuentos', fmt(totalDiscount)],
    ['IVA Cobrado', fmt(totalTax)],
    ['GANANCIA BRUTA', fmt(grossProfit)],
    ['Margen de Ganancia', `${margin.toFixed(1)}%`],
  ]

  let rowNum = headerRow + 1
  items.forEach(([label, val], i) => {
    ws.getRow(rowNum).values = [label, val]
    styleCell(ws, rowNum, 2, i % 2 === 0)
    if (label === 'GANANCIA BRUTA') {
      ws.getRow(rowNum).font = { bold: true, size: 12, color: { argb: grossProfit >= 0 ? 'FF16A34A' : 'FFDC2626' } }
    }
    rowNum++
  })

  autoFitColumns(ws, 2)

  const filename = `ganancias-${(request.startDate || new Date()).toISOString().split('T')[0]}.xlsx`
  download(wb, filename)
  return { success: true, path: filename }
}

export function generateSaleReceiptExcel(saleId: number, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const wb = new ExcelJS.Workbook()
  wb.creator = biz.name
  const ws = wb.addWorksheet('Comprobante')

  const sale = data.sales.find(s => s.id === saleId)
  addTitle(ws, 'Comprobante de Venta', sale ? `#${saleId}` : 'No encontrada', 4)

  if (sale) {
    const client = data.clients.find(c => c.id === sale.client_id)
    ws.getRow(3).values = ['Cliente:', client?.name || '—', 'Documento:', client?.dni || '—']
    ws.getRow(4).values = ['Pago:', sale.payment_method || 'EFECTIVO', 'Fecha:', dmy(sale.created_at)]

    const headerRow = 6
    const headers = ['Producto', 'Cant.', 'P/U', 'Total']
    ws.getRow(headerRow).values = headers
    styleHeader(ws, headers.length)

    const items = sale.items || []
    let rowNum = headerRow + 1
    items.forEach((item: any, i: number) => {
      const unitPrice = item.final_unit_price ?? item.unit_price
      const lineTotal = unitPrice * item.quantity
      ws.getRow(rowNum).values = [productName(data, item.product_id), item.quantity, unitPrice, lineTotal]
      styleCell(ws, rowNum, headers.length, i % 2 === 0)
      rowNum++
    })

    const totalRow = rowNum + 1
    ws.getRow(totalRow).values = ['', '', 'Subtotal:', sale.subtotal ?? 0]
    ws.getRow(totalRow + 1).values = ['', '', 'IVA:', sale.tax_amount ?? 0]
    if (sale.discount_total) {
      ws.getRow(totalRow + 2).values = ['', '', 'Descuento:', sale.discount_total]
    }
    ws.getRow(totalRow + 3).values = ['', '', 'TOTAL:', sale.total]
    ws.getRow(totalRow + 3).font = { bold: true, size: 12 }
  }

  autoFitColumns(ws, 4)

  const filename = `comprobante-venta-${saleId}.xlsx`
  download(wb, filename)
  return { success: true, path: filename }
}

export function generateCashCloseExcel(registerId: number, data: AppData): { success: true; path: string } {
  const biz = bizInfo(data)
  const reg = data.cashRegisters.find(r => r.id === registerId)
  const wb = new ExcelJS.Workbook()
  wb.creator = biz.name
  const ws = wb.addWorksheet('Cierre de Caja')

  addTitle(ws, 'Cierre de Caja', reg ? `Caja #${reg.id}` : undefined, 3)

  if (reg) {
    const sales = data.sales.filter(s => s.cash_register_id === registerId)
    const totalSales = sales.length
    const cashSales = sales.filter(s => !s.payment_method || s.payment_method === 'EFECTIVO')
    const cardSales = sales.filter(s => s.payment_method && s.payment_method !== 'EFECTIVO')
    const cashTotal = cashSales.reduce((a, s) => a + s.total, 0)
    const cardTotal = cardSales.reduce((a, s) => a + s.total, 0)
    const totalRevenue = sales.reduce((a, s) => a + s.total, 0)
    const expectedCash = (reg.opening_amount ?? 0) + cashTotal

    const headerRow = 3
    ws.getRow(headerRow).values = ['Apertura:', dmy(reg.opened_at), fmt(reg.opening_amount ?? 0)]
    ws.getRow(headerRow + 1).values = ['Cierre:', reg.closed_at ? dmy(reg.closed_at) : '—', '']

    const ventasHeaderRow = headerRow + 3
    ws.getRow(ventasHeaderRow).values = ['Resumen de Ventas', '', '']
    ws.getRow(ventasHeaderRow).font = { bold: true, size: 12 }

    const row1 = ventasHeaderRow + 1
    ws.getRow(row1).values = ['Total Ventas', totalSales, fmt(totalRevenue)]
    styleCell(ws, row1, 3, true)
    ws.getRow(row1 + 1).values = ['Efectivo', cashSales.length, fmt(cashTotal)]
    styleCell(ws, row1 + 1, 3, false)
    ws.getRow(row1 + 2).values = ['Tarjeta', cardSales.length, fmt(cardTotal)]
    styleCell(ws, row1 + 2, 3, true)

    const cajaHeaderRow = row1 + 4
    ws.getRow(cajaHeaderRow).values = ['Efectivo en Caja', '', '']
    ws.getRow(cajaHeaderRow).font = { bold: true, size: 12 }

    const row2 = cajaHeaderRow + 1
    ws.getRow(row2).values = ['Monto Apertura', '', fmt(reg.opening_amount ?? 0)]
    styleCell(ws, row2, 3, true)
    ws.getRow(row2 + 1).values = ['+ Total Efectivo', '', fmt(cashTotal)]
    styleCell(ws, row2 + 1, 3, false)
    ws.getRow(row2 + 2).values = ['Efectivo Esperado', '', fmt(expectedCash)]
    styleCell(ws, row2 + 2, 3, true)
    ws.getRow(row2 + 3).values = ['Efectivo Real', '', reg.closing_amount != null ? fmt(reg.closing_amount) : '—']
    styleCell(ws, row2 + 3, 3, false)

    if (reg.difference != null) {
      const diffRow = row2 + 5
      ws.getRow(diffRow).values = ['Diferencia', '', fmt(reg.difference)]
      ws.getRow(diffRow).font = {
        bold: true, size: 12,
        color: { argb: reg.difference === 0 ? 'FF000000' : reg.difference > 0 ? 'FF16A34A' : 'FFDC2626' },
      }
    }

    ws.getRow(row2 + 6).values = ['Estado:', reg.status || 'ABIERTO', '']
  }

  autoFitColumns(ws, 3)

  const filename = `cierre-caja-${registerId}-${new Date().toISOString().split('T')[0]}.xlsx`
  download(wb, filename)
  return { success: true, path: filename }
}
