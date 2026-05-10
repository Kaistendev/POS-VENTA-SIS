import { ISaleRepository } from '../../domain/ports/ISaleRepository.js';
import { IProductRepository } from '../../domain/ports/IProductRepository.js';
import { IClientRepository } from '../../domain/ports/IClientRepository.js';
import { ICashRegisterRepository } from '../../domain/ports/ICashRegisterRepository.js';
import { ISettingsRepository } from '../../domain/ports/ISettingsRepository.js';
import { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { SaleFilterDTO, RegisterSaleDTO } from '../../domain/dtos.js';
import { IDashboardRepository } from '../../domain/ports/IDashboardRepository.js';
import { NotFoundError, BusinessRuleError } from '../../shared/errors.js';
import { saleSchema } from '../../common/schemas.js';

export class SaleService {
  constructor(
    private saleRepo: ISaleRepository,
    private productRepo: IProductRepository,
    private clientRepo: IClientRepository,
    private cashRegisterRepo: ICashRegisterRepository,
    private settingsRepo: ISettingsRepository,
    private auditLogRepo: IAuditLogRepository,
    private dashboardService: IDashboardRepository,
  ) {}

  async getAllSales(startDate?: Date, endDate?: Date, clientId?: number, cashRegisterId?: number) {
    const filter: SaleFilterDTO = {};
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;
    if (clientId) filter.clientId = clientId;
    if (cashRegisterId) filter.cashRegisterId = cashRegisterId;

    return this.saleRepo.findAll(filter);
  }

  async getSaleDetails(id: number) {
    const sale = await this.saleRepo.findById(id);
    if (!sale) throw new NotFoundError('Venta');
    return sale;
  }

  async getTodaySales() {
    return this.saleRepo.findToday();
  }

  async getSalesStats(startDate?: Date, endDate?: Date) {
    return this.saleRepo.getStats(startDate, endDate);
  }

  async getLastSale() {
    return this.saleRepo.findLast();
  }

  async registerSale(saleData: any, itemsData: any[], userId: number = 1) {
    const validated = saleSchema.parse({ ...saleData, items: itemsData });

    const cashRegister = await this.cashRegisterRepo.findOpen();
    if (!cashRegister) throw new BusinessRuleError('La caja no está abierta o no existe.');

    let finalClientId = validated.client_id;

    if (validated.client_dni && validated.client_name && !finalClientId) {
      const existingClient = await this.clientRepo.findByDni(validated.client_dni);
      if (existingClient) {
        finalClientId = existingClient.id;
      } else {
        const client = await this.clientRepo.create({
          dni: validated.client_dni,
          name: validated.client_name,
          code: `CLI-${Date.now()}`,
        });
        finalClientId = client.id;
      }
    }

    if (finalClientId) {
      const client = await this.clientRepo.findById(finalClientId);
      if (!client) throw new NotFoundError('Cliente');
    }

    const productIds = validated.items.map((item: any) => item.product_id);
    const products = await this.productRepo.findByIds(productIds);
    const productMap = new Map(products.map((p: any) => [p.id, p]));

    for (const item of validated.items) {
      const product = productMap.get(item.product_id);
      if (!product) throw new NotFoundError(`Producto`, item.product_id);
      if (product.stock < item.quantity) {
        throw new BusinessRuleError(
          `Stock insuficiente para "${product.name}". Stock actual: ${product.stock}, Cantidad solicitada: ${item.quantity}`,
        );
      }
    }

    const itemsWithPurchasePrice = validated.items.map((item: any) => {
      const product = productMap.get(item.product_id);
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        purchase_price: product?.price_purchase || 0,
      };
    });

    const rawTotal = itemsWithPurchasePrice.reduce(
      (acc: number, item: any) => acc + item.unit_price * item.quantity,
      0,
    );

    const taxSettings = await this.settingsRepo.getTaxSettings();
    let subtotal = rawTotal;
    let taxAmount = 0;
    let total = rawTotal;

    if (taxSettings.taxType !== 'none' && taxSettings.taxRate > 0) {
      taxAmount = parseFloat((rawTotal * taxSettings.taxRate).toFixed(2));
      total = parseFloat((subtotal + taxAmount).toFixed(2));
    }

    const registerInput: RegisterSaleDTO = {
      cash_register_id: validated.cash_register_id,
      client_id: finalClientId || 1,
      subtotal,
      tax_amount: taxAmount,
      total,
      items: itemsWithPurchasePrice,
      payment_method: validated.payment_method,
      exchange_rate: saleData.exchange_rate || 0,
    };

    const saleId = await this.saleRepo.registerSale(registerInput);

    this.dashboardService.invalidateCache();

    await this.auditLogRepo.create({
      userId,
      action: 'CREATE_SALE',
      entity: 'sales',
      entity_id: saleId,
    });

    return { success: true, id: saleId };
  }

  async cancelSale(saleId: number, userId: number = 1) {
    const sale = await this.saleRepo.findById(saleId);
    if (!sale) throw new NotFoundError('Venta');

    await this.saleRepo.cancelSale(saleId);

    this.dashboardService.invalidateCache();

    await this.auditLogRepo.create({
      userId,
      action: 'CANCEL_SALE',
      entity: 'sales',
      entity_id: saleId,
    });

    return { success: true };
  }
}
