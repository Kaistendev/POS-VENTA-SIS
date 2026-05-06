import "dotenv/config";
import { BrowserWindow, app, dialog, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import { ZodError, z } from "zod";
import bcrypt from "bcryptjs";
import fs from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import { createGunzip, createGzip } from "zlib";
//#region src/main/prisma/client.ts
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: "file:./dev.sqlite3?mode=rwc" } } });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
async function setupSQLite() {
	try {
		await prisma.$connect();
		await prisma.$queryRaw`PRAGMA journal_mode=WAL`;
		await prisma.$queryRaw`PRAGMA synchronous=NORMAL`;
		await prisma.$queryRaw`PRAGMA cache_size=10000`;
		await prisma.$queryRaw`PRAGMA temp_store=MEMORY`;
	} catch (e) {
		console.warn("SQLite PRAGMA setup:", e);
	}
}
setupSQLite();
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
//#region src/main/utils/auditLog.ts
/**
* Gets the first admin user from the database.
* Used as a fallback when no userId is provided.
*/
async function getDefaultAdminUserId() {
	try {
		return (await prisma.user.findFirst({
			where: { role: "ADMIN" },
			select: { id: true },
			orderBy: { id: "asc" }
		}))?.id ?? null;
	} catch {
		return null;
	}
}
/**
* Safely creates an audit log entry.
* Verifies the user exists before creating the log to avoid foreign key errors.
*/
async function createAuditLog({ userId, action, entity, entity_id }) {
	let finalUserId = userId;
	try {
		if (finalUserId) {
			if (!await prisma.user.findUnique({
				where: { id: finalUserId },
				select: { id: true }
			})) {
				finalUserId = await getDefaultAdminUserId();
				if (!finalUserId) {
					console.warn(`User ${userId} not found and no admin available, skipping audit log`);
					return;
				}
				console.warn(`User ${userId} not found, using admin user ${finalUserId} for audit log`);
			}
		} else {
			finalUserId = await getDefaultAdminUserId();
			if (!finalUserId) {
				console.warn("No userId provided and no admin user found, skipping audit log");
				return;
			}
		}
		await prisma.auditLog.create({ data: {
			user_id: finalUserId,
			action,
			entity,
			entity_id
		} });
	} catch (error) {
		console.warn("Failed to create audit log:", error);
	}
}
//#endregion
//#region src/main/services/ClientService.ts
var ClientService = class {
	/**
	* Obtiene todos los clientes con búsqueda opcional
	*/
	static async getAllClients(search) {
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
		return prisma.client.findMany({
			where,
			orderBy: { created_at: "desc" }
		});
	}
	/**
	* Obtiene un cliente por ID
	*/
	static async getClientById(id) {
		const client = await prisma.client.findUnique({ where: { id } });
		if (!client) throw new Error("Cliente no encontrado");
		return client;
	}
	/**
	* Crea un cliente y deja la trazabilidad de la creación
	*/
	static async createClient(clientData, userId = 1) {
		const validated = clientSchema.parse(clientData);
		if (await prisma.client.findFirst({ where: { dni: validated.dni } })) throw new Error(`El DNI ${validated.dni} ya se encuentra registrado.`);
		if (await prisma.client.findFirst({ where: { code: validated.code } })) throw new Error(`El código ${validated.code} ya se encuentra registrado.`);
		if (validated.tax_id) {
			if (await prisma.client.findFirst({ where: { tax_id: validated.tax_id } })) throw new Error(`El RUC ${validated.tax_id} ya se encuentra registrado.`);
		}
		const client = await prisma.client.create({ data: validated });
		await createAuditLog({
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
	/**
	* Actualiza un cliente y deja la trazabilidad de la actualización
	*/
	static async updateClient(id, clientData, userId = 1) {
		if (!await prisma.client.findUnique({ where: { id } })) throw new Error("Cliente no encontrado");
		const validated = clientSchema.parse(clientData);
		if (await prisma.client.findFirst({ where: {
			dni: validated.dni,
			NOT: { id }
		} })) throw new Error(`El DNI ${validated.dni} ya se encuentra registrado.`);
		if (await prisma.client.findFirst({ where: {
			code: validated.code,
			NOT: { id }
		} })) throw new Error(`El código ${validated.code} ya se encuentra registrado.`);
		if (validated.tax_id) {
			if (await prisma.client.findFirst({ where: {
				tax_id: validated.tax_id,
				NOT: { id }
			} })) throw new Error(`El RUC ${validated.tax_id} ya se encuentra registrado.`);
		}
		const client = await prisma.client.update({
			where: { id },
			data: validated
		});
		await createAuditLog({
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
	/**
	* Elimina un cliente y deja la trazabilidad de la eliminación
	*/
	static async deleteClient(id, userId = 1) {
		if (!await prisma.client.findUnique({ where: { id } })) throw new Error("Cliente no encontrado");
		const salesCount = await prisma.sale.count({ where: { client_id: id } });
		if (salesCount > 0) throw new Error(`No se puede eliminar el cliente porque tiene ${salesCount} venta(s) asociada(s).`);
		await prisma.client.delete({ where: { id } });
		await createAuditLog({
			userId,
			action: "DELETE_CLIENT",
			entity: "clients",
			entity_id: id
		});
		return { success: true };
	}
};
//#endregion
//#region src/main/services/ProductService.ts
var ProductService = class {
	/**
	* Obtiene todos los productos con búsqueda opcional
	*/
	static async getAllProducts(search, categoryId) {
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
		return prisma.product.findMany({
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
	/**
	* Obtiene un producto por ID
	*/
	static async getProductById(id) {
		const product = await prisma.product.findUnique({
			where: { id },
			include: {
				category: true,
				supplier: true
			}
		});
		if (!product) throw new Error("Producto no encontrado");
		return product;
	}
	/**
	* Obtiene productos con stock bajo
	*/
	static async getLowStockProducts(threshold) {
		return prisma.product.findMany({
			where: { stock: { lte: prisma.product.fields.min_stock } },
			include: { category: true },
			orderBy: { stock: "asc" }
		});
	}
	/**
	* Crea un nuevo producto
	*/
	static async createProduct(productData, userId = 1) {
		const validated = productSchema.parse(productData);
		if (await prisma.product.findUnique({ where: { sku: validated.sku } })) throw new Error(`El SKU ${validated.sku} ya se encuentra registrado.`);
		if (validated.category_id) {
			if (!await prisma.category.findUnique({ where: { id: validated.category_id } })) throw new Error("La categoría especificada no existe.");
		}
		const initialStock = validated.stock || 0;
		const product = await prisma.product.create({ data: {
			sku: validated.sku,
			name: validated.name,
			price_sale: validated.price_sale,
			price_purchase: validated.price_purchase,
			description: validated.description,
			category_id: validated.category_id,
			supplier_id: validated.supplier_id,
			min_stock: validated.min_stock,
			stock: initialStock
		} });
		if (initialStock > 0) await prisma.inventoryMovement.create({ data: {
			product_id: product.id,
			type: "ENTRADA",
			quantity: initialStock,
			reason: "INICIAL"
		} });
		await createAuditLog({
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
	/**
	* Actualiza un producto existente
	*/
	static async updateProduct(id, productData, userId = 1) {
		const existingProduct = await prisma.product.findUnique({ where: { id } });
		if (!existingProduct) throw new Error("Producto no encontrado");
		const validated = productSchema.parse(productData);
		if (validated.sku !== existingProduct.sku) {
			if (await prisma.product.findUnique({ where: { sku: validated.sku } })) throw new Error(`El SKU ${validated.sku} ya se encuentra registrado.`);
		}
		if (validated.category_id) {
			if (!await prisma.category.findUnique({ where: { id: validated.category_id } })) throw new Error("La categoría especificada no existe.");
		}
		const product = await prisma.product.update({
			where: { id },
			data: {
				sku: validated.sku,
				name: validated.name,
				price_sale: validated.price_sale,
				price_purchase: validated.price_purchase,
				description: validated.description,
				category_id: validated.category_id,
				supplier_id: validated.supplier_id,
				min_stock: validated.min_stock
			},
			include: {
				category: true,
				supplier: true
			}
		});
		await createAuditLog({
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
	/**
	* Elimina un producto
	*/
	static async deleteProduct(id, userId = 1) {
		if (!await prisma.product.findUnique({ where: { id } })) throw new Error("Producto no encontrado");
		const salesCount = await prisma.saleItem.count({ where: { product_id: id } });
		if (salesCount > 0) throw new Error(`No se puede eliminar el producto porque tiene ${salesCount} venta(s) asociada(s).`);
		await prisma.product.delete({ where: { id } });
		await createAuditLog({
			userId,
			action: "DELETE_PRODUCT",
			entity: "products",
			entity_id: id
		});
		return { success: true };
	}
	/**
	* Añade stock inicial o adicional (ENTRADA)
	*/
	static async addStock(productId, quantity, userId = 1, reason = "AJUSTE") {
		if (!await prisma.product.findUnique({ where: { id: productId } })) throw new Error("El producto no existe.");
		if (quantity <= 0) throw new Error("La cantidad debe ser mayor a cero.");
		await prisma.product.update({
			where: { id: productId },
			data: { stock: { increment: quantity } }
		});
		await prisma.inventoryMovement.create({ data: {
			product_id: productId,
			type: "ENTRADA",
			quantity,
			reason
		} });
		await createAuditLog({
			userId,
			action: "STOCK_ENTRADA",
			entity: "products",
			entity_id: productId
		});
		return { success: true };
	}
	/**
	* Reduce stock (SALIDA) - Para devoluciones o ajustes
	*/
	static async removeStock(productId, quantity, userId = 1, reason = "AJUSTE") {
		const product = await prisma.product.findUnique({ where: { id: productId } });
		if (!product) throw new Error("El producto no existe.");
		if (quantity <= 0) throw new Error("La cantidad debe ser mayor a cero.");
		if (product.stock < quantity) throw new Error(`Stock insuficiente. Stock actual: ${product.stock}, Cantidad solicitada: ${quantity}`);
		await prisma.product.update({
			where: { id: productId },
			data: { stock: { decrement: quantity } }
		});
		await prisma.inventoryMovement.create({ data: {
			product_id: productId,
			type: "SALIDA",
			quantity,
			reason
		} });
		await createAuditLog({
			userId,
			action: "STOCK_SALIDA",
			entity: "products",
			entity_id: productId
		});
		return { success: true };
	}
	/**
	* Obtiene el historial de movimientos de un producto
	*/
	static async getInventoryMovements(productId, limit = 50) {
		if (!await prisma.product.findUnique({ where: { id: productId } })) throw new Error("El producto no existe.");
		return prisma.inventoryMovement.findMany({
			where: { product_id: productId },
			orderBy: { created_at: "desc" },
			take: limit
		});
	}
};
//#endregion
//#region src/main/repositories/DashboardRepository.ts
var DashboardRepository = class {
	static statsCache = null;
	static CACHE_DURATION = 3e4;
	/**
	* Obtiene estadísticas generales del dashboard
	*/
	static async getStats(startDate, endDate) {
		if (!startDate && !endDate && this.statsCache) {
			if (Date.now() - this.statsCache.timestamp < this.CACHE_DURATION) return this.statsCache.data;
		}
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		const filterWhere = Object.keys(where).length === 0 ? { created_at: { gte: new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) } } : where;
		const revenueResult = await prisma.sale.aggregate({
			where: filterWhere,
			_sum: { total: true }
		});
		const salesCount = await prisma.sale.count({ where: filterWhere });
		const totalProfit = (await prisma.sale.findMany({
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
		const activeProducts = await prisma.product.count({ where: { stock: { gt: 0 } } });
		const totalClients = await prisma.client.count();
		const lowStockCount = await prisma.product.count({ where: { stock: { lt: prisma.product.fields.min_stock } } });
		const result = {
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
		if (!startDate && !endDate) this.statsCache = {
			data: result,
			timestamp: Date.now()
		};
		return result;
	}
	/**
	* Invalida el cache de estadísticas
	*/
	static invalidateCache() {
		this.statsCache = null;
	}
	/**
	* Obtiene ventas de los últimos N días agrupadas por fecha
	*/
	static async getWeeklySales(days = 7) {
		const startDate = /* @__PURE__ */ new Date();
		startDate.setDate(startDate.getDate() - days);
		const groupedByDate = (await prisma.sale.findMany({
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
	/**
	* Obtiene productos con stock bajo
	*/
	static async getLowStockProducts(limit = 10) {
		console.log("[DashboardRepository] Fetching low stock products with limit:", limit);
		const formatted = (await prisma.$queryRaw`
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
		console.log("[DashboardRepository] Found low stock products:", formatted.length, formatted);
		return formatted;
	}
	/**
	* Obtiene ventas por método de pago
	*/
	static async getSalesByPaymentMethod(startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		return prisma.sale.groupBy({
			by: ["payment_method"],
			where,
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true }
		});
	}
	/**
	* Obtiene top productos más vendidos
	*/
	static async getTopProducts(limit = 10, startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		const topProducts = await prisma.saleItem.groupBy({
			by: ["product_id"],
			where,
			_sum: { quantity: true },
			_avg: { unit_price: true },
			_count: { id: true },
			orderBy: { _sum: { quantity: "desc" } },
			take: limit
		});
		const productIds = topProducts.map((item) => item.product_id);
		const products = await prisma.product.findMany({
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
	/**
	* Obtiene top clientes por ventas
	*/
	static async getTopClients(limit = 10, startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		const topClients = await prisma.sale.groupBy({
			by: ["client_id"],
			where,
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true },
			orderBy: { _sum: { total: "desc" } },
			take: limit
		});
		const clientIds = topClients.map((item) => item.client_id).filter((id) => id !== null);
		const clients = await prisma.client.findMany({ where: { id: { in: clientIds } } });
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
	/**
	* Obtiene ventas por hora del día (para análisis de picos de venta)
	*/
	static async getSalesByHour(startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		const sales = await prisma.sale.findMany({
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
	/**
	* Obtiene resumen de caja (cash registers)
	*/
	static async getCashRegisterSummary(startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.opened_at = {};
			if (startDate) where.opened_at.gte = startDate;
			if (endDate) where.opened_at.lte = endDate;
		}
		const registers = await prisma.cashRegister.findMany({
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
			summary: registers.reduce((acc, reg) => {
				acc.totalRegisters += 1;
				acc.totalOpening += reg.opening_amount;
				acc.totalSales += reg.total_sales;
				return acc;
			}, {
				totalRegisters: 0,
				totalOpening: 0,
				totalSales: 0
			})
		};
	}
	/**
	* Obtiene métricas de inventario
	*/
	static async getInventoryMetrics() {
		const totalProducts = await prisma.product.count();
		const productsWithStock = await prisma.product.count({ where: { stock: { gt: 0 } } });
		const productsWithoutStock = await prisma.product.count({ where: { stock: { equals: 0 } } });
		const lowStockProducts = await prisma.product.count({ where: { stock: { lt: prisma.product.fields.min_stock } } });
		const inventoryValue = await prisma.product.aggregate({
			_sum: { price_purchase: true },
			where: { stock: { gt: 0 } }
		});
		const inventorySaleValue = await prisma.product.aggregate({
			_sum: { price_sale: true },
			where: { stock: { gt: 0 } }
		});
		const recentMovements = await prisma.inventoryMovement.findMany({
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
//#region src/main/services/SaleService.ts
var SaleService = class {
	/**
	* Obtiene todas las ventas con filtros opcionales
	*/
	static async getAllSales(startDate, endDate, clientId, cashRegisterId) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		if (clientId) where.client_id = clientId;
		if (cashRegisterId) where.cash_register_id = cashRegisterId;
		return prisma.sale.findMany({
			where,
			select: {
				id: true,
				total: true,
				payment_method: true,
				created_at: true,
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
	/**
	* Obtiene una venta por ID con todos sus detalles
	*/
	static async getSaleDetails(id) {
		const sale = await prisma.sale.findUnique({
			where: { id },
			include: {
				items: { include: { product: true } },
				client: true,
				cash_register: true
			}
		});
		if (!sale) throw new Error("Venta no encontrada");
		return sale;
	}
	/**
	* Obtiene ventas del día actual
	*/
	static async getTodaySales() {
		const startOfDay = /* @__PURE__ */ new Date();
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = /* @__PURE__ */ new Date();
		endOfDay.setHours(23, 59, 59, 999);
		return prisma.sale.findMany({
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
	/**
	* Obtiene estadísticas de ventas
	*/
	static async getSalesStats(startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.created_at = {};
			if (startDate) where.created_at.gte = startDate;
			if (endDate) where.created_at.lte = endDate;
		}
		const stats = await prisma.sale.aggregate({
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
	/**
	* Obtiene la última venta registrada
	*/
	static async getLastSale() {
		return prisma.sale.findFirst({
			orderBy: { created_at: "desc" },
			include: { items: true }
		});
	}
	/**
	* Registra una nueva venta con actualización de inventario
	*/
	static async registerSale(saleData, itemsData, userId = 1) {
		const validated = saleSchema.parse({
			...saleData,
			items: itemsData
		});
		if (!await prisma.cashRegister.findFirst({ where: {
			id: validated.cash_register_id,
			opened_at: { gte: new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) }
		} })) throw new Error("La caja no está abierta o no existe.");
		let finalClientId = validated.client_id;
		if (validated.client_dni && validated.client_name && !finalClientId) {
			const existingClient = await prisma.client.findFirst({ where: { dni: validated.client_dni } });
			if (existingClient) finalClientId = existingClient.id;
			else finalClientId = (await prisma.client.create({ data: {
				dni: validated.client_dni,
				name: validated.client_name,
				code: `CLI-${Date.now()}`
			} })).id;
		}
		if (finalClientId) {
			if (!await prisma.client.findUnique({ where: { id: finalClientId } })) throw new Error("El cliente no existe.");
		}
		const saleId = await prisma.$transaction(async (tx) => {
			const productIds = validated.items.map((item) => item.product_id);
			const products = await tx.product.findMany({ where: { id: { in: productIds } } });
			const productMap = new Map(products.map((p) => [p.id, p]));
			for (const item of validated.items) {
				const product = productMap.get(item.product_id);
				if (!product) throw new Error(`El producto ID ${item.product_id} no existe.`);
				if (product.stock < item.quantity) throw new Error(`Stock insuficiente para "${product.name}". Stock actual: ${product.stock}, Cantidad solicitada: ${item.quantity}`);
			}
			const itemsWithPurchasePrice = validated.items.map((item) => {
				const product = productMap.get(item.product_id);
				return {
					...item,
					purchase_price: product?.price_purchase || 0
				};
			});
			const total = itemsWithPurchasePrice.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
			const sale = await tx.sale.create({ data: {
				cash_register_id: validated.cash_register_id,
				client_id: finalClientId || 1,
				total
			} });
			for (const item of itemsWithPurchasePrice) {
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
				where: { id: validated.cash_register_id },
				data: { total_sales: { increment: total } }
			});
			return sale.id;
		});
		DashboardRepository.invalidateCache();
		await createAuditLog({
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
	/**
	* Anula una venta (devolución completa)
	*/
	static async cancelSale(saleId, userId = 1) {
		const sale = await prisma.sale.findUnique({
			where: { id: saleId },
			include: { items: true }
		});
		if (!sale) throw new Error("Venta no encontrada");
		await prisma.$transaction(async (tx) => {
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
		DashboardRepository.invalidateCache();
		await createAuditLog({
			userId,
			action: "CANCEL_SALE",
			entity: "sales",
			entity_id: saleId
		});
		return { success: true };
	}
};
//#endregion
//#region src/main/repositories/UserRepository.ts
var UserRepository = class {
	/**
	* Find all users (without password hash)
	*/
	static async findAll() {
		return prisma.user.findMany({
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
	/**
	* Find user by ID (without password hash)
	*/
	static async findById(id) {
		return prisma.user.findUnique({
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
	/**
	* Find user by username (with password hash for authentication)
	*/
	static async findByUsername(username) {
		return prisma.user.findUnique({ where: { username } });
	}
	/**
	* Create a new user
	*/
	static async create(data) {
		return prisma.user.create({
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
	/**
	* Update an existing user
	*/
	static async update(id, data) {
		return prisma.user.update({
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
	/**
	* Delete a user by ID
	*/
	static async delete(id) {
		return prisma.user.delete({ where: { id } });
	}
	/**
	* Check if username exists
	*/
	static async exists(username, excludeId) {
		return !!await prisma.user.findFirst({
			where: {
				username,
				...excludeId && { id: { not: excludeId } }
			},
			select: { id: true }
		});
	}
	/**
	* Count total users
	*/
	static async count() {
		return prisma.user.count();
	}
};
//#endregion
//#region src/main/services/AuthService.ts
var AuthService = class {
	/**
	* Intenta iniciar sesión comparando el hash de la base de datos
	*/
	static async login(username, password) {
		try {
			const user = await UserRepository.findByUsername(username);
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
	/**
	* Registra un nuevo usuario hasheando su contraseña
	*/
	static async register(userData) {
		try {
			if (await UserRepository.exists(userData.username)) return {
				success: false,
				error: `El usuario '${userData.username}' ya existe`
			};
			if (userData.password.length < 6) return {
				success: false,
				error: "La contraseña debe tener al menos 6 caracteres"
			};
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(userData.password, salt);
			const user = await UserRepository.create({
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
	/**
	* Cambia la contraseña de un usuario
	*/
	static async changePassword(userId, oldPassword, newPassword) {
		try {
			const user = await prisma.user.findUnique({ where: { id: userId } });
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
			await UserRepository.update(userId, { password_hash: hashedPassword });
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
//#region src/main/services/UserService.ts
var UserService = class {
	/**
	* Get all users (without password hashes)
	*/
	static async getAllUsers() {
		try {
			return await UserRepository.findAll();
		} catch (error) {
			console.error("Get all users error:", error);
			throw new Error("Error al obtener usuarios");
		}
	}
	/**
	* Get user by ID
	*/
	static async getUserById(id) {
		try {
			const user = await UserRepository.findById(id);
			if (!user) throw new Error("Usuario no encontrado");
			return user;
		} catch (error) {
			console.error("Get user by ID error:", error);
			if (error.code === "P2025") throw new Error("Usuario no encontrado");
			throw new Error("Error al obtener usuario");
		}
	}
	/**
	* Create a new user
	*/
	static async createUser(data, createdBy) {
		try {
			if (await UserRepository.exists(data.username)) throw new Error(`El usuario '${data.username}' ya existe`);
			if (data.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(data.password, salt);
			const user = await UserRepository.create({
				username: data.username,
				password_hash: hashedPassword,
				role: data.role
			});
			await createAuditLog({
				userId: createdBy,
				action: "CREATE_USER",
				entity: "users",
				entity_id: user.id
			});
			return user;
		} catch (error) {
			console.error("Create user error:", error);
			if (error.code === "P2002") throw new Error("El nombre de usuario ya está en uso");
			throw error;
		}
	}
	/**
	* Update an existing user
	*/
	static async updateUser(id, data, updatedBy) {
		try {
			if (data.username) {
				if (await UserRepository.exists(data.username, id)) throw new Error(`El usuario '${data.username}' ya existe`);
			}
			const user = await UserRepository.update(id, data);
			await createAuditLog({
				userId: updatedBy,
				action: "UPDATE_USER",
				entity: "users",
				entity_id: id
			});
			return user;
		} catch (error) {
			console.error("Update user error:", error);
			if (error.code === "P2025") throw new Error("Usuario no encontrado");
			throw error;
		}
	}
	/**
	* Delete a user
	*/
	static async deleteUser(id, deletedBy) {
		try {
			if (!await UserRepository.findById(id)) throw new Error("Usuario no encontrado");
			if (id === deletedBy) throw new Error("No puedes eliminar tu propio usuario");
			await UserRepository.delete(id);
			await createAuditLog({
				userId: deletedBy,
				action: "DELETE_USER",
				entity: "users",
				entity_id: id
			});
			return { success: true };
		} catch (error) {
			console.error("Delete user error:", error);
			if (error.code === "P2025") throw new Error("Usuario no encontrado");
			throw error;
		}
	}
	/**
	* Change user password
	*/
	static async changePassword(userId, newPassword, changedBy) {
		try {
			if (newPassword.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(newPassword, salt);
			await UserRepository.update(userId, { password_hash: hashedPassword });
			await createAuditLog({
				userId: changedBy,
				action: "CHANGE_PASSWORD",
				entity: "users",
				entity_id: userId
			});
			return { success: true };
		} catch (error) {
			console.error("Change password error:", error);
			if (error.code === "P2025") throw new Error("Usuario no encontrado");
			throw error;
		}
	}
};
//#endregion
//#region src/main/services/CashRegisterService.ts
var CashRegisterService = class {
	/**
	* Obtiene la caja abierta del día actual
	*/
	static async getOpenRegister() {
		const startOfDay = /* @__PURE__ */ new Date();
		startOfDay.setHours(0, 0, 0, 0);
		return prisma.cashRegister.findFirst({
			where: { opened_at: { gte: startOfDay } },
			orderBy: { opened_at: "desc" }
		});
	}
	/**
	* Obtiene todas las cajas registradas con filtros opcionales
	*/
	static async getAllRegisters(startDate, endDate) {
		const where = {};
		if (startDate || endDate) {
			where.opened_at = {};
			if (startDate) where.opened_at.gte = startDate;
			if (endDate) where.opened_at.lte = endDate;
		}
		return prisma.cashRegister.findMany({
			where,
			include: { _count: { select: { sales: true } } },
			orderBy: { opened_at: "desc" }
		});
	}
	/**
	* Obtiene los detalles de una caja específica
	*/
	static async getRegisterDetails(id) {
		const register = await prisma.cashRegister.findUnique({
			where: { id },
			include: { sales: { include: {
				client: true,
				items: { include: { product: true } }
			} } }
		});
		if (!register) throw new Error("Caja no encontrada");
		return register;
	}
	/**
	* Abre una nueva caja registradora
	*/
	static async openRegister(openingAmount, userId = 1) {
		if (isNaN(openingAmount) || openingAmount < 0) throw new Error("El monto de apertura no puede ser negativo.");
		if (await this.getOpenRegister()) throw new Error("Ya hay una caja abierta para el día de hoy.");
		const cashRegister = await prisma.cashRegister.create({ data: {
			opening_amount: Number(openingAmount),
			total_sales: 0
		} });
		await createAuditLog({
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
	/**
	* Cierra una caja registradora con conciliación
	*/
	static async closeRegister(registerId, closingAmount, userId = 1) {
		if (isNaN(closingAmount) || closingAmount < 0) throw new Error("El monto de cierre no puede ser negativo.");
		const register = await prisma.cashRegister.findUnique({ where: { id: Number(registerId) } });
		if (!register) throw new Error("Caja no encontrada.");
		const expectedCash = Number(register.opening_amount) + Number(register.total_sales);
		const difference = Number(closingAmount) - expectedCash;
		const salesCount = await prisma.sale.count({ where: {
			cash_register_id: register.id,
			created_at: { gte: register.opened_at }
		} });
		const status = difference === 0 ? "PERFECT" : difference > 0 ? "SURPLUS" : "MISSING";
		await createAuditLog({
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
	/**
	* Obtiene el resumen del día para una caja específica
	*/
	static async getDailySummary(registerId) {
		const startOfDay = /* @__PURE__ */ new Date();
		startOfDay.setHours(0, 0, 0, 0);
		const endOfDay = /* @__PURE__ */ new Date();
		endOfDay.setHours(23, 59, 59, 999);
		const register = await prisma.cashRegister.findFirst({ where: {
			id: registerId,
			opened_at: { gte: startOfDay }
		} });
		if (!register) throw new Error("Caja no encontrada o no está abierta hoy.");
		const salesStats = await prisma.sale.aggregate({
			where: {
				cash_register_id: registerId,
				created_at: {
					gte: startOfDay,
					lte: endOfDay
				}
			},
			_count: { id: true },
			_sum: { total: true },
			_avg: { total: true }
		});
		const salesByPayment = await prisma.sale.groupBy({
			by: ["payment_method"],
			where: {
				cash_register_id: registerId,
				created_at: {
					gte: startOfDay,
					lte: endOfDay
				}
			},
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
//#region src/main/repositories/CategoryRepository.ts
var CategoryRepository = class {
	/**
	* Obtiene todas las categorías con búsqueda opcional
	*/
	static async findAll(search) {
		const where = search ? { name: {
			contains: search,
			mode: "insensitive"
		} } : {};
		return prisma.category.findMany({
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
	/**
	* Obtiene una categoría por ID
	*/
	static async findById(id) {
		const category = await prisma.category.findUnique({
			where: { id },
			include: { products: { select: {
				id: true,
				name: true,
				sku: true,
				stock: true
			} } }
		});
		if (!category) throw new Error("Categoría no encontrada");
		return category;
	}
	/**
	* Crea una nueva categoría
	*/
	static async create(categoryData, userId) {
		const validated = categorySchema.parse(categoryData);
		if (await prisma.category.findFirst({ where: { name: validated.name } })) throw new Error(`La categoría "${validated.name}" ya existe.`);
		const category = await prisma.category.create({ data: validated });
		if (userId) await createAuditLog({
			userId,
			action: "CREATE_CATEGORY",
			entity: "categories",
			entity_id: category.id
		});
		return category;
	}
	/**
	* Actualiza una categoría
	*/
	static async update(id, categoryData, userId) {
		if (!await prisma.category.findUnique({ where: { id } })) throw new Error("Categoría no encontrada");
		const validated = categorySchema.parse(categoryData);
		if (await prisma.category.findFirst({ where: {
			name: validated.name,
			NOT: { id }
		} })) throw new Error(`La categoría "${validated.name}" ya existe.`);
		const category = await prisma.category.update({
			where: { id },
			data: validated
		});
		if (userId) await createAuditLog({
			userId,
			action: "UPDATE_CATEGORY",
			entity: "categories",
			entity_id: category.id
		});
		return category;
	}
	/**
	* Elimina una categoría
	*/
	static async delete(id, userId) {
		if (!await prisma.category.findUnique({ where: { id } })) throw new Error("Categoría no encontrada");
		const productsCount = await prisma.product.count({ where: { category_id: id } });
		if (productsCount > 0) throw new Error(`No se puede eliminar la categoría porque tiene ${productsCount} producto(s) asociado(s).`);
		await prisma.category.delete({ where: { id } });
		if (userId) await createAuditLog({
			userId,
			action: "DELETE_CATEGORY",
			entity: "categories",
			entity_id: id
		});
		return { success: true };
	}
};
//#endregion
//#region src/main/services/SettingsService.ts
var SettingsService = class {
	/**
	* Obtiene todas las configuraciones como un objeto clave-valor
	*/
	static async getSettings() {
		return (await prisma.setting.findMany()).reduce((acc, curr) => {
			acc[curr.key] = curr.value;
			return acc;
		}, {});
	}
	/**
	* Guarda o actualiza múltiples configuraciones
	*/
	static async updateSettings(settings) {
		const promises = Object.entries(settings).map(([key, value]) => {
			return prisma.setting.upsert({
				where: { key },
				update: { value },
				create: {
					key,
					value
				}
			});
		});
		await Promise.all(promises);
		return { success: true };
	}
	/**
	* Obtiene una configuración específica
	*/
	static async getSetting(key, defaultValue = "") {
		const setting = await prisma.setting.findUnique({ where: { key } });
		return setting ? setting.value : defaultValue;
	}
};
//#endregion
//#region src/main/services/SupplierService.ts
var SupplierService = class {
	/**
	* Get all suppliers with optional search
	*/
	static async getAllSuppliers(search) {
		try {
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
			return await prisma.supplier.findMany({
				where,
				include: { _count: { select: {
					products: true,
					purchases: true
				} } },
				orderBy: { name: "asc" }
			});
		} catch (error) {
			console.error("Get all suppliers error:", error);
			throw new Error("Error al obtener proveedores");
		}
	}
	/**
	* Get supplier by ID
	*/
	static async getSupplierById(id) {
		try {
			const supplier = await prisma.supplier.findUnique({
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
			if (!supplier) throw new Error("Proveedor no encontrado");
			return supplier;
		} catch (error) {
			console.error("Get supplier by ID error:", error);
			if (error.code === "P2025") throw new Error("Proveedor no encontrado");
			throw new Error("Error al obtener proveedor");
		}
	}
	/**
	* Create a new supplier
	*/
	static async createSupplier(data, createdBy) {
		try {
			if (data.ruc) {
				if (await prisma.supplier.findFirst({ where: { ruc: data.ruc } })) throw new Error(`El RUC ${data.ruc} ya está registrado`);
			}
			const supplier = await prisma.supplier.create({ data: {
				name: data.name,
				ruc: data.ruc,
				phone: data.phone,
				email: data.email,
				address: data.address
			} });
			await createAuditLog({
				userId: createdBy,
				action: "CREATE_SUPPLIER",
				entity: "suppliers",
				entity_id: supplier.id
			});
			return supplier;
		} catch (error) {
			console.error("Create supplier error:", error);
			if (error.code === "P2002") throw new Error("El RUC ya está en uso");
			throw error;
		}
	}
	/**
	* Update an existing supplier
	*/
	static async updateSupplier(id, data, updatedBy) {
		try {
			const existing = await prisma.supplier.findUnique({ where: { id } });
			if (!existing) throw new Error("Proveedor no encontrado");
			if (data.ruc && data.ruc !== existing.ruc) {
				if (await prisma.supplier.findFirst({ where: {
					ruc: data.ruc,
					NOT: { id }
				} })) throw new Error(`El RUC ${data.ruc} ya está registrado`);
			}
			const supplier = await prisma.supplier.update({
				where: { id },
				data: {
					name: data.name,
					ruc: data.ruc,
					phone: data.phone,
					email: data.email,
					address: data.address
				}
			});
			await createAuditLog({
				userId: updatedBy,
				action: "UPDATE_SUPPLIER",
				entity: "suppliers",
				entity_id: id
			});
			return supplier;
		} catch (error) {
			console.error("Update supplier error:", error);
			if (error.code === "P2025") throw new Error("Proveedor no encontrado");
			throw error;
		}
	}
	/**
	* Delete a supplier
	*/
	static async deleteSupplier(id, deletedBy) {
		try {
			const supplier = await prisma.supplier.findUnique({
				where: { id },
				include: {
					products: true,
					purchases: true
				}
			});
			if (!supplier) throw new Error("Proveedor no encontrado");
			if (supplier.products.length > 0) throw new Error(`No se puede eliminar el proveedor porque tiene ${supplier.products.length} producto(s) asociado(s)`);
			if (supplier.purchases.length > 0) throw new Error(`No se puede eliminar el proveedor porque tiene ${supplier.purchases.length} compra(s) asociada(s)`);
			await prisma.supplier.delete({ where: { id } });
			await createAuditLog({
				userId: deletedBy,
				action: "DELETE_SUPPLIER",
				entity: "suppliers",
				entity_id: id
			});
			return { success: true };
		} catch (error) {
			console.error("Delete supplier error:", error);
			if (error.code === "P2025") throw new Error("Proveedor no encontrado");
			throw error;
		}
	}
};
//#endregion
//#region src/main/services/PurchaseService.ts
var PurchaseService = class {
	/**
	* Get all purchases with optional filters
	*/
	static async getAllPurchases(supplierId, status) {
		try {
			const where = {};
			if (supplierId) where.supplier_id = supplierId;
			if (status) where.status = status;
			return await prisma.purchase.findMany({
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
		} catch (error) {
			console.error("Get all purchases error:", error);
			throw new Error("Error al obtener compras");
		}
	}
	/**
	* Get purchase by ID
	*/
	static async getPurchaseById(id) {
		try {
			const purchase = await prisma.purchase.findUnique({
				where: { id },
				include: {
					supplier: true,
					items: { include: { product: true } }
				}
			});
			if (!purchase) throw new Error("Compra no encontrada");
			return purchase;
		} catch (error) {
			console.error("Get purchase by ID error:", error);
			if (error.code === "P2025") throw new Error("Compra no encontrada");
			throw new Error("Error al obtener compra");
		}
	}
	/**
	* Create a new purchase order (status: PENDING)
	*/
	static async createPurchase(data, createdBy) {
		try {
			if (!await prisma.supplier.findUnique({ where: { id: data.supplier_id } })) throw new Error("Proveedor no encontrado");
			const productIds = data.items.map((item) => item.product_id);
			if ((await prisma.product.findMany({ where: { id: { in: productIds } } })).length !== productIds.length) throw new Error("Uno o más productos no existen");
			const totalAmount = data.items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
			const purchase = await prisma.purchase.create({
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
			await createAuditLog({
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
	/**
	* Receive purchase (change status to RECEIVED and update stock)
	*/
	static async receivePurchase(purchaseId, receivedBy) {
		try {
			const purchase = await prisma.purchase.findUnique({
				where: { id: purchaseId },
				include: { items: { include: { product: true } } }
			});
			if (!purchase) throw new Error("Compra no encontrada");
			if (purchase.status === "RECEIVED") throw new Error("Esta compra ya fue recibida");
			if (purchase.status === "CANCELLED") throw new Error("No se puede recibir una compra cancelada");
			await prisma.$transaction(async (tx) => {
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
			await createAuditLog({
				userId: receivedBy,
				action: "RECEIVE_PURCHASE",
				entity: "purchases",
				entity_id: purchaseId
			});
			return { success: true };
		} catch (error) {
			console.error("Receive purchase error:", error);
			if (error.code === "P2025") throw new Error("Compra no encontrada");
			throw error;
		}
	}
	/**
	* Cancel purchase (only if PENDING)
	*/
	static async cancelPurchase(purchaseId, cancelledBy) {
		try {
			const purchase = await prisma.purchase.findUnique({ where: { id: purchaseId } });
			if (!purchase) throw new Error("Compra no encontrada");
			if (purchase.status === "RECEIVED") throw new Error("No se puede cancelar una compra ya recibida");
			if (purchase.status === "CANCELLED") throw new Error("Esta compra ya está cancelada");
			await prisma.purchase.update({
				where: { id: purchaseId },
				data: { status: "CANCELLED" }
			});
			await createAuditLog({
				userId: cancelledBy,
				action: "CANCEL_PURCHASE",
				entity: "purchases",
				entity_id: purchaseId
			});
			return { success: true };
		} catch (error) {
			console.error("Cancel purchase error:", error);
			if (error.code === "P2025") throw new Error("Compra no encontrada");
			throw error;
		}
	}
};
//#endregion
//#region src/main/services/BackupService.ts
var pipelineAsync = promisify(pipeline);
var BackupService = class {
	static getDbPath() {
		if (!app.isPackaged) return path.resolve(process.cwd(), "prisma", "dev.sqlite3");
		const userDataPath = app.getPath("userData");
		return path.join(userDataPath, "dev.sqlite3");
	}
	static getBackupDir() {
		const isDev = !app.isPackaged;
		let basePath;
		if (isDev) basePath = process.cwd();
		else basePath = app.getPath("userData");
		const backupDir = path.join(basePath, "backups");
		if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
		return backupDir;
	}
	/**
	* Create a manual backup of the database
	*/
	static async createBackup(label) {
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
			console.error("[BackupService] Error creating backup:", error);
			return {
				success: false,
				message: error.message
			};
		}
	}
	/**
	* List all available backups
	*/
	static async listBackups() {
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
			console.error("[BackupService] Error listing backups:", error);
			return [];
		}
	}
	/**
	* Restore database from backup
	*/
	static async restoreBackup(backupPath) {
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
			console.error("[BackupService] Error restoring backup:", error);
			return {
				success: false,
				message: error.message
			};
		}
	}
	/**
	* Delete a backup file
	*/
	static async deleteBackup(backupPath) {
		try {
			if (!fs.existsSync(backupPath)) return {
				success: false,
				message: "Backup file not found"
			};
			fs.unlinkSync(backupPath);
			return { success: true };
		} catch (error) {
			console.error("[BackupService] Error deleting backup:", error);
			return {
				success: false,
				message: error.message
			};
		}
	}
	/**
	* Create automatic scheduled backup
	*/
	static async createScheduledBackup() {
		const backups = await this.listBackups();
		const now = /* @__PURE__ */ new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		if (!backups.find((b) => {
			const backupDate = new Date(b.created);
			return new Date(backupDate.getFullYear(), backupDate.getMonth(), backupDate.getDate()).getTime() === today.getTime();
		})) {
			await this.createBackup("auto");
			console.log("[BackupService] Automatic backup created");
		}
	}
	/**
	* Cleanup old backups (keep last N)
	*/
	static async cleanupOldBackups(keep = 10) {
		try {
			const backups = await this.listBackups();
			if (backups.length > keep) {
				const toDelete = backups.slice(keep);
				for (const backup of toDelete) fs.unlinkSync(backup.path);
				console.log(`[BackupService] Cleaned up ${toDelete.length} old backups`);
			}
		} catch (error) {
			console.error("[BackupService] Error cleaning up backups:", error);
		}
	}
};
//#endregion
//#region src/main/utils/ipcWrapper.ts
/**
* Wraps an IPC handler to provide consistent error handling and optional Zod validation.
*/
function wrapIpc(handler, schema) {
	return async (_event, ...args) => {
		try {
			if (schema && args.length > 0) {
				const result = schema.safeParse(args[0]);
				if (!result.success) return {
					success: false,
					message: "Error de validación: " + result.error.issues.map((e) => e.message).join(", "),
					errors: result.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`)
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
			console.error("IPC Error:", error);
			if (error instanceof ZodError) return {
				success: false,
				message: "Error de validación: " + error.issues.map((e) => e.message).join(", ")
			};
			return {
				success: false,
				message: error.message || "Ocurrió un error inesperado en el sistema"
			};
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
			await prisma.$queryRaw`SELECT 1`;
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
			return await DashboardRepository.getStats(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("dashboard:getWeeklySales", async (_, days) => {
		try {
			return await DashboardRepository.getWeeklySales(days);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getLowStock", async (_, limit) => {
		try {
			return await DashboardRepository.getLowStockProducts(limit || 50);
		} catch (error) {
			console.error("[IPC] Error getting low stock:", error);
			return [];
		}
	});
	ipcMain.handle("dashboard:getSalesByPayment", async (_, startDate, endDate) => {
		try {
			return await DashboardRepository.getSalesByPaymentMethod(startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getTopProducts", async (_, limit, startDate, endDate) => {
		try {
			return await DashboardRepository.getTopProducts(limit, startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getTopClients", async (_, limit, startDate, endDate) => {
		try {
			return await DashboardRepository.getTopClients(limit, startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getSalesByHour", async (_, startDate, endDate) => {
		try {
			return await DashboardRepository.getSalesByHour(startDate, endDate);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("dashboard:getCashSummary", async (_, startDate, endDate) => {
		try {
			return await DashboardRepository.getCashRegisterSummary(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("dashboard:getInventoryMetrics", async () => {
		try {
			return await DashboardRepository.getInventoryMetrics();
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	ipcMain.handle("dashboard:invalidateCache", async () => {
		try {
			DashboardRepository.invalidateCache();
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
			return await SettingsService.getSettings();
		} catch (error) {
			return {};
		}
	});
	ipcMain.handle("settings:update", async (_, settings) => {
		try {
			return await SettingsService.updateSettings(settings);
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
			return await CashRegisterService.getOpenRegister();
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("cash:getAll", async (_, startDate, endDate) => {
		try {
			return await CashRegisterService.getAllRegisters(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener cajas"
			};
		}
	});
	ipcMain.handle("cash:getDetails", async (_, id) => {
		try {
			return await CashRegisterService.getRegisterDetails(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener detalles de caja"
			};
		}
	});
	ipcMain.handle("cash:getDailySummary", async (_, registerId) => {
		try {
			return await CashRegisterService.getDailySummary(registerId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener resumen del día"
			};
		}
	});
	ipcMain.handle("cash:open", wrapIpc((amount, userId) => CashRegisterService.openRegister(amount, userId)));
	ipcMain.handle("cash:close", wrapIpc((id, amount, userId) => CashRegisterService.closeRegister(id, amount, userId)));
	/**
	* AUTH
	*/
	ipcMain.handle("auth:login", async (_, username, password) => {
		try {
			return await AuthService.login(username, password);
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
			return await ClientService.getAllClients(search);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener clientes"
			};
		}
	});
	ipcMain.handle("clients:getById", async (_, id) => {
		try {
			return await ClientService.getClientById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener cliente"
			};
		}
	});
	ipcMain.handle("clients:create", wrapIpc((clientData, userId) => ClientService.createClient(clientData, userId), clientSchema));
	ipcMain.handle("clients:update", wrapIpc((id, clientData, userId) => ClientService.updateClient(id, clientData, userId)));
	ipcMain.handle("clients:delete", async (_, id, userId) => {
		try {
			return await ClientService.deleteClient(id, userId);
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
			return await ProductService.getAllProducts(search, categoryId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener productos"
			};
		}
	});
	ipcMain.handle("products:getById", async (_, id) => {
		try {
			return await ProductService.getProductById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener producto"
			};
		}
	});
	ipcMain.handle("products:getLowStock", async () => {
		try {
			return await DashboardRepository.getLowStockProducts(50);
		} catch (error) {
			console.error("Get low stock products error:", error);
			return [];
		}
	});
	ipcMain.handle("products:create", wrapIpc((productData, userId) => ProductService.createProduct(productData, userId), productSchema));
	ipcMain.handle("products:update", wrapIpc((id, productData, userId) => ProductService.updateProduct(id, productData, userId)));
	ipcMain.handle("products:delete", async (_, id, userId) => {
		try {
			return await ProductService.deleteProduct(id, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al eliminar producto"
			};
		}
	});
	ipcMain.handle("products:addStock", async (_, productId, quantity, userId, reason) => {
		try {
			return await ProductService.addStock(productId, quantity, userId, reason);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al añadir stock"
			};
		}
	});
	ipcMain.handle("products:removeStock", async (_, productId, quantity, userId, reason) => {
		try {
			return await ProductService.removeStock(productId, quantity, userId, reason);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al reducir stock"
			};
		}
	});
	ipcMain.handle("products:getMovements", async (_, productId, limit) => {
		try {
			return await ProductService.getInventoryMovements(productId, limit);
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
			return await SaleService.getAllSales(startDate, endDate, clientId, cashRegisterId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener ventas"
			};
		}
	});
	ipcMain.handle("sales:getToday", async () => {
		try {
			return await SaleService.getTodaySales();
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener ventas del día"
			};
		}
	});
	ipcMain.handle("sales:getLast", async () => {
		try {
			return await SaleService.getLastSale();
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("sales:getStats", async (_, startDate, endDate) => {
		try {
			return await SaleService.getSalesStats(startDate, endDate);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener estadísticas"
			};
		}
	});
	ipcMain.handle("sales:getDetails", async (_, saleId) => {
		try {
			return await SaleService.getSaleDetails(saleId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener detalles de venta"
			};
		}
	});
	ipcMain.handle("sales:register", wrapIpc(async (saleData, itemsData, userId) => {
		return SaleService.registerSale(saleData, itemsData, userId);
	}, saleSchema.omit({ items: true })));
	ipcMain.handle("sales:cancel", async (_, saleId, userId) => {
		try {
			return await SaleService.cancelSale(saleId, userId);
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
		try {
			return await CategoryRepository.findAll(search);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("categories:getById", async (_, id) => {
		try {
			return await CategoryRepository.findById(id);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener categoría"
			};
		}
	});
	ipcMain.handle("categories:create", wrapIpc((categoryData, userId) => CategoryRepository.create(categoryData, userId), categorySchema));
	ipcMain.handle("categories:update", wrapIpc((id, categoryData, userId) => CategoryRepository.update(id, categoryData, userId)));
	ipcMain.handle("categories:delete", async (_, id, userId) => {
		try {
			return await CategoryRepository.delete(id, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message
			};
		}
	});
	/**
	* USERS
	*/
	ipcMain.handle("users:getAll", async () => {
		try {
			return await UserService.getAllUsers();
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al obtener usuarios"
			};
		}
	});
	ipcMain.handle("users:getById", async (_, id) => {
		try {
			return await UserService.getUserById(id);
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
				user: await UserService.createUser(userData, createdBy)
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
				user: await UserService.updateUser(id, userData, updatedBy)
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
			return await UserService.deleteUser(id, deletedBy);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al eliminar usuario"
			};
		}
	});
	ipcMain.handle("users:changePassword", async (_, userId, newPassword, changedBy) => {
		try {
			return await UserService.changePassword(userId, newPassword, changedBy);
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
			return await prisma.inventoryMovement.findMany({
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
			return await SupplierService.getAllSuppliers(search);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("suppliers:getById", async (_, id) => {
		try {
			return await SupplierService.getSupplierById(id);
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("suppliers:create", async (_, data, userId) => {
		try {
			return {
				success: true,
				supplier: await SupplierService.createSupplier(data, userId)
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
				supplier: await SupplierService.updateSupplier(id, data, userId)
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
			return await SupplierService.deleteSupplier(id, userId);
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
			return await PurchaseService.getAllPurchases(supplierId, status);
		} catch (error) {
			return [];
		}
	});
	ipcMain.handle("purchases:getById", async (_, id) => {
		try {
			return await PurchaseService.getPurchaseById(id);
		} catch (error) {
			return null;
		}
	});
	ipcMain.handle("purchases:create", async (_, data, userId) => {
		try {
			return {
				success: true,
				purchase: await PurchaseService.createPurchase(data, userId)
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
			return await PurchaseService.receivePurchase(purchaseId, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al recibir compra"
			};
		}
	});
	ipcMain.handle("purchases:cancel", async (_, purchaseId, userId) => {
		try {
			return await PurchaseService.cancelPurchase(purchaseId, userId);
		} catch (error) {
			return {
				success: false,
				message: error.message || "Error al cancelar compra"
			};
		}
	});
	ipcMain.handle("backup:create", async (_, label) => {
		try {
			return await BackupService.createBackup(label);
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
			return await BackupService.listBackups();
		} catch (error) {
			console.error("[IPC] Error listing backups:", error);
			return [];
		}
	});
	ipcMain.handle("backup:restore", async (_, backupPath) => {
		try {
			return await BackupService.restoreBackup(backupPath);
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
			return await BackupService.deleteBackup(backupPath);
		} catch (error) {
			console.error("[IPC] Error deleting backup:", error);
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
		await prisma.$connect();
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
