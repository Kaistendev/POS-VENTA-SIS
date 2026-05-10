import { a as ValidationError, i as NotFoundError, n as ConflictError, r as DomainError, t as BusinessRuleError } from "./errors-CsnIJnFo.js";
import "dotenv/config";
import { BrowserWindow, app, dialog, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import { createGunzip, createGzip } from "zlib";
import { ZodError, z } from "zod";
import bcrypt from "bcryptjs";
//#region src/infrastructure/persistence/PrismaProductRepository.ts
var PrismaProductRepository = class {
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(search, categoryId) {
		const where = {};
		if (search) where.OR = [
			{ name: {
				contains: search,
				mode: "insensitive"
			} },
			{ sku: {
				contains: search,
				mode: "insensitive"
			} },
			{ description: {
				contains: search,
				mode: "insensitive"
			} }
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
		await this.prisma.product.update({
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
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(search) {
		const where = search ? { OR: [
			{ dni: {
				contains: search,
				mode: "insensitive"
			} },
			{ name: {
				contains: search,
				mode: "insensitive"
			} },
			{ code: {
				contains: search,
				mode: "insensitive"
			} },
			{ tax_id: {
				contains: search,
				mode: "insensitive"
			} }
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
		const { NotFoundError } = await import("./errors-CsnIJnFo.js").then((n) => n.o);
		throw new NotFoundError(entityName, id);
	}
	return result;
}
//#endregion
//#region src/infrastructure/persistence/PrismaSaleRepository.ts
var PrismaSaleRepository = class {
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(filter) {
		const where = {};
		Object.assign(where, buildDateFilter("created_at", filter?.startDate, filter?.endDate));
		if (filter?.clientId) where.client_id = filter.clientId;
		if (filter?.cashRegisterId) where.cash_register_id = filter.cashRegisterId;
		return this.prisma.sale.findMany({
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
				} }
			},
			orderBy: { created_at: "desc" }
		});
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
				payment_method: input.payment_method
			} });
			for (const item of input.items) {
				await tx.saleItem.create({ data: {
					sale_id: sale.id,
					product_id: item.product_id,
					quantity: item.quantity,
					unit_price: item.unit_price,
					purchase_price: item.purchase_price
				} });
				await tx.product.update({
					where: { id: item.product_id },
					data: { stock: { decrement: item.quantity } }
				});
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
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findOpen() {
		const startOfDay = /* @__PURE__ */ new Date();
		startOfDay.setHours(0, 0, 0, 0);
		return this.prisma.cashRegister.findFirst({
			where: { opened_at: { gte: startOfDay } },
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
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(search) {
		const where = {};
		if (search) where.OR = [
			{ name: {
				contains: search,
				mode: "insensitive"
			} },
			{ ruc: {
				contains: search,
				mode: "insensitive"
			} },
			{ email: {
				contains: search,
				mode: "insensitive"
			} }
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
};
//#endregion
//#region src/infrastructure/persistence/PrismaSettingsRepository.ts
var PrismaSettingsRepository = class {
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
	async count() {
		return this.prisma.user.count();
	}
};
//#endregion
//#region src/infrastructure/persistence/PrismaCategoryRepository.ts
var PrismaCategoryRepository = class {
	constructor(prisma) {
		this.prisma = prisma;
	}
	async findAll(search) {
		const where = search ? { name: {
			contains: search,
			mode: "insensitive"
		} } : {};
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
				path: backupPath
			};
		} catch (error) {
			console.error("[ElectronBackupService] Error creating backup:", error);
			return {
				success: false,
				message: error.message
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
					path: filePath,
					size: stats.size,
					created: stats.mtime
				};
			}).sort((a, b) => b.created.getTime() - a.created.getTime());
		} catch (error) {
			console.error("[ElectronBackupService] Error listing backups:", error);
			return [];
		}
	}
	async restoreBackup(backupPath) {
		try {
			if (!fs.existsSync(backupPath)) return {
				success: false,
				message: "Backup file not found"
			};
			const dbPath = this.getDbPath();
			await this.createBackup("before-restore");
			await pipelineAsync(fs.createReadStream(backupPath), createGunzip(), fs.createWriteStream(dbPath));
			return {
				success: true,
				message: "Backup restored successfully. Restart the app to see changes."
			};
		} catch (error) {
			console.error("[ElectronBackupService] Error restoring backup:", error);
			return {
				success: false,
				message: error.message
			};
		}
	}
	async deleteBackup(backupPath) {
		try {
			if (!fs.existsSync(backupPath)) return {
				success: false,
				message: "Backup file not found"
			};
			fs.unlinkSync(backupPath);
			return { success: true };
		} catch (error) {
			console.error("[ElectronBackupService] Error deleting backup:", error);
			return {
				success: false,
				message: error.message
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
			console.log("[ElectronBackupService] Automatic backup created");
		}
	}
	async cleanupOldBackups(keep = 10) {
		try {
			const backups = await this.listBackups();
			if (backups.length > keep) {
				const toDelete = backups.slice(keep);
				for (const backup of toDelete) fs.unlinkSync(backup.path);
				console.log(`[ElectronBackupService] Cleaned up ${toDelete.length} old backups`);
			}
		} catch (error) {
			console.error("[ElectronBackupService] Error cleaning up backups:", error);
		}
	}
};
//#endregion
//#region src/common/schemas.ts
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
	unit_price: z.coerce.number().min(0, "El precio unitario no puede ser negativo.")
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
//#endregion
//#region src/main/services/ProductService.ts
var ProductService = class {
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
//#region src/main/services/ClientService.ts
var ClientService = class {
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
//#region src/main/services/SaleService.ts
var SaleService = class {
	constructor(saleRepo, productRepo, clientRepo, cashRegisterRepo, settingsRepo, auditLogRepo, dashboardService) {
		this.saleRepo = saleRepo;
		this.productRepo = productRepo;
		this.clientRepo = clientRepo;
		this.cashRegisterRepo = cashRegisterRepo;
		this.settingsRepo = settingsRepo;
		this.auditLogRepo = auditLogRepo;
		this.dashboardService = dashboardService;
	}
	async getAllSales(startDate, endDate, clientId, cashRegisterId) {
		const filter = {};
		if (startDate) filter.startDate = startDate;
		if (endDate) filter.endDate = endDate;
		if (clientId) filter.clientId = clientId;
		if (cashRegisterId) filter.cashRegisterId = cashRegisterId;
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
		const itemsWithPurchasePrice = validated.items.map((item) => {
			const product = productMap.get(item.product_id);
			return {
				product_id: item.product_id,
				quantity: item.quantity,
				unit_price: item.unit_price,
				purchase_price: product?.price_purchase || 0
			};
		});
		const rawTotal = itemsWithPurchasePrice.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
		const taxSettings = await this.settingsRepo.getTaxSettings();
		let subtotal = rawTotal;
		let taxAmount = 0;
		let total = rawTotal;
		if (taxSettings.taxType !== "none" && taxSettings.taxRate > 0) {
			taxAmount = parseFloat((rawTotal * taxSettings.taxRate).toFixed(2));
			total = parseFloat((subtotal + taxAmount).toFixed(2));
		}
		const registerInput = {
			cash_register_id: validated.cash_register_id,
			client_id: finalClientId || 1,
			subtotal,
			tax_amount: taxAmount,
			total,
			items: itemsWithPurchasePrice,
			payment_method: validated.payment_method
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
//#region src/main/services/CashRegisterService.ts
var CashRegisterService = class {
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
		const difference = Number(closingAmount) - expectedCash;
		const salesCount = await this.cashRegisterRepo.getSalesCount(register.id, register.opened_at);
		const status = difference === 0 ? "PERFECT" : difference > 0 ? "SURPLUS" : "MISSING";
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
//#region src/main/services/SupplierService.ts
var SupplierService = class {
	constructor(supplierRepo, auditLogRepo) {
		this.supplierRepo = supplierRepo;
		this.auditLogRepo = auditLogRepo;
	}
	async getAllSuppliers(search) {
		try {
			return await this.supplierRepo.findAll(search);
		} catch (error) {
			console.error("Get all suppliers error:", error);
			throw new Error("Error al obtener proveedores");
		}
	}
	async getSupplierById(id) {
		try {
			const supplier = await this.supplierRepo.findById(id);
			if (!supplier) throw new NotFoundError("Proveedor");
			return supplier;
		} catch (error) {
			console.error("Get supplier by ID error:", error);
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
			console.error("Create supplier error:", error);
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
			console.error("Update supplier error:", error);
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
			console.error("Delete supplier error:", error);
			if (error.code === "P2025") throw new NotFoundError("Proveedor");
			throw error;
		}
	}
};
//#endregion
//#region src/main/services/PurchaseService.ts
var PurchaseService = class {
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
			console.error("Get all purchases error:", error);
			throw new Error("Error al obtener compras");
		}
	}
	async getPurchaseById(id) {
		try {
			const purchase = await this.purchaseRepo.findById(id);
			if (!purchase) throw new NotFoundError("Compra");
			return purchase;
		} catch (error) {
			console.error("Get purchase by ID error:", error);
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
			console.error("Create purchase error:", error);
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
			console.error("Receive purchase error:", error);
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
			console.error("Cancel purchase error:", error);
			if (error.code === "P2025") throw new NotFoundError("Compra");
			throw error;
		}
	}
};
//#endregion
//#region src/main/services/SettingsService.ts
var SettingsService = class {
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
//#region src/main/services/UserService.ts
var UserService = class {
	constructor(userRepo, auditLogRepo) {
		this.userRepo = userRepo;
		this.auditLogRepo = auditLogRepo;
	}
	async getAllUsers() {
		try {
			return await this.userRepo.findAll();
		} catch (error) {
			console.error("Get all users error:", error);
			throw new Error("Error al obtener usuarios");
		}
	}
	async getUserById(id) {
		try {
			const user = await this.userRepo.findById(id);
			if (!user) throw new NotFoundError("Usuario");
			return user;
		} catch (error) {
			console.error("Get user by ID error:", error);
			if (error.code === "P2025") throw new NotFoundError("Usuario");
			throw error;
		}
	}
	async createUser(data, createdBy) {
		try {
			if (await this.userRepo.exists(data.username)) throw new ConflictError(`El usuario '${data.username}' ya existe`);
			if (data.password.length < 6) throw new ValidationError("La contraseña debe tener al menos 6 caracteres");
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(data.password, salt);
			const user = await this.userRepo.create({
				username: data.username,
				password_hash: hashedPassword,
				role: data.role
			});
			await this.auditLogRepo.create({
				userId: createdBy,
				action: "CREATE_USER",
				entity: "users",
				entity_id: user.id
			});
			return user;
		} catch (error) {
			console.error("Create user error:", error);
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
			console.error("Update user error:", error);
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
			console.error("Delete user error:", error);
			if (error.code === "P2025") throw new NotFoundError("Usuario");
			throw error;
		}
	}
	async changePassword(userId, newPassword, changedBy) {
		try {
			if (newPassword.length < 6) throw new ValidationError("La contraseña debe tener al menos 6 caracteres");
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
			console.error("Change password error:", error);
			if (error.code === "P2025") throw new NotFoundError("Usuario");
			throw error;
		}
	}
};
//#endregion
//#region src/main/services/AuthService.ts
var AuthService = class {
	constructor(userRepo) {
		this.userRepo = userRepo;
	}
	async login(username, password) {
		try {
			const user = await this.userRepo.findByUsername(username);
			if (!user) return {
				success: false,
				error: "Usuario no encontrado"
			};
			if (!await bcrypt.compare(password, user.password_hash)) return {
				success: false,
				error: "Contraseña incorrecta"
			};
			const { password_hash: _, ...userWithoutPassword } = user;
			return {
				success: true,
				user: userWithoutPassword
			};
		} catch (error) {
			console.error("Login error:", error);
			if (error.code === "P2025") return {
				success: false,
				error: "Usuario no encontrado"
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
			if (userData.password.length < 6) return {
				success: false,
				error: "La contraseña debe tener al menos 6 caracteres"
			};
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(userData.password, salt);
			const user = await this.userRepo.create({
				username: userData.username,
				password_hash: hashedPassword,
				role: userData.role
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
			console.error("Register error:", error);
			if (error.code === "P2002") return {
				success: false,
				error: "El nombre de usuario ya está en uso"
			};
			return {
				success: false,
				error: "Error interno del servidor"
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
			if (newPassword.length < 6) return {
				success: false,
				error: "La contraseña debe tener al menos 6 caracteres"
			};
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(newPassword, salt);
			await this.userRepo.update(userId, { password_hash: hashedPassword });
			return { success: true };
		} catch (error) {
			console.error("Change password error:", error);
			return {
				success: false,
				error: "Error interno del servidor"
			};
		}
	}
};
//#endregion
//#region src/main/services/CategoryService.ts
var CategoryService = class {
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
//#region src/main/services/BackupService.ts
var BackupService = class {
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
//#region src/main/services/DashboardService.ts
var CACHE_KEY_STATS = "dashboard:stats";
var DashboardService = class {
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
	invalidateCache() {
		this.cache.invalidate();
	}
};
//#endregion
//#region src/main/services/CacheService.ts
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
//#region src/main/di/container.ts
var prisma = new PrismaClient();
var productRepo = new PrismaProductRepository(prisma);
var clientRepo = new PrismaClientRepository(prisma);
var saleRepo = new PrismaSaleRepository(prisma);
var cashRegisterRepo = new PrismaCashRegisterRepository(prisma);
var supplierRepo = new PrismaSupplierRepository(prisma);
var purchaseRepo = new PrismaPurchaseRepository(prisma);
var settingsRepo = new PrismaSettingsRepository(prisma);
var userRepo = new PrismaUserRepository(prisma);
var categoryRepo = new PrismaCategoryRepository(prisma);
var auditLogRepo = new PrismaAuditLogRepository(prisma);
var dashboardRepo = new PrismaDashboardRepository(prisma);
var cacheService = new CacheService();
var backupAdapter = new ElectronBackupService();
var dashboardService = new DashboardService(dashboardRepo, cacheService);
var productService = new ProductService(productRepo, categoryRepo, auditLogRepo);
var clientService = new ClientService(clientRepo, auditLogRepo);
var cashRegisterService = new CashRegisterService(cashRegisterRepo, auditLogRepo);
var settingsService = new SettingsService(settingsRepo);
var userService = new UserService(userRepo, auditLogRepo);
var authService = new AuthService(userRepo);
var supplierService = new SupplierService(supplierRepo, auditLogRepo);
var purchaseService = new PurchaseService(purchaseRepo, supplierRepo, productRepo, auditLogRepo);
var saleService = new SaleService(saleRepo, productRepo, clientRepo, cashRegisterRepo, settingsRepo, auditLogRepo, dashboardService);
var backupService = new BackupService(backupAdapter);
var container = {
	prisma,
	productService,
	clientService,
	saleService,
	cashRegisterService,
	settingsService,
	userService,
	authService,
	supplierService,
	purchaseService,
	categoryService: new CategoryService(categoryRepo, auditLogRepo),
	dashboardService,
	backupService,
	cacheService
};
//#endregion
//#region src/main/utils/ipcWrapper.ts
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
	console.error("Unhandled IPC Error:", error);
	return {
		success: false,
		message: error.message || "Ocurrió un error inesperado en el sistema",
		code: "INTERNAL"
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
//#region src/main/ipc.ts
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
			await container.prisma.$queryRaw`SELECT 1`;
			return {
				success: true,
				database: "connected",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		} catch (error) {
			return {
				success: false,
				database: "disconnected",
				error: error.message,
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		}
	});
	/**
	* DASHBOARD
	*/
	ipcMain.handle("dashboard:getStats", async (_, startDate, endDate) => {
		try {
			return await container.dashboardService.getStats(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("dashboard:getWeeklySales", async (_, days) => {
		try {
			return await container.dashboardService.getWeeklySales(days);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getLowStock", async (_, limit) => {
		try {
			return await container.dashboardService.getLowStockProducts(limit || 50);
		} catch (error) {
			console.error("[IPC] Error getting low stock:", error);
			return [];
		}
	});
	ipcMain.handle("dashboard:getSalesByPayment", async (_, startDate, endDate) => {
		try {
			return await container.dashboardService.getSalesByPaymentMethod(startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getTopProducts", async (_, limit, startDate, endDate) => {
		try {
			return await container.dashboardService.getTopProducts(limit, startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getTopClients", async (_, limit, startDate, endDate) => {
		try {
			return await container.dashboardService.getTopClients(limit, startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getSalesByHour", async (_, startDate, endDate) => {
		try {
			return await container.dashboardService.getSalesByHour(startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getCashSummary", async (_, startDate, endDate) => {
		try {
			return await container.dashboardService.getCashRegisterSummary(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("dashboard:getInventoryMetrics", async () => {
		try {
			return await container.dashboardService.getInventoryMetrics();
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("dashboard:invalidateCache", async () => {
		try {
			container.dashboardService.invalidateCache();
			return { success: true };
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	/**
	* SETTINGS
	*/
	ipcMain.handle("settings:getAll", async () => {
		try {
			return await container.settingsService.getSettings();
		} catch (error) {
			return {};
		}
	});
	ipcMain.handle("settings:update", async (_, settings) => {
		try {
			return await container.settingsService.updateSettings(settings);
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	/**
	* CASH REGISTERS
	*/
	ipcMain.handle("cash:getOpen", async () => {
		try {
			return await container.cashRegisterService.getOpenRegister();
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("cash:getAll", async (_, startDate, endDate) => {
		try {
			return await container.cashRegisterService.getAllRegisters(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener cajas"
			};
		}
	});
	ipcMain.handle("cash:getDetails", async (_, id) => {
		try {
			return await container.cashRegisterService.getRegisterDetails(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener detalles de caja"
			};
		}
	});
	ipcMain.handle("cash:getDailySummary", async (_, registerId) => {
		try {
			return await container.cashRegisterService.getDailySummary(registerId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener resumen del día"
			};
		}
	});
	ipcMain.handle("cash:open", wrapIpc((amount, userId) => container.cashRegisterService.openRegister(amount, userId)));
	ipcMain.handle("cash:close", wrapIpc((id, amount, userId) => container.cashRegisterService.closeRegister(id, amount, userId)));
	/**
	* AUTH
	*/
	ipcMain.handle("auth:login", async (_, username, password) => {
		try {
			return await container.authService.login(username, password);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error de autenticación"
			};
		}
	});
	/**
	* CLIENTS
	*/
	ipcMain.handle("clients:getAll", async (_, search) => {
		try {
			return await container.clientService.getAllClients(search);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener clientes"
			};
		}
	});
	ipcMain.handle("clients:getById", async (_, id) => {
		try {
			return await container.clientService.getClientById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener cliente"
			};
		}
	});
	ipcMain.handle("clients:create", wrapIpc((clientData, userId) => container.clientService.createClient(clientData, userId), clientSchema));
	ipcMain.handle("clients:update", wrapIpc((id, clientData, userId) => container.clientService.updateClient(id, clientData, userId)));
	ipcMain.handle("clients:delete", async (_, id, userId) => {
		try {
			return await container.clientService.deleteClient(id, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al eliminar cliente"
			};
		}
	});
	/**
	* PRODUCTS
	*/
	ipcMain.handle("products:getAll", async (_, search, categoryId) => {
		try {
			return await container.productService.getAllProducts(search, categoryId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener productos"
			};
		}
	});
	ipcMain.handle("products:getById", async (_, id) => {
		try {
			return await container.productService.getProductById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener producto"
			};
		}
	});
	ipcMain.handle("products:getLowStock", async () => {
		try {
			return await container.dashboardService.getLowStockProducts(50);
		} catch (error) {
			console.error("Get low stock products error:", error);
			return [];
		}
	});
	ipcMain.handle("products:create", wrapIpc((productData, userId) => container.productService.createProduct(productData, userId), productSchema));
	ipcMain.handle("products:update", wrapIpc((id, productData, userId) => container.productService.updateProduct(id, productData, userId)));
	ipcMain.handle("products:delete", async (_, id, userId) => {
		try {
			return await container.productService.deleteProduct(id, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al eliminar producto"
			};
		}
	});
	ipcMain.handle("products:addStock", async (_, productId, quantity, userId, reason) => {
		try {
			return await container.productService.addStock(productId, quantity, userId, reason);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al añadir stock"
			};
		}
	});
	ipcMain.handle("products:removeStock", async (_, productId, quantity, userId, reason) => {
		try {
			return await container.productService.removeStock(productId, quantity, userId, reason);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al reducir stock"
			};
		}
	});
	ipcMain.handle("products:getMovements", async (_, productId, limit) => {
		try {
			return await container.productService.getInventoryMovements(productId, limit);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener movimientos"
			};
		}
	});
	/**
	* SALES
	*/
	ipcMain.handle("sales:getAll", async (_, startDate, endDate, clientId, cashRegisterId) => {
		try {
			return await container.saleService.getAllSales(startDate, endDate, clientId, cashRegisterId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener ventas"
			};
		}
	});
	ipcMain.handle("sales:getToday", async () => {
		try {
			return await container.saleService.getTodaySales();
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener ventas del día"
			};
		}
	});
	ipcMain.handle("sales:getLast", async () => {
		try {
			return await container.saleService.getLastSale();
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("sales:getStats", async (_, startDate, endDate) => {
		try {
			return await container.saleService.getSalesStats(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener estadísticas"
			};
		}
	});
	ipcMain.handle("sales:getDetails", async (_, saleId) => {
		try {
			return await container.saleService.getSaleDetails(saleId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener detalles de venta"
			};
		}
	});
	ipcMain.handle("sales:register", wrapIpc(async (saleData, itemsData, userId) => {
		return container.saleService.registerSale(saleData, itemsData, userId);
	}, saleSchema.omit({ items: true })));
	ipcMain.handle("sales:cancel", async (_, saleId, userId) => {
		try {
			return await container.saleService.cancelSale(saleId, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al cancelar venta"
			};
		}
	});
	/**
	* CATEGORIES
	*/
	ipcMain.handle("categories:getAll", async (_, search) => {
		return await container.categoryService.getAllCategories(search);
	});
	ipcMain.handle("categories:getById", async (_, id) => {
		try {
			return await container.categoryService.getCategoryById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener categoría"
			};
		}
	});
	ipcMain.handle("categories:create", wrapIpc(async (categoryData, userId) => {
		return await container.categoryService.createCategory(categoryData, userId);
	}, categorySchema));
	ipcMain.handle("categories:update", wrapIpc(async (id, categoryData, userId) => {
		const parsed = categorySchema.parse(categoryData);
		return await container.categoryService.updateCategory(id, parsed, userId);
	}));
	ipcMain.handle("categories:delete", wrapIpc(async (id, userId) => {
		return await container.categoryService.deleteCategory(id, userId);
	}));
	/**
	* USERS
	*/
	ipcMain.handle("users:getAll", async () => {
		try {
			return await container.userService.getAllUsers();
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener usuarios"
			};
		}
	});
	ipcMain.handle("users:getById", async (_, id) => {
		try {
			return await container.userService.getUserById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener usuario"
			};
		}
	});
	ipcMain.handle("users:create", async (_, userData, createdBy) => {
		try {
			return {
				success: true,
				user: await container.userService.createUser(userData, createdBy)
			};
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al crear usuario"
			};
		}
	});
	ipcMain.handle("users:update", async (_, id, userData, updatedBy) => {
		try {
			return {
				success: true,
				user: await container.userService.updateUser(id, userData, updatedBy)
			};
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al actualizar usuario"
			};
		}
	});
	ipcMain.handle("users:delete", async (_, id, deletedBy) => {
		try {
			return await container.userService.deleteUser(id, deletedBy);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al eliminar usuario"
			};
		}
	});
	ipcMain.handle("users:changePassword", async (_, userId, newPassword, changedBy) => {
		try {
			return await container.userService.changePassword(userId, newPassword, changedBy);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al cambiar contraseña"
			};
		}
	});
	/**
	* INVENTORY MOVEMENTS
	*/
	ipcMain.handle("movements:getAll", async () => {
		try {
			return await container.prisma.inventoryMovement.findMany({
				include: { product: { select: {
					id: true,
					name: true,
					sku: true
				} } },
				orderBy: { created_at: "desc" },
				take: 500
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
			return await container.supplierService.getAllSuppliers(search);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("suppliers:getById", async (_, id) => {
		try {
			return await container.supplierService.getSupplierById(id);
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("suppliers:create", async (_, data, userId) => {
		try {
			return {
				success: true,
				supplier: await container.supplierService.createSupplier(data, userId)
			};
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al crear proveedor"
			};
		}
	});
	ipcMain.handle("suppliers:update", async (_, id, data, userId) => {
		try {
			return {
				success: true,
				supplier: await container.supplierService.updateSupplier(id, data, userId)
			};
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al actualizar proveedor"
			};
		}
	});
	ipcMain.handle("suppliers:delete", async (_, id, userId) => {
		try {
			return await container.supplierService.deleteSupplier(id, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al eliminar proveedor"
			};
		}
	});
	/**
	* PURCHASES
	*/
	ipcMain.handle("purchases:getAll", async (_, supplierId, status) => {
		try {
			return await container.purchaseService.getAllPurchases(supplierId, status);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("purchases:getById", async (_, id) => {
		try {
			return await container.purchaseService.getPurchaseById(id);
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("purchases:create", async (_, data, userId) => {
		try {
			return {
				success: true,
				purchase: await container.purchaseService.createPurchase(data, userId)
			};
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al crear orden de compra"
			};
		}
	});
	ipcMain.handle("purchases:receive", async (_, purchaseId, userId) => {
		try {
			return await container.purchaseService.receivePurchase(purchaseId, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al recibir compra"
			};
		}
	});
	ipcMain.handle("purchases:cancel", async (_, purchaseId, userId) => {
		try {
			return await container.purchaseService.cancelPurchase(purchaseId, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al cancelar compra"
			};
		}
	});
	ipcMain.handle("backup:create", async (_, label) => {
		try {
			return await container.backupService.createBackup(label);
		} catch (error) {
			console.error("[IPC] Error creating backup:", error);
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("backup:list", async () => {
		try {
			return await container.backupService.listBackups();
		} catch (error) {
			console.error("[IPC] Error listing backups:", error);
			return [];
		}
	});
	ipcMain.handle("backup:restore", async (_, backupPath) => {
		try {
			return await container.backupService.restoreBackup(backupPath);
		} catch (error) {
			console.error("[IPC] Error restoring backup:", error);
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("backup:delete", async (_, backupPath) => {
		try {
			return await container.backupService.deleteBackup(backupPath);
		} catch (error) {
			console.error("[IPC] Error deleting backup:", error);
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("settings:getTax", async () => {
		try {
			return await container.settingsService.getTaxSettings();
		} catch (error) {
			console.error("[IPC] Error getting tax settings:", error);
			return {
				taxRate: 0,
				taxType: "none",
				taxIncluded: false
			};
		}
	});
	ipcMain.handle("settings:updateTax", async (_, taxRate, taxType, taxIncluded) => {
		try {
			return await container.settingsService.updateTaxSettings(taxRate, taxType, taxIncluded);
		} catch (error) {
			console.error("[IPC] Error updating tax settings:", error);
			return {
				success: false,
				message: error.message
			};
		}
	});
}
//#endregion
//#region src/main/index.ts
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
	try {
		await container.prisma.$connect();
		await container.prisma.$queryRaw`PRAGMA journal_mode=WAL`;
		await container.prisma.$queryRaw`PRAGMA synchronous=NORMAL`;
		await container.prisma.$queryRaw`PRAGMA cache_size=10000`;
		await container.prisma.$queryRaw`PRAGMA temp_store=MEMORY`;
		console.log("✅ Prisma connected to SQLite successfully.");
	} catch (err) {
		console.error("❌ Failed to connect to SQLite:", err);
	}
	setupIpcHandlers();
	createWindow();
	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});
//#endregion
