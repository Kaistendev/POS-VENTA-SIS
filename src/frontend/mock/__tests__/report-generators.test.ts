import { describe, it, expect, beforeAll, vi } from 'vitest'

import { describe, it, expect, beforeAll, vi } from 'vitest'

vi.mock('jspdf-autotable', () => ({
  applyPlugin: () => {},
  autoTable: () => {},
}))

import { getSeedData } from '../seed'
import { generateDailySalesPDF, generateSalesSummaryPDF, generateInventoryPDF, generateLowStockPDF, generateTopProductsPDF, generateProfitSummaryPDF, generateSaleReceiptPDF, generateCashClosePDF } from '../reportGenerator'
import { generateDailySalesExcel, generateSalesSummaryExcel, generateInventoryExcel, generateLowStockExcel, generateTopProductsExcel, generateProfitSummaryExcel, generateSaleReceiptExcel, generateCashCloseExcel } from '../excelReportGenerator'

beforeAll(async () => {
  global.URL.createObjectURL = () => 'blob:mock'
  global.URL.revokeObjectURL = () => {}

  const jspdfModule = await import('jspdf')
  const JsPdfClass = (jspdfModule as any).default || (jspdfModule as any).jsPDF
  JsPdfClass.API.autoTable = function (opts: any) {
    this.lastAutoTable = { finalY: (opts.startY || 0) + ((opts.body?.length || 0) * 10 + 20) }
  }
})

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    type: 'daily_sales',
    format: 'pdf' as const,
    startDate: undefined,
    endDate: undefined,
    ...overrides,
  }
}

describe('PDF Report Generators', () => {
  const data = getSeedData()

  it('generateDailySalesPDF returns success', () => {
    const result = generateDailySalesPDF(makeRequest(), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.pdf$/)
  })

  it('generateSalesSummaryPDF returns success', () => {
    const result = generateSalesSummaryPDF(makeRequest({ type: 'sales_summary' }), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.pdf$/)
  })

  it('generateInventoryPDF returns success', () => {
    const result = generateInventoryPDF(makeRequest({ type: 'inventory' }), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.pdf$/)
  })

  it('generateLowStockPDF returns success', () => {
    const result = generateLowStockPDF(makeRequest({ type: 'low_stock' }), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.pdf$/)
  })

  it('generateTopProductsPDF returns success', () => {
    const result = generateTopProductsPDF(makeRequest({ type: 'top_products' }), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.pdf$/)
  })

  it('generateProfitSummaryPDF returns success', () => {
    const result = generateProfitSummaryPDF(makeRequest({ type: 'profit_summary' }), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.pdf$/)
  })

  it('generateSaleReceiptPDF with valid saleId returns success', () => {
    const dataWithSale = getSeedData()
    dataWithSale.sales.push({
      id: 1, cash_register_id: 1, client_id: 1, total: 100, subtotal: 85, tax_amount: 15,
      payment_method: 'EFECTIVO', exchange_rate: 0, created_at: new Date(), updated_at: new Date(),
      items: [{ product_id: 1, quantity: 2, unit_price: 50, final_unit_price: 50, purchase_price: 20 }],
    })
    const result = generateSaleReceiptPDF(1, dataWithSale)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.pdf$/)
  })

  it('generateCashClosePDF with valid registerId returns success', () => {
    const dataWithReg = getSeedData()
    dataWithReg.cashRegisters = [{ id: 1, opening_amount: 100, total_sales: 0, opened_at: new Date(), closed_at: new Date(), closing_amount: 150, difference: 0, status: 'CERRADO', created_at: new Date(), updated_at: new Date() }]
    const result = generateCashClosePDF(1, dataWithReg)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.pdf$/)
  })
})

describe('Excel Report Generators', () => {
  const data = getSeedData()
  data.cashRegisters = [{ id: 1, opening_amount: 100, total_sales: 0, opened_at: new Date(), closed_at: new Date(), closing_amount: 150, difference: 0, status: 'CERRADO', created_at: new Date(), updated_at: new Date() }]

  it('generateDailySalesExcel returns success', () => {
    const result = generateDailySalesExcel(makeRequest(), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.xlsx$/)
  })

  it('generateSalesSummaryExcel returns success', () => {
    const result = generateSalesSummaryExcel(makeRequest({ type: 'sales_summary' }), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.xlsx$/)
  })

  it('generateInventoryExcel returns success', () => {
    const result = generateInventoryExcel(makeRequest({ type: 'inventory' }), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.xlsx$/)
  })

  it('generateLowStockExcel returns success', () => {
    const result = generateLowStockExcel(makeRequest({ type: 'low_stock' }), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.xlsx$/)
  })

  it('generateTopProductsExcel returns success', () => {
    const result = generateTopProductsExcel(makeRequest({ type: 'top_products' }), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.xlsx$/)
  })

  it('generateProfitSummaryExcel returns success', () => {
    const result = generateProfitSummaryExcel(makeRequest({ type: 'profit_summary' }), data)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.xlsx$/)
  })

  it('generateSaleReceiptExcel with valid saleId returns success', () => {
    const dataWithSale = getSeedData()
    dataWithSale.sales.push({
      id: 1, cash_register_id: 1, client_id: 1, total: 100, subtotal: 85, tax_amount: 15,
      payment_method: 'EFECTIVO', exchange_rate: 0, created_at: new Date(), updated_at: new Date(),
      items: [{ product_id: 1, quantity: 2, unit_price: 50, final_unit_price: 50, purchase_price: 20 }],
    })
    const result = generateSaleReceiptExcel(1, dataWithSale)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.xlsx$/)
  })

  it('generateCashCloseExcel with valid registerId returns success', () => {
    const dataWithReg = getSeedData()
    dataWithReg.cashRegisters = [{ id: 1, opening_amount: 100, total_sales: 0, opened_at: new Date(), closed_at: new Date(), closing_amount: 150, difference: 0, status: 'CERRADO', created_at: new Date(), updated_at: new Date() }]
    const result = generateCashCloseExcel(1, dataWithReg)
    expect(result.success).toBe(true)
    expect(result.path).toMatch(/\.xlsx$/)
  })
})
