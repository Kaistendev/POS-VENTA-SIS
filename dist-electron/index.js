import { t as logger } from "./logger-BsWMrnsx.js";
import { t as __exportAll } from "./rag-CM8ewd7C.js";
import "dotenv/config";
import { BrowserWindow, app, dialog, ipcMain, session } from "electron";
import path from "path";
import fs from "fs";
import pkg from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { pipeline } from "stream";
import { promisify } from "util";
import { createGunzip, createGzip } from "zlib";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";
import { ZodError, z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { existsSync as existsSync$1, readFileSync as readFileSync$1, writeFileSync as writeFileSync$1 } from "node:fs";
import { join as join$1 } from "node:path";
import { fileURLToPath } from "url";
import fs$1 from "node:fs/promises";
//#region src/backend/env.ts
var initialized = false;
function setupProductionEnv() {
	if (initialized) return;
	initialized = true;
	if (!app.isPackaged) return;
	const userDataPath = app.getPath("userData");
	let dbPath = path.join(userDataPath, "dev.sqlite3");
	if (!fs.existsSync(userDataPath)) fs.mkdirSync(userDataPath, { recursive: true });
	if (!fs.existsSync(dbPath)) logger.info(`Database will be created at ${dbPath} on first connect`);
	process.env.DATABASE_URL = `file:${dbPath}`;
	logger.info(`Database URL: ${process.env.DATABASE_URL}`);
}
//#endregion
//#region src/shared/errors.ts
var errors_exports = /* @__PURE__ */ __exportAll({
	BusinessRuleError: () => BusinessRuleError,
	ConflictError: () => ConflictError,
	DomainError: () => DomainError,
	NotFoundError: () => NotFoundError,
	ValidationError: () => ValidationError
});
var DomainError = class extends Error {};
var NotFoundError = class extends DomainError {
	code = "NOT_FOUND";
	constructor(entity, id) {
		super(id ? `${entity} no encontrado (${id})` : `${entity} no encontrado`);
		this.name = "NotFoundError";
	}
};
var ValidationError = class extends DomainError {
	code = "VALIDATION";
	errors;
	constructor(message, errors) {
		super(message);
		this.name = "ValidationError";
		this.errors = errors || [];
	}
};
var ConflictError = class extends DomainError {
	code = "CONFLICT";
	constructor(message) {
		super(message);
		this.name = "ConflictError";
	}
};
var BusinessRuleError = class extends DomainError {
	code = "BUSINESS_RULE";
	constructor(message) {
		super(message);
		this.name = "BusinessRuleError";
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaProductRepository.ts
var PrismaProductRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(search, categoryId) {
		const where = {};
		if (search) where.OR = [
			{ name: { contains: search } },
			{ sku: { contains: search } },
			{ description: { contains: search } }
		];
		if (categoryId) where.category_id = categoryId;
		return this.prisma.product.findMany({
			where,
			select: {
				id: true,
				sku: true,
				name: true,
				description: true,
				price_sale: true,
				price_purchase: true,
				stock: true,
				min_stock: true,
				created_at: true,
				updated_at: true,
				category_id: true,
				supplier_id: true,
				category: { select: {
					id: true,
					name: true
				} },
				supplier: { select: {
					id: true,
					name: true
				} }
			},
			orderBy: { created_at: "desc" }
		});
	}
	async findById(id) {
		return await this.prisma.product.findUnique({
			where: { id },
			include: {
				category: true,
				supplier: true
			}
		});
	}
	async findByIds(ids) {
		return this.prisma.product.findMany({ where: { id: { in: ids } } });
	}
	async findBySku(sku) {
		return this.prisma.product.findUnique({ where: { sku } });
	}
	async findLowStock() {
		return this.prisma.product.findMany({
			where: { stock: { lte: this.prisma.product.fields.min_stock } },
			include: { category: true },
			orderBy: { stock: "asc" }
		});
	}
	async create(data) {
		const initialStock = data.stock || 0;
		return this.prisma.product.create({ data: {
			sku: data.sku,
			name: data.name,
			price_sale: data.price_sale,
			price_purchase: data.price_purchase,
			description: data.description,
			category_id: data.category_id,
			supplier_id: data.supplier_id,
			min_stock: data.min_stock,
			stock: initialStock
		} });
	}
	async update(id, data) {
		return this.prisma.product.update({
			where: { id },
			data,
			include: {
				category: true,
				supplier: true
			}
		});
	}
	async delete(id) {
		await this.prisma.product.delete({ where: { id } });
	}
	async getSalesCount(id) {
		return this.prisma.saleItem.count({ where: { product_id: id } });
	}
	async updateStock(id, delta) {
		if (delta < 0) {
			if ((await this.prisma.product.updateMany({
				where: {
					id,
					stock: { gte: Math.abs(delta) }
				},
				data: { stock: { increment: delta } }
			})).count === 0) throw new BusinessRuleError("Stock insuficiente");
		} else await this.prisma.product.update({
			where: { id },
			data: { stock: { increment: delta } }
		});
	}
	async createMovement(data) {
		await this.prisma.inventoryMovement.create({ data });
	}
	async getMovements(productId, limit = 50) {
		return this.prisma.inventoryMovement.findMany({
			where: { product_id: productId },
			orderBy: { created_at: "desc" },
			take: limit
		});
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaClientRepository.ts
var PrismaClientRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(search) {
		const where = search ? { OR: [
			{ dni: { contains: search } },
			{ name: { contains: search } },
			{ code: { contains: search } },
			{ tax_id: { contains: search } }
		] } : {};
		return this.prisma.client.findMany({
			where,
			orderBy: { created_at: "desc" }
		});
	}
	async findById(id) {
		return this.prisma.client.findUnique({ where: { id } });
	}
	async findByDni(dni) {
		return this.prisma.client.findFirst({ where: { dni } });
	}
	async findByCode(code) {
		return this.prisma.client.findFirst({ where: { code } });
	}
	async findByTaxId(taxId) {
		return this.prisma.client.findFirst({ where: { tax_id: taxId } });
	}
	async create(data) {
		return this.prisma.client.create({ data });
	}
	async update(id, data) {
		return this.prisma.client.update({
			where: { id },
			data
		});
	}
	async delete(id) {
		await this.prisma.client.delete({ where: { id } });
	}
	async getSalesCount(id) {
		return this.prisma.sale.count({ where: { client_id: id } });
	}
};
//#endregion
//#region src/shared/helpers.ts
/**
* Helpers DRY para evitar patrones repetidos en servicios y repositorios.
*/
/**
* Construye un filtro de fecha para consultas Prisma.
* Ej: buildDateFilter(startDate, endDate) => { created_at: { gte: ..., lte: ... } }
*/
function buildDateFilter(field, startDate, endDate) {
	if (!startDate && !endDate) return {};
	const filter = {};
	if (startDate) filter[field] = {
		...filter[field] || {},
		gte: startDate
	};
	if (endDate) filter[field] = {
		...filter[field] || {},
		lte: endDate
	};
	return filter;
}
/**
* Busca una entidad por su función finder y lanza NotFoundError si no existe.
*/
async function findOrThrow(finder, entityName, id) {
	const result = await finder();
	if (!result) {
		const { NotFoundError } = await Promise.resolve().then(() => errors_exports);
		throw new NotFoundError(entityName, id);
	}
	return result;
}
//#endregion
//#region src/infrastructure/persistence/PrismaSaleRepository.ts
var PrismaSaleRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(filter) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", filter?.startDate, filter?.endDate));
		if (filter?.clientId) where.client_id = filter.clientId;
		if (filter?.cashRegisterId) where.cash_register_id = filter.cashRegisterId;
		const page = filter?.page ?? 1;
		const pageSize = filter?.pageSize ?? 50;
		const skip = (page - 1) * pageSize;
		const take = pageSize;
		const [data, total] = await Promise.all([this.prisma.sale.findMany({
			where,
			select: {
				id: true,
				total: true,
				subtotal: true,
				tax_amount: true,
				payment_method: true,
				created_at: true,
				updated_at: true,
				cash_register_id: true,
				client_id: true,
				client: { select: {
					id: true,
					name: true,
					dni: true
				} },
				cash_register: { select: {
					id: true,
					opened_at: true,
					opening_amount: true
				} },
				_count: { select: { items: true } }
			},
			skip,
			take,
			orderBy: { created_at: "desc" }
		}), this.prisma.sale.count({ where })]);
		return {
			data,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize)
		};
	}
	async findById(id) {
		return await this.prisma.sale.findUnique({
			where: { id },
			include: {
				items: { include: { product: true } },
				client: true,
				cash_register: true
			}
		});
	}
	async findToday() {
		const startOfDay = /* @__PURE__ */ new Date();
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = /* @__PURE__ */ new Date();
		endOfDay.setHours(23, 59, 59, 999);
		return this.prisma.sale.findMany({
			where: { created_at: {
				gte: startOfDay,
				lte: endOfDay
			} },
			include: {
				client: true,
				cash_register: true
			},
			orderBy: { created_at: "desc" }
		});
	}
	async findLast() {
		return await this.prisma.sale.findFirst({
			orderBy: { created_at: "desc" },
			include: { items: true }
		});
	}
	async getStats(startDate, endDate) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", startDate, endDate));
		const stats = await this.prisma.sale.aggregate({
			where,
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true }
		});
		return {
			totalSales: stats._count.id,
			totalRevenue: stats._sum.total || 0,
			averageSale: stats._avg.total || 0
		};
	}
	async registerSale(input) {
		return this.prisma.$transaction(async (tx) => {
			const sale = await tx.sale.create({ data: {
				cash_register_id: input.cash_register_id,
				client_id: input.client_id,
				subtotal: input.subtotal,
				tax_amount: input.tax_amount,
				total: input.total,
				discount_total: input.discount_total || 0,
				payment_method: input.payment_method,
				exchange_rate: input.exchange_rate || 0
			} });
			for (const item of input.items) {
				await tx.saleItem.create({ data: {
					sale_id: sale.id,
					product_id: item.product_id,
					quantity: item.quantity,
					unit_price: item.unit_price,
					purchase_price: item.purchase_price,
					discount_name: item.discount_name ?? null,
					discount_type: item.discount_type ?? null,
					discount_value: item.discount_value ?? null,
					discount_amount: item.discount_amount ?? 0,
					final_unit_price: item.final_unit_price ?? null
				} });
				if ((await tx.product.updateMany({
					where: {
						id: item.product_id,
						stock: { gte: item.quantity }
					},
					data: { stock: { decrement: item.quantity } }
				})).count === 0) throw new BusinessRuleError(`Stock insuficiente para el producto ${item.product_id}`);
				await tx.inventoryMovement.create({ data: {
					product_id: item.product_id,
					type: "SALIDA",
					quantity: item.quantity,
					reason: "VENTA"
				} });
			}
			await tx.cashRegister.update({
				where: { id: input.cash_register_id },
				data: { total_sales: { increment: input.total } }
			});
			return sale.id;
		});
	}
	async count(filter) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", filter?.startDate, filter?.endDate));
		if (filter?.clientId) where.client_id = filter.clientId;
		if (filter?.cashRegisterId) where.cash_register_id = filter.cashRegisterId;
		return this.prisma.sale.count({ where });
	}
	async cancelSale(saleId) {
		const sale = await this.prisma.sale.findUnique({
			where: { id: saleId },
			include: { items: true }
		});
		if (!sale) throw new Error("Venta no encontrada");
		await this.prisma.$transaction(async (tx) => {
			for (const item of sale.items) {
				await tx.product.update({
					where: { id: item.product_id },
					data: { stock: { increment: item.quantity } }
				});
				await tx.inventoryMovement.create({ data: {
					product_id: item.product_id,
					type: "ENTRADA",
					quantity: item.quantity,
					reason: "DEVOLUCION"
				} });
			}
			await tx.cashRegister.update({
				where: { id: sale.cash_register_id },
				data: { total_sales: { decrement: sale.total } }
			});
			await tx.sale.delete({ where: { id: saleId } });
		});
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaCashRegisterRepository.ts
var PrismaCashRegisterRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findOpen() {
		return this.prisma.cashRegister.findFirst({
			where: { closed_at: null },
			orderBy: { opened_at: "desc" }
		});
	}
	async findById(id) {
		return await this.prisma.cashRegister.findUnique({
			where: { id },
			include: { sales: { include: {
				client: true,
				items: { include: { product: true } }
			} } }
		});
	}
	async findAll(startDate, endDate) {
		const where = {};
		Object.assign(where, buildDateFilter("opened_at", startDate, endDate));
		return this.prisma.cashRegister.findMany({
			where,
			include: { _count: { select: { sales: true } } },
			orderBy: { opened_at: "desc" }
		});
	}
	async create(openingAmount) {
		return this.prisma.cashRegister.create({ data: {
			opening_amount: Number(openingAmount),
			total_sales: 0
		} });
	}
	async close(id, closingAmount, difference, status) {
		await this.prisma.cashRegister.update({
			where: { id },
			data: {
				closed_at: /* @__PURE__ */ new Date(),
				closing_amount: closingAmount,
				difference,
				status
			}
		});
	}
	async updateTotalSales(id, delta) {
		await this.prisma.cashRegister.update({
			where: { id },
			data: { total_sales: { increment: delta } }
		});
	}
	async getSalesCount(id, since) {
		return this.prisma.sale.count({ where: {
			cash_register_id: id,
			created_at: { gte: since }
		} });
	}
	async getDailySummary(registerId) {
		const startOfDay = /* @__PURE__ */ new Date();
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = /* @__PURE__ */ new Date();
		endOfDay.setHours(23, 59, 59, 999);
		const where = {
			cash_register_id: registerId,
			created_at: {
				gte: startOfDay,
				lte: endOfDay
			}
		};
		const register = await this.prisma.cashRegister.findFirst({ where: {
			id: registerId,
			opened_at: { gte: startOfDay }
		} });
		if (!register) throw new Error("Caja no encontrada o no está abierta hoy.");
		const salesStats = await this.prisma.sale.aggregate({
			where,
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true }
		});
		const salesByPayment = await this.prisma.sale.groupBy({
			by: ["payment_method"],
			where,
			_count: { id: true },
			_sum: { total: true }
		});
		return {
			register,
			totalSales: salesStats._count.id,
			totalRevenue: salesStats._sum.total || 0,
			averageSale: salesStats._avg.total || 0,
			salesByPayment
		};
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaSupplierRepository.ts
var PrismaSupplierRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(search) {
		const where = {};
		if (search) where.OR = [
			{ name: { contains: search } },
			{ ruc: { contains: search } },
			{ email: { contains: search } }
		];
		return this.prisma.supplier.findMany({
			where,
			include: { _count: { select: {
				products: true,
				purchases: true
			} } },
			orderBy: { name: "asc" }
		});
	}
	async findById(id) {
		return await this.prisma.supplier.findUnique({
			where: { id },
			include: {
				products: { select: {
					id: true,
					name: true,
					sku: true,
					stock: true
				} },
				purchases: {
					orderBy: { created_at: "desc" },
					take: 10
				}
			}
		});
	}
	async findByRuc(ruc) {
		return this.prisma.supplier.findFirst({ where: { ruc } });
	}
	async create(data) {
		return this.prisma.supplier.create({ data });
	}
	async update(id, data) {
		return this.prisma.supplier.update({
			where: { id },
			data
		});
	}
	async delete(id) {
		await this.prisma.supplier.delete({ where: { id } });
	}
	async hasProducts(id) {
		return await this.prisma.product.count({ where: { supplier_id: id } }) > 0;
	}
	async hasPurchases(id) {
		return await this.prisma.purchase.count({ where: { supplier_id: id } }) > 0;
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaPurchaseRepository.ts
var PrismaPurchaseRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(supplierId, status) {
		const where = {};
		if (supplierId) where.supplier_id = supplierId;
		if (status) where.status = status;
		return this.prisma.purchase.findMany({
			where,
			include: {
				supplier: { select: {
					id: true,
					name: true,
					ruc: true
				} },
				items: { include: { product: { select: {
					id: true,
					name: true,
					sku: true
				} } } }
			},
			orderBy: { created_at: "desc" }
		});
	}
	async findById(id) {
		return await this.prisma.purchase.findUnique({
			where: { id },
			include: {
				supplier: true,
				items: { include: { product: true } }
			}
		});
	}
	async create(data) {
		const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
		return this.prisma.purchase.create({
			data: {
				supplier_id: data.supplier_id,
				total_amount: totalAmount,
				status: "PENDING",
				payment_status: data.payment_status || "UNPAID",
				items: { create: data.items.map((item) => ({
					product_id: item.product_id,
					quantity: item.quantity,
					unit_cost: item.unit_cost
				})) }
			},
			include: {
				supplier: true,
				items: { include: { product: true } }
			}
		});
	}
	async receive(purchaseId) {
		const purchase = await this.prisma.purchase.findUnique({
			where: { id: purchaseId },
			include: { items: { include: { product: true } } }
		});
		if (!purchase) throw new Error("Compra no encontrada");
		if (purchase.status === "RECEIVED") throw new Error("Esta compra ya fue recibida");
		if (purchase.status === "CANCELLED") throw new Error("No se puede recibir una compra cancelada");
		await this.prisma.$transaction(async (tx) => {
			for (const item of purchase.items) {
				await tx.product.update({
					where: { id: item.product_id },
					data: {
						stock: { increment: item.quantity },
						price_purchase: item.unit_cost
					}
				});
				await tx.inventoryMovement.create({ data: {
					product_id: item.product_id,
					type: "ENTRADA",
					quantity: item.quantity,
					reason: "COMPRA"
				} });
			}
			await tx.purchase.update({
				where: { id: purchaseId },
				data: { status: "RECEIVED" }
			});
		});
	}
	async cancel(purchaseId) {
		const purchase = await this.prisma.purchase.findUnique({ where: { id: purchaseId } });
		if (!purchase) throw new Error("Compra no encontrada");
		if (purchase.status === "RECEIVED") throw new Error("No se puede cancelar una compra ya recibida");
		if (purchase.status === "CANCELLED") throw new Error("Esta compra ya está cancelada");
		await this.prisma.purchase.update({
			where: { id: purchaseId },
			data: { status: "CANCELLED" }
		});
	}
	async updatePaymentStatus(purchaseId, paymentStatus) {
		await this.prisma.purchase.update({
			where: { id: purchaseId },
			data: { payment_status: paymentStatus }
		});
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaSettingsRepository.ts
var PrismaSettingsRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async getAll() {
		return (await this.prisma.setting.findMany()).reduce((acc, curr) => {
			acc[curr.key] = curr.value;
			return acc;
		}, {});
	}
	async get(key, defaultValue = "") {
		const setting = await this.prisma.setting.findUnique({ where: { key } });
		return setting ? setting.value : defaultValue;
	}
	async upsert(key, value) {
		await this.prisma.setting.upsert({
			where: { key },
			update: { value },
			create: {
				key,
				value
			}
		});
	}
	async upsertMany(settings) {
		const promises = Object.entries(settings).map(([key, value]) => this.prisma.setting.upsert({
			where: { key },
			update: { value },
			create: {
				key,
				value
			}
		}));
		await Promise.all(promises);
	}
	async getTaxSettings() {
		const taxRate = await this.get("tax_rate", "0");
		const taxType = await this.get("tax_type", "none");
		const taxIncluded = await this.get("tax_included", "false");
		return {
			taxRate: parseFloat(taxRate) || 0,
			taxType,
			taxIncluded: taxIncluded === "true"
		};
	}
	async updateTaxSettings(taxRate, taxType, taxIncluded) {
		await this.upsertMany({
			tax_rate: taxRate.toString(),
			tax_type: taxType,
			tax_included: taxIncluded.toString()
		});
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaUserRepository.ts
var PrismaUserRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll() {
		return this.prisma.user.findMany({
			select: {
				id: true,
				username: true,
				role: true,
				created_at: true,
				updated_at: true
			},
			orderBy: { created_at: "desc" }
		});
	}
	async findById(id) {
		return this.prisma.user.findUnique({
			where: { id },
			select: {
				id: true,
				username: true,
				role: true,
				created_at: true,
				updated_at: true
			}
		});
	}
	async findByIdWithPassword(id) {
		return this.prisma.user.findUnique({ where: { id } });
	}
	async findByUsername(username) {
		return this.prisma.user.findUnique({ where: { username } });
	}
	async create(data) {
		return this.prisma.user.create({
			data,
			select: {
				id: true,
				username: true,
				role: true,
				created_at: true,
				updated_at: true
			}
		});
	}
	async update(id, data) {
		return this.prisma.user.update({
			where: { id },
			data,
			select: {
				id: true,
				username: true,
				role: true,
				created_at: true,
				updated_at: true
			}
		});
	}
	async delete(id) {
		await this.prisma.user.delete({ where: { id } });
	}
	async exists(username, excludeId) {
		const where = { username };
		if (excludeId) where.id = { not: excludeId };
		return !!await this.prisma.user.findFirst({
			where,
			select: { id: true }
		});
	}
	async updateByUsername(username, data) {
		return this.prisma.user.update({
			where: { username },
			data,
			select: {
				id: true,
				username: true,
				role: true,
				security_question: true,
				created_at: true,
				updated_at: true
			}
		});
	}
	async count() {
		return this.prisma.user.count();
	}
	async updateLoginAttempts(username, failed_attempts, locked_until) {
		await this.prisma.user.update({
			where: { username },
			data: {
				failed_attempts,
				locked_until
			}
		});
	}
	async resetLoginAttempts(username) {
		await this.prisma.user.update({
			where: { username },
			data: {
				failed_attempts: 0,
				locked_until: null
			}
		});
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaCategoryRepository.ts
var PrismaCategoryRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(search) {
		const where = search ? { name: { contains: search } } : {};
		return this.prisma.category.findMany({
			where,
			select: {
				id: true,
				name: true,
				created_at: true,
				updated_at: true
			},
			orderBy: { name: "asc" }
		});
	}
	async findById(id) {
		return await this.prisma.category.findUnique({
			where: { id },
			include: { products: { select: {
				id: true,
				name: true,
				sku: true,
				stock: true
			} } }
		});
	}
	async findByName(name) {
		return this.prisma.category.findFirst({ where: { name } });
	}
	async create(data) {
		return this.prisma.category.create({ data });
	}
	async update(id, data) {
		return this.prisma.category.update({
			where: { id },
			data
		});
	}
	async delete(id) {
		await this.prisma.category.delete({ where: { id } });
	}
	async getProductCount(id) {
		return this.prisma.product.count({ where: { category_id: id } });
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaAuditLogRepository.ts
var PrismaAuditLogRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async create(entry) {
		try {
			let finalUserId = entry.userId;
			if (finalUserId) {
				if (!await this.prisma.user.findUnique({
					where: { id: finalUserId },
					select: { id: true }
				})) {
					const adminId = await this.getDefaultAdminUserId();
					if (!adminId) {
						console.warn(`User ${entry.userId} not found and no admin available, skipping audit log`);
						return;
					}
					finalUserId = adminId;
				}
			} else {
				const adminId = await this.getDefaultAdminUserId();
				if (!adminId) {
					console.warn("No userId provided and no admin user found, skipping audit log");
					return;
				}
				finalUserId = adminId;
			}
			await this.prisma.auditLog.create({ data: {
				user_id: finalUserId,
				action: entry.action,
				entity: entry.entity,
				entity_id: entry.entity_id
			} });
		} catch (error) {
			console.warn("Failed to create audit log:", error);
		}
	}
	async getDefaultAdminUserId() {
		try {
			return (await this.prisma.user.findFirst({
				where: { role: "ADMIN" },
				select: { id: true },
				orderBy: { id: "asc" }
			}))?.id ?? null;
		} catch {
			return null;
		}
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaDashboardRepository.ts
var PrismaDashboardRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async getStats(startDate, endDate) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", startDate, endDate));
		const filterWhere = Object.keys(where).length === 0 ? { created_at: { gte: new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) } } : where;
		const revenueResult = await this.prisma.sale.aggregate({
			where: filterWhere,
			_sum: { total: true }
		});
		const salesCount = await this.prisma.sale.count({ where: filterWhere });
		const totalProfit = (await this.prisma.sale.findMany({
			where: filterWhere,
			select: {
				id: true,
				total: true,
				items: { select: {
					quantity: true,
					unit_price: true,
					purchase_price: true
				} }
			}
		})).reduce((acc, sale) => {
			return acc + sale.items.reduce((itemAcc, item) => {
				return itemAcc + item.quantity * (item.unit_price - item.purchase_price);
			}, 0);
		}, 0);
		const activeProducts = await this.prisma.product.count({ where: { stock: { gt: 0 } } });
		const totalClients = await this.prisma.client.count();
		const lowStockCount = await this.prisma.product.count({ where: { stock: { lt: this.prisma.product.fields.min_stock } } });
		return {
			todayRevenue: revenueResult._sum.total || 0,
			todayProfit: totalProfit,
			todaySalesCount: salesCount,
			totalRevenue: revenueResult._sum.total || 0,
			totalProfit,
			totalSales: salesCount,
			activeProducts,
			totalClients,
			lowStockProducts: lowStockCount,
			averageSale: salesCount > 0 ? (revenueResult._sum.total || 0) / salesCount : 0
		};
	}
	async getWeeklySales(days = 7) {
		const startDate = /* @__PURE__ */ new Date();
		startDate.setDate(startDate.getDate() - days);
		const groupedByDate = (await this.prisma.sale.findMany({
			where: { created_at: { gte: startDate } },
			select: {
				total: true,
				created_at: true
			},
			orderBy: { created_at: "asc" }
		})).reduce((acc, sale) => {
			const date = sale.created_at.toISOString().split("T")[0];
			if (!acc[date]) acc[date] = {
				date,
				total: 0,
				count: 0
			};
			acc[date].total += sale.total;
			acc[date].count += 1;
			return acc;
		}, {});
		return Object.values(groupedByDate);
	}
	async getLowStockProducts(limit = 10) {
		return (await this.prisma.$queryRaw`
      SELECT p.id, p.sku, p.name, p.stock, p.min_stock, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock <= COALESCE(p.min_stock, 5) OR p.stock = 0
      ORDER BY p.stock ASC
      LIMIT ${limit}
    ` || []).map((r) => ({
			id: r.id,
			sku: r.sku,
			name: r.name,
			stock: r.stock,
			min_stock: r.min_stock,
			category: r.category_name ? { name: r.category_name } : null
		}));
	}
	async getSalesByPaymentMethod(startDate, endDate) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", startDate, endDate));
		return this.prisma.sale.groupBy({
			by: ["payment_method"],
			where,
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true }
		});
	}
	async getTopProducts(limit = 10, startDate, endDate) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", startDate, endDate));
		const topProducts = await this.prisma.saleItem.groupBy({
			by: ["product_id"],
			where,
			_sum: { quantity: true },
			_avg: { unit_price: true },
			_count: { id: true },
			orderBy: { _sum: { quantity: "desc" } },
			take: limit
		});
		const productIds = topProducts.map((item) => item.product_id);
		const products = await this.prisma.product.findMany({
			where: { id: { in: productIds } },
			include: { category: true }
		});
		return topProducts.map((item) => {
			const product = products.find((p) => p.id === item.product_id);
			return {
				product_id: item.product_id,
				product_name: product?.name || "Unknown",
				product_sku: product?.sku || "Unknown",
				category: product?.category?.name || "Sin categoría",
				total_quantity: item._sum.quantity || 0,
				avg_price: item._avg.unit_price || 0,
				times_sold: item._count.id
			};
		});
	}
	async getTopClients(limit = 10, startDate, endDate) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", startDate, endDate));
		const topClients = await this.prisma.sale.groupBy({
			by: ["client_id"],
			where,
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true },
			orderBy: { _sum: { total: "desc" } },
			take: limit
		});
		const clientIds = topClients.map((item) => item.client_id).filter((id) => id !== null);
		const clients = await this.prisma.client.findMany({ where: { id: { in: clientIds } } });
		return topClients.map((item) => {
			const client = clients.find((c) => c.id === item.client_id);
			return {
				client_id: item.client_id,
				client_name: client?.name || "Cliente Desconocido",
				client_dni: client?.dni || "N/A",
				total_purchases: item._count.id,
				total_spent: item._sum.total || 0,
				avg_purchase: item._avg.total || 0
			};
		});
	}
	async getSalesByHour(startDate, endDate) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", startDate, endDate));
		const sales = await this.prisma.sale.findMany({
			where,
			select: {
				total: true,
				created_at: true
			}
		});
		const hours = Array.from({ length: 24 }, (_, i) => ({
			hour: i,
			total: 0,
			count: 0
		}));
		sales.forEach((sale) => {
			const hour = sale.created_at.getHours();
			hours[hour].total += sale.total;
			hours[hour].count += 1;
		});
		return hours;
	}
	async getCashRegisterSummary(startDate, endDate) {
		const where = {};
		Object.assign(where, buildDateFilter("opened_at", startDate, endDate));
		const registers = await this.prisma.cashRegister.findMany({
			where,
			select: {
				id: true,
				opened_at: true,
				opening_amount: true,
				total_sales: true
			},
			orderBy: { opened_at: "desc" }
		});
		return {
			registers,
			summary: registers.reduce((acc, reg) => ({
				totalRegisters: acc.totalRegisters + 1,
				totalOpening: acc.totalOpening + Number(reg.opening_amount),
				totalSales: acc.totalSales + Number(reg.total_sales)
			}), {
				totalRegisters: 0,
				totalOpening: 0,
				totalSales: 0
			})
		};
	}
	async getLastSaleWithClient() {
		const today = /* @__PURE__ */ new Date();
		today.setHours(0, 0, 0, 0);
		const sale = await this.prisma.sale.findFirst({
			where: { created_at: { gte: today } },
			orderBy: { created_at: "desc" },
			include: { client: { select: {
				name: true,
				dni: true
			} } }
		});
		if (!sale) return null;
		return {
			sale_id: sale.id,
			client_name: sale.client?.name ?? null,
			client_dni: sale.client?.dni ?? null,
			total: sale.total,
			created_at: sale.created_at
		};
	}
	async getInventoryMetrics() {
		const totalProducts = await this.prisma.product.count();
		const productsWithStock = await this.prisma.product.count({ where: { stock: { gt: 0 } } });
		const productsWithoutStock = await this.prisma.product.count({ where: { stock: { equals: 0 } } });
		const lowStockProducts = await this.prisma.product.count({ where: { stock: { lt: this.prisma.product.fields.min_stock } } });
		const inventoryValue = await this.prisma.product.aggregate({
			_sum: { price_purchase: true },
			where: { stock: { gt: 0 } }
		});
		const inventorySaleValue = await this.prisma.product.aggregate({
			_sum: { price_sale: true },
			where: { stock: { gt: 0 } }
		});
		const recentMovements = await this.prisma.inventoryMovement.findMany({
			take: 10,
			orderBy: { created_at: "desc" },
			include: { product: { select: {
				name: true,
				sku: true
			} } }
		});
		return {
			totalProducts,
			productsWithStock,
			productsWithoutStock,
			lowStockProducts,
			totalPurchaseValue: inventoryValue._sum.price_purchase || 0,
			totalSaleValue: inventorySaleValue._sum.price_sale || 0,
			potentialProfit: (inventorySaleValue._sum.price_sale || 0) - (inventoryValue._sum.price_purchase || 0),
			recentMovements
		};
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaDiscountRepository.ts
var PrismaDiscountRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(activeOnly) {
		const where = {};
		if (activeOnly) where.is_active = true;
		return this.prisma.discount.findMany({
			where,
			include: { category: { select: {
				id: true,
				name: true
			} } },
			orderBy: { created_at: "desc" }
		});
	}
	async findById(id) {
		return await this.prisma.discount.findUnique({
			where: { id },
			include: {
				category: { select: {
					id: true,
					name: true
				} },
				products: { include: { product: { select: {
					id: true,
					name: true,
					sku: true
				} } } }
			}
		});
	}
	async findApplicableToProduct(productId, totalAmount) {
		const product = await this.prisma.product.findUnique({
			where: { id: productId },
			select: { category_id: true }
		});
		if (!product) return [];
		const discounts = await this.prisma.discount.findMany({ where: {
			is_active: true,
			OR: [
				{ applicable_to: "ALL" },
				{
					applicable_to: "CATEGORY",
					category_id: product.category_id
				},
				{
					applicable_to: "SPECIFIC",
					products: { some: { product_id: productId } }
				}
			]
		} });
		if (totalAmount !== void 0) return discounts.filter((d) => d.min_purchase_amount === null || d.min_purchase_amount <= totalAmount);
		return discounts;
	}
	async create(data) {
		const { product_ids, ...discountData } = data;
		return this.prisma.$transaction(async (tx) => {
			const discount = await tx.discount.create({ data: {
				name: discountData.name,
				type: discountData.type,
				value: discountData.value,
				is_active: discountData.is_active ?? true,
				applicable_to: discountData.applicable_to ?? "ALL",
				category_id: discountData.category_id ?? null,
				min_purchase_amount: discountData.min_purchase_amount ?? null
			} });
			if (product_ids && product_ids.length > 0) await tx.productDiscount.createMany({ data: product_ids.map((pid) => ({
				product_id: pid,
				discount_id: discount.id
			})) });
			return discount;
		});
	}
	async update(id, data) {
		const { product_ids, ...discountData } = data;
		return this.prisma.$transaction(async (tx) => {
			const discount = await tx.discount.update({
				where: { id },
				data: {
					...discountData,
					category_id: discountData.category_id ?? null,
					min_purchase_amount: discountData.min_purchase_amount ?? null
				}
			});
			if (product_ids !== void 0) {
				await tx.productDiscount.deleteMany({ where: { discount_id: id } });
				if (product_ids.length > 0) await tx.productDiscount.createMany({ data: product_ids.map((pid) => ({
					product_id: pid,
					discount_id: id
				})) });
			}
			return discount;
		});
	}
	async delete(id) {
		await this.prisma.discount.delete({ where: { id } });
	}
	async addProducts(discountId, productIds) {
		await this.prisma.productDiscount.createMany({ data: productIds.map((pid) => ({
			product_id: pid,
			discount_id: discountId
		})) });
	}
	async removeProducts(discountId, productIds) {
		await this.prisma.productDiscount.deleteMany({ where: {
			discount_id: discountId,
			product_id: { in: productIds }
		} });
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaInventoryMovementRepository.ts
var PrismaInventoryMovementRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(filter) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", filter?.startDate, filter?.endDate));
		if (filter?.productId) where.product_id = filter.productId;
		if (filter?.type) where.type = filter.type;
		if (filter?.reason) where.reason = filter.reason;
		const page = filter?.page ?? 1;
		const pageSize = filter?.pageSize ?? 50;
		const skip = (page - 1) * pageSize;
		const take = pageSize;
		const [data, total] = await Promise.all([this.prisma.inventoryMovement.findMany({
			where,
			include: { product: { select: {
				id: true,
				name: true,
				sku: true
			} } },
			skip,
			take,
			orderBy: { created_at: "desc" }
		}), this.prisma.inventoryMovement.count({ where })]);
		return {
			data,
			total,
			page,
			pageSize,
			totalPages: Math.ceil(total / pageSize)
		};
	}
	async count(filter) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", filter?.startDate, filter?.endDate));
		if (filter?.productId) where.product_id = filter.productId;
		if (filter?.type) where.type = filter.type;
		if (filter?.reason) where.reason = filter.reason;
		return this.prisma.inventoryMovement.count({ where });
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaAiTrainingLogRepository.ts
var PrismaAiTrainingLogRepository = class {
	prisma;
	constructor(prisma) {
		this.prisma = prisma;
	}
	async create(data) {
		const record = await this.prisma.aiTrainingLog.create({ data: {
			usuario_id: data.usuario_id,
			mensaje_usuario: data.mensaje_usuario,
			nlu_output: data.nlu_output ?? null,
			respuesta_sistema: data.respuesta_sistema ?? null
		} });
		return this.mapToDTO(record);
	}
	async findById(id) {
		const record = await this.prisma.aiTrainingLog.findUnique({ where: { id } });
		return record ? this.mapToDTO(record) : null;
	}
	async findAll(filter) {
		return (await this.prisma.aiTrainingLog.findMany({
			where: {
				usuario_id: filter?.usuario_id,
				created_at: {
					gte: filter?.startDate,
					lte: filter?.endDate
				}
			},
			orderBy: { created_at: "desc" },
			take: filter?.limit ?? 100
		})).map((r) => this.mapToDTO(r));
	}
	async countByIntentSince(intent, since) {
		const logs = await this.prisma.aiTrainingLog.findMany({
			where: {
				nlu_output: { not: null },
				created_at: { gte: since }
			},
			select: { nlu_output: true }
		});
		const intentPattern = `"intent":"${intent}"`;
		return logs.filter((l) => l.nlu_output?.includes(intentPattern)).length;
	}
	async getLatestByUser(usuario_id, limit = 20) {
		return (await this.prisma.aiTrainingLog.findMany({
			where: { usuario_id },
			orderBy: { created_at: "desc" },
			take: limit
		})).map((r) => this.mapToDTO(r));
	}
	mapToDTO(record) {
		return {
			id: record.id,
			usuario_id: record.usuario_id,
			mensaje_usuario: record.mensaje_usuario,
			nlu_output: record.nlu_output,
			respuesta_sistema: record.respuesta_sistema,
			created_at: record.created_at
		};
	}
};
//#endregion
//#region src/backend/utils/pathValidation.ts
function isPathWithin(base, target) {
	const resolvedBase = path.resolve(base);
	const resolvedTarget = path.resolve(target);
	return resolvedTarget === resolvedBase || resolvedTarget.startsWith(resolvedBase + path.sep);
}
function assertPathWithin(base, target, label) {
	if (!isPathWithin(base, target)) throw new Error(`${label || "Ruta"} no válida: debe estar dentro del directorio permitido`);
}
//#endregion
//#region src/infrastructure/backup/ElectronBackupService.ts
var pipelineAsync = promisify(pipeline);
var ElectronBackupService = class {
	getDbPath() {
		if (!app.isPackaged) return path.resolve(process.cwd(), "prisma", "dev.sqlite3");
		const userDataPath = app.getPath("userData");
		return path.join(userDataPath, "dev.sqlite3");
	}
	getBackupDir() {
		const isDev = !app.isPackaged;
		let basePath;
		if (isDev) basePath = process.cwd();
		else basePath = app.getPath("userData");
		const backupDir = path.join(basePath, "backups");
		if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
		return backupDir;
	}
	async createBackup(label) {
		try {
			const dbPath = this.getDbPath();
			if (!fs.existsSync(dbPath)) return {
				success: false,
				message: "Database file not found"
			};
			const backupDir = this.getBackupDir();
			const backupFileName = `backup-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").split("T")[0]}${label ? `-${label}` : ""}.sqlite.gz`;
			const backupPath = path.join(backupDir, backupFileName);
			await pipelineAsync(fs.createReadStream(dbPath), createGzip(), fs.createWriteStream(backupPath));
			return {
				success: true,
				path: backupFileName
			};
		} catch (error) {
			logger.error({ err: error }, "Error creating backup");
			return {
				success: false,
				message: "Error al crear respaldo"
			};
		}
	}
	async listBackups() {
		try {
			const backupDir = this.getBackupDir();
			if (!fs.existsSync(backupDir)) return [];
			return fs.readdirSync(backupDir).filter((f) => f.endsWith(".sqlite.gz")).map((filename) => {
				const filePath = path.join(backupDir, filename);
				const stats = fs.statSync(filePath);
				return {
					filename,
					path: filename,
					size: stats.size,
					created: stats.mtime
				};
			}).sort((a, b) => b.created.getTime() - a.created.getTime());
		} catch (error) {
			logger.error({ err: error }, "Error listing backups");
			return [];
		}
	}
	async restoreBackup(backupPath) {
		try {
			const backupDir = this.getBackupDir();
			if (path.isAbsolute(backupPath)) return {
				success: false,
				message: "Ruta absoluta no permitida. Use solo el nombre del archivo."
			};
			const resolvedPath = path.join(backupDir, backupPath);
			assertPathWithin(backupDir, resolvedPath, "Archivo de backup");
			if (!fs.existsSync(resolvedPath)) return {
				success: false,
				message: "Archivo de backup no encontrado"
			};
			const dbPath = this.getDbPath();
			await this.createBackup("before-restore");
			await pipelineAsync(fs.createReadStream(resolvedPath), createGunzip(), fs.createWriteStream(dbPath));
			return {
				success: true,
				message: "Backup restaurado correctamente. Reinicia la aplicación."
			};
		} catch (error) {
			logger.error({ err: error }, "Error restoring backup");
			return {
				success: false,
				message: "Error al restaurar respaldo"
			};
		}
	}
	async deleteBackup(backupPath) {
		try {
			const backupDir = this.getBackupDir();
			if (path.isAbsolute(backupPath)) return {
				success: false,
				message: "Ruta absoluta no permitida. Use solo el nombre del archivo."
			};
			const resolvedPath = path.join(backupDir, backupPath);
			assertPathWithin(backupDir, resolvedPath, "Archivo de backup");
			if (!fs.existsSync(resolvedPath)) return {
				success: false,
				message: "Archivo de backup no encontrado"
			};
			fs.unlinkSync(resolvedPath);
			return { success: true };
		} catch (error) {
			logger.error({ err: error }, "Error deleting backup");
			return {
				success: false,
				message: "Error al eliminar respaldo"
			};
		}
	}
	async createScheduledBackup() {
		const backups = await this.listBackups();
		const now = /* @__PURE__ */ new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		if (!backups.find((b) => {
			const backupDate = new Date(b.created);
			return new Date(backupDate.getFullYear(), backupDate.getMonth(), backupDate.getDate()).getTime() === today.getTime();
		})) {
			await this.createBackup("auto");
			logger.info("Automatic backup created");
		}
	}
	async cleanupOldBackups(keep = 10) {
		try {
			const backupDir = this.getBackupDir();
			const backups = await this.listBackups();
			if (backups.length > keep) {
				const toDelete = backups.slice(keep);
				for (const backup of toDelete) {
					const fullPath = path.join(backupDir, backup.path);
					fs.unlinkSync(fullPath);
				}
				logger.info(`Cleaned up ${toDelete.length} old backups`);
			}
		} catch (error) {
			logger.error({ err: error }, "Error cleaning up backups");
		}
	}
};
//#endregion
//#region src/infrastructure/reports/PDFReportGenerator.ts
var PDFReportGenerator = class {
	async generateSalesReport(rows, totals, title = "Reporte de Ventas", showTable = true) {
		const doc = new jsPDF({
			unit: "mm",
			format: "a4"
		});
		doc.setFontSize(16);
		doc.text(title, 14, 20);
		doc.setFontSize(10);
		doc.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, 14, 28);
		let finalY = 34;
		if (showTable && rows.length > 0) {
			autoTable(doc, {
				head: [[
					"Fecha",
					"# Factura",
					"Cliente",
					"Items",
					"Subtotal",
					"Impuesto",
					"Total",
					"Pago"
				]],
				body: rows.map((r) => [
					r.date,
					String(r.invoiceNumber),
					r.client,
					String(r.itemsCount),
					`$ ${r.subtotal.toFixed(2)}`,
					`$ ${r.tax.toFixed(2)}`,
					`$ ${r.total.toFixed(2)}`,
					r.paymentMethod
				]),
				startY: 34,
				styles: { fontSize: 7 },
				headStyles: { fillColor: [
					41,
					128,
					185
				] },
				tableWidth: "auto"
			});
			finalY = doc.lastAutoTable.finalY + 10;
		}
		doc.setFontSize(10);
		doc.text(`Total Ventas: ${totals.totalSales}`, 14, finalY);
		doc.text(`Ingreso Total: $ ${totals.totalRevenue.toFixed(2)}`, 14, finalY + 6);
		doc.text(`Promedio: $ ${totals.averageSale.toFixed(2)}`, 14, finalY + 12);
		if (totals.cashSales !== void 0 || totals.cardSales !== void 0) {
			doc.text(`Efectivo: ${totals.cashSales ?? 0} ventas  |  $ ${(totals.cashRevenue ?? 0).toFixed(2)}`, 14, finalY + 18);
			doc.text(`Tarjeta: ${totals.cardSales ?? 0} ventas  |  $ ${(totals.cardRevenue ?? 0).toFixed(2)}`, 14, finalY + 24);
		}
		return new Uint8Array(doc.output("arraybuffer"));
	}
	async generateInventoryReport(rows, metrics, title = "Reporte de Inventario") {
		const doc = new jsPDF({
			unit: "mm",
			format: "a4"
		});
		doc.setFontSize(16);
		doc.text(title, 14, 20);
		doc.setFontSize(10);
		doc.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, 14, 28);
		autoTable(doc, {
			head: [[
				"SKU",
				"Producto",
				"Categoría",
				"Stock",
				"Stock Min",
				"P. Compra",
				"P. Venta",
				"Estado"
			]],
			body: rows.map((r) => [
				r.sku,
				r.name,
				r.category,
				String(r.stock),
				r.minStock !== null ? String(r.minStock) : "-",
				`$ ${r.purchasePrice.toFixed(2)}`,
				`$ ${r.salePrice.toFixed(2)}`,
				r.status === "ok" ? "OK" : r.status === "low" ? "Stock Bajo" : "Sin Stock"
			]),
			startY: 34,
			styles: { fontSize: 7 },
			headStyles: { fillColor: [
				39,
				174,
				96
			] },
			tableWidth: "auto",
			didParseCell: (data) => {
				if (data.section === "body" && data.column.index === 7) {
					const status = data.cell.raw;
					if (status === "Sin Stock") data.cell.styles.textColor = [
						255,
						0,
						0
					];
					else if (status === "Stock Bajo") data.cell.styles.textColor = [
						255,
						165,
						0
					];
					else data.cell.styles.textColor = [
						0,
						128,
						0
					];
				}
			}
		});
		const finalY = doc.lastAutoTable.finalY + 10 || 50;
		doc.setFontSize(10);
		doc.text(`Total Productos: ${metrics.totalProducts}`, 14, finalY);
		doc.text(`Con Stock: ${metrics.productsWithStock}  |  Sin Stock: ${metrics.productsWithoutStock}  |  Stock Bajo: ${metrics.lowStockProducts}`, 14, finalY + 6);
		doc.text(`Valor Compra: $ ${metrics.totalPurchaseValue.toFixed(2)}  |  Valor Venta: $ ${metrics.totalSaleValue.toFixed(2)}`, 14, finalY + 12);
		doc.text(`Ganancia Potencial: $ ${metrics.potentialProfit.toFixed(2)}`, 14, finalY + 18);
		return new Uint8Array(doc.output("arraybuffer"));
	}
	async generateSaleReceipt(data) {
		const doc = new jsPDF({
			unit: "mm",
			format: [80, 120 + data.items.length * 6]
		});
		let y = 10;
		if (data.logoBase64) try {
			doc.addImage(data.logoBase64, "PNG", 30, y, 20, 20);
			y += 22;
		} catch {}
		doc.setFontSize(10);
		doc.text(data.businessName, 40, y, { align: "center" });
		y += 5;
		doc.setFontSize(7);
		if (data.businessAddress) {
			doc.text(data.businessAddress, 40, y, { align: "center" });
			y += 4;
		}
		if (data.businessPhone) {
			doc.text(`Tel: ${data.businessPhone}`, 40, y, { align: "center" });
			y += 4;
		}
		if (data.businessTaxId) {
			doc.text(`RUC: ${data.businessTaxId}`, 40, y, { align: "center" });
			y += 4;
		}
		y += 3;
		doc.setFontSize(8);
		doc.text("=".repeat(32), 5, y);
		y += 4;
		doc.text(`Ticket: #${data.saleId}`, 5, y);
		y += 4;
		doc.text(`Fecha: ${data.createdAt.toLocaleString("es-PE")}`, 5, y);
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
		doc.text(`Pago: ${data.paymentMethod === "CASH" ? "EFECTIVO" : "TARJETA"}`, 5, y);
		y += 4;
		doc.text("-".repeat(32), 5, y);
		y += 5;
		data.items.forEach((item) => {
			doc.text(`${item.quantity} x ${item.productName}`, 5, y);
			doc.text(`$ ${item.totalPrice.toFixed(2)}`, 75, y, { align: "right" });
			y += 5;
			if (item.discountName && item.discountAmount && item.discountAmount > 0) {
				doc.setFontSize(6);
				doc.text(`  Desc. ${item.discountName}: -$${item.discountAmount.toFixed(2)}`, 8, y);
				y += 4;
				doc.setFontSize(8);
			}
		});
		doc.text("-".repeat(32), 5, y + 2);
		y += 6;
		doc.setFontSize(8);
		doc.text(`Subtotal:`, 5, y);
		doc.text(`$ ${data.subtotal.toFixed(2)}`, 75, y, { align: "right" });
		y += 5;
		if (data.discountTotal && data.discountTotal > 0) {
			doc.text(`Descuento:`, 5, y);
			doc.text(`-$${data.discountTotal.toFixed(2)}`, 75, y, { align: "right" });
			y += 5;
		}
		if (data.taxAmount > 0) {
			doc.text(`${data.taxType.toUpperCase()} (${(data.taxRate * 100).toFixed(1)}%):`, 5, y);
			doc.text(`$ ${data.taxAmount.toFixed(2)}`, 75, y, { align: "right" });
			y += 5;
		}
		doc.setFontSize(10);
		doc.text(`TOTAL:`, 5, y + 2);
		doc.text(`$ ${data.total.toFixed(2)}`, 75, y + 2, { align: "right" });
		y += 8;
		doc.setFontSize(7);
		doc.text(data.ticketFooter || "Gracias por su compra", 40, y, { align: "center" });
		return new Uint8Array(doc.output("arraybuffer"));
	}
	async generateCashCloseReport(data) {
		const doc = new jsPDF({
			unit: "mm",
			format: "a4"
		});
		let y = 20;
		doc.setFontSize(16);
		doc.text("Reporte de Cierre de Caja", 14, y);
		y += 8;
		doc.setFontSize(10);
		doc.text(data.businessName, 14, y);
		y += 6;
		doc.setFontSize(8);
		doc.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, 14, y);
		y += 6;
		doc.text(`Caja #${data.registerId}`, 14, y);
		y += 5;
		doc.text(`Apertura: ${data.openDate.toLocaleString("es-PE")}`, 14, y);
		y += 5;
		doc.text(`Cierre: ${data.closeDate.toLocaleString("es-PE")}`, 14, y);
		y += 8;
		const leftX = 14;
		const rightX = 100;
		const rowH = 7;
		doc.setFontSize(9);
		[
			["Ventas Realizadas", String(data.salesCount)],
			["Ventas Efectivo", `$ ${data.cashSales.toFixed(2)}`],
			["Ventas Tarjeta", `$ ${data.cardSales.toFixed(2)}`]
		].forEach(([label, value]) => {
			doc.text(label, leftX, y);
			doc.text(value, rightX, y);
			y += rowH;
		});
		y += 4;
		doc.setDrawColor(100, 100, 100);
		doc.line(leftX, y, 190, y);
		y += 6;
		doc.setFontSize(10);
		doc.text("RESUMEN", leftX, y);
		y += 6;
		[
			["Fondo Inicial", `$ ${data.openingAmount.toFixed(2)}`],
			["Total Ventas", `$ ${data.totalSales.toFixed(2)}`],
			["Esperado (Fondo + Ventas)", `$ ${data.expectedCash.toFixed(2)}`],
			["Real (Declarado)", `$ ${data.realCash.toFixed(2)}`]
		].forEach(([label, value]) => {
			doc.text(label, leftX, y);
			doc.text(value, rightX, y);
			y += rowH;
		});
		y += 3;
		doc.setDrawColor(100, 100, 100);
		doc.line(leftX, y, 190, y);
		y += 6;
		const diffLabel = data.difference >= 0 ? "SOBRANTE" : "FALTANTE";
		const diffColor = data.difference === 0 ? [
			0,
			128,
			0
		] : [
			200,
			0,
			0
		];
		doc.setTextColor(...diffColor);
		doc.setFontSize(12);
		doc.text(`${diffLabel}: $ ${Math.abs(data.difference).toFixed(2)}`, leftX, y);
		doc.setTextColor(0, 0, 0);
		y += 8;
		doc.setFontSize(8);
		doc.setTextColor(100, 100, 100);
		doc.text(`Estado: ${data.status === "PERFECT" ? "Cuadra Perfectamente" : data.status === "SURPLUS" ? "Sobrante detectado" : "Faltante detectado"}`, leftX, y);
		y += 6;
		doc.text(`Firma del responsable: _______________________________`, leftX, y);
		return new Uint8Array(doc.output("arraybuffer"));
	}
};
//#endregion
//#region src/infrastructure/reports/ExcelReportGenerator.ts
var ExcelReportGenerator = class {
	async generateSalesReport(rows, totals, title = "Reporte de Ventas", _showTable = true) {
		const workbook = new ExcelJS.Workbook();
		workbook.creator = "POS Venta SIS";
		workbook.created = /* @__PURE__ */ new Date();
		const sheet = workbook.addWorksheet("Ventas");
		sheet.mergeCells("A1:H1");
		const titleCell = sheet.getCell("A1");
		titleCell.value = title;
		titleCell.font = {
			size: 16,
			bold: true
		};
		sheet.getCell("A2").value = `Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`;
		sheet.getCell("A2").font = {
			size: 10,
			italic: true
		};
		sheet.columns = [
			{
				header: "Fecha",
				key: "date",
				width: 14
			},
			{
				header: "# Factura",
				key: "invoiceNumber",
				width: 12
			},
			{
				header: "Cliente",
				key: "client",
				width: 30
			},
			{
				header: "Items",
				key: "itemsCount",
				width: 8
			},
			{
				header: "Subtotal",
				key: "subtotal",
				width: 14
			},
			{
				header: "Impuesto",
				key: "tax",
				width: 14
			},
			{
				header: "Total",
				key: "total",
				width: 14
			},
			{
				header: "Pago",
				key: "paymentMethod",
				width: 16
			}
		];
		const headerRow = sheet.getRow(4);
		headerRow.font = {
			bold: true,
			color: { argb: "FFFFFFFF" }
		};
		headerRow.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF2980B9" }
		};
		headerRow.alignment = { horizontal: "center" };
		rows.forEach((r) => {
			sheet.addRow({
				date: r.date,
				invoiceNumber: r.invoiceNumber,
				client: r.client,
				itemsCount: r.itemsCount,
				subtotal: r.subtotal,
				tax: r.tax,
				total: r.total,
				paymentMethod: r.paymentMethod
			});
		});
		const dataStartRow = 5;
		const dataEndRow = dataStartRow + rows.length - 1;
		sheet.addRow({});
		const summaryRow = sheet.addRow({
			date: "TOTALES",
			itemsCount: totals.totalSales,
			subtotal: { formula: `SUM(E${dataStartRow}:E${dataEndRow})` },
			tax: { formula: `SUM(F${dataStartRow}:F${dataEndRow})` },
			total: { formula: `SUM(G${dataStartRow}:G${dataEndRow})` }
		});
		summaryRow.font = { bold: true };
		summaryRow.getCell(1).font = {
			bold: true,
			size: 11
		};
		const avgRow = sheet.addRow({
			date: "Promedio",
			total: totals.averageSale
		});
		avgRow.font = { italic: true };
		if (totals.cashSales !== void 0 || totals.cardSales !== void 0) {
			sheet.addRow({});
			sheet.addRow({
				date: "Efectivo",
				itemsCount: totals.cashSales ?? 0,
				total: totals.cashRevenue ?? 0
			});
			sheet.addRow({
				date: "Tarjeta",
				itemsCount: totals.cardSales ?? 0,
				total: totals.cardRevenue ?? 0
			});
		}
		const buffer = await workbook.xlsx.writeBuffer();
		return new Uint8Array(buffer);
	}
	async generateInventoryReport(rows, metrics, title = "Reporte de Inventario") {
		const workbook = new ExcelJS.Workbook();
		workbook.creator = "POS Venta SIS";
		workbook.created = /* @__PURE__ */ new Date();
		const sheet = workbook.addWorksheet("Inventario");
		sheet.mergeCells("A1:H1");
		const titleCell = sheet.getCell("A1");
		titleCell.value = title;
		titleCell.font = {
			size: 16,
			bold: true
		};
		sheet.getCell("A2").value = `Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`;
		sheet.getCell("A2").font = {
			size: 10,
			italic: true
		};
		sheet.columns = [
			{
				header: "SKU",
				key: "sku",
				width: 16
			},
			{
				header: "Producto",
				key: "name",
				width: 35
			},
			{
				header: "Categoría",
				key: "category",
				width: 20
			},
			{
				header: "Stock",
				key: "stock",
				width: 10
			},
			{
				header: "Stock Min",
				key: "minStock",
				width: 12
			},
			{
				header: "P. Compra",
				key: "purchasePrice",
				width: 14
			},
			{
				header: "P. Venta",
				key: "salePrice",
				width: 14
			},
			{
				header: "Estado",
				key: "status",
				width: 14
			}
		];
		const headerRow = sheet.getRow(4);
		headerRow.font = {
			bold: true,
			color: { argb: "FFFFFFFF" }
		};
		headerRow.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF27AE60" }
		};
		headerRow.alignment = { horizontal: "center" };
		rows.forEach((r) => {
			const statusCell = sheet.addRow({
				sku: r.sku,
				name: r.name,
				category: r.category,
				stock: r.stock,
				minStock: r.minStock ?? "-",
				purchasePrice: r.purchasePrice,
				salePrice: r.salePrice,
				status: r.status === "ok" ? "OK" : r.status === "low" ? "Stock Bajo" : "Sin Stock"
			}).getCell(8);
			if (r.status === "out") statusCell.font = {
				color: { argb: "FFFF0000" },
				bold: true
			};
			else if (r.status === "low") statusCell.font = {
				color: { argb: "FFFFA500" },
				bold: true
			};
			else statusCell.font = { color: { argb: "FF008000" } };
		});
		sheet.addRow({});
		const summaryRow = sheet.addRow({
			sku: "RESUMEN",
			stock: metrics.totalProducts,
			purchasePrice: metrics.totalPurchaseValue,
			salePrice: metrics.totalSaleValue
		});
		summaryRow.font = { bold: true };
		sheet.addRow({
			sku: "Con Stock",
			stock: metrics.productsWithStock
		});
		sheet.addRow({
			sku: "Sin Stock",
			stock: metrics.productsWithoutStock
		});
		sheet.addRow({
			sku: "Stock Bajo",
			stock: metrics.lowStockProducts
		});
		const buffer = await workbook.xlsx.writeBuffer();
		return new Uint8Array(buffer);
	}
	async generateSaleReceipt(data) {
		const workbook = new ExcelJS.Workbook();
		workbook.creator = "POS Venta SIS";
		workbook.created = /* @__PURE__ */ new Date();
		const sheet = workbook.addWorksheet("Comprobante");
		sheet.mergeCells("A1:D1");
		const titleCell = sheet.getCell("A1");
		titleCell.value = `${data.businessName} - Ticket #${data.saleId}`;
		titleCell.font = {
			size: 14,
			bold: true
		};
		sheet.getCell("A2").value = `Fecha: ${data.createdAt.toLocaleString("es-PE")}`;
		sheet.getCell("A2").font = {
			size: 10,
			italic: true
		};
		sheet.getCell("A3").value = `Cliente: ${data.clientName}`;
		sheet.getCell("A4").value = `Pago: ${data.paymentMethod === "CASH" ? "EFECTIVO" : "TARJETA"}`;
		sheet.columns = [
			{
				header: "Cant.",
				key: "quantity",
				width: 8
			},
			{
				header: "Producto",
				key: "productName",
				width: 35
			},
			{
				header: "P. Unit.",
				key: "unitPrice",
				width: 14
			},
			{
				header: "Total",
				key: "totalPrice",
				width: 14
			}
		];
		const headerRow = sheet.getRow(6);
		headerRow.font = {
			bold: true,
			color: { argb: "FFFFFFFF" }
		};
		headerRow.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF2980B9" }
		};
		data.items.forEach((item) => {
			sheet.addRow({
				quantity: item.quantity,
				productName: item.productName,
				unitPrice: item.unitPrice,
				totalPrice: item.totalPrice
			});
		});
		const summaryRow = 6 + data.items.length + 1;
		sheet.addRow({});
		sheet.getCell(`A${summaryRow + 1}`).value = "Subtotal:";
		sheet.getCell(`D${summaryRow + 1}`).value = data.subtotal;
		sheet.getCell(`D${summaryRow + 1}`).numFmt = "#,##0.00";
		if (data.taxAmount > 0) {
			sheet.getCell(`A${summaryRow + 2}`).value = `${data.taxType.toUpperCase()} (${(data.taxRate * 100).toFixed(1)}%):`;
			sheet.getCell(`D${summaryRow + 2}`).value = data.taxAmount;
			sheet.getCell(`D${summaryRow + 2}`).numFmt = "#,##0.00";
		}
		const totalRow = data.taxAmount > 0 ? summaryRow + 3 : summaryRow + 2;
		sheet.getCell(`A${totalRow}`).value = "TOTAL:";
		sheet.getCell(`A${totalRow}`).font = {
			bold: true,
			size: 12
		};
		sheet.getCell(`D${totalRow}`).value = data.total;
		sheet.getCell(`D${totalRow}`).font = {
			bold: true,
			size: 12
		};
		sheet.getCell(`D${totalRow}`).numFmt = "#,##0.00";
		const buffer = await workbook.xlsx.writeBuffer();
		return new Uint8Array(buffer);
	}
	async generateCashCloseReport(data) {
		const workbook = new ExcelJS.Workbook();
		workbook.creator = "POS Venta SIS";
		workbook.created = /* @__PURE__ */ new Date();
		const sheet = workbook.addWorksheet("Cierre de Caja");
		sheet.mergeCells("A1:B1");
		const titleCell = sheet.getCell("A1");
		titleCell.value = `${data.businessName} - Cierre de Caja #${data.registerId}`;
		titleCell.font = {
			size: 14,
			bold: true
		};
		sheet.getCell("A3").value = `Apertura: ${data.openDate.toLocaleString("es-PE")}`;
		sheet.getCell("A4").value = `Cierre: ${data.closeDate.toLocaleString("es-PE")}`;
		sheet.columns = [{
			header: "Concepto",
			key: "concept",
			width: 30
		}, {
			header: "Valor",
			key: "value",
			width: 20
		}];
		sheet.addRow({});
		const summaryHeaderRow = sheet.addRow({
			concept: "RESUMEN",
			value: ""
		});
		summaryHeaderRow.font = {
			bold: true,
			size: 11
		};
		[
			{
				concept: "Ventas Realizadas",
				value: data.salesCount
			},
			{
				concept: "Ventas Efectivo",
				value: data.cashSales
			},
			{
				concept: "Ventas Tarjeta",
				value: data.cardSales
			},
			{
				concept: "",
				value: ""
			},
			{
				concept: "Fondo Inicial",
				value: data.openingAmount
			},
			{
				concept: "Total Ventas",
				value: data.totalSales
			},
			{
				concept: "Esperado",
				value: data.expectedCash
			},
			{
				concept: "Real (Declarado)",
				value: data.realCash
			}
		].forEach((r) => {
			const row = sheet.addRow({
				concept: r.concept,
				value: typeof r.value === "number" ? r.value : r.value
			});
			if (typeof r.value === "number" && r.concept) row.getCell(2).numFmt = r.concept.includes("Realizadas") ? "#,##0" : "#,##0.00";
		});
		const diffRow = sheet.addRow({
			concept: data.difference >= 0 ? "SOBRANTE" : "FALTANTE",
			value: Math.abs(data.difference)
		});
		diffRow.font = {
			bold: true,
			size: 12,
			color: { argb: data.difference === 0 ? "FF008000" : "FFC80000" }
		};
		diffRow.getCell(2).numFmt = "#,##0.00";
		const buffer = await workbook.xlsx.writeBuffer();
		return new Uint8Array(buffer);
	}
};
//#endregion
//#region src/infrastructure/ai/OllamaAiProvider.ts
var DEFAULT_CONFIG = {
	baseUrl: process.env.IA_URL ?? "http://localhost:11434",
	model: "phi3:latest",
	timeoutMs: 3e4,
	maxRetries: 2,
	circuitBreakerThreshold: 3,
	circuitBreakerResetMs: 6e4
};
var OllamaAiProvider = class {
	config;
	consecutiveFailures = 0;
	circuitOpen = false;
	circuitOpenTime = 0;
	constructor(config) {
		this.config = {
			...DEFAULT_CONFIG,
			...config
		};
	}
	async generateResponse(prompt, systemContext) {
		return this.withCircuitBreaker(async () => {
			const body = JSON.stringify({
				model: this.config.model,
				prompt: `${systemContext}\n\nPregunta: ${prompt}\n\nRespuesta directa:`,
				stream: false,
				options: {
					temperature: .1,
					top_p: .9
				}
			});
			return (await this.fetchWithTimeout("/api/generate", body)).response.trim();
		}, "generateResponse");
	}
	async classifyIntent(prompt, examples) {
		return this.withCircuitBreaker(async () => {
			const body = JSON.stringify({
				model: this.config.model,
				prompt: `${examples}\n\nUsuario: ${prompt}\n\nJSON:`,
				stream: false,
				format: "json",
				options: {
					temperature: 0,
					top_p: .5
				}
			});
			const data = await this.fetchWithTimeout("/api/generate", body);
			const parsed = JSON.parse(data.response.trim());
			if (parsed && typeof parsed === "object" && parsed.intent) return parsed;
			return null;
		}, "classifyIntent");
	}
	async generateWithContext(prompt, systemPrompt, context) {
		return this.withCircuitBreaker(async () => {
			const fullPrompt = context ? `${systemPrompt}\n\n${context}\n\nPregunta: ${prompt}\n\nRespuesta:` : `${systemPrompt}\n\nPregunta: ${prompt}\n\nRespuesta:`;
			const body = JSON.stringify({
				model: this.config.model,
				prompt: fullPrompt,
				stream: false,
				options: {
					temperature: .2,
					top_p: .9
				}
			});
			return (await this.fetchWithTimeout("/api/generate", body)).response.trim();
		}, "generateWithContext");
	}
	async fetchWithTimeout(path, body) {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);
		try {
			const res = await fetch(`${this.config.baseUrl}${path}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body,
				signal: controller.signal
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(`Ollama responded with ${res.status}: ${text}`);
			}
			return await res.json();
		} finally {
			clearTimeout(timeoutId);
		}
	}
	async withCircuitBreaker(fn, operation) {
		if (this.circuitOpen) {
			const elapsed = Date.now() - this.circuitOpenTime;
			if (elapsed < this.config.circuitBreakerResetMs) {
				logger.warn({
					operation,
					remainingMs: this.config.circuitBreakerResetMs - elapsed
				}, "[Ollama] Circuit open, skipping");
				throw new OllamaCircuitBreakerError();
			}
			this.circuitOpen = false;
			this.consecutiveFailures = 0;
		}
		try {
			const result = await fn();
			this.consecutiveFailures = 0;
			return result;
		} catch (error) {
			if (error instanceof OllamaCircuitBreakerError) throw error;
			this.consecutiveFailures++;
			logger.error({
				err: error,
				operation,
				consecutiveFailures: this.consecutiveFailures
			}, "[Ollama] Request failed");
			if (this.consecutiveFailures >= this.config.circuitBreakerThreshold) {
				this.circuitOpen = true;
				this.circuitOpenTime = Date.now();
				logger.warn({ threshold: this.config.circuitBreakerThreshold }, "[Ollama] Circuit opened");
			}
			if (this.consecutiveFailures <= this.config.maxRetries) {
				logger.info({
					retry: this.consecutiveFailures,
					operation
				}, "[Ollama] Retrying");
				return this.withCircuitBreaker(fn, operation);
			}
			throw error;
		}
	}
	isAvailable() {
		return !this.circuitOpen;
	}
	getStats() {
		return {
			baseUrl: this.config.baseUrl,
			model: this.config.model,
			circuitOpen: this.circuitOpen,
			consecutiveFailures: this.consecutiveFailures,
			timeoutMs: this.config.timeoutMs
		};
	}
	resetCircuitBreaker() {
		this.circuitOpen = false;
		this.consecutiveFailures = 0;
		logger.info("[Ollama] Circuit breaker reset");
	}
};
var OllamaCircuitBreakerError = class extends Error {
	constructor() {
		super("Ollama circuit breaker is open");
		this.name = "OllamaCircuitBreakerError";
	}
};
//#endregion
//#region src/infrastructure/ai/reviewQueue.ts
var ReviewQueue = class {
	items = [];
	enqueue(draft) {
		this.items.push(draft);
	}
	dequeue(draftId) {
		const idx = this.items.findIndex((i) => i.draftId === draftId);
		if (idx === -1) return void 0;
		return this.items.splice(idx, 1)[0];
	}
	peek(draftId) {
		return this.items.find((i) => i.draftId === draftId);
	}
	listPending(types) {
		return this.items.filter((i) => i.status === "pending" && (!types || types.includes(i.type)));
	}
	approve(draftId, by) {
		const item = this.items.find((i) => i.draftId === draftId);
		if (!item) return void 0;
		item.status = "approved";
		item.reviewedAt = /* @__PURE__ */ new Date();
		item.reviewedBy = by;
		return item;
	}
	reject(draftId, reason, by) {
		const item = this.items.find((i) => i.draftId === draftId);
		if (!item) return void 0;
		item.status = "rejected";
		item.reviewedAt = /* @__PURE__ */ new Date();
		item.reviewedBy = by;
		item.reason = reason;
		return item;
	}
	getPending() {
		return this.items.filter((i) => i.status === "pending");
	}
	getHistory(limit) {
		const processed = this.items.filter((i) => i.status !== "pending");
		return limit ? processed.slice(0, limit) : processed;
	}
	size() {
		return this.items.length;
	}
};
//#endregion
//#region src/infrastructure/ai/aiAuditService.ts
var AiAuditService = class {
	trainingLogRepo;
	auditLogRepo;
	constructor(trainingLogRepo, auditLogRepo) {
		this.trainingLogRepo = trainingLogRepo;
		this.auditLogRepo = auditLogRepo;
	}
	async logDecision(decision) {
		await this.trainingLogRepo.create({
			usuario_id: Number(decision.reviewedBy) || 1,
			mensaje_usuario: JSON.stringify({
				draftId: decision.draftId,
				action: decision.action
			}),
			nlu_output: JSON.stringify(decision),
			respuesta_sistema: `Draft ${decision.action.toLowerCase()}d`
		});
		await this.auditLogRepo.create({
			action: `AI_DRAFT_${decision.action}`,
			entity: "AI_DRAFT",
			entityId: decision.draftId,
			details: `Draft ${decision.draftId} was ${decision.action.toLowerCase()}ed${decision.reason ? `: ${decision.reason}` : ""}`,
			userId: decision.reviewedBy || "system",
			createdAt: /* @__PURE__ */ new Date()
		});
	}
	async recordDraftConfirmed(type, _payload, userId) {
		await this.auditLogRepo.create({
			action: "AI_DRAFT_CONFIRMED",
			entity: type,
			details: `Draft confirmed by user ${userId ?? "unknown"}`,
			userId: String(userId ?? "system"),
			createdAt: /* @__PURE__ */ new Date()
		});
	}
	async recordDraftRejected(type, userId) {
		await this.auditLogRepo.create({
			action: "AI_DRAFT_REJECTED",
			entity: type,
			details: `Draft rejected by user ${userId ?? "unknown"}`,
			userId: String(userId ?? "system"),
			createdAt: /* @__PURE__ */ new Date()
		});
	}
};
//#endregion
//#region src/infrastructure/ai/validationPipeline.ts
var ValidationPipeline = class {
	reviewQueue;
	auditService;
	constructor(reviewQueue, auditService) {
		this.reviewQueue = reviewQueue;
		this.auditService = auditService;
	}
	async enqueueDraft(draft) {
		this.reviewQueue.enqueue({
			draftId: draft.id,
			status: "pending",
			type: draft.type,
			payload: draft.payload,
			createdAt: /* @__PURE__ */ new Date()
		});
	}
	async approveDraft(draftId, by) {
		if (!this.reviewQueue.approve(draftId, by)) return false;
		await this.auditService.logDecision({
			draftId,
			action: "APPROVE",
			reviewedBy: by,
			confidence: .9,
			timestamp: /* @__PURE__ */ new Date()
		});
		return true;
	}
	async rejectDraft(draftId, reason, by) {
		if (!this.reviewQueue.reject(draftId, reason, by)) return false;
		await this.auditService.logDecision({
			draftId,
			action: "REJECT",
			reason,
			reviewedBy: by,
			confidence: .9,
			timestamp: /* @__PURE__ */ new Date()
		});
		return true;
	}
	async getPendingDrafts(types) {
		return this.reviewQueue.listPending(types);
	}
	getReviewQueue() {
		return this.reviewQueue;
	}
	getAuditService() {
		return this.auditService;
	}
};
//#endregion
//#region src/shared/schemas.ts
var productSchema = z.object({
	sku: z.string().min(1, "El SKU es obligatorio."),
	name: z.string().min(1, "El nombre es obligatorio."),
	description: z.string().optional(),
	category_id: z.coerce.number().int().positive().optional().nullable(),
	supplier_id: z.coerce.number().int().positive().optional().nullable(),
	price_purchase: z.coerce.number().min(0, "El precio de compra no puede ser negativo."),
	price_sale: z.coerce.number().min(0, "El precio de venta no puede ser negativo."),
	stock: z.coerce.number().int().optional(),
	min_stock: z.coerce.number().int().min(0).optional().default(10)
});
var saleItemSchema = z.object({
	product_id: z.coerce.number().int().positive("El ID del producto es obligatorio."),
	quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
	unit_price: z.coerce.number().min(0, "El precio unitario no puede ser negativo."),
	discount_id: z.coerce.number().int().positive().optional()
});
var saleSchema = z.object({
	cash_register_id: z.coerce.number().int().positive("El ID de la caja es obligatorio."),
	client_id: z.coerce.number().int().optional(),
	client_dni: z.string().optional(),
	client_name: z.string().optional(),
	payment_method: z.enum(["CASH", "CARD"]).default("CASH"),
	items: z.array(saleItemSchema).min(1, "La venta debe tener al menos un producto.")
});
z.object({ opening_amount: z.coerce.number().min(0, "El monto de apertura no puede ser negativo.") });
z.object({
	register_id: z.coerce.number().int().positive("El ID de la caja es obligatorio."),
	closing_amount: z.coerce.number().min(0, "El monto de cierre no puede ser negativo.")
});
var clientSchema = z.object({
	dni: z.string().min(1, "El DNI/Documento es obligatorio."),
	name: z.string().min(1, "El nombre es obligatorio."),
	phone: z.string().optional().nullable(),
	code: z.string().min(1, "El código de cliente es obligatorio."),
	tax_id: z.string().optional().nullable()
});
var categorySchema = z.object({ name: z.string().min(1, "El nombre de la categoría es obligatorio.").max(255) });
z.object({
	product_id: z.coerce.number().int().positive("El ID del producto es obligatorio."),
	type: z.enum(["ENTRADA", "SALIDA"], { errorMap: () => ({ message: "El tipo debe ser ENTRADA o SALIDA." }) }),
	quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0.")
});
var supplierSchema = z.object({
	name: z.string().min(1, "El nombre del proveedor es obligatorio."),
	ruc: z.string().optional().nullable(),
	phone: z.string().optional().nullable(),
	email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
	address: z.string().optional().nullable()
});
z.object({
	name: z.string().min(1, "El nombre del proveedor es obligatorio.").optional(),
	ruc: z.string().optional().nullable(),
	phone: z.string().optional().nullable(),
	email: z.string().email("Email inválido").optional().nullable().or(z.literal("")),
	address: z.string().optional().nullable()
});
var purchaseItemSchema = z.object({
	product_id: z.coerce.number().int().positive("El ID del producto es obligatorio."),
	quantity: z.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
	unit_cost: z.coerce.number().min(0, "El costo unitario no puede ser negativo.")
});
var purchaseSchema = z.object({
	supplier_id: z.coerce.number().int().positive("El ID del proveedor es obligatorio."),
	items: z.array(purchaseItemSchema).min(1, "La orden debe tener al menos un producto."),
	payment_status: z.enum([
		"UNPAID",
		"PAID",
		"CANCELED"
	]).optional().default("UNPAID")
});
var userCreateSchema = z.object({
	username: z.string().min(1, "El nombre de usuario es obligatorio.").max(50),
	password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial").regex(/[A-Z]/, "Debe contener al menos una mayúscula").regex(/[a-z]/, "Debe contener al menos una minúscula").regex(/[0-9]/, "Debe contener al menos un número").regex(/[!@#$%^&*()_\-+=<>?/{}~|]/, "Debe contener al menos un carácter especial"),
	role: z.enum(["ADMIN", "VENDEDOR"], { errorMap: () => ({ message: "El rol debe ser ADMIN o VENDEDOR." }) }),
	question: z.string().optional(),
	answer: z.string().optional()
});
z.object({
	username: z.string().min(1, "El nombre de usuario es obligatorio.").max(50).optional(),
	role: z.enum(["ADMIN", "VENDEDOR"]).optional()
});
var discountSchema = z.object({
	name: z.string().min(1, "El nombre del descuento es obligatorio."),
	type: z.enum(["PERCENTAGE", "FIXED_AMOUNT"], { errorMap: () => ({ message: "El tipo debe ser PERCENTAGE o FIXED_AMOUNT." }) }),
	value: z.coerce.number().min(0, "El valor no puede ser negativo."),
	is_active: z.boolean().optional(),
	applicable_to: z.enum([
		"ALL",
		"CATEGORY",
		"SPECIFIC"
	]).optional(),
	category_id: z.coerce.number().int().positive().optional().nullable(),
	product_ids: z.array(z.coerce.number().int().positive()).optional(),
	min_purchase_amount: z.coerce.number().min(0).optional().nullable()
});
var aiChatSchema = z.object({ query: z.string().min(1, "La consulta no puede estar vacía.") });
var settingsSchema = z.record(z.enum([
	"business_name",
	"business_phone",
	"business_address",
	"business_tax_id",
	"ticket_footer",
	"business_logo",
	"exchange_rate_usd_ves",
	"tax_rate",
	"tax_type",
	"tax_included"
]), z.string()).refine((val) => Object.keys(val).length > 0, { message: "Debe enviar al menos una configuración." });
//#endregion
//#region src/backend/services/ProductService.ts
var ProductService = class {
	productRepo;
	categoryRepo;
	auditLogRepo;
	constructor(productRepo, categoryRepo, auditLogRepo) {
		this.productRepo = productRepo;
		this.categoryRepo = categoryRepo;
		this.auditLogRepo = auditLogRepo;
	}
	async getAllProducts(search, categoryId) {
		return this.productRepo.findAll(search, categoryId);
	}
	async getProductById(id) {
		const product = await this.productRepo.findById(id);
		if (!product) throw new NotFoundError("Producto");
		return product;
	}
	async getLowStockProducts(threshold) {
		return this.productRepo.findLowStock();
	}
	async createProduct(data, userId = 1) {
		const validated = productSchema.parse(data);
		if (await this.productRepo.findBySku(validated.sku)) throw new ConflictError(`El SKU ${validated.sku} ya se encuentra registrado.`);
		if (validated.category_id) {
			if (!await this.categoryRepo.findById(validated.category_id)) throw new NotFoundError("Categoría");
		}
		const initialStock = validated.stock || 0;
		const product = await this.productRepo.create(validated);
		if (initialStock > 0) await this.productRepo.createMovement({
			product_id: product.id,
			type: "ENTRADA",
			quantity: initialStock,
			reason: "INICIAL"
		});
		await this.auditLogRepo.create({
			userId,
			action: "CREATE_PRODUCT",
			entity: "products",
			entity_id: product.id
		});
		return {
			success: true,
			id: product.id
		};
	}
	async updateProduct(id, data, userId = 1) {
		const existingProduct = await this.productRepo.findById(id);
		if (!existingProduct) throw new NotFoundError("Producto");
		const validated = productSchema.parse(data);
		if (validated.sku !== existingProduct.sku) {
			if (await this.productRepo.findBySku(validated.sku)) throw new ConflictError(`El SKU ${validated.sku} ya se encuentra registrado.`);
		}
		if (validated.category_id) {
			if (!await this.categoryRepo.findById(validated.category_id)) throw new NotFoundError("Categoría");
		}
		const product = await this.productRepo.update(id, validated);
		await this.auditLogRepo.create({
			userId,
			action: "UPDATE_PRODUCT",
			entity: "products",
			entity_id: product.id
		});
		return {
			success: true,
			product
		};
	}
	async deleteProduct(id, userId = 1) {
		if (!await this.productRepo.findById(id)) throw new NotFoundError("Producto");
		const salesCount = await this.productRepo.getSalesCount(id);
		if (salesCount > 0) throw new BusinessRuleError(`No se puede eliminar el producto porque tiene ${salesCount} venta(s) asociada(s).`);
		await this.productRepo.delete(id);
		await this.auditLogRepo.create({
			userId,
			action: "DELETE_PRODUCT",
			entity: "products",
			entity_id: id
		});
		return { success: true };
	}
	async addStock(productId, quantity, userId = 1, reason = "AJUSTE") {
		if (!await this.productRepo.findById(productId)) throw new NotFoundError("Producto");
		if (quantity <= 0) throw new ValidationError("La cantidad debe ser mayor a cero.");
		await this.productRepo.updateStock(productId, quantity);
		await this.productRepo.createMovement({
			product_id: productId,
			type: "ENTRADA",
			quantity,
			reason
		});
		await this.auditLogRepo.create({
			userId,
			action: "STOCK_ENTRADA",
			entity: "products",
			entity_id: productId
		});
		return { success: true };
	}
	async removeStock(productId, quantity, userId = 1, reason = "AJUSTE") {
		const product = await this.productRepo.findById(productId);
		if (!product) throw new NotFoundError("Producto");
		if (quantity <= 0) throw new ValidationError("La cantidad debe ser mayor a cero.");
		if (product.stock < quantity) throw new BusinessRuleError(`Stock insuficiente. Stock actual: ${product.stock}, Cantidad solicitada: ${quantity}`);
		await this.productRepo.updateStock(productId, -quantity);
		const updated = await this.productRepo.findById(productId);
		if (updated && updated.stock < 0) throw new BusinessRuleError("Error interno: el stock no puede ser negativo");
		await this.productRepo.createMovement({
			product_id: productId,
			type: "SALIDA",
			quantity,
			reason
		});
		await this.auditLogRepo.create({
			userId,
			action: "STOCK_SALIDA",
			entity: "products",
			entity_id: productId
		});
		return { success: true };
	}
	async getInventoryMovements(productId, limit = 50) {
		if (!await this.productRepo.findById(productId)) throw new NotFoundError("Producto");
		return this.productRepo.getMovements(productId, limit);
	}
};
//#endregion
//#region src/backend/services/ClientService.ts
var ClientService = class {
	clientRepo;
	auditLogRepo;
	constructor(clientRepo, auditLogRepo) {
		this.clientRepo = clientRepo;
		this.auditLogRepo = auditLogRepo;
	}
	async getAllClients(search) {
		return this.clientRepo.findAll(search);
	}
	async getClientById(id) {
		return await findOrThrow(() => this.clientRepo.findById(id), "Cliente", id);
	}
	async createClient(data, userId = 1) {
		const validated = clientSchema.parse(data);
		if (await this.clientRepo.findByDni(validated.dni)) throw new ConflictError(`El DNI ${validated.dni} ya se encuentra registrado.`);
		if (await this.clientRepo.findByCode(validated.code)) throw new ConflictError(`El código ${validated.code} ya se encuentra registrado.`);
		if (validated.tax_id) {
			if (await this.clientRepo.findByTaxId(validated.tax_id)) throw new ConflictError(`El RUC ${validated.tax_id} ya se encuentra registrado.`);
		}
		const client = await this.clientRepo.create(validated);
		await this.auditLogRepo.create({
			userId,
			action: "CREATE_CLIENT",
			entity: "clients",
			entity_id: client.id
		});
		return {
			success: true,
			id: client.id
		};
	}
	async updateClient(id, data, userId = 1) {
		await findOrThrow(() => this.clientRepo.findById(id), "Cliente", id);
		const validated = clientSchema.parse(data);
		const existingDni = await this.clientRepo.findByDni(validated.dni);
		if (existingDni && existingDni.id !== id) throw new ConflictError(`El DNI ${validated.dni} ya se encuentra registrado.`);
		const existingCode = await this.clientRepo.findByCode(validated.code);
		if (existingCode && existingCode.id !== id) throw new ConflictError(`El código ${validated.code} ya se encuentra registrado.`);
		if (validated.tax_id) {
			const existingTaxId = await this.clientRepo.findByTaxId(validated.tax_id);
			if (existingTaxId && existingTaxId.id !== id) throw new ConflictError(`El RUC ${validated.tax_id} ya se encuentra registrado.`);
		}
		const client = await this.clientRepo.update(id, validated);
		await this.auditLogRepo.create({
			userId,
			action: "UPDATE_CLIENT",
			entity: "clients",
			entity_id: client.id
		});
		return {
			success: true,
			client
		};
	}
	async deleteClient(id, userId = 1) {
		await findOrThrow(() => this.clientRepo.findById(id), "Cliente", id);
		const salesCount = await this.clientRepo.getSalesCount(id);
		if (salesCount > 0) throw new BusinessRuleError(`No se puede eliminar el cliente porque tiene ${salesCount} venta(s) asociada(s).`);
		await this.clientRepo.delete(id);
		await this.auditLogRepo.create({
			userId,
			action: "DELETE_CLIENT",
			entity: "clients",
			entity_id: id
		});
		return { success: true };
	}
};
//#endregion
//#region src/backend/services/SaleService.ts
var SaleService = class {
	saleRepo;
	productRepo;
	clientRepo;
	cashRegisterRepo;
	settingsRepo;
	auditLogRepo;
	discountRepo;
	dashboardService;
	constructor(saleRepo, productRepo, clientRepo, cashRegisterRepo, settingsRepo, auditLogRepo, discountRepo, dashboardService) {
		this.saleRepo = saleRepo;
		this.productRepo = productRepo;
		this.clientRepo = clientRepo;
		this.cashRegisterRepo = cashRegisterRepo;
		this.settingsRepo = settingsRepo;
		this.auditLogRepo = auditLogRepo;
		this.discountRepo = discountRepo;
		this.dashboardService = dashboardService;
	}
	async getAllSales(startDate, endDate, clientId, cashRegisterId, page, pageSize) {
		const filter = {};
		if (startDate) filter.startDate = startDate;
		if (endDate) filter.endDate = endDate;
		if (clientId) filter.clientId = clientId;
		if (cashRegisterId) filter.cashRegisterId = cashRegisterId;
		if (page) filter.page = page;
		if (pageSize) filter.pageSize = pageSize;
		return this.saleRepo.findAll(filter);
	}
	async getSaleDetails(id) {
		const sale = await this.saleRepo.findById(id);
		if (!sale) throw new NotFoundError("Venta");
		return sale;
	}
	async getTodaySales() {
		return this.saleRepo.findToday();
	}
	async getSalesStats(startDate, endDate) {
		return this.saleRepo.getStats(startDate, endDate);
	}
	async getLastSale() {
		return this.saleRepo.findLast();
	}
	async registerSale(saleData, itemsData, userId = 1) {
		const validated = saleSchema.parse({
			...saleData,
			items: itemsData
		});
		if (!await this.cashRegisterRepo.findOpen()) throw new BusinessRuleError("La caja no está abierta o no existe.");
		let finalClientId = validated.client_id;
		if (validated.client_dni && validated.client_name && !finalClientId) {
			const existingClient = await this.clientRepo.findByDni(validated.client_dni);
			if (existingClient) finalClientId = existingClient.id;
			else finalClientId = (await this.clientRepo.create({
				dni: validated.client_dni,
				name: validated.client_name,
				code: `CLI-${Date.now()}`
			})).id;
		}
		if (finalClientId) {
			if (!await this.clientRepo.findById(finalClientId)) throw new NotFoundError("Cliente");
		}
		const productIds = validated.items.map((item) => item.product_id);
		const products = await this.productRepo.findByIds(productIds);
		const productMap = new Map(products.map((p) => [p.id, p]));
		for (const item of validated.items) {
			const product = productMap.get(item.product_id);
			if (!product) throw new NotFoundError(`Producto`, item.product_id);
			if (product.stock < item.quantity) throw new BusinessRuleError(`Stock insuficiente para "${product.name}". Stock actual: ${product.stock}, Cantidad solicitada: ${item.quantity}`);
		}
		const itemsWithPurchasePrice = await Promise.all(validated.items.map(async (item) => {
			const product = productMap.get(item.product_id);
			let discountAmount = 0;
			let finalUnitPrice = item.unit_price;
			let discountName = null;
			let discountType = null;
			let discountValue = null;
			if (item.discount_id) {
				const discount = await this.discountRepo.findById(item.discount_id);
				if (discount && discount.is_active) {
					discountName = discount.name;
					discountType = discount.type;
					discountValue = discount.value;
					const lineTotal = item.unit_price * item.quantity;
					if (discount.type === "PERCENTAGE") discountAmount = lineTotal * (discount.value / 100);
					else discountAmount = Math.min(discount.value, lineTotal);
					discountAmount = parseFloat(discountAmount.toFixed(2));
					finalUnitPrice = parseFloat(((lineTotal - discountAmount) / item.quantity).toFixed(2));
				}
			}
			return {
				product_id: item.product_id,
				quantity: item.quantity,
				unit_price: item.unit_price,
				purchase_price: product?.price_purchase || 0,
				discount_name: discountName,
				discount_type: discountType,
				discount_value: discountValue,
				discount_amount: discountAmount,
				final_unit_price: finalUnitPrice
			};
		}));
		const rawTotal = itemsWithPurchasePrice.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
		const totalDiscount = itemsWithPurchasePrice.reduce((acc, item) => acc + (item.discount_amount || 0), 0);
		const taxSettings = await this.settingsRepo.getTaxSettings();
		let subtotal = rawTotal - totalDiscount;
		subtotal = parseFloat(subtotal.toFixed(2));
		let taxAmount = 0;
		let total = subtotal;
		if (taxSettings.taxType !== "none" && taxSettings.taxRate > 0) {
			taxAmount = parseFloat((subtotal * taxSettings.taxRate).toFixed(2));
			total = parseFloat((subtotal + taxAmount).toFixed(2));
		}
		const registerInput = {
			cash_register_id: validated.cash_register_id,
			client_id: finalClientId || 1,
			subtotal,
			tax_amount: taxAmount,
			total,
			discount_total: totalDiscount,
			items: itemsWithPurchasePrice,
			payment_method: validated.payment_method,
			exchange_rate: saleData.exchange_rate || 0
		};
		const saleId = await this.saleRepo.registerSale(registerInput);
		this.dashboardService.invalidateCache();
		await this.auditLogRepo.create({
			userId,
			action: "CREATE_SALE",
			entity: "sales",
			entity_id: saleId
		});
		return {
			success: true,
			id: saleId
		};
	}
	async cancelSale(saleId, userId = 1) {
		if (!await this.saleRepo.findById(saleId)) throw new NotFoundError("Venta");
		await this.saleRepo.cancelSale(saleId);
		this.dashboardService.invalidateCache();
		await this.auditLogRepo.create({
			userId,
			action: "CANCEL_SALE",
			entity: "sales",
			entity_id: saleId
		});
		return { success: true };
	}
};
//#endregion
//#region src/backend/services/CashRegisterService.ts
var CashRegisterService = class {
	cashRegisterRepo;
	auditLogRepo;
	constructor(cashRegisterRepo, auditLogRepo) {
		this.cashRegisterRepo = cashRegisterRepo;
		this.auditLogRepo = auditLogRepo;
	}
	async getOpenRegister() {
		return this.cashRegisterRepo.findOpen();
	}
	async getAllRegisters(startDate, endDate) {
		return this.cashRegisterRepo.findAll(startDate, endDate);
	}
	async getRegisterDetails(id) {
		const register = await this.cashRegisterRepo.findById(id);
		if (!register) throw new NotFoundError("Caja");
		return register;
	}
	async openRegister(openingAmount, userId = 1) {
		if (isNaN(openingAmount) || openingAmount < 0) throw new ValidationError("El monto de apertura no puede ser negativo.");
		if (await this.cashRegisterRepo.findOpen()) throw new ConflictError("Ya hay una caja abierta para el día de hoy.");
		const cashRegister = await this.cashRegisterRepo.create(openingAmount);
		await this.auditLogRepo.create({
			userId,
			action: "OPEN_CASH_REGISTER",
			entity: "cash_registers",
			entity_id: cashRegister.id
		});
		return {
			success: true,
			id: cashRegister.id
		};
	}
	async closeRegister(registerId, closingAmount, userId = 1) {
		if (isNaN(closingAmount) || closingAmount < 0) throw new ValidationError("El monto de cierre no puede ser negativo.");
		const register = await this.cashRegisterRepo.findById(registerId);
		if (!register) throw new NotFoundError("Caja");
		const expectedCash = Number(register.opening_amount) + Number(register.total_sales);
		const difference = Math.round((Number(closingAmount) - expectedCash) * 100) / 100;
		const salesCount = await this.cashRegisterRepo.getSalesCount(register.id, register.opened_at);
		const status = difference === 0 ? "PERFECT" : difference > 0 ? "SURPLUS" : "MISSING";
		await this.cashRegisterRepo.close(register.id, Number(closingAmount), difference, status);
		await this.auditLogRepo.create({
			userId,
			action: "CLOSE_CASH_REGISTER",
			entity: "cash_registers",
			entity_id: register.id
		});
		return {
			success: true,
			registerId: register.id,
			openingAmount: register.opening_amount,
			totalSales: register.total_sales,
			expectedCash,
			realCash: Number(closingAmount),
			difference,
			status,
			salesCount
		};
	}
	async getDailySummary(registerId) {
		return this.cashRegisterRepo.getDailySummary(registerId);
	}
};
//#endregion
//#region src/backend/services/SupplierService.ts
var SupplierService = class {
	supplierRepo;
	auditLogRepo;
	constructor(supplierRepo, auditLogRepo) {
		this.supplierRepo = supplierRepo;
		this.auditLogRepo = auditLogRepo;
	}
	async getAllSuppliers(search) {
		try {
			return await this.supplierRepo.findAll(search);
		} catch (error) {
			logger.error("Get all suppliers error:", error);
			throw new Error("Error al obtener proveedores");
		}
	}
	async getSupplierById(id) {
		try {
			const supplier = await this.supplierRepo.findById(id);
			if (!supplier) throw new NotFoundError("Proveedor");
			return supplier;
		} catch (error) {
			logger.error("Get supplier by ID error:", error);
			if (error.code === "P2025") throw new NotFoundError("Proveedor");
			throw error;
		}
	}
	async createSupplier(data, createdBy) {
		try {
			if (data.ruc) {
				if (await this.supplierRepo.findByRuc(data.ruc)) throw new ConflictError(`El RUC ${data.ruc} ya está registrado`);
			}
			const supplier = await this.supplierRepo.create(data);
			await this.auditLogRepo.create({
				userId: createdBy,
				action: "CREATE_SUPPLIER",
				entity: "suppliers",
				entity_id: supplier.id
			});
			return supplier;
		} catch (error) {
			logger.error("Create supplier error:", error);
			if (error.code === "P2002") throw new ConflictError("El RUC ya está en uso");
			throw error;
		}
	}
	async updateSupplier(id, data, updatedBy) {
		try {
			const existing = await this.supplierRepo.findById(id);
			if (!existing) throw new NotFoundError("Proveedor");
			if (data.ruc && data.ruc !== existing.ruc) {
				if (await this.supplierRepo.findByRuc(data.ruc)) throw new ConflictError(`El RUC ${data.ruc} ya está registrado`);
			}
			const supplier = await this.supplierRepo.update(id, data);
			await this.auditLogRepo.create({
				userId: updatedBy,
				action: "UPDATE_SUPPLIER",
				entity: "suppliers",
				entity_id: id
			});
			return supplier;
		} catch (error) {
			logger.error("Update supplier error:", error);
			if (error.code === "P2025") throw new NotFoundError("Proveedor");
			throw error;
		}
	}
	async deleteSupplier(id, deletedBy) {
		try {
			if (!await this.supplierRepo.findById(id)) throw new NotFoundError("Proveedor");
			if (await this.supplierRepo.hasProducts(id)) throw new BusinessRuleError("No se puede eliminar el proveedor porque tiene producto(s) asociado(s)");
			if (await this.supplierRepo.hasPurchases(id)) throw new BusinessRuleError("No se puede eliminar el proveedor porque tiene compra(s) asociada(s)");
			await this.supplierRepo.delete(id);
			await this.auditLogRepo.create({
				userId: deletedBy,
				action: "DELETE_SUPPLIER",
				entity: "suppliers",
				entity_id: id
			});
			return { success: true };
		} catch (error) {
			logger.error("Delete supplier error:", error);
			if (error.code === "P2025") throw new NotFoundError("Proveedor");
			throw error;
		}
	}
};
//#endregion
//#region src/backend/services/PurchaseService.ts
var PurchaseService = class {
	purchaseRepo;
	supplierRepo;
	productRepo;
	auditLogRepo;
	constructor(purchaseRepo, supplierRepo, productRepo, auditLogRepo) {
		this.purchaseRepo = purchaseRepo;
		this.supplierRepo = supplierRepo;
		this.productRepo = productRepo;
		this.auditLogRepo = auditLogRepo;
	}
	async getAllPurchases(supplierId, status) {
		try {
			return await this.purchaseRepo.findAll(supplierId, status);
		} catch (error) {
			logger.error("Get all purchases error:", error);
			throw new Error("Error al obtener compras");
		}
	}
	async getPurchaseById(id) {
		try {
			const purchase = await this.purchaseRepo.findById(id);
			if (!purchase) throw new NotFoundError("Compra");
			return purchase;
		} catch (error) {
			logger.error("Get purchase by ID error:", error);
			if (error.code === "P2025") throw new NotFoundError("Compra");
			throw error;
		}
	}
	async createPurchase(data, createdBy) {
		try {
			if (!await this.supplierRepo.findById(data.supplier_id)) throw new NotFoundError("Proveedor");
			const productIds = data.items.map((item) => item.product_id);
			if ((await this.productRepo.findByIds(productIds)).length !== productIds.length) throw new NotFoundError("Producto", "uno o más productos no existen");
			const purchase = await this.purchaseRepo.create(data);
			await this.auditLogRepo.create({
				userId: createdBy,
				action: "CREATE_PURCHASE",
				entity: "purchases",
				entity_id: purchase.id
			});
			return purchase;
		} catch (error) {
			logger.error("Create purchase error:", error);
			throw error;
		}
	}
	async receivePurchase(purchaseId, receivedBy) {
		try {
			await this.purchaseRepo.receive(purchaseId);
			await this.auditLogRepo.create({
				userId: receivedBy,
				action: "RECEIVE_PURCHASE",
				entity: "purchases",
				entity_id: purchaseId
			});
			return { success: true };
		} catch (error) {
			logger.error("Receive purchase error:", error);
			if (error.code === "P2025") throw new NotFoundError("Compra");
			throw error;
		}
	}
	async updatePaymentStatus(purchaseId, paymentStatus) {
		try {
			await this.purchaseRepo.updatePaymentStatus(purchaseId, paymentStatus);
			return { success: true };
		} catch (error) {
			logger.error("Update payment status error:", error);
			if (error.code === "P2025") throw new NotFoundError("Compra");
			throw error;
		}
	}
	async cancelPurchase(purchaseId, cancelledBy) {
		try {
			await this.purchaseRepo.cancel(purchaseId);
			await this.auditLogRepo.create({
				userId: cancelledBy,
				action: "CANCEL_PURCHASE",
				entity: "purchases",
				entity_id: purchaseId
			});
			return { success: true };
		} catch (error) {
			logger.error("Cancel purchase error:", error);
			if (error.code === "P2025") throw new NotFoundError("Compra");
			throw error;
		}
	}
};
//#endregion
//#region src/backend/services/SettingsService.ts
var SettingsService = class {
	settingsRepo;
	constructor(settingsRepo) {
		this.settingsRepo = settingsRepo;
	}
	async getSettings() {
		return this.settingsRepo.getAll();
	}
	async updateSettings(settings) {
		await this.settingsRepo.upsertMany(settings);
		return { success: true };
	}
	async getSetting(key, defaultValue = "") {
		return this.settingsRepo.get(key, defaultValue);
	}
	async getTaxSettings() {
		return this.settingsRepo.getTaxSettings();
	}
	async updateTaxSettings(taxRate, taxType, taxIncluded) {
		await this.settingsRepo.updateTaxSettings(taxRate, taxType, taxIncluded);
		return { success: true };
	}
};
//#endregion
//#region src/shared/validation.ts
var MIN_LENGTH = 8;
var UPPERCASE_RE = /[A-Z]/;
var LOWERCASE_RE = /[a-z]/;
var NUMBER_RE = /[0-9]/;
var SPECIAL_RE = /[!@#$%^&*()_\-+=<>?/{}~|]/;
var PASSWORD_ERROR = `La contraseña debe tener al menos ${MIN_LENGTH} caracteres, una mayúscula, un número y un carácter especial`;
function validatePassword(password) {
	if (password.length < MIN_LENGTH) return {
		valid: false,
		error: PASSWORD_ERROR
	};
	if (!UPPERCASE_RE.test(password)) return {
		valid: false,
		error: PASSWORD_ERROR
	};
	if (!LOWERCASE_RE.test(password)) return {
		valid: false,
		error: PASSWORD_ERROR
	};
	if (!NUMBER_RE.test(password)) return {
		valid: false,
		error: PASSWORD_ERROR
	};
	if (!SPECIAL_RE.test(password)) return {
		valid: false,
		error: PASSWORD_ERROR
	};
	return {
		valid: true,
		error: ""
	};
}
//#endregion
//#region src/backend/services/UserService.ts
var UserService = class {
	userRepo;
	auditLogRepo;
	constructor(userRepo, auditLogRepo) {
		this.userRepo = userRepo;
		this.auditLogRepo = auditLogRepo;
	}
	async getAllUsers() {
		try {
			return await this.userRepo.findAll();
		} catch (error) {
			logger.error("Get all users error:", error);
			throw new Error("Error al obtener usuarios");
		}
	}
	async getUserById(id) {
		try {
			const user = await this.userRepo.findById(id);
			if (!user) throw new NotFoundError("Usuario");
			return user;
		} catch (error) {
			logger.error("Get user by ID error:", error);
			if (error.code === "P2025") throw new NotFoundError("Usuario");
			throw error;
		}
	}
	async createUser(data, createdBy) {
		try {
			if (await this.userRepo.exists(data.username)) throw new ConflictError(`El usuario '${data.username}' ya existe`);
			const pwCheck = validatePassword(data.password);
			if (!pwCheck.valid) throw new ValidationError(pwCheck.error);
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(data.password, salt);
			let security_answer_hash;
			if (data.question && data.answer) {
				const answerSalt = await bcrypt.genSalt(10);
				security_answer_hash = await bcrypt.hash(data.answer.toLowerCase().trim(), answerSalt);
			}
			const user = await this.userRepo.create({
				username: data.username,
				password_hash: hashedPassword,
				role: data.role,
				security_question: data.question || null,
				security_answer_hash: security_answer_hash || null
			});
			await this.auditLogRepo.create({
				userId: createdBy,
				action: "CREATE_USER",
				entity: "users",
				entity_id: user.id
			});
			return user;
		} catch (error) {
			logger.error("Create user error:", error);
			if (error.code === "P2002") throw new ConflictError("El nombre de usuario ya está en uso");
			throw error;
		}
	}
	async updateUser(id, data, updatedBy) {
		try {
			if (data.username) {
				if (await this.userRepo.exists(data.username, id)) throw new ConflictError(`El usuario '${data.username}' ya existe`);
			}
			const user = await this.userRepo.update(id, data);
			await this.auditLogRepo.create({
				userId: updatedBy,
				action: "UPDATE_USER",
				entity: "users",
				entity_id: id
			});
			return user;
		} catch (error) {
			logger.error("Update user error:", error);
			if (error.code === "P2025") throw new NotFoundError("Usuario");
			throw error;
		}
	}
	async deleteUser(id, deletedBy) {
		try {
			if (!await this.userRepo.findById(id)) throw new NotFoundError("Usuario");
			if (id === deletedBy) throw new BusinessRuleError("No puedes eliminar tu propio usuario");
			await this.userRepo.delete(id);
			await this.auditLogRepo.create({
				userId: deletedBy,
				action: "DELETE_USER",
				entity: "users",
				entity_id: id
			});
			return { success: true };
		} catch (error) {
			logger.error("Delete user error:", error);
			if (error.code === "P2025") throw new NotFoundError("Usuario");
			throw error;
		}
	}
	async changePassword(userId, newPassword, changedBy) {
		try {
			const pwCheck = validatePassword(newPassword);
			if (!pwCheck.valid) throw new ValidationError(pwCheck.error);
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(newPassword, salt);
			await this.userRepo.update(userId, { password_hash: hashedPassword });
			await this.auditLogRepo.create({
				userId: changedBy,
				action: "CHANGE_PASSWORD",
				entity: "users",
				entity_id: userId
			});
			return { success: true };
		} catch (error) {
			logger.error("Change password error:", error);
			if (error.code === "P2025") throw new NotFoundError("Usuario");
			throw error;
		}
	}
};
//#endregion
//#region src/backend/services/AuthService.ts
var MAX_ATTEMPTS = 5;
var LOCKOUT_MS = 900 * 1e3;
var recoveryTokens = /* @__PURE__ */ new Map();
var AuthService = class {
	userRepo;
	constructor(userRepo) {
		this.userRepo = userRepo;
	}
	async getSecurityQuestion(username) {
		try {
			const user = await this.userRepo.findByUsername(username);
			if (!user || !user.security_question) return {
				success: false,
				error: "Usuario no encontrado o no tiene pregunta de seguridad configurada"
			};
			return {
				success: true,
				question: user.security_question
			};
		} catch (error) {
			logger.error({ err: error }, "Get security question error");
			return {
				success: false,
				error: "Error interno del servidor"
			};
		}
	}
	async verifySecurityAnswer(username, answer) {
		try {
			const user = await this.userRepo.findByUsername(username);
			if (!user || !user.security_answer_hash) return {
				success: false,
				error: "Usuario no encontrado o no tiene pregunta de seguridad configurada"
			};
			if (!await bcrypt.compare(answer.toLowerCase().trim(), user.security_answer_hash)) return {
				success: false,
				error: "Respuesta incorrecta"
			};
			const token = crypto.randomUUID();
			recoveryTokens.set(token, {
				username,
				expiresAt: Date.now() + 600 * 1e3
			});
			return {
				success: true,
				token
			};
		} catch (error) {
			logger.error({ err: error }, "Verify security answer error");
			return {
				success: false,
				error: "Error interno del servidor"
			};
		}
	}
	async resetPassword(token, newPassword) {
		const session = recoveryTokens.get(token);
		if (!session || session.expiresAt < Date.now()) {
			recoveryTokens.delete(token);
			return {
				success: false,
				error: "Token inválido o expirado"
			};
		}
		const pwCheck = validatePassword(newPassword);
		if (!pwCheck.valid) return {
			success: false,
			error: pwCheck.error
		};
		try {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(newPassword, salt);
			await this.userRepo.updateByUsername(session.username, { password_hash: hashedPassword });
			recoveryTokens.delete(token);
			return { success: true };
		} catch (error) {
			logger.error({ err: error }, "Reset password error");
			return {
				success: false,
				error: "Error interno del servidor"
			};
		}
	}
	async setSecurityQuestion(userId, question, answer) {
		try {
			const salt = await bcrypt.genSalt(10);
			const hashedAnswer = await bcrypt.hash(answer.toLowerCase().trim(), salt);
			await this.userRepo.update(userId, {
				security_question: question,
				security_answer_hash: hashedAnswer
			});
			return { success: true };
		} catch (error) {
			logger.error({ err: error }, "Set security question error");
			return {
				success: false,
				error: "Error interno del servidor"
			};
		}
	}
	async login(username, password) {
		try {
			const user = await this.userRepo.findByUsername(username);
			if (!user) return {
				success: false,
				error: "Usuario no encontrado"
			};
			const now = Date.now();
			if (user.locked_until && new Date(user.locked_until).getTime() > now) {
				const remainingMs = new Date(user.locked_until).getTime() - now;
				const minutes = Math.ceil(remainingMs / 6e4);
				return {
					success: false,
					error: `Demasiados intentos. Bloqueado por ${minutes} minuto${minutes > 1 ? "s" : ""}`,
					remainingAttempts: 0,
					locked: true,
					lockoutRemainingMs: remainingMs
				};
			}
			if (user.failed_attempts >= MAX_ATTEMPTS) await this.userRepo.resetLoginAttempts(username);
			if (!await bcrypt.compare(password, user.password_hash)) {
				const newAttempts = user.failed_attempts + 1;
				const remaining = MAX_ATTEMPTS - newAttempts;
				if (newAttempts >= MAX_ATTEMPTS) {
					const lockedUntil = new Date(now + LOCKOUT_MS);
					await this.userRepo.updateLoginAttempts(username, newAttempts, lockedUntil);
					return {
						success: false,
						error: `Demasiados intentos. Bloqueado por 15 minutos`,
						remainingAttempts: 0,
						locked: true,
						lockoutRemainingMs: LOCKOUT_MS
					};
				}
				await this.userRepo.updateLoginAttempts(username, newAttempts, null);
				return {
					success: false,
					error: remaining > 0 ? `Contraseña incorrecta. Intentos restantes: ${remaining}` : "Contraseña incorrecta",
					remainingAttempts: remaining
				};
			}
			await this.userRepo.resetLoginAttempts(username);
			const { password_hash: _, ...userWithoutPassword } = user;
			return {
				success: true,
				user: userWithoutPassword
			};
		} catch (error) {
			logger.error({ err: error }, "Login error");
			if (error.code === "P2025") return {
				success: false,
				error: "Usuario no encontrado",
				remainingAttempts: 0
			};
			return {
				success: false,
				error: "Error interno del servidor"
			};
		}
	}
	async register(userData) {
		try {
			if (await this.userRepo.exists(userData.username)) return {
				success: false,
				error: `El usuario '${userData.username}' ya existe`
			};
			const pwCheck = validatePassword(userData.password);
			if (!pwCheck.valid) return {
				success: false,
				error: pwCheck.error
			};
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(userData.password, salt);
			let security_answer_hash;
			if (userData.security_question && userData.security_answer) {
				const answerSalt = await bcrypt.genSalt(10);
				security_answer_hash = await bcrypt.hash(userData.security_answer.toLowerCase().trim(), answerSalt);
			}
			const user = await this.userRepo.create({
				username: userData.username,
				password_hash: hashedPassword,
				role: userData.role,
				security_question: userData.security_question || null,
				security_answer_hash: security_answer_hash || null
			});
			return {
				success: true,
				user: {
					id: user.id,
					username: user.username,
					role: user.role,
					created_at: user.created_at,
					updated_at: user.updated_at
				}
			};
		} catch (error) {
			logger.error({ err: error }, "Register error");
			if (error.code === "P2002") return {
				success: false,
				error: "El nombre de usuario ya está en uso"
			};
			return {
				success: false,
				error: "Error interno del servidor: " + (error.message || String(error))
			};
		}
	}
	async changePassword(userId, oldPassword, newPassword) {
		try {
			const user = await this.userRepo.findByIdWithPassword(userId);
			if (!user) return {
				success: false,
				error: "Usuario no encontrado"
			};
			if (!await bcrypt.compare(oldPassword, user.password_hash)) return {
				success: false,
				error: "Contraseña actual incorrecta"
			};
			const pwCheck = validatePassword(newPassword);
			if (!pwCheck.valid) return {
				success: false,
				error: pwCheck.error
			};
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(newPassword, salt);
			await this.userRepo.update(userId, { password_hash: hashedPassword });
			return { success: true };
		} catch (error) {
			logger.error({ err: error }, "Change password error");
			return {
				success: false,
				error: "Error interno del servidor"
			};
		}
	}
};
//#endregion
//#region src/backend/services/CategoryService.ts
var CategoryService = class {
	categoryRepo;
	auditLogRepo;
	constructor(categoryRepo, auditLogRepo) {
		this.categoryRepo = categoryRepo;
		this.auditLogRepo = auditLogRepo;
	}
	async getAllCategories(search) {
		return await this.categoryRepo.findAll(search);
	}
	async getCategoryById(id) {
		return await findOrThrow(() => this.categoryRepo.findById(id), "Categoría", id);
	}
	async createCategory(data, createdBy) {
		if (await this.categoryRepo.findByName(data.name)) throw new ConflictError(`La categoría "${data.name}" ya existe.`);
		const category = await this.categoryRepo.create(data);
		await this.auditLogRepo.create({
			userId: createdBy,
			action: "CREATE_CATEGORY",
			entity: "categories",
			entity_id: category.id
		});
		return category;
	}
	async updateCategory(id, data, updatedBy) {
		await findOrThrow(() => this.categoryRepo.findById(id), "Categoría", id);
		const duplicate = await this.categoryRepo.findByName(data.name);
		if (duplicate && duplicate.id !== id) throw new ConflictError(`La categoría "${data.name}" ya existe.`);
		const category = await this.categoryRepo.update(id, data);
		await this.auditLogRepo.create({
			userId: updatedBy,
			action: "UPDATE_CATEGORY",
			entity: "categories",
			entity_id: id
		});
		return category;
	}
	async deleteCategory(id, deletedBy) {
		await findOrThrow(() => this.categoryRepo.findById(id), "Categoría", id);
		const productCount = await this.categoryRepo.getProductCount(id);
		if (productCount > 0) throw new BusinessRuleError(`No se puede eliminar la categoría porque tiene ${productCount} producto(s) asociado(s).`);
		await this.categoryRepo.delete(id);
		await this.auditLogRepo.create({
			userId: deletedBy,
			action: "DELETE_CATEGORY",
			entity: "categories",
			entity_id: id
		});
		return { success: true };
	}
};
//#endregion
//#region src/backend/services/BackupService.ts
var BackupService = class {
	adapter;
	constructor(adapter) {
		this.adapter = adapter;
	}
	async createBackup(label) {
		return this.adapter.createBackup(label);
	}
	async listBackups() {
		return this.adapter.listBackups();
	}
	async restoreBackup(backupPath) {
		return this.adapter.restoreBackup(backupPath);
	}
	async deleteBackup(backupPath) {
		return this.adapter.deleteBackup(backupPath);
	}
	async createScheduledBackup() {
		return this.adapter.createScheduledBackup();
	}
	async cleanupOldBackups(keep) {
		return this.adapter.cleanupOldBackups(keep);
	}
};
//#endregion
//#region src/backend/services/DashboardService.ts
var CACHE_KEY_STATS = "dashboard:stats";
var DashboardService = class {
	repo;
	cache;
	constructor(repo, cache) {
		this.repo = repo;
		this.cache = cache;
	}
	async getStats(startDate, endDate) {
		if (startDate || endDate) return this.repo.getStats(startDate, endDate);
		return this.cache.getOrSet(CACHE_KEY_STATS, () => this.repo.getStats());
	}
	async getWeeklySales(days) {
		return this.repo.getWeeklySales(days);
	}
	async getLowStockProducts(limit) {
		return this.repo.getLowStockProducts(limit);
	}
	async getSalesByPaymentMethod(startDate, endDate) {
		return this.repo.getSalesByPaymentMethod(startDate, endDate);
	}
	async getTopProducts(limit, startDate, endDate) {
		return this.repo.getTopProducts(limit, startDate, endDate);
	}
	async getTopClients(limit, startDate, endDate) {
		return this.repo.getTopClients(limit, startDate, endDate);
	}
	async getSalesByHour(startDate, endDate) {
		return this.repo.getSalesByHour(startDate, endDate);
	}
	async getCashRegisterSummary(startDate, endDate) {
		return this.repo.getCashRegisterSummary(startDate, endDate);
	}
	async getInventoryMetrics() {
		return this.repo.getInventoryMetrics();
	}
	async getLastSaleWithClient() {
		return this.repo.getLastSaleWithClient();
	}
	invalidateCache() {
		this.cache.invalidate();
	}
};
//#endregion
//#region src/backend/services/CacheService.ts
var CacheService = class {
	cache = /* @__PURE__ */ new Map();
	defaultTTL;
	constructor(defaultTTL = 3e4) {
		this.defaultTTL = defaultTTL;
	}
	async getOrSet(key, fn, ttl) {
		const now = Date.now();
		const effectiveTTL = ttl ?? this.defaultTTL;
		const entry = this.cache.get(key);
		if (entry && now - entry.timestamp < effectiveTTL) return entry.data;
		const data = await fn();
		this.cache.set(key, {
			data,
			timestamp: now
		});
		return data;
	}
	invalidate(key) {
		if (key) this.cache.delete(key);
		else this.cache.clear();
	}
	clear() {
		this.cache.clear();
	}
	get size() {
		return this.cache.size;
	}
};
//#endregion
//#region src/backend/services/ReportService.ts
var ReportService = class {
	pdfGenerator;
	excelGenerator;
	dashboardService;
	saleService;
	productService;
	cashRegisterService;
	settingsService;
	constructor(pdfGenerator, excelGenerator, dashboardService, saleService, productService, cashRegisterService, settingsService) {
		this.pdfGenerator = pdfGenerator;
		this.excelGenerator = excelGenerator;
		this.dashboardService = dashboardService;
		this.saleService = saleService;
		this.productService = productService;
		this.cashRegisterService = cashRegisterService;
		this.settingsService = settingsService;
	}
	async generateReport(request) {
		const generator = request.format === "pdf" ? this.pdfGenerator : this.excelGenerator;
		const title = request.title ?? this.getDefaultTitle(request.type);
		switch (request.type) {
			case "daily_sales": return this.generateSalesReport(generator, request, title, true);
			case "sales_summary": return this.generateSalesReport(generator, request, title, false);
			case "profit_summary": return this.generateProfitReport(generator, request, title);
			case "inventory": return this.generateInventoryReport(generator, false, title);
			case "low_stock": return this.generateInventoryReport(generator, true, title);
			case "top_products": return this.generateTopProductsReport(generator, request, title);
			case "sale_receipt": return this.generateSaleReceipt(request);
			case "cash_close": return this.generateCashCloseReport(generator, request, title);
		}
	}
	async generateSalesReport(generator, request, title, showTable = true) {
		const sales = await this.saleService.getAllSales(request.startDate, request.endDate);
		const stats = await this.saleService.getSalesStats(request.startDate, request.endDate);
		const paymentBreakdown = await this.dashboardService.getSalesByPaymentMethod(request.startDate, request.endDate);
		const cash = paymentBreakdown.find((p) => p.payment_method === "CASH");
		const card = paymentBreakdown.find((p) => p.payment_method === "CARD");
		const totals = {
			totalSales: stats.totalSales,
			totalRevenue: stats.totalRevenue,
			averageSale: stats.averageSale,
			cashSales: cash?._count?.id ?? 0,
			cashRevenue: cash?._sum?.total ?? 0,
			cardSales: card?._count?.id ?? 0,
			cardRevenue: card?._sum?.total ?? 0
		};
		const rows = sales.map((s) => {
			const date = s.created_at instanceof Date ? s.created_at : new Date(s.created_at);
			const saleWithCount = s;
			return {
				date: date.toLocaleDateString("es-PE"),
				invoiceNumber: s.id,
				client: s.client?.name ?? "N/A",
				itemsCount: saleWithCount._count?.items ?? 0,
				subtotal: Number(s.subtotal),
				tax: Number(s.tax_amount),
				total: Number(s.total),
				paymentMethod: s.payment_method ?? "N/A"
			};
		});
		return generator.generateSalesReport(rows, totals, title, showTable);
	}
	async generateProfitReport(generator, request, title) {
		const stats = await this.dashboardService.getStats(request.startDate, request.endDate);
		const totals = {
			totalSales: stats.totalSales,
			totalRevenue: stats.totalRevenue,
			averageSale: stats.averageSale
		};
		const rows = [{
			date: `${request.startDate?.toLocaleDateString("es-PE") ?? "Inicio"} - ${request.endDate?.toLocaleDateString("es-PE") ?? "Hoy"}`,
			invoiceNumber: 0,
			client: "-",
			itemsCount: 0,
			subtotal: 0,
			tax: 0,
			total: stats.totalRevenue,
			paymentMethod: "-"
		}];
		return generator.generateSalesReport(rows, totals, title);
	}
	async generateInventoryReport(generator, lowStockOnly, title) {
		const products = await this.productService.getAllProducts();
		const metrics = await this.dashboardService.getInventoryMetrics();
		const rows = (lowStockOnly ? products.filter((p) => p.stock <= (p.min_stock ?? 5) || p.stock === 0) : products).map((p) => ({
			sku: p.sku,
			name: p.name,
			category: p.category?.name ?? "Sin categoría",
			stock: p.stock,
			minStock: p.min_stock,
			purchasePrice: Number(p.price_purchase),
			salePrice: Number(p.price_sale),
			status: p.stock === 0 ? "out" : p.min_stock !== null && p.stock <= p.min_stock ? "low" : "ok"
		}));
		return generator.generateInventoryReport(rows, metrics, title);
	}
	async generateTopProductsReport(generator, request, title) {
		const topProducts = await this.dashboardService.getTopProducts(50, request.startDate, request.endDate);
		const metrics = await this.dashboardService.getInventoryMetrics();
		const rows = topProducts.map((p) => ({
			sku: p.product_sku,
			name: p.product_name,
			category: p.category,
			stock: p.total_quantity,
			minStock: null,
			purchasePrice: 0,
			salePrice: p.avg_price,
			status: "ok"
		}));
		return generator.generateInventoryReport(rows, metrics, title);
	}
	async generateSaleReceipt(request) {
		if (!request.saleId) throw new Error("Se requiere saleId para generar un comprobante");
		const sale = await this.saleService.getSaleDetails(request.saleId);
		const settings = await this.settingsService.getSettings();
		const items = (sale.items || []).map((item) => ({
			quantity: item.quantity,
			productName: item.product?.name ?? "Producto",
			unitPrice: Number(item.unit_price),
			totalPrice: Number(item.unit_price) * item.quantity,
			discountName: item.discount_name ?? null,
			discountAmount: item.discount_amount != null ? Number(item.discount_amount) : null,
			finalPrice: item.final_unit_price != null ? Number(item.final_unit_price) * item.quantity : null
		}));
		const taxSettings = await this.settingsService.getTaxSettings();
		const receiptData = {
			saleId: sale.id,
			businessName: settings.business_name || "INVENTARIO-POS",
			businessAddress: settings.business_address || "",
			businessPhone: settings.business_phone || "",
			businessTaxId: settings.business_tax_id || "",
			ticketFooter: settings.ticket_footer || "Gracias por su compra",
			logoBase64: settings.business_logo || void 0,
			clientName: sale.client?.name ?? "Cliente General",
			clientDni: sale.client?.dni ?? "",
			clientTaxId: sale.client?.tax_id ?? null,
			createdAt: sale.created_at,
			paymentMethod: sale.payment_method ?? "CASH",
			items,
			subtotal: Number(sale.subtotal),
			discountTotal: sale.discount_total != null ? Number(sale.discount_total) : void 0,
			taxAmount: Number(sale.tax_amount),
			taxType: taxSettings.taxType || "iva",
			taxRate: taxSettings.taxRate || 0,
			total: Number(sale.total)
		};
		return this.pdfGenerator.generateSaleReceipt(receiptData);
	}
	async generateCashCloseReport(generator, request, title) {
		if (!request.registerId) throw new Error("Se requiere registerId para generar reporte de cierre");
		const details = await this.cashRegisterService.getRegisterDetails(request.registerId);
		const settings = await this.settingsService.getSettings();
		const totalCash = details.sales?.filter((s) => s.payment_method === "CASH").reduce((sum, s) => sum + Number(s.total), 0) ?? 0;
		const totalCard = details.sales?.filter((s) => s.payment_method === "CARD").reduce((sum, s) => sum + Number(s.total), 0) ?? 0;
		const expectedCash = Number(details.opening_amount) + Number(details.total_sales);
		const cashCloseData = {
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
			status: details.status || "PERFECT",
			businessName: settings.business_name || "INVENTARIO-POS"
		};
		return generator.generateCashCloseReport(cashCloseData);
	}
	getDefaultTitle(type) {
		return {
			daily_sales: "Reporte de Ventas del Día",
			sales_summary: "Resumen de Ventas",
			profit_summary: "Reporte de Ganancias",
			inventory: "Reporte de Inventario",
			low_stock: "Productos con Stock Bajo",
			top_products: "Productos Más Vendidos",
			sale_receipt: "Comprobante de Venta",
			cash_close: "Reporte de Cierre de Caja"
		}[type] ?? "Reporte";
	}
};
//#endregion
//#region src/backend/services/SchedulerService.ts
var SCHEDULER_PREFIX = "scheduler_";
var SchedulerService = class {
	reportService;
	backupService;
	dailyTimer = null;
	weeklyTimer = null;
	statePath;
	constructor(reportService, backupService) {
		this.reportService = reportService;
		this.backupService = backupService;
		this.statePath = join$1(process.cwd(), "scheduler-state.json");
	}
	start() {
		logger.info("Starting scheduled tasks");
		this.scheduleDailyReport();
		this.scheduleWeeklyReport();
		this.scheduleDailyBackup();
	}
	stop() {
		if (this.dailyTimer) clearInterval(this.dailyTimer);
		if (this.weeklyTimer) clearInterval(this.weeklyTimer);
		logger.info("Stopped scheduled tasks");
	}
	scheduleDailyReport() {
		const runDaily = async () => {
			try {
				const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				if (this.getLastRun("daily_report") === today) return;
				logger.info("Generating daily report");
				await this.reportService.generateReport({
					type: "daily_sales",
					format: "pdf",
					title: `Reporte Diario - ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`
				});
				this.setLastRun("daily_report", today);
				logger.info("Daily report saved");
			} catch (err) {
				logger.error({ err }, "Error generating daily report");
			}
		};
		runDaily();
		this.dailyTimer = setInterval(runDaily, 3600 * 1e3);
	}
	scheduleWeeklyReport() {
		const runWeekly = async () => {
			try {
				const now = /* @__PURE__ */ new Date();
				const weekNum = this.getWeekNumber(now);
				if (this.getLastRun("weekly_report") === String(weekNum)) return;
				const startOfWeek = new Date(now);
				startOfWeek.setDate(now.getDate() - now.getDay());
				startOfWeek.setHours(0, 0, 0, 0);
				logger.info("Generating weekly report");
				await this.reportService.generateReport({
					type: "sales_summary",
					format: "pdf",
					startDate: startOfWeek,
					endDate: now,
					title: `Reporte Semanal - Semana ${weekNum}`
				});
				this.setLastRun("weekly_report", String(weekNum));
				logger.info("Weekly report saved");
			} catch (err) {
				logger.error({ err }, "Error generating weekly report");
			}
		};
		runWeekly();
		this.weeklyTimer = setInterval(runWeekly, 360 * 60 * 1e3);
	}
	scheduleDailyBackup() {
		const runBackup = async () => {
			try {
				const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				if (this.getLastRun("daily_backup") === today) return;
				logger.info("Creating daily backup");
				await this.backupService.createBackup(`auto-${today}`);
				this.setLastRun("daily_backup", today);
				logger.info("Daily backup created");
			} catch (err) {
				logger.error({ err }, "Error creating daily backup");
			}
		};
		runBackup();
		setInterval(runBackup, 3600 * 1e3);
	}
	getLastRun(key) {
		try {
			if (!existsSync$1(this.statePath)) return "";
			return JSON.parse(readFileSync$1(this.statePath, "utf-8"))[SCHEDULER_PREFIX + key] ?? "";
		} catch {
			return "";
		}
	}
	setLastRun(key, value) {
		try {
			let data = {};
			if (existsSync$1(this.statePath)) data = JSON.parse(readFileSync$1(this.statePath, "utf-8"));
			data[SCHEDULER_PREFIX + key] = value;
			writeFileSync$1(this.statePath, JSON.stringify(data, null, 2));
		} catch {}
	}
	getWeekNumber(date) {
		const startOfYear = new Date(date.getFullYear(), 0, 1);
		const diff = date.getTime() - startOfYear.getTime();
		return Math.ceil((diff / 864e5 + startOfYear.getDay() + 1) / 7);
	}
};
//#endregion
//#region src/backend/services/DiscountService.ts
var DiscountService = class {
	discountRepo;
	constructor(discountRepo) {
		this.discountRepo = discountRepo;
	}
	async getAllDiscounts(activeOnly) {
		return this.discountRepo.findAll(activeOnly);
	}
	async getDiscountById(id) {
		const discount = await this.discountRepo.findById(id);
		if (!discount) throw new NotFoundError("Descuento");
		return discount;
	}
	async createDiscount(data, userId = 1) {
		return {
			success: true,
			id: (await this.discountRepo.create(data)).id
		};
	}
	async updateDiscount(id, data) {
		await this.getDiscountById(id);
		return {
			success: true,
			discount: await this.discountRepo.update(id, data)
		};
	}
	async deleteDiscount(id) {
		await this.getDiscountById(id);
		await this.discountRepo.delete(id);
		return { success: true };
	}
	async getApplicableDiscounts(productId, totalAmount) {
		return this.discountRepo.findApplicableToProduct(productId, totalAmount);
	}
	calculateDiscount(product, discount, quantity) {
		const lineTotal = product.price_sale * quantity;
		let discountAmount;
		if (discount.type === "PERCENTAGE") discountAmount = lineTotal * (discount.value / 100);
		else discountAmount = Math.min(discount.value, lineTotal);
		discountAmount = parseFloat(discountAmount.toFixed(2));
		const finalLineTotal = lineTotal - discountAmount;
		return {
			finalUnitPrice: parseFloat((finalLineTotal / quantity).toFixed(2)),
			discountAmount
		};
	}
};
//#endregion
//#region src/backend/services/AiService.ts
var AiService = class {
	aiProvider;
	dashboardService;
	productService;
	clientService;
	aiTrainingLogRepo;
	neuralOrchestrator = null;
	unifiedQueryService = null;
	neuralEnabled = false;
	validationPipeline = null;
	constructor(aiProvider, dashboardService, productService, clientService, aiTrainingLogRepo) {
		this.aiProvider = aiProvider;
		this.dashboardService = dashboardService;
		this.productService = productService;
		this.clientService = clientService;
		this.aiTrainingLogRepo = aiTrainingLogRepo;
	}
	setNeuralOrchestrator(orchestrator) {
		this.neuralOrchestrator = orchestrator;
	}
	setUnifiedQueryService(service) {
		this.unifiedQueryService = service;
	}
	setValidationPipeline(pipeline) {
		this.validationPipeline = pipeline;
	}
	async enableNeuralClassifier() {
		if (!this.neuralOrchestrator) return false;
		const loaded = await this.neuralOrchestrator.isModelLoaded();
		this.neuralEnabled = loaded;
		if (loaded) logger.info("Neural classifier enabled");
		return loaded;
	}
	async processCommand(userInput) {
		let intent = null;
		let entities = {};
		if (this.unifiedQueryService) try {
			const uqs = await this.unifiedQueryService.query(userInput);
			if (uqs.source === "cache" || uqs.source === "neural") {
				intent = uqs.intent;
				uqs.confidence;
			}
		} catch {
			logger.warn("[AiService] UQS failed, falling back to neural");
		}
		if (!intent && this.neuralEnabled && this.neuralOrchestrator) try {
			const nn = await this.neuralOrchestrator.classify(userInput);
			if (nn.source === "neural" || nn.source === "cache") {
				intent = nn.intent;
				nn.confidence;
			}
		} catch {
			logger.warn("[AiService] Neural classifier failed");
		}
		if (!intent) {
			const llm = await this.classifyWithLLM(userInput);
			if (llm?.intent) {
				intent = llm.intent;
				entities = llm.entities ?? {};
			}
		}
		if (intent) return this.routeByIntent(intent, userInput, entities);
		return this.handleGeneralQuery(userInput);
	}
	async routeByIntent(intent, userInput, entities) {
		switch (intent) {
			case "product_query": return this.handleStockQuery(userInput);
			case "sales_summary": return this.handleSalesSummary(userInput);
			case "entity_count": {
				const q = userInput.toLowerCase();
				const type = entities?.entity_type || "";
				if (/proveedor/.test(q) || type.includes("proveedor") || type === "supplier") return this.handleSupplierCount();
				if (/categor/.test(q) || type.includes("categoria") || type === "category") return this.handleCategoryCount();
				if (/cliente/.test(q) || type.includes("cliente") || type === "client") return this.handleClientCount();
				if (/producto/.test(q) || type.includes("producto") || type === "product") return this.handleProductCount();
				return this.handleGeneralQuery(userInput);
			}
			case "entity_creation": return this.handleEntityCreation(userInput, entities);
			case "data_modification": return this.handleDataModification(entities);
			case "data_deletion": return this.handleDataDeletion(entities);
			case "sale_draft": return this.handleSaleDraft(userInput, entities);
			default: return this.handleGeneralQuery(userInput);
		}
	}
	async classifyWithLLM(input) {
		const prompt = `Eres un clasificador de intenciones para un sistema POS. Tu única tarea es elegir un intent y extraer entidades clave. NO generes texto libre, NO respondas preguntas, SOLO clasifica.

## REGLAS DE CLASIFICACIÓN

### 1. product_query — Consultas sobre productos existentes
- Preguntas por precio, stock, SKU, productos caros/baratos, poco stock, buscar productos
- Incluye: "cuanto vale", "precio del", "dame el producto mas ...", "productos con poco stock", busqueda por SKU
- NO incluye: crear productos nuevos, contar productos

### 2. entity_count — Preguntar cuántos existen
- "cuantos productos", "cuantas categorias", "cuantos clientes", "cuantos proveedores"
- Palabras clave: cuantos, cuantas, total, registrados, existen, hay
- entity_type puede ser: "product", "client", "category", "supplier"

### 3. entity_creation — Crear/registrar un nuevo producto o cliente
- Producto: menciona "producto", "precio de compra", "precio de venta", "sku"
- Cliente: menciona "cliente", "persona", "dni", "documento"
- entity_type: "product" o "client"
- SI menciona "cliente" o "persona" SIN precios de compra/venta → entity_type = "client"
- SI menciona "precio de compra" o "precio de venta" → entity_type = "product"
- NUNCA uses entity_creation para modificar o borrar

### 4. data_modification — Modificar/editar/actualizar datos existentes
- "modificar", "editar", "actualizar", "cambiar precio", "cambiar nombre"
- Este intent NO tiene handler real, solo clasifica para dar mensaje

### 5. data_deletion — Eliminar/borrar datos existentes
- "eliminar", "borrar", "quitar", "dar de baja", "remover"
- Este intent NO tiene handler real, solo clasifica para dar mensaje

### 6. sale_draft — Preparar un carrito de venta
- "vender", "comprar", "carrito", "prepara venta", "arma venta"
- Incluye producto(s) y opcionalmente cliente
- Entities: producto (string), cantidad (number), cliente (string opcional)

### 7. sales_summary — Resumen de ventas/ganancias
- "cuanto se vendio", "resumen de ventas", "ganancias", "ingresos", "ventas del dia"

### 8. general — Cualquier cosa que no encaje arriba
- Saludos, preguntas existenciales, consultas no relacionadas al POS

## FORMATO DE RESPUESTA
Siempre responde SOLO un JSON: {"intent":"...","entities":{...}}
Si no hay entidades relevantes, entities puede ser {} u omitirse.

## EJEMPLOS\n
product_query:
- cuales son los productos con poco stock → {"intent":"product_query","entities":{"query_type":"low_stock"}}
- quiero saber el producto mas caro → {"intent":"product_query","entities":{"query_type":"most_expensive"}}
- dame el precio del SKU BEB-001 → {"intent":"product_query","entities":{"query_type":"sku","sku":"BEB-001"}}
- cuanto vale el arroz → {"intent":"product_query"}
- cuales son los productos mas vendidos → {"intent":"product_query","entities":{"query_type":"top_sold"}}

entity_count:
- cuantos productos hay en total → {"intent":"entity_count","entities":{"entity_type":"product"}}
- cuantas categorias tengo → {"intent":"entity_count","entities":{"entity_type":"category"}}
- cuantos clientes registrados → {"intent":"entity_count","entities":{"entity_type":"client"}}
- cuantos proveedores existen → {"intent":"entity_count","entities":{"entity_type":"supplier"}}

entity_creation:
- registra un producto nuevo llamado te verde → {"intent":"entity_creation","entities":{"entity_type":"product","name":"Te verde"}}
- crea un cliente llamado juan perez con dni 12345678 → {"intent":"entity_creation","entities":{"entity_type":"client","name":"Juan Perez","dni":"12345678"}}
- registra un cliente nuevo maria lopez → {"intent":"entity_creation","entities":{"entity_type":"client","name":"Maria Lopez"}}
- crear producto castañas precio compra 1.30 precio venta 2 → {"intent":"entity_creation","entities":{"entity_type":"product","name":"Castañas","price_purchase":1.30,"price_sale":2}}

data_modification:
- modifica el precio del arroz → {"intent":"data_modification","entities":{"entity_type":"product","name":"arroz"}}
- actualiza el stock de la leche → {"intent":"data_modification","entities":{"entity_type":"product","name":"leche"}}
- cambiar nombre del cliente juan → {"intent":"data_modification","entities":{"entity_type":"client","name":"juan"}}

data_deletion:
- elimina el producto cafe → {"intent":"data_deletion","entities":{"entity_type":"product","name":"cafe"}}
- borrar cliente pedro → {"intent":"data_deletion","entities":{"entity_type":"client","name":"pedro"}}

sale_draft:
- vende 2 cafes a juan perez → {"intent":"sale_draft","entities":{"producto":"cafe","cantidad":2,"cliente":"juan perez"}}
- quiero comprar 3 arroz → {"intent":"sale_draft","entities":{"producto":"arroz","cantidad":3}}
- vende una leche a maria → {"intent":"sale_draft","entities":{"producto":"leche","cantidad":1,"cliente":"maria"}}
- prepara carrito con pan y mantequilla → {"intent":"sale_draft","entities":{"producto":"pan mantequilla","cantidad":1}}

sales_summary:
- cuanto se vendio ayer → {"intent":"sales_summary","entities":{"period":"yesterday"}}
- resumen de ventas de esta semana → {"intent":"sales_summary","entities":{"period":"week"}}
- dame las ganancias del dia → {"intent":"sales_summary"}

general:
- que productos estan por vencer → {"intent":"general"}
- quien compro la ultima venta → {"intent":"general"}
- hola como estas → {"intent":"general"}\n\nUsuario: ${input}\n\nJSON:`;
		const raw = await this.aiProvider.classifyIntent(input, prompt);
		if (!raw || typeof raw.intent !== "string") return null;
		return raw;
	}
	async askAssistant(query, userId) {
		const response = await this.processCommand(query);
		await this.logInteraction(query, response, userId);
		return response;
	}
	extractKeywords(input) {
		const stopWords = [
			"el",
			"la",
			"los",
			"las",
			"un",
			"una",
			"de",
			"del",
			"en",
			"con",
			"por",
			"para",
			"y",
			"e",
			"o",
			"a",
			"su",
			"que",
			"es",
			"se",
			"no",
			"lo",
			"como",
			"más",
			"pero",
			"sus",
			"le",
			"ya",
			"este",
			"entre",
			"porque",
			"cuando",
			"muy",
			"sin",
			"sobre",
			"también",
			"me",
			"mi",
			"tu",
			"te",
			"si",
			"nos",
			"les",
			"hay",
			"cual",
			"cuales",
			"dime",
			"busca",
			"encuentra",
			"saber",
			"puedes",
			"podrias",
			"quiero",
			"necesito"
		];
		return input.toLowerCase().replace(/[¿?¡!,.;:]/g, "").split(/\s+/).filter((w) => w.length > 1 && !stopWords.includes(w));
	}
	async handleSalesSummary(input) {
		const q = input.toLowerCase();
		if (/cliente\s+(que\s+)?(mas|más|top|mayor)\s+(compro|compró|gasto|gastó|compra)/i.test(q)) {
			const top = await this.dashboardService.getTopClients(1);
			if (top.length > 0) {
				const t = top[0];
				return {
					type: "TEXT",
					content: `🥇 **${t.client_name}** es el cliente que más compró hoy:\n• ${t.total_purchases} compras\n• Total: S/ ${t.total_spent.toFixed(2)}\n• Promedio: S/ ${t.avg_purchase.toFixed(2)} por compra`
				};
			}
			return {
				type: "TEXT",
				content: "No hay ventas con clientes registrados hoy."
			};
		}
		if (/a nombre de|comprador|cliente.*venta|quien.*compro|quien.*compró/i.test(q)) {
			const last = await this.dashboardService.getLastSaleWithClient();
			if (last?.client_name) return {
				type: "TEXT",
				content: `La última venta fue a nombre de **${last.client_name}**${last.client_dni ? ` (${last.client_dni})` : ""}.`
			};
			if ((await this.dashboardService.getStats()).todaySalesCount > 0) return {
				type: "TEXT",
				content: "La última venta del día no tiene cliente registrado (venta al mostrador)."
			};
			return {
				type: "TEXT",
				content: "No hay ventas registradas hoy."
			};
		}
		const stats = await this.dashboardService.getStats();
		const topProducts = await this.dashboardService.getTopProducts(3);
		const paymentMethods = await this.dashboardService.getSalesByPaymentMethod();
		if (stats.todaySalesCount === 0) return {
			type: "TEXT",
			content: `No hay ventas registradas hoy.

📊 Totales históricos — Ingresos: S/ ${stats.totalRevenue.toFixed(2)} | Ventas: ${stats.totalSales} | Ganancia: S/ ${stats.totalProfit.toFixed(2)}`
		};
		const top3 = topProducts.map((p, i) => `${i + 1}. ${p.product_name} (${p.total_quantity} uds)`).join("\n");
		const pagos = paymentMethods.map((m) => `${m.payment_method === "CASH" ? "Efectivo" : "Tarjeta"}: S/ ${(m._sum.total ?? 0).toFixed(2)}`).join(" | ");
		return {
			type: "TEXT",
			content: `📊 **Resumen de ventas - Hoy**
• Ingresos: S/ ${stats.todayRevenue.toFixed(2)}
• Transacciones: ${stats.todaySalesCount}
• Ganancia: S/ ${stats.todayProfit.toFixed(2)}
• Ticket promedio: S/ ${stats.averageSale.toFixed(2)}

🥇 **Top 3 productos:**
${top3}

💳 ${pagos}

📈 Totales históricos: S/ ${stats.totalRevenue.toFixed(2)} en ${stats.totalSales} ventas`
		};
	}
	async handleStockQuery(input) {
		const q = input.toLowerCase();
		if (/costoso|caro|precio.mas|mayor.precio|mas.caro/.test(q)) return this.handleMostExpensiveProduct();
		if (/barato|menor.precio|mas.barato|economico/.test(q)) return this.handleCheapestProduct();
		const skuMatch = q.match(/sku[\s]*[:]?[\s]*([\w-]+)/i);
		if (skuMatch) {
			const sku = skuMatch[1].toUpperCase();
			const found = (await this.productService.getAllProducts()).find((p) => p.sku.toUpperCase() === sku);
			if (found) return {
				type: "TEXT",
				content: `**${found.name}** (SKU: ${found.sku})
• Precio venta: **S/ ${found.price_sale.toFixed(2)}**
• Precio compra: S/ ${found.price_purchase.toFixed(2)}
• Stock: ${found.stock} unidades
• Stock mínimo: ${found.min_stock ?? 5}
• Categoría: ${found.category?.name ?? "Sin categoría"}`
			};
			return {
				type: "TEXT",
				content: `No encontré ningún producto con el SKU "${sku}".`
			};
		}
		const raw = q.replace(/[¿?¡!.,;:]/g, "").trim();
		const garbageWords = [
			"cuanto",
			"cuanta",
			"cuantos",
			"cuantas",
			"hay",
			"tengo",
			"dime",
			"busca",
			"encuentra",
			"saber",
			"puedes",
			"quiero",
			"necesito",
			"stock",
			"inventario",
			"producto",
			"productos",
			"precio",
			"precios",
			"cual",
			"cuales",
			"el",
			"la",
			"los",
			"las",
			"de",
			"del",
			"que",
			"me",
			"te",
			"se",
			"le",
			"un",
			"una",
			"con",
			"por",
			"para",
			"como",
			"mas",
			"pero",
			"tiene",
			"tienen",
			"esta",
			"este"
		];
		const searchTerm = raw.split(/\s+/).filter((w) => w.length > 2 && !garbageWords.includes(w)).join(" ");
		const allProducts = await this.productService.getAllProducts(searchTerm || raw);
		const found = allProducts.length > 0 ? allProducts : searchTerm ? (await this.productService.getAllProducts()).filter((p) => p.name.toLowerCase().includes(searchTerm) || p.sku.toLowerCase().includes(searchTerm)) : [];
		if (found.length === 0) return {
			type: "TEXT",
			content: `No encontré productos que coincidan con "${searchTerm || raw}".`
		};
		return {
			type: "TEXT",
			content: `Productos encontrados:\n${[...found].sort((a, b) => b.stock - a.stock).slice(0, 10).map((p) => `• ${p.name} — S/ ${p.price_sale.toFixed(2)} — Stock: ${p.stock}${p.stock <= (p.min_stock ?? 5) ? " ⚠️" : ""}`).join("\n")}`
		};
	}
	async handleMostExpensiveProduct() {
		const allProducts = await this.productService.getAllProducts();
		if (allProducts.length === 0) return {
			type: "TEXT",
			content: "No hay productos registrados en el inventario."
		};
		const top5 = [...allProducts].sort((a, b) => b.price_sale - a.price_sale).slice(0, 5);
		const maxProduct = top5[0];
		return {
			type: "TEXT",
			content: `El producto más costoso del inventario es **${maxProduct.name}** (SKU: ${maxProduct.sku}) con un precio de venta de **S/ ${maxProduct.price_sale.toFixed(2)}** (precio de compra: S/ ${maxProduct.price_purchase.toFixed(2)}). Stock actual: ${maxProduct.stock} unidades.

Otros productos de alto valor:
${top5.slice(1).map((p, i) => `${i + 2}. ${p.name} — S/ ${p.price_sale.toFixed(2)}`).join("\n")}`
		};
	}
	async handleCheapestProduct() {
		const allProducts = await this.productService.getAllProducts();
		if (allProducts.length === 0) return {
			type: "TEXT",
			content: "No hay productos registrados en el inventario."
		};
		const top5 = [...allProducts].sort((a, b) => a.price_sale - b.price_sale).slice(0, 5);
		const minProduct = top5[0];
		return {
			type: "TEXT",
			content: `El producto más económico del inventario es **${minProduct.name}** (SKU: ${minProduct.sku}) con un precio de venta de **S/ ${minProduct.price_sale.toFixed(2)}**. Stock actual: ${minProduct.stock} unidades.

Otros productos económicos:
${top5.slice(1).map((p, i) => `${i + 2}. ${p.name} — S/ ${p.price_sale.toFixed(2)}`).join("\n")}`
		};
	}
	async handleProductCount() {
		const products = await this.productService.getAllProducts();
		return {
			type: "TEXT",
			content: `📦 **${products.length} productos** en total.\n• Con stock: ${products.filter((p) => p.stock > 0).length}\n• Stock bajo: ${products.filter((p) => p.stock <= (p.min_stock ?? 5)).length}`
		};
	}
	async handleClientCount() {
		try {
			return {
				type: "TEXT",
				content: `👥 **${(await this.clientService.getAllClients()).length} clientes** registrados.`
			};
		} catch {
			return {
				type: "TEXT",
				content: "No se pudieron obtener los clientes."
			};
		}
	}
	async handleCategoryCount() {
		try {
			const { getContainer } = await Promise.resolve().then(() => registry_exports);
			return {
				type: "TEXT",
				content: `📂 **${(await getContainer().categoryService.getAllCategories()).length} categorías** registradas.`
			};
		} catch {
			return {
				type: "TEXT",
				content: "No se pudieron obtener las categorías."
			};
		}
	}
	async handleSupplierCount() {
		try {
			const { getContainer } = await Promise.resolve().then(() => registry_exports);
			return {
				type: "TEXT",
				content: `🏢 **${(await getContainer().supplierService.getAllSuppliers()).length} proveedores** registrados.`
			};
		} catch {
			return {
				type: "TEXT",
				content: "No se pudieron obtener los proveedores."
			};
		}
	}
	async handleEntityCreation(input, entities) {
		const q = input.toLowerCase();
		const entityType = (entities?.entity_type || "").toLowerCase();
		const extractProduct = () => {
			const name = q.match(/(?:llamado|llamada|nombre)\s+["""]?([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*?)(?:["""]?\s+(?:con|de|y|precio|un|una)|["""]?\s*$|,|\.)/i)?.[1]?.trim();
			if (!name || name.length <= 1) return null;
			const ppMatch = q.match(/precio\s*(?:de\s*)?compra\s*(?:de\s*)?(?:S\/|s\/|\$)?\s*([0-9]+(?:\.[0-9]+)?)/i);
			const pvMatch = q.match(/precio\s*(?:de\s*)?venta\s*(?:de\s*)?(?:S\/|s\/|\$)?\s*([0-9]+(?:\.[0-9]+)?)/i);
			return {
				action: "DRAFT_PRODUCT",
				payload: {
					name: name.charAt(0).toUpperCase() + name.slice(1),
					price_purchase: ppMatch ? parseFloat(ppMatch[1]) : 0,
					price_sale: pvMatch ? parseFloat(pvMatch[1]) : 0,
					stock: 0,
					min_stock: 5
				}
			};
		};
		const extractClient = () => {
			const dniMatch = q.match(/\b(\d{6,11})\b/);
			const clName = q.match(/(?:llamado|llamada|nombre|cliente|persona)\s+["""]?([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*?)(?:["""]?\s+(?:con|de|y|dni)|["""]?\s*$|,|\.)/i);
			if (!clName && !dniMatch) return null;
			return {
				action: "DRAFT_CLIENT",
				payload: {
					name: clName?.[1] ? clName[1].charAt(0).toUpperCase() + clName[1].slice(1) : "",
					dni: dniMatch?.[1] || "",
					phone: null
				}
			};
		};
		let draft = null;
		if (entityType.includes("cliente") || entityType === "client") draft = extractClient();
		else if (entityType.includes("producto") || entityType === "product") draft = extractProduct();
		if (!draft) if (/cliente|persona/.test(q) && !/precio/.test(q)) draft = extractClient();
		else if (!/cliente|persona/.test(q) || /precio|producto|sku/.test(q)) draft = extractProduct();
		else draft = extractClient();
		if (!draft) return {
			type: "TEXT",
			content: "No pude entender los datos para crear. Especifica nombre, precio de compra y precio de venta del producto, o nombre y DNI del cliente."
		};
		if (!this.validationPipeline) return {
			type: "ACTION",
			action: draft.action,
			payload: draft.payload
		};
		const rateCheck = this.validationPipeline.checkRateLimit();
		if (!rateCheck.allowed) return {
			type: "TEXT",
			content: `Límite de solicitudes alcanzado. Espera ${Math.ceil(rateCheck.resetMs / 1e3)}s antes de crear más.`
		};
		const processed = await this.validationPipeline.processDraft(draft.action, draft.payload, entities?.confidence ?? 0, void 0, "neural");
		if (processed.autoApproved) try {
			draft.action === "DRAFT_PRODUCT" ? await this.productService.createProduct(draft.payload) : (await this.clientService.createClient(draft.payload)).id;
			return {
				type: "TEXT",
				content: `✅ ${draft.action === "DRAFT_PRODUCT" ? "Producto" : "Cliente"} creado automáticamente (alta confianza).`
			};
		} catch {
			return {
				type: "TEXT",
				content: `No se pudo crear automáticamente. Revisa los datos en el formulario.`,
				draftId: processed.draft.id
			};
		}
		return {
			type: "ACTION",
			action: draft.action,
			payload: draft.payload,
			draftId: processed.draft.id,
			autoApproved: false
		};
	}
	handleDataModification(entities) {
		const entityType = (entities?.entity_type || "").toLowerCase();
		const name = entities?.name || "";
		if (entityType === "client" || entityType.includes("cliente")) return Promise.resolve({
			type: "TEXT",
			content: `Para modificar el cliente "${name}", ve a la sección Clientes y usa el botón Editar. El asistente IA solo puede consultar y crear datos, no modificarlos.`
		});
		return Promise.resolve({
			type: "TEXT",
			content: `Para modificar ${name ? `"${name}"` : "datos"}, ve a la sección correspondiente y usa el botón Editar. El asistente IA solo puede consultar y crear datos, no modificarlos.`
		});
	}
	handleDataDeletion(entities) {
		const entityType = (entities?.entity_type || "").toLowerCase();
		const name = entities?.name || "";
		if (entityType === "client" || entityType.includes("cliente")) return Promise.resolve({
			type: "TEXT",
			content: `Para eliminar al cliente "${name}", ve a la sección Clientes y usa el botón Eliminar. El asistente IA no puede borrar datos por seguridad.`
		});
		return Promise.resolve({
			type: "TEXT",
			content: `Para eliminar ${name ? `"${name}"` : "datos"}, ve a la sección correspondiente y usa el botón Eliminar. El asistente IA no puede borrar datos por seguridad.`
		});
	}
	async handleSaleDraft(input, entities) {
		const productName = typeof entities?.producto === "string" ? entities.producto.trim() : "";
		const clientName = typeof entities?.cliente === "string" ? entities.cliente.trim() : "";
		const quantity = typeof entities?.cantidad === "number" ? entities.cantidad : typeof entities?.cantidad === "string" ? parseInt(entities.cantidad, 10) || 0 : 0;
		if (productName || clientName) {
			const [clients, products] = await Promise.all([clientName ? this.clientService.getAllClients(clientName) : Promise.resolve([]), productName ? this.productService.getAllProducts(productName) : Promise.resolve([])]);
			if (clients.length === 0 && products.length === 0) return {
				type: "TEXT",
				content: clientName ? `No encontré "${clientName}" como cliente ni "${productName}" como producto.` : `No encontré ningún producto llamado "${productName}".`
			};
			return {
				type: "ACTION",
				action: "DRAFT_SALE",
				payload: {
					client_id: clients.length > 0 ? clients[0].id : null,
					client_name: clients.length > 0 ? clients[0].name : "",
					items: products.map((p) => ({
						product_id: p.id,
						product_name: p.name,
						quantity: quantity > 0 ? quantity : 1,
						unit_price: p.price_sale
					}))
				}
			};
		}
		const searchTerm = this.extractKeywords(input).join(" ");
		if (!searchTerm) return {
			type: "TEXT",
			content: "Especifica qué producto y/o cliente para armar el carrito. Ej: \"vende 2 cafes a juan perez\"."
		};
		const [clients, products] = await Promise.all([this.clientService.getAllClients(searchTerm), this.productService.getAllProducts(searchTerm)]);
		if (clients.length === 0 && products.length === 0) return {
			type: "TEXT",
			content: "No encontré clientes ni productos que coincidan con tu búsqueda."
		};
		return {
			type: "ACTION",
			action: "DRAFT_SALE",
			payload: {
				client_id: clients.length > 0 ? clients[0].id : null,
				client_name: clients.length > 0 ? clients[0].name : "",
				items: products.map((p) => ({
					product_id: p.id,
					product_name: p.name,
					quantity: 1,
					unit_price: p.price_sale
				}))
			}
		};
	}
	async logInteraction(query, response, userId) {
		if (!this.aiTrainingLogRepo || !userId) return;
		try {
			const nlu = response.type === "ACTION" ? JSON.stringify({
				intent: "entity_creation",
				action: response.action,
				payload: response.payload
			}) : null;
			await this.aiTrainingLogRepo.create({
				usuario_id: userId,
				mensaje_usuario: query,
				nlu_output: nlu,
				respuesta_sistema: response.type === "TEXT" ? response.content : `[ACTION: ${response.action}]`
			});
		} catch {}
	}
	async handleGeneralQuery(input) {
		const stats = await this.dashboardService.getStats();
		const products = await this.productService.getAllProducts();
		const q = input.toLowerCase();
		const masCaro = products.length > 0 ? [...products].sort((a, b) => b.price_sale - a.price_sale)[0] : null;
		const masBarato = products.length > 0 ? [...products].sort((a, b) => a.price_sale - b.price_sale)[0] : null;
		const lines = [];
		if (/producto|inventario/.test(q)) {
			lines.push(`📦 **${products.length} productos** en inventario.`);
			if (masCaro) lines.push(`💰 Más costoso: **${masCaro.name}** — S/ ${masCaro.price_sale.toFixed(2)}`);
			if (masBarato) lines.push(`💵 Más barato: **${masBarato.name}** — S/ ${masBarato.price_sale.toFixed(2)}`);
		}
		if (/venta|ganancia|ingreso/.test(q) || lines.length === 0) lines.push(`📊 Hoy: S/ ${stats.todayRevenue.toFixed(2)} ingresos, ${stats.todaySalesCount} ventas, S/ ${stats.todayProfit.toFixed(2)} ganancia.`);
		return {
			type: "TEXT",
			content: lines.join("\n")
		};
	}
};
//#endregion
//#region src/backend/services/AiMonitorService.ts
var AiMonitorService = class {
	unifiedQuery = null;
	setUnifiedQueryService(service) {
		this.unifiedQuery = service;
		logger.info("[AiMonitor] Service registered");
	}
	getSnapshot() {
		if (!this.unifiedQuery) return null;
		try {
			const stats = this.unifiedQuery.getStats();
			return {
				timestamp: (/* @__PURE__ */ new Date()).toISOString(),
				decisionStats: stats.decisionStats,
				llmStatus: {
					available: stats.llmStats.circuitOpen !== void 0 ? !stats.llmStats.circuitOpen : true,
					circuitOpen: stats.llmStats.circuitOpen ?? false,
					consecutiveFailures: stats.llmStats.consecutiveFailures ?? 0
				},
				ragStats: {
					documents: stats.ragStats.documents ?? 0,
					totalQueries: stats.ragStats.totalQueries ?? 0,
					hitRate: stats.ragStats.hitRate ?? 0
				},
				modelLoaded: stats.orchestratorStats.classifierInfo?.isLoaded ?? false,
				config: stats.config
			};
		} catch (error) {
			logger.error({ err: error }, "[AiMonitor] Failed to get snapshot");
			return null;
		}
	}
	getHistory(limit) {
		if (!this.unifiedQuery) return [];
		return this.unifiedQuery.getDecisionLogger().getHistory(limit);
	}
	getRecentErrors(limit = 10) {
		if (!this.unifiedQuery) return [];
		return this.unifiedQuery.getDecisionLogger().getRecentBySource("error", limit);
	}
	resetHistory() {
		if (!this.unifiedQuery) return;
		this.unifiedQuery.getDecisionLogger().clear();
		logger.info("[AiMonitor] History reset");
	}
	isAvailable() {
		return this.unifiedQuery !== null;
	}
};
//#endregion
//#region src/backend/di/container.ts
function buildContainer(prisma) {
	const productRepo = new PrismaProductRepository(prisma);
	const clientRepo = new PrismaClientRepository(prisma);
	const saleRepo = new PrismaSaleRepository(prisma);
	const cashRegisterRepo = new PrismaCashRegisterRepository(prisma);
	const supplierRepo = new PrismaSupplierRepository(prisma);
	const purchaseRepo = new PrismaPurchaseRepository(prisma);
	const settingsRepo = new PrismaSettingsRepository(prisma);
	const userRepo = new PrismaUserRepository(prisma);
	const categoryRepo = new PrismaCategoryRepository(prisma);
	const auditLogRepo = new PrismaAuditLogRepository(prisma);
	const dashboardRepo = new PrismaDashboardRepository(prisma);
	const discountRepo = new PrismaDiscountRepository(prisma);
	const movementRepo = new PrismaInventoryMovementRepository(prisma);
	const aiTrainingLogRepo = new PrismaAiTrainingLogRepository(prisma);
	const cacheService = new CacheService();
	const backupAdapter = new ElectronBackupService();
	const pdfReportGenerator = new PDFReportGenerator();
	const excelReportGenerator = new ExcelReportGenerator();
	const dashboardService = new DashboardService(dashboardRepo, cacheService);
	const productService = new ProductService(productRepo, categoryRepo, auditLogRepo);
	const clientService = new ClientService(clientRepo, auditLogRepo);
	const cashRegisterService = new CashRegisterService(cashRegisterRepo, auditLogRepo);
	const settingsService = new SettingsService(settingsRepo);
	const userService = new UserService(userRepo, auditLogRepo);
	const authService = new AuthService(userRepo);
	const supplierService = new SupplierService(supplierRepo, auditLogRepo);
	const purchaseService = new PurchaseService(purchaseRepo, supplierRepo, productRepo, auditLogRepo);
	const discountService = new DiscountService(discountRepo);
	const saleService = new SaleService(saleRepo, productRepo, clientRepo, cashRegisterRepo, settingsRepo, auditLogRepo, discountRepo, dashboardService);
	const backupService = new BackupService(backupAdapter);
	const categoryService = new CategoryService(categoryRepo, auditLogRepo);
	const reportService = new ReportService(pdfReportGenerator, excelReportGenerator, dashboardService, saleService, productService, cashRegisterService, settingsService);
	const schedulerService = new SchedulerService(reportService, backupService);
	const aiProvider = new OllamaAiProvider();
	const aiService = new AiService(aiProvider, dashboardService, productService, clientService, aiTrainingLogRepo);
	const aiMonitorService = new AiMonitorService();
	const aiAuditService = new AiAuditService(aiTrainingLogRepo, auditLogRepo);
	const validationPipeline = new ValidationPipeline(new ReviewQueue(), aiAuditService);
	aiService.setValidationPipeline(validationPipeline);
	return {
		prisma,
		userRepo,
		productService,
		clientService,
		saleService,
		cashRegisterService,
		settingsService,
		userService,
		authService,
		supplierService,
		purchaseService,
		categoryService,
		dashboardService,
		backupService,
		reportService,
		schedulerService,
		discountService,
		cacheService,
		movementRepo,
		aiTrainingLogRepo,
		aiProvider,
		aiService,
		aiMonitorService,
		aiAuditService,
		validationPipeline
	};
}
//#endregion
//#region src/backend/di/registry.ts
var registry_exports = /* @__PURE__ */ __exportAll({
	getContainer: () => getContainer,
	setContainer: () => setContainer
});
var _container = null;
function getContainer() {
	if (!_container) throw new Error("Container not initialized");
	return _container;
}
function setContainer(c) {
	_container = c;
}
//#endregion
//#region src/backend/utils/ipcWrapper.ts
function formatError(error) {
	if (error instanceof ZodError) return {
		success: false,
		message: "Error de validación: " + error.issues.map((e) => e.message).join(", "),
		errors: error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
		code: "VALIDATION"
	};
	if (error instanceof DomainError) return {
		success: false,
		message: error.message,
		code: error.code,
		errors: error instanceof ValidationError ? error.errors : void 0
	};
	logger.error({ err: error }, "Unhandled IPC Error");
	return {
		success: false,
		message: "Ocurrió un error inesperado en el sistema",
		code: "INTERNAL"
	};
}
function sanitizedCatch(error, genericMessage = "Error interno") {
	logger.error({ err: error }, `[SafeHandler] Error: ${genericMessage}`);
	return {
		success: false,
		message: genericMessage
	};
}
function wrapIpc(handler, schema) {
	return async (_event, ...args) => {
		try {
			if (schema && args.length > 0) {
				const result = schema.safeParse(args[0]);
				if (!result.success) return {
					success: false,
					message: "Error de validación: " + result.error.issues.map((e) => e.message).join(", "),
					errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
					code: "VALIDATION"
				};
				args[0] = result.data;
			}
			const data = await handler(...args);
			if (data && typeof data === "object" && "success" in data) return data;
			return {
				success: true,
				data
			};
		} catch (error) {
			return formatError(error);
		}
	};
}
//#endregion
//#region src/backend/auth/session.ts
var currentUser = null;
function setCurrentUser(user) {
	currentUser = user;
}
function getCurrentUser() {
	return currentUser;
}
function clearCurrentUser() {
	currentUser = null;
}
//#endregion
//#region src/backend/auth/authorize.ts
var UnauthorizedError = class extends DomainError {
	code = "UNAUTHORIZED";
	constructor() {
		super("No autenticado");
	}
};
var ForbiddenError = class extends DomainError {
	code = "FORBIDDEN";
	constructor(roles) {
		super(`Acceso denegado. Se requiere rol: ${roles.join(" o ")}`);
	}
};
/**
* Wraps an IPC handler to require specific roles.
* Must be placed BETWEEN the handler function and wrapIpc:
*
*   ipcMain.handle("users:create", wrapIpc(requireRole('ADMIN')(data => userService.createUser(data))));
*/
function requireRole(...roles) {
	return function(handler) {
		const wrapped = (async (...args) => {
			const user = getCurrentUser();
			if (!user) throw new UnauthorizedError();
			if (!roles.includes(user.role)) throw new ForbiddenError(roles);
			return handler(...args);
		});
		return wrapped;
	};
}
//#endregion
//#region src/backend/ipc.ts
var $ = new Proxy({}, { get(_, prop) {
	return getContainer()[prop];
} });
function setupIpcHandlers() {
	/**
	* HEALTH CHECK
	*/
	ipcMain.handle("dialog:showConfirm", async (_, options) => {
		return (await dialog.showMessageBox({
			type: "question",
			buttons: ["Sí", "No"],
			defaultId: 0,
			cancelId: 1,
			title: options.title || "Confirmación",
			message: options.message
		})).response === 0;
	});
	ipcMain.handle("health:check", async () => {
		try {
			await $.prisma.$queryRaw`SELECT 1`;
			return {
				success: true,
				database: "connected",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		} catch (error) {
			logger.error("[Health] Database check failed:", error);
			return {
				success: false,
				database: "disconnected",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		}
	});
	/**
	* DASHBOARD
	*/
	ipcMain.handle("dashboard:getStats", async (_, startDate, endDate) => {
		try {
			return await $.dashboardService.getStats(startDate, endDate);
		} catch (error) {
			logger.error("[Dashboard] getStats error:", error);
			return sanitizedCatch(error, "Error al obtener estadísticas del dashboard");
		}
	});
	ipcMain.handle("dashboard:getWeeklySales", async (_, days) => {
		try {
			return await $.dashboardService.getWeeklySales(days);
		} catch (error) {
			logger.error("[Dashboard] getWeeklySales error:", error);
			return [];
		}
	});
	ipcMain.handle("dashboard:getLowStock", async (_, limit) => {
		try {
			return await $.dashboardService.getLowStockProducts(limit || 50);
		} catch (error) {
			logger.error("[Dashboard] getLowStock error:", error);
			return [];
		}
	});
	ipcMain.handle("dashboard:getSalesByPayment", async (_, startDate, endDate) => {
		try {
			return await $.dashboardService.getSalesByPaymentMethod(startDate, endDate);
		} catch (error) {
			logger.error("[Dashboard] getSalesByPayment error:", error);
			return [];
		}
	});
	ipcMain.handle("dashboard:getTopProducts", async (_, limit, startDate, endDate) => {
		try {
			return await $.dashboardService.getTopProducts(limit, startDate, endDate);
		} catch (error) {
			logger.error("[Dashboard] getTopProducts error:", error);
			return [];
		}
	});
	ipcMain.handle("dashboard:getTopClients", async (_, limit, startDate, endDate) => {
		try {
			return await $.dashboardService.getTopClients(limit, startDate, endDate);
		} catch (error) {
			logger.error("[Dashboard] getTopClients error:", error);
			return [];
		}
	});
	ipcMain.handle("dashboard:getSalesByHour", async (_, startDate, endDate) => {
		try {
			return await $.dashboardService.getSalesByHour(startDate, endDate);
		} catch (error) {
			logger.error("[Dashboard] getSalesByHour error:", error);
			return [];
		}
	});
	ipcMain.handle("dashboard:getCashSummary", async (_, startDate, endDate) => {
		try {
			return await $.dashboardService.getCashRegisterSummary(startDate, endDate);
		} catch (error) {
			logger.error("[Dashboard] getCashSummary error:", error);
			return sanitizedCatch(error, "Error al obtener resumen de caja");
		}
	});
	ipcMain.handle("dashboard:getInventoryMetrics", async () => {
		try {
			return await $.dashboardService.getInventoryMetrics();
		} catch (error) {
			logger.error("[Dashboard] getInventoryMetrics error:", error);
			return sanitizedCatch(error, "Error al obtener métricas de inventario");
		}
	});
	ipcMain.handle("dashboard:invalidateCache", async () => {
		try {
			$.dashboardService.invalidateCache();
			return { success: true };
		} catch (error) {
			logger.error("[Dashboard] invalidateCache error:", error);
			return sanitizedCatch(error, "Error al limpiar caché");
		}
	});
	/**
	* SETTINGS
	*/
	ipcMain.handle("settings:getAll", async () => {
		try {
			const user = getCurrentUser();
			if (!user) throw new UnauthorizedError();
			if (user.role !== "ADMIN") throw new ForbiddenError(["ADMIN"]);
			return await $.settingsService.getSettings();
		} catch (error) {
			logger.error("[Settings] getAll error:", error);
			return sanitizedCatch(error, "Error al obtener configuración");
		}
	});
	ipcMain.handle("settings:update", async (_, settings) => {
		try {
			const user = getCurrentUser();
			if (!user) throw new UnauthorizedError();
			if (user.role !== "ADMIN") throw new ForbiddenError(["ADMIN"]);
			const parsed = settingsSchema.safeParse(settings);
			if (!parsed.success) return {
				success: false,
				message: "Error de validación: " + parsed.error.issues.map((e) => e.message).join(", ")
			};
			await $.settingsService.updateSettings(parsed.data);
			logger.info("Settings saved successfully");
			return { success: true };
		} catch (error) {
			logger.error({
				err: error,
				settings: Object.keys(settings)
			}, "[Settings] update error");
			return sanitizedCatch(error, "Error al guardar configuración");
		}
	});
	/**
	* CASH REGISTERS
	*/
	ipcMain.handle("cash:getOpen", async () => {
		try {
			return await $.cashRegisterService.getOpenRegister();
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("cash:getAll", async (_, startDate, endDate) => {
		try {
			const user = getCurrentUser();
			if (!user) throw new UnauthorizedError();
			if (user.role !== "ADMIN") throw new ForbiddenError(["ADMIN"]);
			return await $.cashRegisterService.getAllRegisters(startDate, endDate);
		} catch (error) {
			logger.error("[Cash] getAll error:", error);
			return sanitizedCatch(error, "Error al obtener cajas");
		}
	});
	ipcMain.handle("cash:getDetails", async (_, id) => {
		try {
			const user = getCurrentUser();
			if (!user) throw new UnauthorizedError();
			if (user.role !== "ADMIN") throw new ForbiddenError(["ADMIN"]);
			return await $.cashRegisterService.getRegisterDetails(id);
		} catch (error) {
			logger.error("[Cash] getDetails error:", error);
			return sanitizedCatch(error, "Error al obtener detalles de caja");
		}
	});
	ipcMain.handle("cash:getDailySummary", async (_, registerId) => {
		try {
			const user = getCurrentUser();
			if (!user) throw new UnauthorizedError();
			if (user.role !== "ADMIN") throw new ForbiddenError(["ADMIN"]);
			return await $.cashRegisterService.getDailySummary(registerId);
		} catch (error) {
			logger.error("[Cash] getDailySummary error:", error);
			return sanitizedCatch(error, "Error al obtener resumen del día");
		}
	});
	ipcMain.handle("cash:open", wrapIpc(requireRole("ADMIN")((amount, userId) => $.cashRegisterService.openRegister(amount, userId))));
	ipcMain.handle("cash:close", wrapIpc(requireRole("ADMIN")((id, amount, userId) => $.cashRegisterService.closeRegister(id, amount, userId))));
	/**
	* AUTH
	*/
	ipcMain.handle("auth:login", async (_, username, password) => {
		try {
			const result = await $.authService.login(username, password);
			if (result.success && result.user) setCurrentUser({
				id: result.user.id,
				username: result.user.username,
				role: result.user.role
			});
			return result;
		} catch (error) {
			logger.error("[Auth] Login error:", error);
			return sanitizedCatch(error, "Error de autenticación");
		}
	});
	ipcMain.handle("auth:logout", async () => {
		clearCurrentUser();
		return { success: true };
	});
	ipcMain.handle("auth:checkSession", async () => {
		const user = getCurrentUser();
		return {
			authenticated: !!user,
			user
		};
	});
	ipcMain.handle("auth:getSecurityQuestion", async (_, username) => {
		try {
			return await $.authService.getSecurityQuestion(username);
		} catch (error) {
			return sanitizedCatch(error, "Error al obtener pregunta de seguridad");
		}
	});
	ipcMain.handle("auth:verifySecurityAnswer", async (_, username, answer) => {
		try {
			return await $.authService.verifySecurityAnswer(username, answer);
		} catch (error) {
			return sanitizedCatch(error, "Error al verificar respuesta");
		}
	});
	ipcMain.handle("auth:resetPassword", async (_, token, newPassword) => {
		try {
			return await $.authService.resetPassword(token, newPassword);
		} catch (error) {
			return sanitizedCatch(error, "Error al restablecer contraseña");
		}
	});
	ipcMain.handle("auth:setSecurityQuestion", wrapIpc(requireRole("ADMIN")(async (_, userId, question, answer) => {
		return await $.authService.setSecurityQuestion(userId, question, answer);
	})));
	/**
	* SETUP (First-run wizard)
	*/
	ipcMain.handle("setup:status", async () => {
		try {
			return { needsSetup: await $.userRepo.count() === 0 };
		} catch (error) {
			logger.error("[Setup] Status error:", error);
			return { needsSetup: true };
		}
	});
	ipcMain.handle("setup:complete", async (_, data) => {
		try {
			const result = await $.authService.register({
				username: data.user.username,
				password: data.user.password,
				role: "ADMIN",
				password_hash: "",
				security_question: data.user.security_question,
				security_answer: data.user.security_answer
			});
			let user;
			if (result.success && result.user) {
				user = result.user;
				logger.info({ userId: user.id }, "User created during setup");
			} else if (result.error?.includes("ya existe")) {
				const existing = await $.userRepo.findByUsername(data.user.username);
				if (!existing) return {
					success: false,
					message: "Error al verificar el usuario existente"
				};
				user = {
					id: existing.id,
					username: existing.username,
					role: existing.role
				};
				logger.info({ userId: user.id }, "User already exists, reusing");
			} else return {
				success: false,
				message: result.error || "Error al crear el usuario"
			};
			setCurrentUser({
				id: user.id,
				username: user.username,
				role: user.role
			});
			try {
				await $.settingsService.updateSettings(data.settings);
				logger.info({ settings: Object.keys(data.settings) }, "Settings saved during setup");
			} catch (settingsErr) {
				logger.error({
					err: settingsErr,
					settings: Object.keys(data.settings)
				}, "[Setup] Settings save error");
				return {
					success: false,
					message: "Error al guardar la configuración del negocio: " + (settingsErr?.message || String(settingsErr))
				};
			}
			return {
				success: true,
				user
			};
		} catch (error) {
			logger.error({ err: error }, "[Setup] Complete error");
			return sanitizedCatch(error, "Error durante la configuración inicial");
		}
	});
	/**
	* CLIENTS
	*/
	ipcMain.handle("clients:getAll", async (_, search) => {
		try {
			return await $.clientService.getAllClients(search);
		} catch (error) {
			logger.error("[Clients] getAll error:", error);
			return sanitizedCatch(error, "Error al obtener clientes");
		}
	});
	ipcMain.handle("clients:getById", async (_, id) => {
		try {
			return await $.clientService.getClientById(id);
		} catch (error) {
			logger.error("[Clients] getById error:", error);
			return sanitizedCatch(error, "Error al obtener cliente");
		}
	});
	ipcMain.handle("clients:create", wrapIpc((clientData, userId) => $.clientService.createClient(clientData, userId), clientSchema));
	ipcMain.handle("clients:update", wrapIpc((id, clientData, userId) => $.clientService.updateClient(id, clientData, userId)));
	ipcMain.handle("clients:delete", async (_, id, userId) => {
		try {
			return await $.clientService.deleteClient(id, userId);
		} catch (error) {
			logger.error("[Clients] delete error:", error);
			return sanitizedCatch(error, "Error al eliminar cliente");
		}
	});
	/**
	* PRODUCTS
	*/
	ipcMain.handle("products:getAll", async (_, search, categoryId) => {
		try {
			return await $.productService.getAllProducts(search, categoryId);
		} catch (error) {
			logger.error("[Products] getAll error:", error);
			return sanitizedCatch(error, "Error al obtener productos");
		}
	});
	ipcMain.handle("products:getById", async (_, id) => {
		try {
			return await $.productService.getProductById(id);
		} catch (error) {
			logger.error("[Products] getById error:", error);
			return sanitizedCatch(error, "Error al obtener producto");
		}
	});
	ipcMain.handle("products:getLowStock", async () => {
		try {
			return await $.dashboardService.getLowStockProducts(50);
		} catch (error) {
			logger.error("Get low stock products error:", error);
			return [];
		}
	});
	ipcMain.handle("products:create", wrapIpc((productData, userId) => $.productService.createProduct(productData, userId), productSchema));
	ipcMain.handle("products:update", wrapIpc((id, productData, userId) => $.productService.updateProduct(id, productData, userId)));
	ipcMain.handle("products:delete", async (_, id, userId) => {
		try {
			return await $.productService.deleteProduct(id, userId);
		} catch (error) {
			logger.error("[Products] delete error:", error);
			return sanitizedCatch(error, "Error al eliminar producto");
		}
	});
	ipcMain.handle("products:addStock", async (_, productId, quantity, userId, reason) => {
		try {
			return await $.productService.addStock(productId, quantity, userId, reason);
		} catch (error) {
			logger.error("[Products] addStock error:", error);
			return sanitizedCatch(error, "Error al añadir stock");
		}
	});
	ipcMain.handle("products:removeStock", async (_, productId, quantity, userId, reason) => {
		try {
			return await $.productService.removeStock(productId, quantity, userId, reason);
		} catch (error) {
			logger.error("[Products] removeStock error:", error);
			return sanitizedCatch(error, "Error al reducir stock");
		}
	});
	ipcMain.handle("products:getMovements", async (_, productId, limit) => {
		try {
			return await $.productService.getInventoryMovements(productId, limit);
		} catch (error) {
			logger.error("[Products] getMovements error:", error);
			return sanitizedCatch(error, "Error al obtener movimientos");
		}
	});
	/**
	* DISCOUNTS
	*/
	ipcMain.handle("discounts:getAll", async (_, activeOnly) => {
		try {
			if (!getCurrentUser()) throw new UnauthorizedError();
			return await $.discountService.getAllDiscounts(activeOnly);
		} catch (error) {
			logger.error("[Discounts] getAll error:", error);
			return sanitizedCatch(error, "Error al obtener descuentos");
		}
	});
	ipcMain.handle("discounts:getById", async (_, id) => {
		try {
			if (!getCurrentUser()) throw new UnauthorizedError();
			return await $.discountService.getDiscountById(id);
		} catch (error) {
			logger.error("[Discounts] getById error:", error);
			return sanitizedCatch(error, "Error al obtener descuento");
		}
	});
	ipcMain.handle("discounts:create", wrapIpc(requireRole("ADMIN")(async (data) => {
		const parsed = discountSchema.parse(data);
		return await $.discountService.createDiscount(parsed);
	})));
	ipcMain.handle("discounts:update", wrapIpc(requireRole("ADMIN")(async (id, data) => {
		const parsed = discountSchema.partial().parse(data);
		return await $.discountService.updateDiscount(id, parsed);
	})));
	ipcMain.handle("discounts:delete", wrapIpc(requireRole("ADMIN")(async (id) => {
		return await $.discountService.deleteDiscount(id);
	})));
	ipcMain.handle("discounts:getApplicable", async (_, productId, totalAmount) => {
		try {
			if (!getCurrentUser()) throw new UnauthorizedError();
			return await $.discountService.getApplicableDiscounts(productId, totalAmount);
		} catch (error) {
			logger.error("[Discounts] getApplicable error:", error);
			return [];
		}
	});
	/**
	* SALES
	*/
	ipcMain.handle("sales:getAll", async (_, startDate, endDate, clientId, cashRegisterId, page, pageSize) => {
		try {
			return await $.saleService.getAllSales(startDate, endDate, clientId, cashRegisterId, page, pageSize);
		} catch (error) {
			logger.error("[Sales] getAll error:", error);
			return sanitizedCatch(error, "Error al obtener ventas");
		}
	});
	ipcMain.handle("sales:getToday", async () => {
		try {
			return await $.saleService.getTodaySales();
		} catch (error) {
			logger.error("[Sales] getToday error:", error);
			return sanitizedCatch(error, "Error al obtener ventas del día");
		}
	});
	ipcMain.handle("sales:getLast", async () => {
		try {
			return await $.saleService.getLastSale();
		} catch (error) {
			logger.error("[Sales] getLast error:", error);
			return null;
		}
	});
	ipcMain.handle("sales:getStats", async (_, startDate, endDate) => {
		try {
			return await $.saleService.getSalesStats(startDate, endDate);
		} catch (error) {
			logger.error("[Sales] getStats error:", error);
			return sanitizedCatch(error, "Error al obtener estadísticas");
		}
	});
	ipcMain.handle("sales:getDetails", async (_, saleId) => {
		try {
			return await $.saleService.getSaleDetails(saleId);
		} catch (error) {
			logger.error("[Sales] getDetails error:", error);
			return sanitizedCatch(error, "Error al obtener detalles de venta");
		}
	});
	ipcMain.handle("sales:register", wrapIpc(async (saleData, itemsData, userId) => {
		return $.saleService.registerSale(saleData, itemsData, userId);
	}, saleSchema.omit({ items: true })));
	ipcMain.handle("sales:cancel", async (_, saleId, userId) => {
		try {
			return await $.saleService.cancelSale(saleId, userId);
		} catch (error) {
			logger.error("[Sales] cancel error:", error);
			return sanitizedCatch(error, "Error al cancelar venta");
		}
	});
	/**
	* CATEGORIES
	*/
	ipcMain.handle("categories:getAll", async (_, search) => {
		return await $.categoryService.getAllCategories(search);
	});
	ipcMain.handle("categories:getById", async (_, id) => {
		try {
			return await $.categoryService.getCategoryById(id);
		} catch (error) {
			logger.error("[Categories] getById error:", error);
			return sanitizedCatch(error, "Error al obtener categoría");
		}
	});
	ipcMain.handle("categories:create", wrapIpc(requireRole("ADMIN")(async (categoryData, userId) => {
		return await $.categoryService.createCategory(categoryData, userId);
	}), categorySchema));
	ipcMain.handle("categories:update", wrapIpc(requireRole("ADMIN")(async (id, categoryData, userId) => {
		const parsed = categorySchema.parse(categoryData);
		return await $.categoryService.updateCategory(id, parsed, userId);
	})));
	ipcMain.handle("categories:delete", wrapIpc(requireRole("ADMIN")(async (id, userId) => {
		return await $.categoryService.deleteCategory(id, userId);
	})));
	/**
	* USERS
	*/
	ipcMain.handle("users:getAll", async () => {
		try {
			return await requireRole("ADMIN")(async () => {
				return await $.userService.getAllUsers();
			})();
		} catch (error) {
			logger.error("[Users] getAll error:", error);
			return sanitizedCatch(error, "Error al obtener usuarios");
		}
	});
	ipcMain.handle("users:getById", async (_, id) => {
		try {
			return await requireRole("ADMIN")(async () => {
				return await $.userService.getUserById(id);
			})();
		} catch (error) {
			logger.error("[Users] getById error:", error);
			return sanitizedCatch(error, "Error al obtener usuario");
		}
	});
	ipcMain.handle("users:create", wrapIpc(requireRole("ADMIN")((userData, createdBy) => $.userService.createUser(userData, createdBy)), userCreateSchema));
	ipcMain.handle("users:update", wrapIpc(requireRole("ADMIN")(async (id, userData, updatedBy) => {
		const parsed = userCreateSchema.partial().parse(userData);
		return await $.userService.updateUser(id, parsed, updatedBy);
	})));
	ipcMain.handle("users:delete", wrapIpc(requireRole("ADMIN")((id, deletedBy) => $.userService.deleteUser(id, deletedBy))));
	ipcMain.handle("users:changePassword", wrapIpc(requireRole("ADMIN")((userId, newPassword, changedBy) => $.userService.changePassword(userId, newPassword, changedBy))));
	/**
	* INVENTORY MOVEMENTS
	*/
	ipcMain.handle("movements:getAll", async (_, page, pageSize, productId, type, reason, startDate, endDate) => {
		try {
			const user = getCurrentUser();
			if (!user) throw new UnauthorizedError();
			if (user.role !== "ADMIN") throw new ForbiddenError(["ADMIN"]);
			return await $.movementRepo.findAll({
				page,
				pageSize,
				productId,
				type,
				reason,
				startDate,
				endDate
			});
		} catch (error) {
			return [];
		}
	});
	/**
	* SUPPLIERS
	*/
	ipcMain.handle("suppliers:getAll", async (_, search) => {
		try {
			return await $.supplierService.getAllSuppliers(search);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("suppliers:getById", async (_, id) => {
		try {
			return await $.supplierService.getSupplierById(id);
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("suppliers:create", wrapIpc(requireRole("ADMIN")((data, userId) => $.supplierService.createSupplier(data, userId)), supplierSchema));
	ipcMain.handle("suppliers:update", wrapIpc(requireRole("ADMIN")(async (id, data, userId) => {
		const parsed = supplierSchema.partial().parse(data);
		return await $.supplierService.updateSupplier(id, parsed, userId);
	})));
	ipcMain.handle("suppliers:delete", wrapIpc(requireRole("ADMIN")((id, userId) => $.supplierService.deleteSupplier(id, userId))));
	/**
	* PURCHASES
	*/
	ipcMain.handle("purchases:getAll", async (_, supplierId, status) => {
		try {
			return await $.purchaseService.getAllPurchases(supplierId, status);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("purchases:getById", async (_, id) => {
		try {
			return await $.purchaseService.getPurchaseById(id);
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("purchases:create", wrapIpc(requireRole("ADMIN")((data, userId) => $.purchaseService.createPurchase(data, userId)), purchaseSchema));
	ipcMain.handle("purchases:receive", wrapIpc(requireRole("ADMIN")((purchaseId, userId) => $.purchaseService.receivePurchase(purchaseId, userId))));
	ipcMain.handle("purchases:cancel", wrapIpc(requireRole("ADMIN")((purchaseId, userId) => $.purchaseService.cancelPurchase(purchaseId, userId))));
	ipcMain.handle("purchases:updatePaymentStatus", wrapIpc(requireRole("ADMIN")((purchaseId, paymentStatus) => $.purchaseService.updatePaymentStatus(purchaseId, paymentStatus))));
	ipcMain.handle("backup:create", wrapIpc(requireRole("ADMIN")((label) => $.backupService.createBackup(label))));
	ipcMain.handle("backup:list", async () => {
		try {
			return await $.backupService.listBackups();
		} catch (error) {
			logger.error("[IPC] Error listing backups:", error);
			return [];
		}
	});
	ipcMain.handle("backup:restore", wrapIpc(requireRole("ADMIN")((backupPath) => $.backupService.restoreBackup(backupPath))));
	ipcMain.handle("backup:delete", wrapIpc(requireRole("ADMIN")((backupPath) => $.backupService.deleteBackup(backupPath))));
	ipcMain.handle("settings:getTax", async () => {
		try {
			const user = getCurrentUser();
			if (!user) throw new UnauthorizedError();
			if (user.role !== "ADMIN") throw new ForbiddenError(["ADMIN"]);
			return await $.settingsService.getTaxSettings();
		} catch (error) {
			logger.error("[Settings] getTax error:", error);
			return sanitizedCatch(error, "Error al obtener configuración de impuestos");
		}
	});
	ipcMain.handle("settings:updateTax", async (_, taxRate, taxType, taxIncluded) => {
		try {
			const user = getCurrentUser();
			if (!user) throw new UnauthorizedError();
			if (user.role !== "ADMIN") throw new ForbiddenError(["ADMIN"]);
			return await $.settingsService.updateTaxSettings(taxRate, taxType, taxIncluded);
		} catch (error) {
			logger.error({ err: error }, "[Settings] updateTax error");
			return sanitizedCatch(error, "Error al guardar configuración de impuestos");
		}
	});
	ipcMain.handle("reports:generate", wrapIpc(requireRole("ADMIN")(async (raw) => {
		const startDate = raw.startDate ? new Date(raw.startDate) : void 0;
		let endDate;
		if (raw.endDate) {
			endDate = new Date(raw.endDate);
			endDate.setHours(23, 59, 59, 999);
		} else if (startDate) {
			endDate = new Date(startDate);
			endDate.setHours(23, 59, 59, 999);
		}
		const request = {
			...raw,
			startDate,
			endDate
		};
		const buffer = await $.reportService.generateReport(request);
		const ext = request.format === "pdf" ? "pdf" : "xlsx";
		const { filePath, canceled } = await dialog.showSaveDialog({
			defaultPath: `${request.type}-${Date.now()}.${ext}`,
			filters: request.format === "pdf" ? [{
				name: "PDF",
				extensions: ["pdf"]
			}] : [{
				name: "Excel",
				extensions: ["xlsx"]
			}]
		});
		if (canceled || !filePath) return {
			success: false,
			message: "Cancelado por el usuario"
		};
		await fs$1.writeFile(filePath, buffer);
		return {
			success: true,
			path: filePath
		};
	})));
	ipcMain.handle("reports:generateReceipt", wrapIpc(requireRole("ADMIN")(async (saleId) => {
		const request = {
			type: "sale_receipt",
			format: "pdf",
			saleId
		};
		const buffer = await $.reportService.generateReport(request);
		const { filePath, canceled } = await dialog.showSaveDialog({
			defaultPath: `comprobante-${saleId}-${Date.now()}.pdf`,
			filters: [{
				name: "PDF",
				extensions: ["pdf"]
			}]
		});
		if (canceled || !filePath) return {
			success: false,
			message: "Cancelado por el usuario"
		};
		await fs$1.writeFile(filePath, buffer);
		return {
			success: true,
			path: filePath
		};
	})));
	ipcMain.handle("reports:generateCashClose", wrapIpc(requireRole("ADMIN")(async (registerId) => {
		const request = {
			type: "cash_close",
			format: "pdf",
			registerId
		};
		const buffer = await $.reportService.generateReport(request);
		const { filePath, canceled } = await dialog.showSaveDialog({
			defaultPath: `cierre-caja-${registerId}-${Date.now()}.pdf`,
			filters: [{
				name: "PDF",
				extensions: ["pdf"]
			}]
		});
		if (canceled || !filePath) return {
			success: false,
			message: "Cancelado por el usuario"
		};
		await fs$1.writeFile(filePath, buffer);
		return {
			success: true,
			path: filePath
		};
	})));
	/**
	* AI ASSISTANT
	*/
	ipcMain.handle("ai:chat", wrapIpc(async (data) => {
		const user = getCurrentUser();
		return await $.aiService.askAssistant(data.query, user?.id);
	}, aiChatSchema));
	/**
	* AI MONITORING STATS
	*/
	ipcMain.handle("ai:stats", wrapIpc(async () => {
		return $.aiMonitorService.getSnapshot();
	}));
	ipcMain.handle("ai:stats:history", wrapIpc(async (data) => {
		return $.aiMonitorService.getHistory(data?.limit);
	}));
	ipcMain.handle("ai:stats:errors", wrapIpc(async () => {
		return $.aiMonitorService.getRecentErrors();
	}));
	ipcMain.handle("ai:stats:reset", wrapIpc(async () => {
		$.aiMonitorService.resetHistory();
		return { reset: true };
	}));
	/**
	* AI FEEDBACK
	*/
	ipcMain.handle("ai:feedback", wrapIpc(async (data) => {
		const user = getCurrentUser();
		if (!user || !$.aiTrainingLogRepo) return { success: false };
		await $.aiTrainingLogRepo.create({
			usuario_id: user.id,
			mensaje_usuario: data.query || `feedback:${data.rating}`,
			nlu_output: JSON.stringify({
				feedback: data.rating,
				messageIndex: data.messageIndex
			}),
			respuesta_sistema: null
		});
		return { success: true };
	}));
	/**
	* AI TRAINING
	*/
	ipcMain.handle("ai:training:stats", wrapIpc(async () => {
		const AutoTrainService = (await import("./AutoTrainService-D4nynddO.js")).AutoTrainService;
		return new AutoTrainService().getStats();
	}));
	ipcMain.handle("ai:training:retrain", wrapIpc(async (data) => {
		const AutoTrainService = (await import("./AutoTrainService-D4nynddO.js")).AutoTrainService;
		return new AutoTrainService().retrain({ epochs: data?.epochs });
	}));
	/**
	* AI DRAFT APPROVAL
	*/
	ipcMain.handle("ai:draft:approve", wrapIpc(async (data) => {
		const pipeline = $.validationPipeline;
		if (!pipeline) return {
			success: false,
			message: "Validation pipeline not available"
		};
		const draft = pipeline.getReviewQueue().approve(data.draftId, data.userId);
		if (!draft) return {
			success: false,
			message: "Draft not found or already processed"
		};
		await pipeline.getAuditService().recordDraftConfirmed(draft.type, draft.payload, data.userId);
		try {
			if (draft.type === "DRAFT_PRODUCT") {
				const result = await $.productService.createProduct(draft.payload, data.userId);
				return {
					success: true,
					action: draft.type,
					result
				};
			}
			if (draft.type === "DRAFT_CLIENT") {
				const result = await $.clientService.createClient(draft.payload, data.userId);
				return {
					success: true,
					action: draft.type,
					result
				};
			}
			return {
				success: true,
				action: draft.type
			};
		} catch (err) {
			return {
				success: false,
				message: err.message ?? "Failed to create entity"
			};
		}
	}));
	ipcMain.handle("ai:draft:reject", wrapIpc(async (data) => {
		const pipeline = $.validationPipeline;
		if (!pipeline) return {
			success: false,
			message: "Validation pipeline not available"
		};
		const draft = pipeline.getReviewQueue().reject(data.draftId, String(data.userId));
		if (!draft) return {
			success: false,
			message: "Draft not found or already processed"
		};
		await pipeline.getAuditService().recordDraftRejected(draft.type, data.userId);
		return {
			success: true,
			draftId: draft.draftId,
			status: "rejected"
		};
	}));
	ipcMain.handle("ai:draft:pending", wrapIpc(async () => {
		const pipeline = $.validationPipeline;
		if (!pipeline) return [];
		return pipeline.getReviewQueue().getPending();
	}));
	ipcMain.handle("ai:draft:history", wrapIpc(async (data) => {
		const pipeline = $.validationPipeline;
		if (!pipeline) return [];
		return pipeline.getReviewQueue().getHistory(data?.limit);
	}));
}
//#endregion
//#region src/backend/utils/generatedSchema.ts
var SCHEMA_SQL = `-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "security_question" TEXT,
    "security_answer_hash" TEXT,
    "failed_attempts" INTEGER NOT NULL DEFAULT 0,
    "locked_until" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dni" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "code" TEXT NOT NULL,
    "tax_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "products" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category_id" INTEGER,
    "price_purchase" REAL NOT NULL,
    "price_sale" REAL NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "min_stock" INTEGER DEFAULT 5,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "supplier_id" INTEGER,
    CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cash_registers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "opened_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "opening_amount" REAL NOT NULL,
    "total_sales" REAL NOT NULL DEFAULT 0,
    "closed_at" DATETIME,
    "closing_amount" REAL,
    "difference" REAL,
    "status" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "sales" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cash_register_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "total" REAL NOT NULL,
    "subtotal" REAL NOT NULL DEFAULT 0,
    "tax_amount" REAL NOT NULL DEFAULT 0,
    "discount_total" REAL DEFAULT 0,
    "payment_method" TEXT DEFAULT 'CASH',
    "exchange_rate" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sales_cash_register_id_fkey" FOREIGN KEY ("cash_register_id") REFERENCES "cash_registers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sales_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sale_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sale_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" REAL NOT NULL,
    "purchase_price" REAL NOT NULL,
    "discount_name" TEXT,
    "discount_type" TEXT,
    "discount_value" REAL,
    "discount_amount" REAL DEFAULT 0,
    "final_unit_price" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "product_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inventory_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "ruc" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "purchases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplier_id" INTEGER NOT NULL,
    "total_amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_status" TEXT NOT NULL DEFAULT 'UNPAID',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchase_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_cost" REAL NOT NULL,
    CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "purchase_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "discounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "applicable_to" TEXT NOT NULL DEFAULT 'ALL',
    "category_id" INTEGER,
    "min_purchase_amount" REAL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "discounts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "product_discounts" (
    "product_id" INTEGER NOT NULL,
    "discount_id" INTEGER NOT NULL,

    PRIMARY KEY ("product_id", "discount_id"),
    CONSTRAINT "product_discounts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_discounts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "clients_dni_key" ON "clients"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "clients_code_key" ON "clients"("code");

-- CreateIndex
CREATE UNIQUE INDEX "clients_tax_id_key" ON "clients"("tax_id");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "clients_dni_idx" ON "clients"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_stock_min_stock_idx" ON "products"("stock", "min_stock");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_sku_idx" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_supplier_id_idx" ON "products"("supplier_id");

-- CreateIndex
CREATE INDEX "sales_cash_register_id_idx" ON "sales"("cash_register_id");

-- CreateIndex
CREATE INDEX "sales_client_id_idx" ON "sales"("client_id");

-- CreateIndex
CREATE INDEX "sales_created_at_idx" ON "sales"("created_at");

-- CreateIndex
CREATE INDEX "sales_cash_register_id_created_at_idx" ON "sales"("cash_register_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_client_id_created_at_idx" ON "sales"("client_id", "created_at");

-- CreateIndex
CREATE INDEX "sales_payment_method_idx" ON "sales"("payment_method");

-- CreateIndex
CREATE INDEX "sale_items_sale_id_idx" ON "sale_items"("sale_id");

-- CreateIndex
CREATE INDEX "sale_items_product_id_idx" ON "sale_items"("product_id");

-- CreateIndex
CREATE INDEX "inventory_movements_product_id_idx" ON "inventory_movements"("product_id");

-- CreateIndex
CREATE INDEX "inventory_movements_type_idx" ON "inventory_movements"("type");

-- CreateIndex
CREATE INDEX "inventory_movements_product_id_created_at_idx" ON "inventory_movements"("product_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_movements_product_id_type_idx" ON "inventory_movements"("product_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_ruc_key" ON "suppliers"("ruc");

-- CreateIndex
CREATE INDEX "purchases_supplier_id_idx" ON "purchases"("supplier_id");

-- CreateIndex
CREATE INDEX "purchases_status_idx" ON "purchases"("status");

-- CreateIndex
CREATE INDEX "purchases_created_at_idx" ON "purchases"("created_at");

-- CreateIndex
CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items"("purchase_id");

-- CreateIndex
CREATE INDEX "purchase_items_product_id_idx" ON "purchase_items"("product_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "settings_key_key" ON "settings"("key");
`;
//#endregion
//#region src/backend/utils/migrationRunner.ts
/**
* Split a SQL script into individual statements.
* Handles multi-line CREATE TABLE, comments, and trailing semicolons.
*/
function splitSqlStatements(sql) {
	const statements = [];
	let current = "";
	let inString = false;
	let stringChar = "";
	for (let i = 0; i < sql.length; i++) {
		const ch = sql[i];
		const next = sql[i + 1] || "";
		if (inString) {
			current += ch;
			if (ch === stringChar && sql[i - 1] !== "\\") inString = false;
			continue;
		}
		if (ch === "-" && next === "-") {
			while (i < sql.length && sql[i] !== "\n") i++;
			continue;
		}
		if (ch === "/" && next === "*") {
			i += 2;
			while (i < sql.length && !(sql[i] === "*" && sql[i + 1] === "/")) i++;
			i += 2;
			continue;
		}
		if (ch === "'" || ch === "\"") {
			inString = true;
			stringChar = ch;
			current += ch;
			continue;
		}
		if (ch === ";") {
			const trimmed = current.trim();
			if (trimmed) statements.push(trimmed);
			current = "";
			continue;
		}
		current += ch;
	}
	const trimmed = current.trim();
	if (trimmed) statements.push(trimmed);
	return statements;
}
/**
* Check if the database appears to have been initialized
* by checking for the existence of core tables.
*/
async function isDatabaseInitialized(prisma) {
	try {
		const result = await prisma.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table' AND name='users'`);
		return Array.isArray(result) && result.length > 0;
	} catch {
		return false;
	}
}
/**
* Run the full schema DDL against the database.
* Creates all tables, indexes, and constraints from the embedded schema.
*/
async function runMigrations(prisma) {
	if (await isDatabaseInitialized(prisma)) {
		logger.info("Database already initialized, skipping.");
		return { applied: false };
	}
	logger.info("Loading embedded schema");
	const statements = splitSqlStatements(SCHEMA_SQL);
	logger.info(`Found ${statements.length} SQL statements to execute`);
	for (let i = 0; i < statements.length; i++) {
		const stmt = statements[i];
		try {
			await prisma.$executeRawUnsafe(stmt);
		} catch (err) {
			if (err.message && err.message.includes("already exists")) {
				logger.info(`Skipping statement ${i + 1} (already exists): ${stmt.slice(0, 60)}...`);
				continue;
			}
			const msg = `Migration failed at statement ${i + 1}: ${err.message || err}`;
			logger.error(msg);
			logger.error(`SQL: ${stmt.slice(0, 200)}`);
			return {
				applied: false,
				error: msg
			};
		}
	}
	logger.info("Schema applied successfully!");
	try {
		await prisma.$disconnect();
		await prisma.$connect();
		logger.info("Prisma connection refreshed");
	} catch (e) {
		logger.error({ err: e }, "Failed to refresh Prisma connection");
		return {
			applied: true,
			error: "Migrations applied but failed to refresh connection"
		};
	}
	return { applied: true };
}
//#endregion
//#region src/backend/index.ts
var { PrismaClient } = pkg;
setupProductionEnv();
var container = buildContainer(new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: process.env.DATABASE_URL }) }));
setContainer(container);
var __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.DIST = path.join(__dirname, "../dist");
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, "../public");
var win = null;
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
async function createWindow() {
	win = new BrowserWindow({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
		webPreferences: {
			preload: path.join(__dirname, "index.mjs"),
			contextIsolation: true,
			nodeIntegration: false
		},
		autoHideMenuBar: true
	});
	if (app.isPackaged) session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
		callback({ responseHeaders: {
			...details.responseHeaders,
			"Content-Security-Policy": ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'"]
		} });
	});
	if (VITE_DEV_SERVER_URL) {
		win.loadURL(VITE_DEV_SERVER_URL);
		win.webContents.openDevTools();
	} else win.loadFile(path.join(process.env.DIST, "index.html"));
	win.on("blur", () => {
		setTimeout(() => {
			if (win && !win.isDestroyed() && !win.isFocused()) {
				const focusedWindow = BrowserWindow.getFocusedWindow();
				if (!focusedWindow || focusedWindow === win) win.focus();
			}
		}, 100);
	});
	win.on("focus", () => {
		if (win && win.webContents) win.webContents.focus();
	});
	win.on("closed", () => {
		win = null;
	});
}
ipcMain.handle("window:focus", () => {
	if (win && !win.isDestroyed()) {
		win.focus();
		win.webContents.focus();
		return true;
	}
	return false;
});
ipcMain.handle("window:is-ready", () => {
	return win && !win.isDestroyed();
});
ipcMain.handle("dialog:showMessageBox", (event, options) => {
	const focusedWindow = BrowserWindow.getFocusedWindow() || win;
	return dialog.showMessageBox(focusedWindow, options);
});
ipcMain.handle("dialog:showOpenDialog", (event, options) => {
	const focusedWindow = BrowserWindow.getFocusedWindow() || win;
	return dialog.showOpenDialog(focusedWindow, options);
});
ipcMain.handle("dialog:showSaveDialog", (event, options) => {
	const focusedWindow = BrowserWindow.getFocusedWindow() || win;
	return dialog.showSaveDialog(focusedWindow, options);
});
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
		win = null;
	}
});
app.whenReady().then(async () => {
	let prismaOk = false;
	try {
		await container.prisma.$connect();
		await container.prisma.$queryRaw`PRAGMA journal_mode=WAL`;
		await container.prisma.$queryRaw`PRAGMA synchronous=NORMAL`;
		await container.prisma.$queryRaw`PRAGMA cache_size=10000`;
		await container.prisma.$queryRaw`PRAGMA temp_store=MEMORY`;
		logger.info("Prisma connected to SQLite successfully");
		prismaOk = true;
	} catch (err) {
		const detail = [
			`Error: ${err.message || String(err)}`,
			err.code ? `Code: ${err.code}` : "",
			`DATABASE_URL: ${process.env.DATABASE_URL || "(not set)"}`,
			`resourcesPath: ${process.resourcesPath || "(not set)"}`,
			`appPath: ${app.getAppPath()}`
		].filter(Boolean).join("\n");
		logger.error({ err }, `Failed to connect to SQLite:\n${detail}`);
		try {
			await dialog.showMessageBox({
				type: "error",
				title: "Error de Base de Datos",
				message: "No se pudo conectar a la base de datos SQLite.",
				detail: `Revisa que la instalación sea correcta o contacta al administrador.\n\nSi el problema persiste, revisa los logs de la aplicación.`
			});
		} catch {}
	}
	if (prismaOk) {
		const migrationResult = await runMigrations(container.prisma);
		if (migrationResult.error) {
			logger.error({ err: migrationResult.error }, "Migration error");
			try {
				await dialog.showMessageBox({
					type: "error",
					title: "Error de Migración",
					message: "No se pudieron aplicar las migraciones de la base de datos.",
					detail: migrationResult.error
				});
			} catch {}
		}
	}
	setupIpcHandlers();
	container.schedulerService.start();
	try {
		const { existsSync } = await import("fs");
		const { join, dirname } = await import("path");
		const modelPath = process.env.NEURAL_MODEL_PATH ? path.resolve(process.env.NEURAL_MODEL_PATH) : join(app.getAppPath(), "neural_model");
		const ragDir = path.join(__dirname, "../infrastructure/rag/knowledge-base");
		if (existsSync(join(modelPath, "model.json"))) {
			const { IntentClassifierService } = await import("./IntentClassifierService-BF22L3df.js");
			const { NeuralOrchestrator } = await import("./neuralOrchestrator-DggILq01.js");
			const { RagService, KnowledgeBase } = await import("./rag-CM8ewd7C.js");
			const { UnifiedQueryService } = await import("./unifiedQueryService-CWmfmGUT.js");
			const classifier = new IntentClassifierService();
			await classifier.loadModel(modelPath);
			const orchestrator = new NeuralOrchestrator(classifier);
			const kb = new KnowledgeBase();
			await kb.loadFromDirectory(ragDir);
			const rag = new RagService(kb);
			const unifiedQuery = new UnifiedQueryService(orchestrator, container.aiProvider, rag);
			container.aiService.setNeuralOrchestrator(orchestrator);
			container.aiService.setUnifiedQueryService(unifiedQuery);
			container.aiMonitorService.setUnifiedQueryService(unifiedQuery);
			await container.aiService.enableNeuralClassifier();
			logger.info({ modelPath }, "Neural classifier + RAG + UnifiedQuery loaded");
		} else logger.info("Neural model not found at " + modelPath + " — using LLM only");
	} catch (err) {
		logger.warn({ err }, "Neural classifier could not be loaded — using LLM only");
	}
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
//#endregion
