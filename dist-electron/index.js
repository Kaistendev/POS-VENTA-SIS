import { a as e, i as t, n, r, t as i } from "./errors-CBdiC9hv.js";
import "dotenv/config";
import { BrowserWindow as a, app as o, dialog as s, ipcMain as c, session as l } from "electron";
import u from "path";
import d from "fs";
import f from "pino";
import { PrismaClient as p } from "@prisma/client";
import { PrismaBetterSqlite3 as m } from "@prisma/adapter-better-sqlite3";
import { pipeline as h } from "stream";
import { promisify as g } from "util";
import { createGunzip as _, createGzip as v } from "zlib";
import { jsPDF as y } from "jspdf";
import b from "jspdf-autotable";
import x from "exceljs";
import { ZodError as ee, z as S } from "zod";
import C from "bcryptjs";
import te from "node:crypto";
import { existsSync as w, readFileSync as T, writeFileSync as E } from "node:fs";
import { join as ne } from "node:path";
import { fileURLToPath as D } from "url";
import O from "node:fs/promises";
//#region src/shared/logger.ts
var k = f({
	level: "info",
	timestamp: f.stdTimeFunctions.isoTime
}), A = !1;
function re() {
	if (A || (A = !0, !o.isPackaged)) return;
	let e = o.getPath("userData"), t = u.join(e, "dev.sqlite3");
	d.existsSync(e) || d.mkdirSync(e, { recursive: !0 }), d.existsSync(t) || k.info(`Database will be created at ${t} on first connect`), process.env.DATABASE_URL = `file:${t}`, k.info(`Database URL: ${process.env.DATABASE_URL}`);
}
//#endregion
//#region src/infrastructure/persistence/PrismaProductRepository.ts
var ie = class {
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e, t) {
		let n = {};
		return e && (n.OR = [
			{ name: {
				contains: e,
				mode: "insensitive"
			} },
			{ sku: {
				contains: e,
				mode: "insensitive"
			} },
			{ description: {
				contains: e,
				mode: "insensitive"
			} }
		]), t && (n.category_id = t), this.prisma.product.findMany({
			where: n,
			select: {
				id: !0,
				sku: !0,
				name: !0,
				description: !0,
				price_sale: !0,
				price_purchase: !0,
				stock: !0,
				min_stock: !0,
				created_at: !0,
				updated_at: !0,
				category_id: !0,
				supplier_id: !0,
				category: { select: {
					id: !0,
					name: !0
				} },
				supplier: { select: {
					id: !0,
					name: !0
				} }
			},
			orderBy: { created_at: "desc" }
		});
	}
	async findById(e) {
		return await this.prisma.product.findUnique({
			where: { id: e },
			include: {
				category: !0,
				supplier: !0
			}
		});
	}
	async findByIds(e) {
		return this.prisma.product.findMany({ where: { id: { in: e } } });
	}
	async findBySku(e) {
		return this.prisma.product.findUnique({ where: { sku: e } });
	}
	async findLowStock() {
		return this.prisma.product.findMany({
			where: { stock: { lte: this.prisma.product.fields.min_stock } },
			include: { category: !0 },
			orderBy: { stock: "asc" }
		});
	}
	async create(e) {
		let t = e.stock || 0;
		return this.prisma.product.create({ data: {
			sku: e.sku,
			name: e.name,
			price_sale: e.price_sale,
			price_purchase: e.price_purchase,
			description: e.description,
			category_id: e.category_id,
			supplier_id: e.supplier_id,
			min_stock: e.min_stock,
			stock: t
		} });
	}
	async update(e, t) {
		return this.prisma.product.update({
			where: { id: e },
			data: t,
			include: {
				category: !0,
				supplier: !0
			}
		});
	}
	async delete(e) {
		await this.prisma.product.delete({ where: { id: e } });
	}
	async getSalesCount(e) {
		return this.prisma.saleItem.count({ where: { product_id: e } });
	}
	async updateStock(e, t) {
		if (t < 0) {
			if ((await this.prisma.product.updateMany({
				where: {
					id: e,
					stock: { gte: Math.abs(t) }
				},
				data: { stock: { increment: t } }
			})).count === 0) throw new i("Stock insuficiente");
		} else await this.prisma.product.update({
			where: { id: e },
			data: { stock: { increment: t } }
		});
	}
	async createMovement(e) {
		await this.prisma.inventoryMovement.create({ data: e });
	}
	async getMovements(e, t = 50) {
		return this.prisma.inventoryMovement.findMany({
			where: { product_id: e },
			orderBy: { created_at: "desc" },
			take: t
		});
	}
	async bulkUpdatePrice(e, t) {
		let n = {};
		return t !== void 0 && (n.category_id = t), (await this.prisma.product.updateMany({
			where: n,
			data: { price_sale: { multiply: 1 + e / 100 } }
		})).count;
	}
}, ae = class {
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = e ? { OR: [
			{ dni: {
				contains: e,
				mode: "insensitive"
			} },
			{ name: {
				contains: e,
				mode: "insensitive"
			} },
			{ code: {
				contains: e,
				mode: "insensitive"
			} },
			{ tax_id: {
				contains: e,
				mode: "insensitive"
			} }
		] } : {};
		return this.prisma.client.findMany({
			where: t,
			orderBy: { created_at: "desc" }
		});
	}
	async findById(e) {
		return this.prisma.client.findUnique({ where: { id: e } });
	}
	async findByDni(e) {
		return this.prisma.client.findFirst({ where: { dni: e } });
	}
	async findByCode(e) {
		return this.prisma.client.findFirst({ where: { code: e } });
	}
	async findByTaxId(e) {
		return this.prisma.client.findFirst({ where: { tax_id: e } });
	}
	async create(e) {
		return this.prisma.client.create({ data: e });
	}
	async update(e, t) {
		return this.prisma.client.update({
			where: { id: e },
			data: t
		});
	}
	async delete(e) {
		await this.prisma.client.delete({ where: { id: e } });
	}
	async getSalesCount(e) {
		return this.prisma.sale.count({ where: { client_id: e } });
	}
};
//#endregion
//#region src/shared/helpers.ts
function j(e, t, n) {
	if (!t && !n) return {};
	let r = {};
	return t && (r[e] = {
		...r[e] || {},
		gte: t
	}), n && (r[e] = {
		...r[e] || {},
		lte: n
	}), r;
}
async function M(e, t, n) {
	let r = await e();
	if (!r) {
		let { NotFoundError: e } = await import("./errors-CBdiC9hv.js").then((e) => e.o);
		throw new e(t, n);
	}
	return r;
}
//#endregion
//#region src/infrastructure/persistence/PrismaSaleRepository.ts
var oe = class {
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = {};
		return Object.assign(t, j("created_at", e?.startDate, e?.endDate)), e?.clientId && (t.client_id = e.clientId), e?.cashRegisterId && (t.cash_register_id = e.cashRegisterId), this.prisma.sale.findMany({
			where: t,
			select: {
				id: !0,
				total: !0,
				subtotal: !0,
				tax_amount: !0,
				payment_method: !0,
				created_at: !0,
				updated_at: !0,
				cash_register_id: !0,
				client_id: !0,
				client: { select: {
					id: !0,
					name: !0,
					dni: !0
				} },
				cash_register: { select: {
					id: !0,
					opened_at: !0,
					opening_amount: !0
				} },
				_count: { select: { items: !0 } }
			},
			orderBy: { created_at: "desc" }
		});
	}
	async findById(e) {
		return await this.prisma.sale.findUnique({
			where: { id: e },
			include: {
				items: { include: { product: !0 } },
				client: !0,
				cash_register: !0
			}
		});
	}
	async findToday() {
		let e = /* @__PURE__ */ new Date();
		e.setHours(0, 0, 0, 0);
		let t = /* @__PURE__ */ new Date();
		return t.setHours(23, 59, 59, 999), this.prisma.sale.findMany({
			where: { created_at: {
				gte: e,
				lte: t
			} },
			include: {
				client: !0,
				cash_register: !0
			},
			orderBy: { created_at: "desc" }
		});
	}
	async findLast() {
		return await this.prisma.sale.findFirst({
			orderBy: { created_at: "desc" },
			include: { items: !0 }
		});
	}
	async getStats(e, t) {
		let n = {};
		Object.assign(n, j("created_at", e, t));
		let r = await this.prisma.sale.aggregate({
			where: n,
			_count: { id: !0 },
			_sum: { total: !0 },
			_avg: { total: !0 }
		});
		return {
			totalSales: r._count.id,
			totalRevenue: r._sum.total || 0,
			averageSale: r._avg.total || 0
		};
	}
	async registerSale(e) {
		return this.prisma.$transaction(async (t) => {
			let n = await t.sale.create({ data: {
				cash_register_id: e.cash_register_id,
				client_id: e.client_id,
				subtotal: e.subtotal,
				tax_amount: e.tax_amount,
				total: e.total,
				discount_total: e.discount_total || 0,
				payment_method: e.payment_method,
				exchange_rate: e.exchange_rate || 0
			} });
			for (let r of e.items) {
				if (await t.saleItem.create({ data: {
					sale_id: n.id,
					product_id: r.product_id,
					quantity: r.quantity,
					unit_price: r.unit_price,
					purchase_price: r.purchase_price,
					discount_name: r.discount_name ?? null,
					discount_type: r.discount_type ?? null,
					discount_value: r.discount_value ?? null,
					discount_amount: r.discount_amount ?? 0,
					final_unit_price: r.final_unit_price ?? null
				} }), (await t.product.updateMany({
					where: {
						id: r.product_id,
						stock: { gte: r.quantity }
					},
					data: { stock: { decrement: r.quantity } }
				})).count === 0) throw new i(`Stock insuficiente para el producto ${r.product_id}`);
				await t.inventoryMovement.create({ data: {
					product_id: r.product_id,
					type: "SALIDA",
					quantity: r.quantity,
					reason: "VENTA"
				} });
			}
			return await t.cashRegister.update({
				where: { id: e.cash_register_id },
				data: { total_sales: { increment: e.total } }
			}), n.id;
		});
	}
	async cancelSale(e) {
		let t = await this.prisma.sale.findUnique({
			where: { id: e },
			include: { items: !0 }
		});
		if (!t) throw Error("Venta no encontrada");
		await this.prisma.$transaction(async (n) => {
			for (let e of t.items) await n.product.update({
				where: { id: e.product_id },
				data: { stock: { increment: e.quantity } }
			}), await n.inventoryMovement.create({ data: {
				product_id: e.product_id,
				type: "ENTRADA",
				quantity: e.quantity,
				reason: "DEVOLUCION"
			} });
			await n.cashRegister.update({
				where: { id: t.cash_register_id },
				data: { total_sales: { decrement: t.total } }
			}), await n.sale.delete({ where: { id: e } });
		});
	}
}, se = class {
	constructor(e) {
		this.prisma = e;
	}
	async findOpen() {
		return this.prisma.cashRegister.findFirst({
			where: { closed_at: null },
			orderBy: { opened_at: "desc" }
		});
	}
	async findById(e) {
		return await this.prisma.cashRegister.findUnique({
			where: { id: e },
			include: { sales: { include: {
				client: !0,
				items: { include: { product: !0 } }
			} } }
		});
	}
	async findAll(e, t) {
		let n = {};
		return Object.assign(n, j("opened_at", e, t)), this.prisma.cashRegister.findMany({
			where: n,
			include: { _count: { select: { sales: !0 } } },
			orderBy: { opened_at: "desc" }
		});
	}
	async create(e) {
		return this.prisma.cashRegister.create({ data: {
			opening_amount: Number(e),
			total_sales: 0
		} });
	}
	async close(e, t, n, r) {
		await this.prisma.cashRegister.update({
			where: { id: e },
			data: {
				closed_at: /* @__PURE__ */ new Date(),
				closing_amount: t,
				difference: n,
				status: r
			}
		});
	}
	async updateTotalSales(e, t) {
		await this.prisma.cashRegister.update({
			where: { id: e },
			data: { total_sales: { increment: t } }
		});
	}
	async getSalesCount(e, t) {
		return this.prisma.sale.count({ where: {
			cash_register_id: e,
			created_at: { gte: t }
		} });
	}
	async getDailySummary(e) {
		let t = /* @__PURE__ */ new Date();
		t.setHours(0, 0, 0, 0);
		let n = /* @__PURE__ */ new Date();
		n.setHours(23, 59, 59, 999);
		let r = {
			cash_register_id: e,
			created_at: {
				gte: t,
				lte: n
			}
		}, i = await this.prisma.cashRegister.findFirst({ where: {
			id: e,
			opened_at: { gte: t }
		} });
		if (!i) throw Error("Caja no encontrada o no está abierta hoy.");
		let a = await this.prisma.sale.aggregate({
			where: r,
			_count: { id: !0 },
			_sum: { total: !0 },
			_avg: { total: !0 }
		}), o = await this.prisma.sale.groupBy({
			by: ["payment_method"],
			where: r,
			_count: { id: !0 },
			_sum: { total: !0 }
		});
		return {
			register: i,
			totalSales: a._count.id,
			totalRevenue: a._sum.total || 0,
			averageSale: a._avg.total || 0,
			salesByPayment: o
		};
	}
}, ce = class {
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = {};
		return e && (t.OR = [
			{ name: {
				contains: e,
				mode: "insensitive"
			} },
			{ ruc: {
				contains: e,
				mode: "insensitive"
			} },
			{ email: {
				contains: e,
				mode: "insensitive"
			} }
		]), this.prisma.supplier.findMany({
			where: t,
			include: { _count: { select: {
				products: !0,
				purchases: !0
			} } },
			orderBy: { name: "asc" }
		});
	}
	async findById(e) {
		return await this.prisma.supplier.findUnique({
			where: { id: e },
			include: {
				products: { select: {
					id: !0,
					name: !0,
					sku: !0,
					stock: !0
				} },
				purchases: {
					orderBy: { created_at: "desc" },
					take: 10
				}
			}
		});
	}
	async findByRuc(e) {
		return this.prisma.supplier.findFirst({ where: { ruc: e } });
	}
	async create(e) {
		return this.prisma.supplier.create({ data: e });
	}
	async update(e, t) {
		return this.prisma.supplier.update({
			where: { id: e },
			data: t
		});
	}
	async delete(e) {
		await this.prisma.supplier.delete({ where: { id: e } });
	}
	async hasProducts(e) {
		return await this.prisma.product.count({ where: { supplier_id: e } }) > 0;
	}
	async hasPurchases(e) {
		return await this.prisma.purchase.count({ where: { supplier_id: e } }) > 0;
	}
}, le = class {
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e, t) {
		let n = {};
		return e && (n.supplier_id = e), t && (n.status = t), this.prisma.purchase.findMany({
			where: n,
			include: {
				supplier: { select: {
					id: !0,
					name: !0,
					ruc: !0
				} },
				items: { include: { product: { select: {
					id: !0,
					name: !0,
					sku: !0
				} } } }
			},
			orderBy: { created_at: "desc" }
		});
	}
	async findById(e) {
		return await this.prisma.purchase.findUnique({
			where: { id: e },
			include: {
				supplier: !0,
				items: { include: { product: !0 } }
			}
		});
	}
	async create(e) {
		let t = e.items.reduce((e, t) => e + t.quantity * t.unit_cost, 0);
		return this.prisma.purchase.create({
			data: {
				supplier_id: e.supplier_id,
				total_amount: t,
				status: "PENDING",
				payment_status: e.payment_status || "UNPAID",
				items: { create: e.items.map((e) => ({
					product_id: e.product_id,
					quantity: e.quantity,
					unit_cost: e.unit_cost
				})) }
			},
			include: {
				supplier: !0,
				items: { include: { product: !0 } }
			}
		});
	}
	async receive(e) {
		let t = await this.prisma.purchase.findUnique({
			where: { id: e },
			include: { items: { include: { product: !0 } } }
		});
		if (!t) throw Error("Compra no encontrada");
		if (t.status === "RECEIVED") throw Error("Esta compra ya fue recibida");
		if (t.status === "CANCELLED") throw Error("No se puede recibir una compra cancelada");
		await this.prisma.$transaction(async (n) => {
			for (let e of t.items) await n.product.update({
				where: { id: e.product_id },
				data: {
					stock: { increment: e.quantity },
					price_purchase: e.unit_cost
				}
			}), await n.inventoryMovement.create({ data: {
				product_id: e.product_id,
				type: "ENTRADA",
				quantity: e.quantity,
				reason: "COMPRA"
			} });
			await n.purchase.update({
				where: { id: e },
				data: { status: "RECEIVED" }
			});
		});
	}
	async cancel(e) {
		let t = await this.prisma.purchase.findUnique({ where: { id: e } });
		if (!t) throw Error("Compra no encontrada");
		if (t.status === "RECEIVED") throw Error("No se puede cancelar una compra ya recibida");
		if (t.status === "CANCELLED") throw Error("Esta compra ya está cancelada");
		await this.prisma.purchase.update({
			where: { id: e },
			data: { status: "CANCELLED" }
		});
	}
	async updatePaymentStatus(e, t) {
		await this.prisma.purchase.update({
			where: { id: e },
			data: { payment_status: t }
		});
	}
}, ue = class {
	constructor(e) {
		this.prisma = e;
	}
	async getAll() {
		return (await this.prisma.setting.findMany()).reduce((e, t) => (e[t.key] = t.value, e), {});
	}
	async get(e, t = "") {
		let n = await this.prisma.setting.findUnique({ where: { key: e } });
		return n ? n.value : t;
	}
	async upsert(e, t) {
		await this.prisma.setting.upsert({
			where: { key: e },
			update: { value: t },
			create: {
				key: e,
				value: t
			}
		});
	}
	async upsertMany(e) {
		let t = Object.entries(e).map(([e, t]) => this.prisma.setting.upsert({
			where: { key: e },
			update: { value: t },
			create: {
				key: e,
				value: t
			}
		}));
		await Promise.all(t);
	}
	async getTaxSettings() {
		let e = await this.get("tax_rate", "0"), t = await this.get("tax_type", "none"), n = await this.get("tax_included", "false");
		return {
			taxRate: parseFloat(e) || 0,
			taxType: t,
			taxIncluded: n === "true"
		};
	}
	async updateTaxSettings(e, t, n) {
		await this.upsertMany({
			tax_rate: e.toString(),
			tax_type: t,
			tax_included: n.toString()
		});
	}
}, de = class {
	constructor(e) {
		this.prisma = e;
	}
	async findAll() {
		return this.prisma.user.findMany({
			select: {
				id: !0,
				username: !0,
				role: !0,
				created_at: !0,
				updated_at: !0
			},
			orderBy: { created_at: "desc" }
		});
	}
	async findById(e) {
		return this.prisma.user.findUnique({
			where: { id: e },
			select: {
				id: !0,
				username: !0,
				role: !0,
				created_at: !0,
				updated_at: !0
			}
		});
	}
	async findByIdWithPassword(e) {
		return this.prisma.user.findUnique({ where: { id: e } });
	}
	async findByUsername(e) {
		return this.prisma.user.findUnique({ where: { username: e } });
	}
	async create(e) {
		return this.prisma.user.create({
			data: e,
			select: {
				id: !0,
				username: !0,
				role: !0,
				created_at: !0,
				updated_at: !0
			}
		});
	}
	async update(e, t) {
		return this.prisma.user.update({
			where: { id: e },
			data: t,
			select: {
				id: !0,
				username: !0,
				role: !0,
				created_at: !0,
				updated_at: !0
			}
		});
	}
	async delete(e) {
		await this.prisma.user.delete({ where: { id: e } });
	}
	async exists(e, t) {
		let n = { username: e };
		return t && (n.id = { not: t }), !!await this.prisma.user.findFirst({
			where: n,
			select: { id: !0 }
		});
	}
	async updateByUsername(e, t) {
		return this.prisma.user.update({
			where: { username: e },
			data: t,
			select: {
				id: !0,
				username: !0,
				role: !0,
				security_question: !0,
				created_at: !0,
				updated_at: !0
			}
		});
	}
	async count() {
		return this.prisma.user.count();
	}
}, fe = class {
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = e ? { name: {
			contains: e,
			mode: "insensitive"
		} } : {};
		return this.prisma.category.findMany({
			where: t,
			select: {
				id: !0,
				name: !0,
				created_at: !0,
				updated_at: !0
			},
			orderBy: { name: "asc" }
		});
	}
	async findById(e) {
		return await this.prisma.category.findUnique({
			where: { id: e },
			include: { products: { select: {
				id: !0,
				name: !0,
				sku: !0,
				stock: !0
			} } }
		});
	}
	async findByName(e) {
		return this.prisma.category.findFirst({ where: { name: e } });
	}
	async create(e) {
		return this.prisma.category.create({ data: e });
	}
	async update(e, t) {
		return this.prisma.category.update({
			where: { id: e },
			data: t
		});
	}
	async delete(e) {
		await this.prisma.category.delete({ where: { id: e } });
	}
	async getProductCount(e) {
		return this.prisma.product.count({ where: { category_id: e } });
	}
}, pe = class {
	constructor(e) {
		this.prisma = e;
	}
	async create(e) {
		try {
			let t = e.userId;
			if (t) {
				if (!await this.prisma.user.findUnique({
					where: { id: t },
					select: { id: !0 }
				})) {
					let n = await this.getDefaultAdminUserId();
					if (!n) {
						console.warn(`User ${e.userId} not found and no admin available, skipping audit log`);
						return;
					}
					t = n;
				}
			} else {
				let e = await this.getDefaultAdminUserId();
				if (!e) {
					console.warn("No userId provided and no admin user found, skipping audit log");
					return;
				}
				t = e;
			}
			await this.prisma.auditLog.create({ data: {
				user_id: t,
				action: e.action,
				entity: e.entity,
				entity_id: e.entity_id
			} });
		} catch (e) {
			console.warn("Failed to create audit log:", e);
		}
	}
	async getDefaultAdminUserId() {
		try {
			return (await this.prisma.user.findFirst({
				where: { role: "ADMIN" },
				select: { id: !0 },
				orderBy: { id: "asc" }
			}))?.id ?? null;
		} catch {
			return null;
		}
	}
}, me = class {
	constructor(e) {
		this.prisma = e;
	}
	async getStats(e, t) {
		let n = {};
		Object.assign(n, j("created_at", e, t));
		let r = Object.keys(n).length === 0 ? { created_at: { gte: new Date((/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) } } : n, i = await this.prisma.sale.aggregate({
			where: r,
			_sum: { total: !0 }
		}), a = await this.prisma.sale.count({ where: r }), o = (await this.prisma.sale.findMany({
			where: r,
			select: {
				id: !0,
				total: !0,
				items: { select: {
					quantity: !0,
					unit_price: !0,
					purchase_price: !0
				} }
			}
		})).reduce((e, t) => e + t.items.reduce((e, t) => e + t.quantity * (t.unit_price - t.purchase_price), 0), 0), s = await this.prisma.product.count({ where: { stock: { gt: 0 } } }), c = await this.prisma.client.count(), l = await this.prisma.product.count({ where: { stock: { lt: this.prisma.product.fields.min_stock } } });
		return {
			todayRevenue: i._sum.total || 0,
			todayProfit: o,
			todaySalesCount: a,
			totalRevenue: i._sum.total || 0,
			totalProfit: o,
			totalSales: a,
			activeProducts: s,
			totalClients: c,
			lowStockProducts: l,
			averageSale: a > 0 ? (i._sum.total || 0) / a : 0
		};
	}
	async getWeeklySales(e = 7) {
		let t = /* @__PURE__ */ new Date();
		t.setDate(t.getDate() - e);
		let n = (await this.prisma.sale.findMany({
			where: { created_at: { gte: t } },
			select: {
				total: !0,
				created_at: !0
			},
			orderBy: { created_at: "asc" }
		})).reduce((e, t) => {
			let n = t.created_at.toISOString().split("T")[0];
			return e[n] || (e[n] = {
				date: n,
				total: 0,
				count: 0
			}), e[n].total += t.total, e[n].count += 1, e;
		}, {});
		return Object.values(n);
	}
	async getLowStockProducts(e = 10) {
		return (await this.prisma.$queryRaw`
      SELECT p.id, p.sku, p.name, p.stock, p.min_stock, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock <= COALESCE(p.min_stock, 5) OR p.stock = 0
      ORDER BY p.stock ASC
      LIMIT ${e}
    ` || []).map((e) => ({
			id: e.id,
			sku: e.sku,
			name: e.name,
			stock: e.stock,
			min_stock: e.min_stock,
			category: e.category_name ? { name: e.category_name } : null
		}));
	}
	async getSalesByPaymentMethod(e, t) {
		let n = {};
		return Object.assign(n, j("created_at", e, t)), this.prisma.sale.groupBy({
			by: ["payment_method"],
			where: n,
			_count: { id: !0 },
			_sum: { total: !0 },
			_avg: { total: !0 }
		});
	}
	async getTopProducts(e = 10, t, n) {
		let r = {};
		Object.assign(r, j("created_at", t, n));
		let i = await this.prisma.saleItem.groupBy({
			by: ["product_id"],
			where: r,
			_sum: { quantity: !0 },
			_avg: { unit_price: !0 },
			_count: { id: !0 },
			orderBy: { _sum: { quantity: "desc" } },
			take: e
		}), a = i.map((e) => e.product_id), o = await this.prisma.product.findMany({
			where: { id: { in: a } },
			include: { category: !0 }
		});
		return i.map((e) => {
			let t = o.find((t) => t.id === e.product_id);
			return {
				product_id: e.product_id,
				product_name: t?.name || "Unknown",
				product_sku: t?.sku || "Unknown",
				category: t?.category?.name || "Sin categoría",
				total_quantity: e._sum.quantity || 0,
				avg_price: e._avg.unit_price || 0,
				times_sold: e._count.id
			};
		});
	}
	async getTopClients(e = 10, t, n) {
		let r = {};
		Object.assign(r, j("created_at", t, n));
		let i = await this.prisma.sale.groupBy({
			by: ["client_id"],
			where: r,
			_count: { id: !0 },
			_sum: { total: !0 },
			_avg: { total: !0 },
			orderBy: { _sum: { total: "desc" } },
			take: e
		}), a = i.map((e) => e.client_id).filter((e) => e !== null), o = await this.prisma.client.findMany({ where: { id: { in: a } } });
		return i.map((e) => {
			let t = o.find((t) => t.id === e.client_id);
			return {
				client_id: e.client_id,
				client_name: t?.name || "Cliente Desconocido",
				client_dni: t?.dni || "N/A",
				total_purchases: e._count.id,
				total_spent: e._sum.total || 0,
				avg_purchase: e._avg.total || 0
			};
		});
	}
	async getSalesByHour(e, t) {
		let n = {};
		Object.assign(n, j("created_at", e, t));
		let r = await this.prisma.sale.findMany({
			where: n,
			select: {
				total: !0,
				created_at: !0
			}
		}), i = Array.from({ length: 24 }, (e, t) => ({
			hour: t,
			total: 0,
			count: 0
		}));
		return r.forEach((e) => {
			let t = e.created_at.getHours();
			i[t].total += e.total, i[t].count += 1;
		}), i;
	}
	async getCashRegisterSummary(e, t) {
		let n = {};
		Object.assign(n, j("opened_at", e, t));
		let r = await this.prisma.cashRegister.findMany({
			where: n,
			select: {
				id: !0,
				opened_at: !0,
				opening_amount: !0,
				total_sales: !0
			},
			orderBy: { opened_at: "desc" }
		});
		return {
			registers: r,
			summary: r.reduce((e, t) => ({
				totalRegisters: e.totalRegisters + 1,
				totalOpening: e.totalOpening + Number(t.opening_amount),
				totalSales: e.totalSales + Number(t.total_sales)
			}), {
				totalRegisters: 0,
				totalOpening: 0,
				totalSales: 0
			})
		};
	}
	async getInventoryMetrics() {
		let e = await this.prisma.product.count(), t = await this.prisma.product.count({ where: { stock: { gt: 0 } } }), n = await this.prisma.product.count({ where: { stock: { equals: 0 } } }), r = await this.prisma.product.count({ where: { stock: { lt: this.prisma.product.fields.min_stock } } }), i = await this.prisma.product.aggregate({
			_sum: { price_purchase: !0 },
			where: { stock: { gt: 0 } }
		}), a = await this.prisma.product.aggregate({
			_sum: { price_sale: !0 },
			where: { stock: { gt: 0 } }
		}), o = await this.prisma.inventoryMovement.findMany({
			take: 10,
			orderBy: { created_at: "desc" },
			include: { product: { select: {
				name: !0,
				sku: !0
			} } }
		});
		return {
			totalProducts: e,
			productsWithStock: t,
			productsWithoutStock: n,
			lowStockProducts: r,
			totalPurchaseValue: i._sum.price_purchase || 0,
			totalSaleValue: a._sum.price_sale || 0,
			potentialProfit: (a._sum.price_sale || 0) - (i._sum.price_purchase || 0),
			recentMovements: o
		};
	}
}, he = class {
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = {};
		return e && (t.is_active = !0), this.prisma.discount.findMany({
			where: t,
			include: { category: { select: {
				id: !0,
				name: !0
			} } },
			orderBy: { created_at: "desc" }
		});
	}
	async findById(e) {
		return await this.prisma.discount.findUnique({
			where: { id: e },
			include: {
				category: { select: {
					id: !0,
					name: !0
				} },
				products: { include: { product: { select: {
					id: !0,
					name: !0,
					sku: !0
				} } } }
			}
		});
	}
	async findApplicableToProduct(e, t) {
		let n = await this.prisma.product.findUnique({
			where: { id: e },
			select: { category_id: !0 }
		});
		if (!n) return [];
		let r = await this.prisma.discount.findMany({ where: {
			is_active: !0,
			OR: [
				{ applicable_to: "ALL" },
				{
					applicable_to: "CATEGORY",
					category_id: n.category_id
				},
				{
					applicable_to: "SPECIFIC",
					products: { some: { product_id: e } }
				}
			]
		} });
		return t === void 0 ? r : r.filter((e) => e.min_purchase_amount === null || e.min_purchase_amount <= t);
	}
	async create(e) {
		let { product_ids: t, ...n } = e;
		return this.prisma.$transaction(async (e) => {
			let r = await e.discount.create({ data: {
				name: n.name,
				type: n.type,
				value: n.value,
				is_active: n.is_active ?? !0,
				applicable_to: n.applicable_to ?? "ALL",
				category_id: n.category_id ?? null,
				min_purchase_amount: n.min_purchase_amount ?? null
			} });
			return t && t.length > 0 && await e.productDiscount.createMany({ data: t.map((e) => ({
				product_id: e,
				discount_id: r.id
			})) }), r;
		});
	}
	async update(e, t) {
		let { product_ids: n, ...r } = t;
		return this.prisma.$transaction(async (t) => {
			let i = await t.discount.update({
				where: { id: e },
				data: {
					...r,
					category_id: r.category_id ?? null,
					min_purchase_amount: r.min_purchase_amount ?? null
				}
			});
			return n !== void 0 && (await t.productDiscount.deleteMany({ where: { discount_id: e } }), n.length > 0 && await t.productDiscount.createMany({ data: n.map((t) => ({
				product_id: t,
				discount_id: e
			})) })), i;
		});
	}
	async delete(e) {
		await this.prisma.discount.delete({ where: { id: e } });
	}
	async addProducts(e, t) {
		await this.prisma.productDiscount.createMany({ data: t.map((t) => ({
			product_id: t,
			discount_id: e
		})) });
	}
	async removeProducts(e, t) {
		await this.prisma.productDiscount.deleteMany({ where: {
			discount_id: e,
			product_id: { in: t }
		} });
	}
};
//#endregion
//#region src/backend/utils/pathValidation.ts
function ge(e, t) {
	let n = u.resolve(e), r = u.resolve(t);
	return r === n || r.startsWith(n + u.sep);
}
function _e(e, t, n) {
	if (!ge(e, t)) throw Error(`${n || "Ruta"} no válida: debe estar dentro del directorio permitido`);
}
//#endregion
//#region src/infrastructure/backup/ElectronBackupService.ts
var ve = g(h), ye = class {
	getDbPath() {
		if (!o.isPackaged) return u.resolve(process.cwd(), "prisma", "dev.sqlite3");
		let e = o.getPath("userData");
		return u.join(e, "dev.sqlite3");
	}
	getBackupDir() {
		let e = !o.isPackaged, t;
		t = e ? process.cwd() : o.getPath("userData");
		let n = u.join(t, "backups");
		return d.existsSync(n) || d.mkdirSync(n, { recursive: !0 }), n;
	}
	async createBackup(e) {
		try {
			let t = this.getDbPath();
			if (!d.existsSync(t)) return {
				success: !1,
				message: "Database file not found"
			};
			let n = this.getBackupDir(), r = `backup-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").split("T")[0]}${e ? `-${e}` : ""}.sqlite.gz`, i = u.join(n, r);
			return await ve(d.createReadStream(t), v(), d.createWriteStream(i)), {
				success: !0,
				path: r
			};
		} catch (e) {
			return k.error({ err: e }, "Error creating backup"), {
				success: !1,
				message: "Error al crear respaldo"
			};
		}
	}
	async listBackups() {
		try {
			let e = this.getBackupDir();
			return d.existsSync(e) ? d.readdirSync(e).filter((e) => e.endsWith(".sqlite.gz")).map((t) => {
				let n = u.join(e, t), r = d.statSync(n);
				return {
					filename: t,
					path: t,
					size: r.size,
					created: r.mtime
				};
			}).sort((e, t) => t.created.getTime() - e.created.getTime()) : [];
		} catch (e) {
			return k.error({ err: e }, "Error listing backups"), [];
		}
	}
	async restoreBackup(e) {
		try {
			let t = this.getBackupDir();
			if (u.isAbsolute(e)) return {
				success: !1,
				message: "Ruta absoluta no permitida. Use solo el nombre del archivo."
			};
			let n = u.join(t, e);
			if (_e(t, n, "Archivo de backup"), !d.existsSync(n)) return {
				success: !1,
				message: "Archivo de backup no encontrado"
			};
			let r = this.getDbPath();
			return await this.createBackup("before-restore"), await ve(d.createReadStream(n), _(), d.createWriteStream(r)), {
				success: !0,
				message: "Backup restaurado correctamente. Reinicia la aplicación."
			};
		} catch (e) {
			return k.error({ err: e }, "Error restoring backup"), {
				success: !1,
				message: "Error al restaurar respaldo"
			};
		}
	}
	async deleteBackup(e) {
		try {
			let t = this.getBackupDir();
			if (u.isAbsolute(e)) return {
				success: !1,
				message: "Ruta absoluta no permitida. Use solo el nombre del archivo."
			};
			let n = u.join(t, e);
			return _e(t, n, "Archivo de backup"), d.existsSync(n) ? (d.unlinkSync(n), { success: !0 }) : {
				success: !1,
				message: "Archivo de backup no encontrado"
			};
		} catch (e) {
			return k.error({ err: e }, "Error deleting backup"), {
				success: !1,
				message: "Error al eliminar respaldo"
			};
		}
	}
	async createScheduledBackup() {
		let e = await this.listBackups(), t = /* @__PURE__ */ new Date(), n = new Date(t.getFullYear(), t.getMonth(), t.getDate());
		e.find((e) => {
			let t = new Date(e.created);
			return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() === n.getTime();
		}) || (await this.createBackup("auto"), k.info("Automatic backup created"));
	}
	async cleanupOldBackups(e = 10) {
		try {
			let t = this.getBackupDir(), n = await this.listBackups();
			if (n.length > e) {
				let r = n.slice(e);
				for (let e of r) {
					let n = u.join(t, e.path);
					d.unlinkSync(n);
				}
				k.info(`Cleaned up ${r.length} old backups`);
			}
		} catch (e) {
			k.error({ err: e }, "Error cleaning up backups");
		}
	}
}, be = class {
	async generateSalesReport(e, t, n = "Reporte de Ventas", r = !0) {
		let i = new y({
			unit: "mm",
			format: "a4"
		});
		i.setFontSize(16), i.text(n, 14, 20), i.setFontSize(10), i.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, 14, 28);
		let a = 34;
		return r && e.length > 0 && (b(i, {
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
			body: e.map((e) => [
				e.date,
				String(e.invoiceNumber),
				e.client,
				String(e.itemsCount),
				`$ ${e.subtotal.toFixed(2)}`,
				`$ ${e.tax.toFixed(2)}`,
				`$ ${e.total.toFixed(2)}`,
				e.paymentMethod
			]),
			startY: 34,
			styles: { fontSize: 7 },
			headStyles: { fillColor: [
				41,
				128,
				185
			] },
			tableWidth: "auto"
		}), a = i.lastAutoTable.finalY + 10), i.setFontSize(10), i.text(`Total Ventas: ${t.totalSales}`, 14, a), i.text(`Ingreso Total: $ ${t.totalRevenue.toFixed(2)}`, 14, a + 6), i.text(`Promedio: $ ${t.averageSale.toFixed(2)}`, 14, a + 12), (t.cashSales !== void 0 || t.cardSales !== void 0) && (i.text(`Efectivo: ${t.cashSales ?? 0} ventas  |  $ ${(t.cashRevenue ?? 0).toFixed(2)}`, 14, a + 18), i.text(`Tarjeta: ${t.cardSales ?? 0} ventas  |  $ ${(t.cardRevenue ?? 0).toFixed(2)}`, 14, a + 24)), new Uint8Array(i.output("arraybuffer"));
	}
	async generateInventoryReport(e, t, n = "Reporte de Inventario") {
		let r = new y({
			unit: "mm",
			format: "a4"
		});
		r.setFontSize(16), r.text(n, 14, 20), r.setFontSize(10), r.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, 14, 28), b(r, {
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
			body: e.map((e) => [
				e.sku,
				e.name,
				e.category,
				String(e.stock),
				e.minStock === null ? "-" : String(e.minStock),
				`$ ${e.purchasePrice.toFixed(2)}`,
				`$ ${e.salePrice.toFixed(2)}`,
				e.status === "ok" ? "OK" : e.status === "low" ? "Stock Bajo" : "Sin Stock"
			]),
			startY: 34,
			styles: { fontSize: 7 },
			headStyles: { fillColor: [
				39,
				174,
				96
			] },
			tableWidth: "auto",
			didParseCell: (e) => {
				if (e.section === "body" && e.column.index === 7) {
					let t = e.cell.raw;
					t === "Sin Stock" ? e.cell.styles.textColor = [
						255,
						0,
						0
					] : t === "Stock Bajo" ? e.cell.styles.textColor = [
						255,
						165,
						0
					] : e.cell.styles.textColor = [
						0,
						128,
						0
					];
				}
			}
		});
		let i = r.lastAutoTable.finalY + 10 || 50;
		return r.setFontSize(10), r.text(`Total Productos: ${t.totalProducts}`, 14, i), r.text(`Con Stock: ${t.productsWithStock}  |  Sin Stock: ${t.productsWithoutStock}  |  Stock Bajo: ${t.lowStockProducts}`, 14, i + 6), r.text(`Valor Compra: $ ${t.totalPurchaseValue.toFixed(2)}  |  Valor Venta: $ ${t.totalSaleValue.toFixed(2)}`, 14, i + 12), r.text(`Ganancia Potencial: $ ${t.potentialProfit.toFixed(2)}`, 14, i + 18), new Uint8Array(r.output("arraybuffer"));
	}
	async generateSaleReceipt(e) {
		let t = new y({
			unit: "mm",
			format: [80, 120 + e.items.length * 6]
		}), n = 10;
		if (e.logoBase64) try {
			t.addImage(e.logoBase64, "PNG", 30, n, 20, 20), n += 22;
		} catch {}
		return t.setFontSize(10), t.text(e.businessName, 40, n, { align: "center" }), n += 5, t.setFontSize(7), e.businessAddress && (t.text(e.businessAddress, 40, n, { align: "center" }), n += 4), e.businessPhone && (t.text(`Tel: ${e.businessPhone}`, 40, n, { align: "center" }), n += 4), e.businessTaxId && (t.text(`RUC: ${e.businessTaxId}`, 40, n, { align: "center" }), n += 4), n += 3, t.setFontSize(8), t.text("=".repeat(32), 5, n), n += 4, t.text(`Ticket: #${e.saleId}`, 5, n), n += 4, t.text(`Fecha: ${e.createdAt.toLocaleString("es-PE")}`, 5, n), n += 4, t.text(`Cliente: ${e.clientName}`, 5, n), n += 4, e.clientDni && (t.text(`DNI: ${e.clientDni}`, 5, n), n += 4), e.clientTaxId && (t.text(`RUC: ${e.clientTaxId}`, 5, n), n += 4), t.text(`Pago: ${e.paymentMethod === "CASH" ? "EFECTIVO" : "TARJETA"}`, 5, n), n += 4, t.text("-".repeat(32), 5, n), n += 5, e.items.forEach((e) => {
			t.text(`${e.quantity} x ${e.productName}`, 5, n), t.text(`$ ${e.totalPrice.toFixed(2)}`, 75, n, { align: "right" }), n += 5, e.discountName && e.discountAmount && e.discountAmount > 0 && (t.setFontSize(6), t.text(`  Desc. ${e.discountName}: -$${e.discountAmount.toFixed(2)}`, 8, n), n += 4, t.setFontSize(8));
		}), t.text("-".repeat(32), 5, n + 2), n += 6, t.setFontSize(8), t.text("Subtotal:", 5, n), t.text(`$ ${e.subtotal.toFixed(2)}`, 75, n, { align: "right" }), n += 5, e.discountTotal && e.discountTotal > 0 && (t.text("Descuento:", 5, n), t.text(`-$${e.discountTotal.toFixed(2)}`, 75, n, { align: "right" }), n += 5), e.taxAmount > 0 && (t.text(`${e.taxType.toUpperCase()} (${(e.taxRate * 100).toFixed(1)}%):`, 5, n), t.text(`$ ${e.taxAmount.toFixed(2)}`, 75, n, { align: "right" }), n += 5), t.setFontSize(10), t.text("TOTAL:", 5, n + 2), t.text(`$ ${e.total.toFixed(2)}`, 75, n + 2, { align: "right" }), n += 8, t.setFontSize(7), t.text(e.ticketFooter || "Gracias por su compra", 40, n, { align: "center" }), new Uint8Array(t.output("arraybuffer"));
	}
	async generateCashCloseReport(e) {
		let t = new y({
			unit: "mm",
			format: "a4"
		}), n = 20;
		t.setFontSize(16), t.text("Reporte de Cierre de Caja", 14, n), n += 8, t.setFontSize(10), t.text(e.businessName, 14, n), n += 6, t.setFontSize(8), t.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, 14, n), n += 6, t.text(`Caja #${e.registerId}`, 14, n), n += 5, t.text(`Apertura: ${e.openDate.toLocaleString("es-PE")}`, 14, n), n += 5, t.text(`Cierre: ${e.closeDate.toLocaleString("es-PE")}`, 14, n), n += 8, t.setFontSize(9), [
			["Ventas Realizadas", String(e.salesCount)],
			["Ventas Efectivo", `$ ${e.cashSales.toFixed(2)}`],
			["Ventas Tarjeta", `$ ${e.cardSales.toFixed(2)}`]
		].forEach(([e, r]) => {
			t.text(e, 14, n), t.text(r, 100, n), n += 7;
		}), n += 4, t.setDrawColor(100, 100, 100), t.line(14, n, 190, n), n += 6, t.setFontSize(10), t.text("RESUMEN", 14, n), n += 6, [
			["Fondo Inicial", `$ ${e.openingAmount.toFixed(2)}`],
			["Total Ventas", `$ ${e.totalSales.toFixed(2)}`],
			["Esperado (Fondo + Ventas)", `$ ${e.expectedCash.toFixed(2)}`],
			["Real (Declarado)", `$ ${e.realCash.toFixed(2)}`]
		].forEach(([e, r]) => {
			t.text(e, 14, n), t.text(r, 100, n), n += 7;
		}), n += 3, t.setDrawColor(100, 100, 100), t.line(14, n, 190, n), n += 6;
		let r = e.difference >= 0 ? "SOBRANTE" : "FALTANTE", i = e.difference === 0 ? [
			0,
			128,
			0
		] : [
			200,
			0,
			0
		];
		return t.setTextColor(...i), t.setFontSize(12), t.text(`${r}: $ ${Math.abs(e.difference).toFixed(2)}`, 14, n), t.setTextColor(0, 0, 0), n += 8, t.setFontSize(8), t.setTextColor(100, 100, 100), t.text(`Estado: ${e.status === "PERFECT" ? "Cuadra Perfectamente" : e.status === "SURPLUS" ? "Sobrante detectado" : "Faltante detectado"}`, 14, n), n += 6, t.text("Firma del responsable: _______________________________", 14, n), new Uint8Array(t.output("arraybuffer"));
	}
}, xe = class {
	async generateSalesReport(e, t, n = "Reporte de Ventas", r = !0) {
		let i = new x.Workbook();
		i.creator = "POS Venta SIS", i.created = /* @__PURE__ */ new Date();
		let a = i.addWorksheet("Ventas");
		a.mergeCells("A1:H1");
		let o = a.getCell("A1");
		o.value = n, o.font = {
			size: 16,
			bold: !0
		}, a.getCell("A2").value = `Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, a.getCell("A2").font = {
			size: 10,
			italic: !0
		}, a.columns = [
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
		let s = a.getRow(4);
		s.font = {
			bold: !0,
			color: { argb: "FFFFFFFF" }
		}, s.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF2980B9" }
		}, s.alignment = { horizontal: "center" }, e.forEach((e) => {
			a.addRow({
				date: e.date,
				invoiceNumber: e.invoiceNumber,
				client: e.client,
				itemsCount: e.itemsCount,
				subtotal: e.subtotal,
				tax: e.tax,
				total: e.total,
				paymentMethod: e.paymentMethod
			});
		});
		let c = 5 + e.length - 1;
		a.addRow({});
		let l = a.addRow({
			date: "TOTALES",
			itemsCount: t.totalSales,
			subtotal: { formula: `SUM(E5:E${c})` },
			tax: { formula: `SUM(F5:F${c})` },
			total: { formula: `SUM(G5:G${c})` }
		});
		l.font = { bold: !0 }, l.getCell(1).font = {
			bold: !0,
			size: 11
		};
		let u = a.addRow({
			date: "Promedio",
			total: t.averageSale
		});
		u.font = { italic: !0 }, (t.cashSales !== void 0 || t.cardSales !== void 0) && (a.addRow({}), a.addRow({
			date: "Efectivo",
			itemsCount: t.cashSales ?? 0,
			total: t.cashRevenue ?? 0
		}), a.addRow({
			date: "Tarjeta",
			itemsCount: t.cardSales ?? 0,
			total: t.cardRevenue ?? 0
		}));
		let d = await i.xlsx.writeBuffer();
		return new Uint8Array(d);
	}
	async generateInventoryReport(e, t, n = "Reporte de Inventario") {
		let r = new x.Workbook();
		r.creator = "POS Venta SIS", r.created = /* @__PURE__ */ new Date();
		let i = r.addWorksheet("Inventario");
		i.mergeCells("A1:H1");
		let a = i.getCell("A1");
		a.value = n, a.font = {
			size: 16,
			bold: !0
		}, i.getCell("A2").value = `Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, i.getCell("A2").font = {
			size: 10,
			italic: !0
		}, i.columns = [
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
		let o = i.getRow(4);
		o.font = {
			bold: !0,
			color: { argb: "FFFFFFFF" }
		}, o.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF27AE60" }
		}, o.alignment = { horizontal: "center" }, e.forEach((e) => {
			let t = i.addRow({
				sku: e.sku,
				name: e.name,
				category: e.category,
				stock: e.stock,
				minStock: e.minStock ?? "-",
				purchasePrice: e.purchasePrice,
				salePrice: e.salePrice,
				status: e.status === "ok" ? "OK" : e.status === "low" ? "Stock Bajo" : "Sin Stock"
			}).getCell(8);
			e.status === "out" ? t.font = {
				color: { argb: "FFFF0000" },
				bold: !0
			} : e.status === "low" ? t.font = {
				color: { argb: "FFFFA500" },
				bold: !0
			} : t.font = { color: { argb: "FF008000" } };
		}), i.addRow({});
		let s = i.addRow({
			sku: "RESUMEN",
			stock: t.totalProducts,
			purchasePrice: t.totalPurchaseValue,
			salePrice: t.totalSaleValue
		});
		s.font = { bold: !0 }, i.addRow({
			sku: "Con Stock",
			stock: t.productsWithStock
		}), i.addRow({
			sku: "Sin Stock",
			stock: t.productsWithoutStock
		}), i.addRow({
			sku: "Stock Bajo",
			stock: t.lowStockProducts
		});
		let c = await r.xlsx.writeBuffer();
		return new Uint8Array(c);
	}
	async generateSaleReceipt(e) {
		let t = new x.Workbook();
		t.creator = "POS Venta SIS", t.created = /* @__PURE__ */ new Date();
		let n = t.addWorksheet("Comprobante");
		n.mergeCells("A1:D1");
		let r = n.getCell("A1");
		r.value = `${e.businessName} - Ticket #${e.saleId}`, r.font = {
			size: 14,
			bold: !0
		}, n.getCell("A2").value = `Fecha: ${e.createdAt.toLocaleString("es-PE")}`, n.getCell("A2").font = {
			size: 10,
			italic: !0
		}, n.getCell("A3").value = `Cliente: ${e.clientName}`, n.getCell("A4").value = `Pago: ${e.paymentMethod === "CASH" ? "EFECTIVO" : "TARJETA"}`, n.columns = [
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
		let i = n.getRow(6);
		i.font = {
			bold: !0,
			color: { argb: "FFFFFFFF" }
		}, i.fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FF2980B9" }
		}, e.items.forEach((e) => {
			n.addRow({
				quantity: e.quantity,
				productName: e.productName,
				unitPrice: e.unitPrice,
				totalPrice: e.totalPrice
			});
		});
		let a = 6 + e.items.length + 1;
		n.addRow({}), n.getCell(`A${a + 1}`).value = "Subtotal:", n.getCell(`D${a + 1}`).value = e.subtotal, n.getCell(`D${a + 1}`).numFmt = "#,##0.00", e.taxAmount > 0 && (n.getCell(`A${a + 2}`).value = `${e.taxType.toUpperCase()} (${(e.taxRate * 100).toFixed(1)}%):`, n.getCell(`D${a + 2}`).value = e.taxAmount, n.getCell(`D${a + 2}`).numFmt = "#,##0.00");
		let o = e.taxAmount > 0 ? a + 3 : a + 2;
		n.getCell(`A${o}`).value = "TOTAL:", n.getCell(`A${o}`).font = {
			bold: !0,
			size: 12
		}, n.getCell(`D${o}`).value = e.total, n.getCell(`D${o}`).font = {
			bold: !0,
			size: 12
		}, n.getCell(`D${o}`).numFmt = "#,##0.00";
		let s = await t.xlsx.writeBuffer();
		return new Uint8Array(s);
	}
	async generateCashCloseReport(e) {
		let t = new x.Workbook();
		t.creator = "POS Venta SIS", t.created = /* @__PURE__ */ new Date();
		let n = t.addWorksheet("Cierre de Caja");
		n.mergeCells("A1:B1");
		let r = n.getCell("A1");
		r.value = `${e.businessName} - Cierre de Caja #${e.registerId}`, r.font = {
			size: 14,
			bold: !0
		}, n.getCell("A3").value = `Apertura: ${e.openDate.toLocaleString("es-PE")}`, n.getCell("A4").value = `Cierre: ${e.closeDate.toLocaleString("es-PE")}`, n.columns = [{
			header: "Concepto",
			key: "concept",
			width: 30
		}, {
			header: "Valor",
			key: "value",
			width: 20
		}], n.addRow({});
		let i = n.addRow({
			concept: "RESUMEN",
			value: ""
		});
		i.font = {
			bold: !0,
			size: 11
		}, [
			{
				concept: "Ventas Realizadas",
				value: e.salesCount
			},
			{
				concept: "Ventas Efectivo",
				value: e.cashSales
			},
			{
				concept: "Ventas Tarjeta",
				value: e.cardSales
			},
			{
				concept: "",
				value: ""
			},
			{
				concept: "Fondo Inicial",
				value: e.openingAmount
			},
			{
				concept: "Total Ventas",
				value: e.totalSales
			},
			{
				concept: "Esperado",
				value: e.expectedCash
			},
			{
				concept: "Real (Declarado)",
				value: e.realCash
			}
		].forEach((e) => {
			let t = n.addRow({
				concept: e.concept,
				value: (e.value, e.value)
			});
			typeof e.value == "number" && e.concept && (t.getCell(2).numFmt = e.concept.includes("Realizadas") ? "#,##0" : "#,##0.00");
		});
		let a = n.addRow({
			concept: e.difference >= 0 ? "SOBRANTE" : "FALTANTE",
			value: Math.abs(e.difference)
		});
		a.font = {
			bold: !0,
			size: 12,
			color: { argb: e.difference === 0 ? "FF008000" : "FFC80000" }
		}, a.getCell(2).numFmt = "#,##0.00";
		let o = await t.xlsx.writeBuffer();
		return new Uint8Array(o);
	}
}, N = S.object({
	sku: S.string().min(1, "El SKU es obligatorio."),
	name: S.string().min(1, "El nombre es obligatorio."),
	description: S.string().optional(),
	category_id: S.coerce.number().int().positive().optional().nullable(),
	supplier_id: S.coerce.number().int().positive().optional().nullable(),
	price_purchase: S.coerce.number().min(0, "El precio de compra no puede ser negativo."),
	price_sale: S.coerce.number().min(0, "El precio de venta no puede ser negativo."),
	stock: S.coerce.number().int().optional(),
	min_stock: S.coerce.number().int().min(0).optional().default(10)
}), Se = S.object({
	product_id: S.coerce.number().int().positive("El ID del producto es obligatorio."),
	quantity: S.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
	unit_price: S.coerce.number().min(0, "El precio unitario no puede ser negativo."),
	discount_id: S.coerce.number().int().positive().optional()
}), Ce = S.object({
	cash_register_id: S.coerce.number().int().positive("El ID de la caja es obligatorio."),
	client_id: S.coerce.number().int().optional(),
	client_dni: S.string().optional(),
	client_name: S.string().optional(),
	payment_method: S.enum(["CASH", "CARD"]).default("CASH"),
	items: S.array(Se).min(1, "La venta debe tener al menos un producto.")
});
S.object({ opening_amount: S.coerce.number().min(0, "El monto de apertura no puede ser negativo.") }), S.object({
	register_id: S.coerce.number().int().positive("El ID de la caja es obligatorio."),
	closing_amount: S.coerce.number().min(0, "El monto de cierre no puede ser negativo.")
});
var P = S.object({
	dni: S.string().min(1, "El DNI/Documento es obligatorio."),
	name: S.string().min(1, "El nombre es obligatorio."),
	phone: S.string().optional().nullable(),
	code: S.string().min(1, "El código de cliente es obligatorio."),
	tax_id: S.string().optional().nullable()
}), F = S.object({ name: S.string().min(1, "El nombre de la categoría es obligatorio.").max(255) });
S.object({
	product_id: S.coerce.number().int().positive("El ID del producto es obligatorio."),
	type: S.enum(["ENTRADA", "SALIDA"], { errorMap: () => ({ message: "El tipo debe ser ENTRADA o SALIDA." }) }),
	quantity: S.coerce.number().int().positive("La cantidad debe ser mayor a 0.")
});
var I = S.object({
	name: S.string().min(1, "El nombre del proveedor es obligatorio."),
	ruc: S.string().optional().nullable(),
	phone: S.string().optional().nullable(),
	email: S.string().email("Email inválido").optional().nullable().or(S.literal("")),
	address: S.string().optional().nullable()
});
S.object({
	name: S.string().min(1, "El nombre del proveedor es obligatorio.").optional(),
	ruc: S.string().optional().nullable(),
	phone: S.string().optional().nullable(),
	email: S.string().email("Email inválido").optional().nullable().or(S.literal("")),
	address: S.string().optional().nullable()
});
var we = S.object({
	product_id: S.coerce.number().int().positive("El ID del producto es obligatorio."),
	quantity: S.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
	unit_cost: S.coerce.number().min(0, "El costo unitario no puede ser negativo.")
}), Te = S.object({
	supplier_id: S.coerce.number().int().positive("El ID del proveedor es obligatorio."),
	items: S.array(we).min(1, "La orden debe tener al menos un producto."),
	payment_status: S.enum([
		"PENDING",
		"PAID",
		"CANCELED"
	]).optional().default("PENDING")
}), Ee = S.object({
	username: S.string().min(1, "El nombre de usuario es obligatorio.").max(50),
	password: S.string().min(8, "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial").regex(/[A-Z]/, "Debe contener al menos una mayúscula").regex(/[a-z]/, "Debe contener al menos una minúscula").regex(/[0-9]/, "Debe contener al menos un número").regex(/[!@#$%^&*()_\-+=<>?/{}~|]/, "Debe contener al menos un carácter especial"),
	role: S.enum(["ADMIN", "VENDEDOR"], { errorMap: () => ({ message: "El rol debe ser ADMIN o VENDEDOR." }) }),
	question: S.string().optional(),
	answer: S.string().optional()
});
S.object({
	username: S.string().min(1, "El nombre de usuario es obligatorio.").max(50).optional(),
	role: S.enum(["ADMIN", "VENDEDOR"]).optional()
});
var De = S.object({
	name: S.string().min(1, "El nombre del descuento es obligatorio."),
	type: S.enum(["PERCENTAGE", "FIXED_AMOUNT"], { errorMap: () => ({ message: "El tipo debe ser PERCENTAGE o FIXED_AMOUNT." }) }),
	value: S.coerce.number().min(0, "El valor no puede ser negativo."),
	is_active: S.boolean().optional(),
	applicable_to: S.enum([
		"ALL",
		"CATEGORY",
		"SPECIFIC"
	]).optional(),
	category_id: S.coerce.number().int().positive().optional().nullable(),
	product_ids: S.array(S.coerce.number().int().positive()).optional(),
	min_purchase_amount: S.coerce.number().min(0).optional().nullable()
}), Oe = S.object({
	percentage: S.coerce.number().int("Debe ser un número entero.").min(-100, "Mínimo -100%.").max(1e3, "Máximo 1000%."),
	category_id: S.coerce.number().int().positive().optional()
}), ke = S.record(S.enum([
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
]), S.string()).refine((e) => Object.keys(e).length > 0, { message: "Debe enviar al menos una configuración." }), Ae = class {
	constructor(e, t, n) {
		this.productRepo = e, this.categoryRepo = t, this.auditLogRepo = n;
	}
	async getAllProducts(e, t) {
		return this.productRepo.findAll(e, t);
	}
	async getProductById(e) {
		let n = await this.productRepo.findById(e);
		if (!n) throw new t("Producto");
		return n;
	}
	async getLowStockProducts(e) {
		return this.productRepo.findLowStock();
	}
	async createProduct(e, r = 1) {
		let i = N.parse(e);
		if (await this.productRepo.findBySku(i.sku)) throw new n(`El SKU ${i.sku} ya se encuentra registrado.`);
		if (i.category_id && !await this.categoryRepo.findById(i.category_id)) throw new t("Categoría");
		let a = i.stock || 0, o = await this.productRepo.create(i);
		return a > 0 && await this.productRepo.createMovement({
			product_id: o.id,
			type: "ENTRADA",
			quantity: a,
			reason: "INICIAL"
		}), await this.auditLogRepo.create({
			userId: r,
			action: "CREATE_PRODUCT",
			entity: "products",
			entity_id: o.id
		}), {
			success: !0,
			id: o.id
		};
	}
	async updateProduct(e, r, i = 1) {
		let a = await this.productRepo.findById(e);
		if (!a) throw new t("Producto");
		let o = N.parse(r);
		if (o.sku !== a.sku && await this.productRepo.findBySku(o.sku)) throw new n(`El SKU ${o.sku} ya se encuentra registrado.`);
		if (o.category_id && !await this.categoryRepo.findById(o.category_id)) throw new t("Categoría");
		let s = await this.productRepo.update(e, o);
		return await this.auditLogRepo.create({
			userId: i,
			action: "UPDATE_PRODUCT",
			entity: "products",
			entity_id: s.id
		}), {
			success: !0,
			product: s
		};
	}
	async deleteProduct(e, n = 1) {
		if (!await this.productRepo.findById(e)) throw new t("Producto");
		let r = await this.productRepo.getSalesCount(e);
		if (r > 0) throw new i(`No se puede eliminar el producto porque tiene ${r} venta(s) asociada(s).`);
		return await this.productRepo.delete(e), await this.auditLogRepo.create({
			userId: n,
			action: "DELETE_PRODUCT",
			entity: "products",
			entity_id: e
		}), { success: !0 };
	}
	async addStock(n, r, i = 1, a = "AJUSTE") {
		if (!await this.productRepo.findById(n)) throw new t("Producto");
		if (r <= 0) throw new e("La cantidad debe ser mayor a cero.");
		return await this.productRepo.updateStock(n, r), await this.productRepo.createMovement({
			product_id: n,
			type: "ENTRADA",
			quantity: r,
			reason: a
		}), await this.auditLogRepo.create({
			userId: i,
			action: "STOCK_ENTRADA",
			entity: "products",
			entity_id: n
		}), { success: !0 };
	}
	async removeStock(n, r, a = 1, o = "AJUSTE") {
		let s = await this.productRepo.findById(n);
		if (!s) throw new t("Producto");
		if (r <= 0) throw new e("La cantidad debe ser mayor a cero.");
		if (s.stock < r) throw new i(`Stock insuficiente. Stock actual: ${s.stock}, Cantidad solicitada: ${r}`);
		await this.productRepo.updateStock(n, -r);
		let c = await this.productRepo.findById(n);
		if (c && c.stock < 0) throw new i("Error interno: el stock no puede ser negativo");
		return await this.productRepo.createMovement({
			product_id: n,
			type: "SALIDA",
			quantity: r,
			reason: o
		}), await this.auditLogRepo.create({
			userId: a,
			action: "STOCK_SALIDA",
			entity: "products",
			entity_id: n
		}), { success: !0 };
	}
	async getInventoryMovements(e, n = 50) {
		if (!await this.productRepo.findById(e)) throw new t("Producto");
		return this.productRepo.getMovements(e, n);
	}
	async bulkUpdatePrice(n, r = 1) {
		let i = n.percentage;
		if (!Number.isInteger(i) || i < -100 || i > 1e3) throw new e("El porcentaje debe ser un entero entre -100 y 1000.");
		if (n.category_id && !await this.categoryRepo.findById(n.category_id)) throw new t("Categoría");
		let a = await this.productRepo.bulkUpdatePrice(i, n.category_id);
		return await this.auditLogRepo.create({
			userId: r,
			action: "BULK_UPDATE_PRICE",
			entity: "products",
			entity_id: 0
		}), {
			success: !0,
			updatedCount: a
		};
	}
}, je = class {
	constructor(e, t) {
		this.clientRepo = e, this.auditLogRepo = t;
	}
	async getAllClients(e) {
		return this.clientRepo.findAll(e);
	}
	async getClientById(e) {
		return await M(() => this.clientRepo.findById(e), "Cliente", e);
	}
	async createClient(e, t = 1) {
		let r = P.parse(e);
		if (await this.clientRepo.findByDni(r.dni)) throw new n(`El DNI ${r.dni} ya se encuentra registrado.`);
		if (await this.clientRepo.findByCode(r.code)) throw new n(`El código ${r.code} ya se encuentra registrado.`);
		if (r.tax_id && await this.clientRepo.findByTaxId(r.tax_id)) throw new n(`El RUC ${r.tax_id} ya se encuentra registrado.`);
		let i = await this.clientRepo.create(r);
		return await this.auditLogRepo.create({
			userId: t,
			action: "CREATE_CLIENT",
			entity: "clients",
			entity_id: i.id
		}), {
			success: !0,
			id: i.id
		};
	}
	async updateClient(e, t, r = 1) {
		await M(() => this.clientRepo.findById(e), "Cliente", e);
		let i = P.parse(t), a = await this.clientRepo.findByDni(i.dni);
		if (a && a.id !== e) throw new n(`El DNI ${i.dni} ya se encuentra registrado.`);
		let o = await this.clientRepo.findByCode(i.code);
		if (o && o.id !== e) throw new n(`El código ${i.code} ya se encuentra registrado.`);
		if (i.tax_id) {
			let t = await this.clientRepo.findByTaxId(i.tax_id);
			if (t && t.id !== e) throw new n(`El RUC ${i.tax_id} ya se encuentra registrado.`);
		}
		let s = await this.clientRepo.update(e, i);
		return await this.auditLogRepo.create({
			userId: r,
			action: "UPDATE_CLIENT",
			entity: "clients",
			entity_id: s.id
		}), {
			success: !0,
			client: s
		};
	}
	async deleteClient(e, t = 1) {
		await M(() => this.clientRepo.findById(e), "Cliente", e);
		let n = await this.clientRepo.getSalesCount(e);
		if (n > 0) throw new i(`No se puede eliminar el cliente porque tiene ${n} venta(s) asociada(s).`);
		return await this.clientRepo.delete(e), await this.auditLogRepo.create({
			userId: t,
			action: "DELETE_CLIENT",
			entity: "clients",
			entity_id: e
		}), { success: !0 };
	}
}, Me = class {
	constructor(e, t, n, r, i, a, o, s) {
		this.saleRepo = e, this.productRepo = t, this.clientRepo = n, this.cashRegisterRepo = r, this.settingsRepo = i, this.auditLogRepo = a, this.discountRepo = o, this.dashboardService = s;
	}
	async getAllSales(e, t, n, r) {
		let i = {};
		return e && (i.startDate = e), t && (i.endDate = t), n && (i.clientId = n), r && (i.cashRegisterId = r), this.saleRepo.findAll(i);
	}
	async getSaleDetails(e) {
		let n = await this.saleRepo.findById(e);
		if (!n) throw new t("Venta");
		return n;
	}
	async getTodaySales() {
		return this.saleRepo.findToday();
	}
	async getSalesStats(e, t) {
		return this.saleRepo.getStats(e, t);
	}
	async getLastSale() {
		return this.saleRepo.findLast();
	}
	async registerSale(e, n, r = 1) {
		let a = Ce.parse({
			...e,
			items: n
		});
		if (!await this.cashRegisterRepo.findOpen()) throw new i("La caja no está abierta o no existe.");
		let o = a.client_id;
		if (a.client_dni && a.client_name && !o) {
			let e = await this.clientRepo.findByDni(a.client_dni);
			o = e ? e.id : (await this.clientRepo.create({
				dni: a.client_dni,
				name: a.client_name,
				code: `CLI-${Date.now()}`
			})).id;
		}
		if (o && !await this.clientRepo.findById(o)) throw new t("Cliente");
		let s = a.items.map((e) => e.product_id), c = await this.productRepo.findByIds(s), l = new Map(c.map((e) => [e.id, e]));
		for (let e of a.items) {
			let n = l.get(e.product_id);
			if (!n) throw new t("Producto", e.product_id);
			if (n.stock < e.quantity) throw new i(`Stock insuficiente para "${n.name}". Stock actual: ${n.stock}, Cantidad solicitada: ${e.quantity}`);
		}
		let u = await Promise.all(a.items.map(async (e) => {
			let t = l.get(e.product_id), n = 0, r = e.unit_price, i = null, a = null, o = null;
			if (e.discount_id) {
				let t = await this.discountRepo.findById(e.discount_id);
				if (t && t.is_active) {
					i = t.name, a = t.type, o = t.value;
					let s = e.unit_price * e.quantity;
					n = t.type === "PERCENTAGE" ? s * (t.value / 100) : Math.min(t.value, s), n = parseFloat(n.toFixed(2)), r = parseFloat(((s - n) / e.quantity).toFixed(2));
				}
			}
			return {
				product_id: e.product_id,
				quantity: e.quantity,
				unit_price: e.unit_price,
				purchase_price: t?.price_purchase || 0,
				discount_name: i,
				discount_type: a,
				discount_value: o,
				discount_amount: n,
				final_unit_price: r
			};
		})), d = u.reduce((e, t) => e + t.unit_price * t.quantity, 0), f = u.reduce((e, t) => e + (t.discount_amount || 0), 0), p = await this.settingsRepo.getTaxSettings(), m = d - f;
		m = parseFloat(m.toFixed(2));
		let h = 0, g = m;
		p.taxType !== "none" && p.taxRate > 0 && (h = parseFloat((m * p.taxRate).toFixed(2)), g = parseFloat((m + h).toFixed(2)));
		let _ = {
			cash_register_id: a.cash_register_id,
			client_id: o || 1,
			subtotal: m,
			tax_amount: h,
			total: g,
			discount_total: f,
			items: u,
			payment_method: a.payment_method,
			exchange_rate: e.exchange_rate || 0
		}, v = await this.saleRepo.registerSale(_);
		return this.dashboardService.invalidateCache(), await this.auditLogRepo.create({
			userId: r,
			action: "CREATE_SALE",
			entity: "sales",
			entity_id: v
		}), {
			success: !0,
			id: v
		};
	}
	async cancelSale(e, n = 1) {
		if (!await this.saleRepo.findById(e)) throw new t("Venta");
		return await this.saleRepo.cancelSale(e), this.dashboardService.invalidateCache(), await this.auditLogRepo.create({
			userId: n,
			action: "CANCEL_SALE",
			entity: "sales",
			entity_id: e
		}), { success: !0 };
	}
}, Ne = class {
	constructor(e, t) {
		this.cashRegisterRepo = e, this.auditLogRepo = t;
	}
	async getOpenRegister() {
		return this.cashRegisterRepo.findOpen();
	}
	async getAllRegisters(e, t) {
		return this.cashRegisterRepo.findAll(e, t);
	}
	async getRegisterDetails(e) {
		let n = await this.cashRegisterRepo.findById(e);
		if (!n) throw new t("Caja");
		return n;
	}
	async openRegister(t, r = 1) {
		if (isNaN(t) || t < 0) throw new e("El monto de apertura no puede ser negativo.");
		if (await this.cashRegisterRepo.findOpen()) throw new n("Ya hay una caja abierta para el día de hoy.");
		let i = await this.cashRegisterRepo.create(t);
		return await this.auditLogRepo.create({
			userId: r,
			action: "OPEN_CASH_REGISTER",
			entity: "cash_registers",
			entity_id: i.id
		}), {
			success: !0,
			id: i.id
		};
	}
	async closeRegister(n, r, i = 1) {
		if (isNaN(r) || r < 0) throw new e("El monto de cierre no puede ser negativo.");
		let a = await this.cashRegisterRepo.findById(n);
		if (!a) throw new t("Caja");
		let o = Number(a.opening_amount) + Number(a.total_sales), s = Number(r) - o, c = await this.cashRegisterRepo.getSalesCount(a.id, a.opened_at), l = s === 0 ? "PERFECT" : s > 0 ? "SURPLUS" : "MISSING";
		return await this.cashRegisterRepo.close(a.id, Number(r), s, l), await this.auditLogRepo.create({
			userId: i,
			action: "CLOSE_CASH_REGISTER",
			entity: "cash_registers",
			entity_id: a.id
		}), {
			success: !0,
			registerId: a.id,
			openingAmount: a.opening_amount,
			totalSales: a.total_sales,
			expectedCash: o,
			realCash: Number(r),
			difference: s,
			status: l,
			salesCount: c
		};
	}
	async getDailySummary(e) {
		return this.cashRegisterRepo.getDailySummary(e);
	}
}, Pe = class {
	constructor(e, t) {
		this.supplierRepo = e, this.auditLogRepo = t;
	}
	async getAllSuppliers(e) {
		try {
			return await this.supplierRepo.findAll(e);
		} catch (e) {
			throw k.error("Get all suppliers error:", e), Error("Error al obtener proveedores");
		}
	}
	async getSupplierById(e) {
		try {
			let n = await this.supplierRepo.findById(e);
			if (!n) throw new t("Proveedor");
			return n;
		} catch (e) {
			throw k.error("Get supplier by ID error:", e), e.code === "P2025" ? new t("Proveedor") : e;
		}
	}
	async createSupplier(e, t) {
		try {
			if (e.ruc && await this.supplierRepo.findByRuc(e.ruc)) throw new n(`El RUC ${e.ruc} ya está registrado`);
			let r = await this.supplierRepo.create(e);
			return await this.auditLogRepo.create({
				userId: t,
				action: "CREATE_SUPPLIER",
				entity: "suppliers",
				entity_id: r.id
			}), r;
		} catch (e) {
			throw k.error("Create supplier error:", e), e.code === "P2002" ? new n("El RUC ya está en uso") : e;
		}
	}
	async updateSupplier(e, r, i) {
		try {
			let a = await this.supplierRepo.findById(e);
			if (!a) throw new t("Proveedor");
			if (r.ruc && r.ruc !== a.ruc && await this.supplierRepo.findByRuc(r.ruc)) throw new n(`El RUC ${r.ruc} ya está registrado`);
			let o = await this.supplierRepo.update(e, r);
			return await this.auditLogRepo.create({
				userId: i,
				action: "UPDATE_SUPPLIER",
				entity: "suppliers",
				entity_id: e
			}), o;
		} catch (e) {
			throw k.error("Update supplier error:", e), e.code === "P2025" ? new t("Proveedor") : e;
		}
	}
	async deleteSupplier(e, n) {
		try {
			if (!await this.supplierRepo.findById(e)) throw new t("Proveedor");
			if (await this.supplierRepo.hasProducts(e)) throw new i("No se puede eliminar el proveedor porque tiene producto(s) asociado(s)");
			if (await this.supplierRepo.hasPurchases(e)) throw new i("No se puede eliminar el proveedor porque tiene compra(s) asociada(s)");
			return await this.supplierRepo.delete(e), await this.auditLogRepo.create({
				userId: n,
				action: "DELETE_SUPPLIER",
				entity: "suppliers",
				entity_id: e
			}), { success: !0 };
		} catch (e) {
			throw k.error("Delete supplier error:", e), e.code === "P2025" ? new t("Proveedor") : e;
		}
	}
}, Fe = class {
	constructor(e, t, n, r) {
		this.purchaseRepo = e, this.supplierRepo = t, this.productRepo = n, this.auditLogRepo = r;
	}
	async getAllPurchases(e, t) {
		try {
			return await this.purchaseRepo.findAll(e, t);
		} catch (e) {
			throw k.error("Get all purchases error:", e), Error("Error al obtener compras");
		}
	}
	async getPurchaseById(e) {
		try {
			let n = await this.purchaseRepo.findById(e);
			if (!n) throw new t("Compra");
			return n;
		} catch (e) {
			throw k.error("Get purchase by ID error:", e), e.code === "P2025" ? new t("Compra") : e;
		}
	}
	async createPurchase(e, n) {
		try {
			if (!await this.supplierRepo.findById(e.supplier_id)) throw new t("Proveedor");
			let r = e.items.map((e) => e.product_id);
			if ((await this.productRepo.findByIds(r)).length !== r.length) throw new t("Producto", "uno o más productos no existen");
			let i = await this.purchaseRepo.create(e);
			return await this.auditLogRepo.create({
				userId: n,
				action: "CREATE_PURCHASE",
				entity: "purchases",
				entity_id: i.id
			}), i;
		} catch (e) {
			throw k.error("Create purchase error:", e), e;
		}
	}
	async receivePurchase(e, n) {
		try {
			return await this.purchaseRepo.receive(e), await this.auditLogRepo.create({
				userId: n,
				action: "RECEIVE_PURCHASE",
				entity: "purchases",
				entity_id: e
			}), { success: !0 };
		} catch (e) {
			throw k.error("Receive purchase error:", e), e.code === "P2025" ? new t("Compra") : e;
		}
	}
	async updatePaymentStatus(e, n) {
		try {
			return await this.purchaseRepo.updatePaymentStatus(e, n), { success: !0 };
		} catch (e) {
			throw k.error("Update payment status error:", e), e.code === "P2025" ? new t("Compra") : e;
		}
	}
	async cancelPurchase(e, n) {
		try {
			return await this.purchaseRepo.cancel(e), await this.auditLogRepo.create({
				userId: n,
				action: "CANCEL_PURCHASE",
				entity: "purchases",
				entity_id: e
			}), { success: !0 };
		} catch (e) {
			throw k.error("Cancel purchase error:", e), e.code === "P2025" ? new t("Compra") : e;
		}
	}
}, Ie = class {
	constructor(e) {
		this.settingsRepo = e;
	}
	async getSettings() {
		return this.settingsRepo.getAll();
	}
	async updateSettings(e) {
		return await this.settingsRepo.upsertMany(e), { success: !0 };
	}
	async getSetting(e, t = "") {
		return this.settingsRepo.get(e, t);
	}
	async getTaxSettings() {
		return this.settingsRepo.getTaxSettings();
	}
	async updateTaxSettings(e, t, n) {
		return await this.settingsRepo.updateTaxSettings(e, t, n), { success: !0 };
	}
}, Le = 8, Re = /[A-Z]/, ze = /[a-z]/, Be = /[0-9]/, Ve = /[!@#$%^&*()_\-+=<>?/{}~|]/, He = `La contraseña debe tener al menos ${Le} caracteres, una mayúscula, un número y un carácter especial`;
function L(e) {
	return e.length < Le || !Re.test(e) || !ze.test(e) || !Be.test(e) || !Ve.test(e) ? {
		valid: !1,
		error: He
	} : {
		valid: !0,
		error: ""
	};
}
//#endregion
//#region src/backend/services/UserService.ts
var Ue = class {
	constructor(e, t) {
		this.userRepo = e, this.auditLogRepo = t;
	}
	async getAllUsers() {
		try {
			return await this.userRepo.findAll();
		} catch (e) {
			throw k.error("Get all users error:", e), Error("Error al obtener usuarios");
		}
	}
	async getUserById(e) {
		try {
			let n = await this.userRepo.findById(e);
			if (!n) throw new t("Usuario");
			return n;
		} catch (e) {
			throw k.error("Get user by ID error:", e), e.code === "P2025" ? new t("Usuario") : e;
		}
	}
	async createUser(t, r) {
		try {
			if (await this.userRepo.exists(t.username)) throw new n(`El usuario '${t.username}' ya existe`);
			let i = L(t.password);
			if (!i.valid) throw new e(i.error);
			let a = await C.genSalt(10), o = await C.hash(t.password, a), s;
			if (t.question && t.answer) {
				let e = await C.genSalt(10);
				s = await C.hash(t.answer.toLowerCase().trim(), e);
			}
			let c = await this.userRepo.create({
				username: t.username,
				password_hash: o,
				role: t.role,
				security_question: t.question || null,
				security_answer_hash: s || null
			});
			return await this.auditLogRepo.create({
				userId: r,
				action: "CREATE_USER",
				entity: "users",
				entity_id: c.id
			}), c;
		} catch (e) {
			throw k.error("Create user error:", e), e.code === "P2002" ? new n("El nombre de usuario ya está en uso") : e;
		}
	}
	async updateUser(e, r, i) {
		try {
			if (r.username && await this.userRepo.exists(r.username, e)) throw new n(`El usuario '${r.username}' ya existe`);
			let t = await this.userRepo.update(e, r);
			return await this.auditLogRepo.create({
				userId: i,
				action: "UPDATE_USER",
				entity: "users",
				entity_id: e
			}), t;
		} catch (e) {
			throw k.error("Update user error:", e), e.code === "P2025" ? new t("Usuario") : e;
		}
	}
	async deleteUser(e, n) {
		try {
			if (!await this.userRepo.findById(e)) throw new t("Usuario");
			if (e === n) throw new i("No puedes eliminar tu propio usuario");
			return await this.userRepo.delete(e), await this.auditLogRepo.create({
				userId: n,
				action: "DELETE_USER",
				entity: "users",
				entity_id: e
			}), { success: !0 };
		} catch (e) {
			throw k.error("Delete user error:", e), e.code === "P2025" ? new t("Usuario") : e;
		}
	}
	async changePassword(n, r, i) {
		try {
			let t = L(r);
			if (!t.valid) throw new e(t.error);
			let a = await C.genSalt(10), o = await C.hash(r, a);
			return await this.userRepo.update(n, { password_hash: o }), await this.auditLogRepo.create({
				userId: i,
				action: "CHANGE_PASSWORD",
				entity: "users",
				entity_id: n
			}), { success: !0 };
		} catch (e) {
			throw k.error("Change password error:", e), e.code === "P2025" ? new t("Usuario") : e;
		}
	}
}, We = 5, R = 900 * 1e3, z = /* @__PURE__ */ new Map();
function Ge(e) {
	let t = z.get(e);
	return t || (t = {
		count: 0,
		firstAttempt: Date.now()
	}, z.set(e, t)), t;
}
function Ke(e) {
	let t = Ge(e), n = Date.now() - t.firstAttempt;
	if (t.count >= We) {
		if (n < R) return {
			allowed: !1,
			remainingAttempts: 0,
			locked: !0,
			lockoutRemainingMs: R - n
		};
		t.count = 0, t.firstAttempt = Date.now();
	}
	return {
		allowed: !0,
		remainingAttempts: We - t.count,
		locked: !1,
		lockoutRemainingMs: 0
	};
}
function B(e) {
	let t = Ge(e);
	t.count += 1, t.count === 1 && (t.firstAttempt = Date.now());
}
function qe(e) {
	z.delete(e);
}
//#endregion
//#region src/backend/services/AuthService.ts
var V = /* @__PURE__ */ new Map(), Je = class {
	constructor(e) {
		this.userRepo = e;
	}
	async getSecurityQuestion(e) {
		try {
			let t = await this.userRepo.findByUsername(e);
			return !t || !t.security_question ? {
				success: !1,
				error: "Usuario no encontrado o no tiene pregunta de seguridad configurada"
			} : {
				success: !0,
				question: t.security_question
			};
		} catch (e) {
			return k.error({ err: e }, "Get security question error"), {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
	async verifySecurityAnswer(e, t) {
		try {
			let n = await this.userRepo.findByUsername(e);
			if (!n || !n.security_answer_hash) return {
				success: !1,
				error: "Usuario no encontrado o no tiene pregunta de seguridad configurada"
			};
			if (!await C.compare(t.toLowerCase().trim(), n.security_answer_hash)) return {
				success: !1,
				error: "Respuesta incorrecta"
			};
			let r = te.randomUUID();
			return V.set(r, {
				username: e,
				expiresAt: Date.now() + 600 * 1e3
			}), {
				success: !0,
				token: r
			};
		} catch (e) {
			return k.error({ err: e }, "Verify security answer error"), {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
	async resetPassword(e, t) {
		let n = V.get(e);
		if (!n || n.expiresAt < Date.now()) return V.delete(e), {
			success: !1,
			error: "Token inválido o expirado"
		};
		let r = L(t);
		if (!r.valid) return {
			success: !1,
			error: r.error
		};
		try {
			let r = await C.genSalt(10), i = await C.hash(t, r);
			return await this.userRepo.updateByUsername(n.username, { password_hash: i }), V.delete(e), { success: !0 };
		} catch (e) {
			return k.error({ err: e }, "Reset password error"), {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
	async setSecurityQuestion(e, t, n) {
		try {
			let r = await C.genSalt(10), i = await C.hash(n.toLowerCase().trim(), r);
			return await this.userRepo.update(e, {
				security_question: t,
				security_answer_hash: i
			}), { success: !0 };
		} catch (e) {
			return k.error({ err: e }, "Set security question error"), {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
	async login(e, t) {
		let n = Ke(e);
		if (!n.allowed) {
			let e = Math.ceil(n.lockoutRemainingMs / 6e4);
			return {
				success: !1,
				error: `Demasiados intentos. Bloqueado por ${e} minuto${e > 1 ? "s" : ""}`,
				remainingAttempts: 0,
				locked: !0,
				lockoutRemainingMs: n.lockoutRemainingMs
			};
		}
		try {
			let r = await this.userRepo.findByUsername(e);
			if (!r) return B(e), {
				success: !1,
				error: "Usuario no encontrado",
				remainingAttempts: n.remainingAttempts - 1
			};
			if (!await C.compare(t, r.password_hash)) {
				B(e);
				let t = n.remainingAttempts - 1;
				return {
					success: !1,
					error: t > 0 ? `Contraseña incorrecta. Intentos restantes: ${t}` : "Contraseña incorrecta",
					remainingAttempts: t
				};
			}
			qe(e);
			let { password_hash: i, ...a } = r;
			return {
				success: !0,
				user: a
			};
		} catch (t) {
			return k.error({ err: t }, "Login error"), t.code === "P2025" ? (B(e), {
				success: !1,
				error: "Usuario no encontrado",
				remainingAttempts: 0
			}) : {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
	async register(e) {
		try {
			if (await this.userRepo.exists(e.username)) return {
				success: !1,
				error: `El usuario '${e.username}' ya existe`
			};
			let t = L(e.password);
			if (!t.valid) return {
				success: !1,
				error: t.error
			};
			let n = await C.genSalt(10), r = await C.hash(e.password, n), i;
			if (e.security_question && e.security_answer) {
				let t = await C.genSalt(10);
				i = await C.hash(e.security_answer.toLowerCase().trim(), t);
			}
			let a = await this.userRepo.create({
				username: e.username,
				password_hash: r,
				role: e.role,
				security_question: e.security_question || null,
				security_answer_hash: i || null
			});
			return {
				success: !0,
				user: {
					id: a.id,
					username: a.username,
					role: a.role,
					created_at: a.created_at,
					updated_at: a.updated_at
				}
			};
		} catch (e) {
			return k.error({ err: e }, "Register error"), e.code === "P2002" ? {
				success: !1,
				error: "El nombre de usuario ya está en uso"
			} : {
				success: !1,
				error: "Error interno del servidor: " + (e.message || String(e))
			};
		}
	}
	async changePassword(e, t, n) {
		try {
			let r = await this.userRepo.findByIdWithPassword(e);
			if (!r) return {
				success: !1,
				error: "Usuario no encontrado"
			};
			if (!await C.compare(t, r.password_hash)) return {
				success: !1,
				error: "Contraseña actual incorrecta"
			};
			let i = L(n);
			if (!i.valid) return {
				success: !1,
				error: i.error
			};
			let a = await C.genSalt(10), o = await C.hash(n, a);
			return await this.userRepo.update(e, { password_hash: o }), { success: !0 };
		} catch (e) {
			return k.error({ err: e }, "Change password error"), {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
}, Ye = class {
	constructor(e, t) {
		this.categoryRepo = e, this.auditLogRepo = t;
	}
	async getAllCategories(e) {
		return await this.categoryRepo.findAll(e);
	}
	async getCategoryById(e) {
		return await M(() => this.categoryRepo.findById(e), "Categoría", e);
	}
	async createCategory(e, t) {
		if (await this.categoryRepo.findByName(e.name)) throw new n(`La categoría "${e.name}" ya existe.`);
		let r = await this.categoryRepo.create(e);
		return await this.auditLogRepo.create({
			userId: t,
			action: "CREATE_CATEGORY",
			entity: "categories",
			entity_id: r.id
		}), r;
	}
	async updateCategory(e, t, r) {
		await M(() => this.categoryRepo.findById(e), "Categoría", e);
		let i = await this.categoryRepo.findByName(t.name);
		if (i && i.id !== e) throw new n(`La categoría "${t.name}" ya existe.`);
		let a = await this.categoryRepo.update(e, t);
		return await this.auditLogRepo.create({
			userId: r,
			action: "UPDATE_CATEGORY",
			entity: "categories",
			entity_id: e
		}), a;
	}
	async deleteCategory(e, t) {
		await M(() => this.categoryRepo.findById(e), "Categoría", e);
		let n = await this.categoryRepo.getProductCount(e);
		if (n > 0) throw new i(`No se puede eliminar la categoría porque tiene ${n} producto(s) asociado(s).`);
		return await this.categoryRepo.delete(e), await this.auditLogRepo.create({
			userId: t,
			action: "DELETE_CATEGORY",
			entity: "categories",
			entity_id: e
		}), { success: !0 };
	}
}, Xe = class {
	constructor(e) {
		this.adapter = e;
	}
	async createBackup(e) {
		return this.adapter.createBackup(e);
	}
	async listBackups() {
		return this.adapter.listBackups();
	}
	async restoreBackup(e) {
		return this.adapter.restoreBackup(e);
	}
	async deleteBackup(e) {
		return this.adapter.deleteBackup(e);
	}
	async createScheduledBackup() {
		return this.adapter.createScheduledBackup();
	}
	async cleanupOldBackups(e) {
		return this.adapter.cleanupOldBackups(e);
	}
}, Ze = "dashboard:stats", Qe = class {
	constructor(e, t) {
		this.repo = e, this.cache = t;
	}
	async getStats(e, t) {
		return e || t ? this.repo.getStats(e, t) : this.cache.getOrSet(Ze, () => this.repo.getStats());
	}
	async getWeeklySales(e) {
		return this.repo.getWeeklySales(e);
	}
	async getLowStockProducts(e) {
		return this.repo.getLowStockProducts(e);
	}
	async getSalesByPaymentMethod(e, t) {
		return this.repo.getSalesByPaymentMethod(e, t);
	}
	async getTopProducts(e, t, n) {
		return this.repo.getTopProducts(e, t, n);
	}
	async getTopClients(e, t, n) {
		return this.repo.getTopClients(e, t, n);
	}
	async getSalesByHour(e, t) {
		return this.repo.getSalesByHour(e, t);
	}
	async getCashRegisterSummary(e, t) {
		return this.repo.getCashRegisterSummary(e, t);
	}
	async getInventoryMetrics() {
		return this.repo.getInventoryMetrics();
	}
	invalidateCache() {
		this.cache.invalidate();
	}
}, $e = class {
	cache = /* @__PURE__ */ new Map();
	defaultTTL;
	constructor(e = 3e4) {
		this.defaultTTL = e;
	}
	async getOrSet(e, t, n) {
		let r = Date.now(), i = n ?? this.defaultTTL, a = this.cache.get(e);
		if (a && r - a.timestamp < i) return a.data;
		let o = await t();
		return this.cache.set(e, {
			data: o,
			timestamp: r
		}), o;
	}
	invalidate(e) {
		e ? this.cache.delete(e) : this.cache.clear();
	}
	clear() {
		this.cache.clear();
	}
	get size() {
		return this.cache.size;
	}
}, et = class {
	constructor(e, t, n, r, i, a, o) {
		this.pdfGenerator = e, this.excelGenerator = t, this.dashboardService = n, this.saleService = r, this.productService = i, this.cashRegisterService = a, this.settingsService = o;
	}
	async generateReport(e) {
		let t = e.format === "pdf" ? this.pdfGenerator : this.excelGenerator, n = e.title ?? this.getDefaultTitle(e.type);
		switch (e.type) {
			case "daily_sales": return this.generateSalesReport(t, e, n, !0);
			case "sales_summary": return this.generateSalesReport(t, e, n, !1);
			case "profit_summary": return this.generateProfitReport(t, e, n);
			case "inventory": return this.generateInventoryReport(t, !1, n);
			case "low_stock": return this.generateInventoryReport(t, !0, n);
			case "top_products": return this.generateTopProductsReport(t, e, n);
			case "sale_receipt": return this.generateSaleReceipt(e);
			case "cash_close": return this.generateCashCloseReport(t, e, n);
		}
	}
	async generateSalesReport(e, t, n, r = !0) {
		let i = await this.saleService.getAllSales(t.startDate, t.endDate), a = await this.saleService.getSalesStats(t.startDate, t.endDate), o = await this.dashboardService.getSalesByPaymentMethod(t.startDate, t.endDate), s = o.find((e) => e.payment_method === "CASH"), c = o.find((e) => e.payment_method === "CARD"), l = {
			totalSales: a.totalSales,
			totalRevenue: a.totalRevenue,
			averageSale: a.averageSale,
			cashSales: s?._count?.id ?? 0,
			cashRevenue: s?._sum?.total ?? 0,
			cardSales: c?._count?.id ?? 0,
			cardRevenue: c?._sum?.total ?? 0
		}, u = i.map((e) => {
			let t = e.created_at instanceof Date ? e.created_at : new Date(e.created_at), n = e;
			return {
				date: t.toLocaleDateString("es-PE"),
				invoiceNumber: e.id,
				client: e.client?.name ?? "N/A",
				itemsCount: n._count?.items ?? 0,
				subtotal: Number(e.subtotal),
				tax: Number(e.tax_amount),
				total: Number(e.total),
				paymentMethod: e.payment_method ?? "N/A"
			};
		});
		return e.generateSalesReport(u, l, n, r);
	}
	async generateProfitReport(e, t, n) {
		let r = await this.dashboardService.getStats(t.startDate, t.endDate), i = {
			totalSales: r.totalSales,
			totalRevenue: r.totalRevenue,
			averageSale: r.averageSale
		}, a = [{
			date: `${t.startDate?.toLocaleDateString("es-PE") ?? "Inicio"} - ${t.endDate?.toLocaleDateString("es-PE") ?? "Hoy"}`,
			invoiceNumber: 0,
			client: "-",
			itemsCount: 0,
			subtotal: 0,
			tax: 0,
			total: r.totalRevenue,
			paymentMethod: "-"
		}];
		return e.generateSalesReport(a, i, n);
	}
	async generateInventoryReport(e, t, n) {
		let r = await this.productService.getAllProducts(), i = await this.dashboardService.getInventoryMetrics(), a = (t ? r.filter((e) => e.stock <= (e.min_stock ?? 5) || e.stock === 0) : r).map((e) => ({
			sku: e.sku,
			name: e.name,
			category: e.category?.name ?? "Sin categoría",
			stock: e.stock,
			minStock: e.min_stock,
			purchasePrice: Number(e.price_purchase),
			salePrice: Number(e.price_sale),
			status: e.stock === 0 ? "out" : e.min_stock !== null && e.stock <= e.min_stock ? "low" : "ok"
		}));
		return e.generateInventoryReport(a, i, n);
	}
	async generateTopProductsReport(e, t, n) {
		let r = await this.dashboardService.getTopProducts(50, t.startDate, t.endDate), i = await this.dashboardService.getInventoryMetrics(), a = r.map((e) => ({
			sku: e.product_sku,
			name: e.product_name,
			category: e.category,
			stock: e.total_quantity,
			minStock: null,
			purchasePrice: 0,
			salePrice: e.avg_price,
			status: "ok"
		}));
		return e.generateInventoryReport(a, i, n);
	}
	async generateSaleReceipt(e) {
		if (!e.saleId) throw Error("Se requiere saleId para generar un comprobante");
		let t = await this.saleService.getSaleDetails(e.saleId), n = await this.settingsService.getSettings(), r = (t.items || []).map((e) => ({
			quantity: e.quantity,
			productName: e.product?.name ?? "Producto",
			unitPrice: Number(e.unit_price),
			totalPrice: Number(e.unit_price) * e.quantity,
			discountName: e.discount_name ?? null,
			discountAmount: e.discount_amount == null ? null : Number(e.discount_amount),
			finalPrice: e.final_unit_price == null ? null : Number(e.final_unit_price) * e.quantity
		})), i = await this.settingsService.getTaxSettings(), a = {
			saleId: t.id,
			businessName: n.business_name || "INVENTARIO-POS",
			businessAddress: n.business_address || "",
			businessPhone: n.business_phone || "",
			businessTaxId: n.business_tax_id || "",
			ticketFooter: n.ticket_footer || "Gracias por su compra",
			logoBase64: n.business_logo || void 0,
			clientName: t.client?.name ?? "Cliente General",
			clientDni: t.client?.dni ?? "",
			clientTaxId: t.client?.tax_id ?? null,
			createdAt: t.created_at,
			paymentMethod: t.payment_method ?? "CASH",
			items: r,
			subtotal: Number(t.subtotal),
			discountTotal: t.discount_total == null ? void 0 : Number(t.discount_total),
			taxAmount: Number(t.tax_amount),
			taxType: i.taxType || "iva",
			taxRate: i.taxRate || 0,
			total: Number(t.total)
		};
		return this.pdfGenerator.generateSaleReceipt(a);
	}
	async generateCashCloseReport(e, t, n) {
		if (!t.registerId) throw Error("Se requiere registerId para generar reporte de cierre");
		let r = await this.cashRegisterService.getRegisterDetails(t.registerId), i = await this.settingsService.getSettings(), a = r.sales?.filter((e) => e.payment_method === "CASH").reduce((e, t) => e + Number(t.total), 0) ?? 0, o = r.sales?.filter((e) => e.payment_method === "CARD").reduce((e, t) => e + Number(t.total), 0) ?? 0, s = Number(r.opening_amount) + Number(r.total_sales), c = {
			registerId: r.id,
			openDate: r.opened_at,
			closeDate: r.closed_at || r.updated_at,
			openingAmount: Number(r.opening_amount),
			totalSales: Number(r.total_sales),
			cashSales: a,
			cardSales: o,
			salesCount: r.sales?.length ?? 0,
			expectedCash: s,
			realCash: Number(r.closing_amount) || s,
			difference: Number(r.difference) || 0,
			status: r.status || "PERFECT",
			businessName: i.business_name || "INVENTARIO-POS"
		};
		return e.generateCashCloseReport(c);
	}
	getDefaultTitle(e) {
		return {
			daily_sales: "Reporte de Ventas del Día",
			sales_summary: "Resumen de Ventas",
			profit_summary: "Reporte de Ganancias",
			inventory: "Reporte de Inventario",
			low_stock: "Productos con Stock Bajo",
			top_products: "Productos Más Vendidos",
			sale_receipt: "Comprobante de Venta",
			cash_close: "Reporte de Cierre de Caja"
		}[e] ?? "Reporte";
	}
}, H = "scheduler_", tt = class {
	dailyTimer = null;
	weeklyTimer = null;
	statePath;
	constructor(e, t) {
		this.reportService = e, this.backupService = t, this.statePath = ne(process.cwd(), "scheduler-state.json");
	}
	start() {
		k.info("Starting scheduled tasks"), this.scheduleDailyReport(), this.scheduleWeeklyReport(), this.scheduleDailyBackup();
	}
	stop() {
		this.dailyTimer && clearInterval(this.dailyTimer), this.weeklyTimer && clearInterval(this.weeklyTimer), k.info("Stopped scheduled tasks");
	}
	scheduleDailyReport() {
		let e = async () => {
			try {
				let e = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				if (this.getLastRun("daily_report") === e) return;
				k.info("Generating daily report"), await this.reportService.generateReport({
					type: "daily_sales",
					format: "pdf",
					title: `Reporte Diario - ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`
				}), this.setLastRun("daily_report", e), k.info("Daily report saved");
			} catch (e) {
				k.error({ err: e }, "Error generating daily report");
			}
		};
		e(), this.dailyTimer = setInterval(e, 3600 * 1e3);
	}
	scheduleWeeklyReport() {
		let e = async () => {
			try {
				let e = /* @__PURE__ */ new Date(), t = this.getWeekNumber(e);
				if (this.getLastRun("weekly_report") === String(t)) return;
				let n = new Date(e);
				n.setDate(e.getDate() - e.getDay()), n.setHours(0, 0, 0, 0), k.info("Generating weekly report"), await this.reportService.generateReport({
					type: "sales_summary",
					format: "pdf",
					startDate: n,
					endDate: e,
					title: `Reporte Semanal - Semana ${t}`
				}), this.setLastRun("weekly_report", String(t)), k.info("Weekly report saved");
			} catch (e) {
				k.error({ err: e }, "Error generating weekly report");
			}
		};
		e(), this.weeklyTimer = setInterval(e, 360 * 60 * 1e3);
	}
	scheduleDailyBackup() {
		let e = async () => {
			try {
				let e = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				if (this.getLastRun("daily_backup") === e) return;
				k.info("Creating daily backup"), await this.backupService.createBackup(`auto-${e}`), this.setLastRun("daily_backup", e), k.info("Daily backup created");
			} catch (e) {
				k.error({ err: e }, "Error creating daily backup");
			}
		};
		e(), setInterval(e, 3600 * 1e3);
	}
	getLastRun(e) {
		try {
			return w(this.statePath) ? JSON.parse(T(this.statePath, "utf-8"))[H + e] ?? "" : "";
		} catch {
			return "";
		}
	}
	setLastRun(e, t) {
		try {
			let n = {};
			w(this.statePath) && (n = JSON.parse(T(this.statePath, "utf-8"))), n[H + e] = t, E(this.statePath, JSON.stringify(n, null, 2));
		} catch {}
	}
	getWeekNumber(e) {
		let t = new Date(e.getFullYear(), 0, 1), n = e.getTime() - t.getTime();
		return Math.ceil((n / 864e5 + t.getDay() + 1) / 7);
	}
}, nt = class {
	constructor(e) {
		this.discountRepo = e;
	}
	async getAllDiscounts(e) {
		return this.discountRepo.findAll(e);
	}
	async getDiscountById(e) {
		let n = await this.discountRepo.findById(e);
		if (!n) throw new t("Descuento");
		return n;
	}
	async createDiscount(e, t = 1) {
		return {
			success: !0,
			id: (await this.discountRepo.create(e)).id
		};
	}
	async updateDiscount(e, t) {
		return await this.getDiscountById(e), {
			success: !0,
			discount: await this.discountRepo.update(e, t)
		};
	}
	async deleteDiscount(e) {
		return await this.getDiscountById(e), await this.discountRepo.delete(e), { success: !0 };
	}
	async getApplicableDiscounts(e, t) {
		return this.discountRepo.findApplicableToProduct(e, t);
	}
	calculateDiscount(e, t, n) {
		let r = e.price_sale * n, i;
		i = t.type === "PERCENTAGE" ? r * (t.value / 100) : Math.min(t.value, r), i = parseFloat(i.toFixed(2));
		let a = r - i;
		return {
			finalUnitPrice: parseFloat((a / n).toFixed(2)),
			discountAmount: i
		};
	}
};
//#endregion
//#region src/backend/di/container.ts
function rt(e) {
	let t = new ie(e), n = new ae(e), r = new oe(e), i = new se(e), a = new ce(e), o = new le(e), s = new ue(e), c = new de(e), l = new fe(e), u = new pe(e), d = new me(e), f = new he(e), p = new $e(), m = new ye(), h = new be(), g = new xe(), _ = new Qe(d, p), v = new Ae(t, l, u), y = new je(n, u), b = new Ne(i, u), x = new Ie(s), ee = new Ue(c, u), S = new Je(c), C = new Pe(a, u), te = new Fe(o, a, t, u), w = new nt(f), T = new Me(r, t, n, i, s, u, f, _), E = new Xe(m), ne = new Ye(l, u), D = new et(h, g, _, T, v, b, x);
	return {
		prisma: e,
		userRepo: c,
		productService: v,
		clientService: y,
		saleService: T,
		cashRegisterService: b,
		settingsService: x,
		userService: ee,
		authService: S,
		supplierService: C,
		purchaseService: te,
		categoryService: ne,
		dashboardService: _,
		backupService: E,
		reportService: D,
		schedulerService: new tt(D, E),
		discountService: w,
		cacheService: p
	};
}
//#endregion
//#region src/backend/di/registry.ts
var U = null;
function it() {
	if (!U) throw Error("Container not initialized");
	return U;
}
function at(e) {
	U = e;
}
//#endregion
//#region src/backend/utils/ipcWrapper.ts
function ot(t) {
	return t instanceof ee ? {
		success: !1,
		message: "Error de validación: " + t.issues.map((e) => e.message).join(", "),
		errors: t.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
		code: "VALIDATION"
	} : t instanceof r ? {
		success: !1,
		message: t.message,
		code: t.code,
		errors: t instanceof e ? t.errors : void 0
	} : (k.error({ err: t }, "Unhandled IPC Error"), {
		success: !1,
		message: "Ocurrió un error inesperado en el sistema",
		code: "INTERNAL"
	});
}
function W(e, t = "Error interno") {
	return k.error({ err: e }, `[SafeHandler] Error: ${t}`), {
		success: !1,
		message: t
	};
}
function G(e, t) {
	return async (n, ...r) => {
		try {
			if (t && r.length > 0) {
				let e = t.safeParse(r[0]);
				if (!e.success) return {
					success: !1,
					message: "Error de validación: " + e.error.issues.map((e) => e.message).join(", "),
					errors: e.error.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
					code: "VALIDATION"
				};
				r[0] = e.data;
			}
			let n = await e(...r);
			return n && typeof n == "object" && "success" in n ? n : {
				success: !0,
				data: n
			};
		} catch (e) {
			return ot(e);
		}
	};
}
//#endregion
//#region src/backend/auth/session.ts
var K = null;
function st(e) {
	K = e;
}
function q() {
	return K;
}
function ct() {
	K = null;
}
//#endregion
//#region src/backend/auth/authorize.ts
var J = class extends r {
	code = "UNAUTHORIZED";
	constructor() {
		super("No autenticado");
	}
}, Y = class extends r {
	code = "FORBIDDEN";
	constructor(e) {
		super(`Acceso denegado. Se requiere rol: ${e.join(" o ")}`);
	}
};
function X(...e) {
	return function(t) {
		return (async (...n) => {
			let r = q();
			if (!r) throw new J();
			if (!e.includes(r.role)) throw new Y(e);
			return t(...n);
		});
	};
}
//#endregion
//#region src/backend/ipc.ts
var Z = new Proxy({}, { get(e, t) {
	return it()[t];
} });
function lt() {
	c.handle("dialog:showConfirm", async (e, t) => (await s.showMessageBox({
		type: "question",
		buttons: ["Sí", "No"],
		defaultId: 0,
		cancelId: 1,
		title: t.title || "Confirmación",
		message: t.message
	})).response === 0), c.handle("health:check", async () => {
		try {
			return await Z.prisma.$queryRaw`SELECT 1`, {
				success: !0,
				database: "connected",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		} catch (e) {
			return k.error("[Health] Database check failed:", e), {
				success: !1,
				database: "disconnected",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		}
	}), c.handle("dashboard:getStats", async (e, t, n) => {
		try {
			return await Z.dashboardService.getStats(t, n);
		} catch (e) {
			return k.error("[Dashboard] getStats error:", e), W(e, "Error al obtener estadísticas del dashboard");
		}
	}), c.handle("dashboard:getWeeklySales", async (e, t) => {
		try {
			return await Z.dashboardService.getWeeklySales(t);
		} catch (e) {
			return k.error("[Dashboard] getWeeklySales error:", e), [];
		}
	}), c.handle("dashboard:getLowStock", async (e, t) => {
		try {
			return await Z.dashboardService.getLowStockProducts(t || 50);
		} catch (e) {
			return k.error("[Dashboard] getLowStock error:", e), [];
		}
	}), c.handle("dashboard:getSalesByPayment", async (e, t, n) => {
		try {
			return await Z.dashboardService.getSalesByPaymentMethod(t, n);
		} catch (e) {
			return k.error("[Dashboard] getSalesByPayment error:", e), [];
		}
	}), c.handle("dashboard:getTopProducts", async (e, t, n, r) => {
		try {
			return await Z.dashboardService.getTopProducts(t, n, r);
		} catch (e) {
			return k.error("[Dashboard] getTopProducts error:", e), [];
		}
	}), c.handle("dashboard:getTopClients", async (e, t, n, r) => {
		try {
			return await Z.dashboardService.getTopClients(t, n, r);
		} catch (e) {
			return k.error("[Dashboard] getTopClients error:", e), [];
		}
	}), c.handle("dashboard:getSalesByHour", async (e, t, n) => {
		try {
			return await Z.dashboardService.getSalesByHour(t, n);
		} catch (e) {
			return k.error("[Dashboard] getSalesByHour error:", e), [];
		}
	}), c.handle("dashboard:getCashSummary", async (e, t, n) => {
		try {
			return await Z.dashboardService.getCashRegisterSummary(t, n);
		} catch (e) {
			return k.error("[Dashboard] getCashSummary error:", e), W(e, "Error al obtener resumen de caja");
		}
	}), c.handle("dashboard:getInventoryMetrics", async () => {
		try {
			return await Z.dashboardService.getInventoryMetrics();
		} catch (e) {
			return k.error("[Dashboard] getInventoryMetrics error:", e), W(e, "Error al obtener métricas de inventario");
		}
	}), c.handle("dashboard:invalidateCache", async () => {
		try {
			return Z.dashboardService.invalidateCache(), { success: !0 };
		} catch (e) {
			return k.error("[Dashboard] invalidateCache error:", e), W(e, "Error al limpiar caché");
		}
	}), c.handle("settings:getAll", async () => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.settingsService.getSettings();
		} catch (e) {
			return k.error("[Settings] getAll error:", e), W(e, "Error al obtener configuración");
		}
	}), c.handle("settings:update", async (e, t) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			let n = ke.safeParse(t);
			return n.success ? (await Z.settingsService.updateSettings(n.data), k.info("Settings saved successfully"), { success: !0 }) : {
				success: !1,
				message: "Error de validación: " + n.error.issues.map((e) => e.message).join(", ")
			};
		} catch (e) {
			return k.error({
				err: e,
				settings: Object.keys(t)
			}, "[Settings] update error"), W(e, "Error al guardar configuración");
		}
	}), c.handle("cash:getOpen", async () => {
		try {
			return await Z.cashRegisterService.getOpenRegister();
		} catch {
			return null;
		}
	}), c.handle("cash:getAll", async (e, t, n) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.cashRegisterService.getAllRegisters(t, n);
		} catch (e) {
			return k.error("[Cash] getAll error:", e), W(e, "Error al obtener cajas");
		}
	}), c.handle("cash:getDetails", async (e, t) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.cashRegisterService.getRegisterDetails(t);
		} catch (e) {
			return k.error("[Cash] getDetails error:", e), W(e, "Error al obtener detalles de caja");
		}
	}), c.handle("cash:getDailySummary", async (e, t) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.cashRegisterService.getDailySummary(t);
		} catch (e) {
			return k.error("[Cash] getDailySummary error:", e), W(e, "Error al obtener resumen del día");
		}
	}), c.handle("cash:open", G(X("ADMIN")((e, t) => Z.cashRegisterService.openRegister(e, t)))), c.handle("cash:close", G(X("ADMIN")((e, t, n) => Z.cashRegisterService.closeRegister(e, t, n)))), c.handle("auth:login", async (e, t, n) => {
		try {
			let e = await Z.authService.login(t, n);
			return e.success && e.user && st({
				id: e.user.id,
				username: e.user.username,
				role: e.user.role
			}), e;
		} catch (e) {
			return k.error("[Auth] Login error:", e), W(e, "Error de autenticación");
		}
	}), c.handle("auth:logout", async () => (ct(), { success: !0 })), c.handle("auth:checkSession", async () => {
		let e = q();
		return {
			authenticated: !!e,
			user: e
		};
	}), c.handle("auth:getSecurityQuestion", async (e, t) => {
		try {
			return await Z.authService.getSecurityQuestion(t);
		} catch (e) {
			return W(e, "Error al obtener pregunta de seguridad");
		}
	}), c.handle("auth:verifySecurityAnswer", async (e, t, n) => {
		try {
			return await Z.authService.verifySecurityAnswer(t, n);
		} catch (e) {
			return W(e, "Error al verificar respuesta");
		}
	}), c.handle("auth:resetPassword", async (e, t, n) => {
		try {
			return await Z.authService.resetPassword(t, n);
		} catch (e) {
			return W(e, "Error al restablecer contraseña");
		}
	}), c.handle("auth:setSecurityQuestion", G(X("ADMIN")(async (e, t, n, r) => await Z.authService.setSecurityQuestion(t, n, r)))), c.handle("setup:status", async () => {
		try {
			return { needsSetup: await Z.userRepo.count() === 0 };
		} catch (e) {
			return k.error("[Setup] Status error:", e), { needsSetup: !0 };
		}
	}), c.handle("setup:complete", async (e, t) => {
		try {
			let e = await Z.authService.register({
				username: t.user.username,
				password: t.user.password,
				role: "ADMIN",
				password_hash: "",
				security_question: t.user.security_question,
				security_answer: t.user.security_answer
			}), n;
			if (e.success && e.user) n = e.user, k.info({ userId: n.id }, "User created during setup");
			else if (e.error?.includes("ya existe")) {
				let e = await Z.userRepo.findByUsername(t.user.username);
				if (!e) return {
					success: !1,
					message: "Error al verificar el usuario existente"
				};
				n = {
					id: e.id,
					username: e.username,
					role: e.role
				}, k.info({ userId: n.id }, "User already exists, reusing");
			} else return {
				success: !1,
				message: e.error || "Error al crear el usuario"
			};
			st({
				id: n.id,
				username: n.username,
				role: n.role
			});
			try {
				await Z.settingsService.updateSettings(t.settings), k.info({ settings: Object.keys(t.settings) }, "Settings saved during setup");
			} catch (e) {
				return k.error({
					err: e,
					settings: Object.keys(t.settings)
				}, "[Setup] Settings save error"), {
					success: !1,
					message: "Error al guardar la configuración del negocio: " + (e?.message || String(e))
				};
			}
			return {
				success: !0,
				user: n
			};
		} catch (e) {
			return k.error({ err: e }, "[Setup] Complete error"), W(e, "Error durante la configuración inicial");
		}
	}), c.handle("clients:getAll", async (e, t) => {
		try {
			return await Z.clientService.getAllClients(t);
		} catch (e) {
			return k.error("[Clients] getAll error:", e), W(e, "Error al obtener clientes");
		}
	}), c.handle("clients:getById", async (e, t) => {
		try {
			return await Z.clientService.getClientById(t);
		} catch (e) {
			return k.error("[Clients] getById error:", e), W(e, "Error al obtener cliente");
		}
	}), c.handle("clients:create", G((e, t) => Z.clientService.createClient(e, t), P)), c.handle("clients:update", G((e, t, n) => Z.clientService.updateClient(e, t, n))), c.handle("clients:delete", async (e, t, n) => {
		try {
			return await Z.clientService.deleteClient(t, n);
		} catch (e) {
			return k.error("[Clients] delete error:", e), W(e, "Error al eliminar cliente");
		}
	}), c.handle("products:getAll", async (e, t, n) => {
		try {
			return await Z.productService.getAllProducts(t, n);
		} catch (e) {
			return k.error("[Products] getAll error:", e), W(e, "Error al obtener productos");
		}
	}), c.handle("products:getById", async (e, t) => {
		try {
			return await Z.productService.getProductById(t);
		} catch (e) {
			return k.error("[Products] getById error:", e), W(e, "Error al obtener producto");
		}
	}), c.handle("products:getLowStock", async () => {
		try {
			return await Z.dashboardService.getLowStockProducts(50);
		} catch (e) {
			return k.error("Get low stock products error:", e), [];
		}
	}), c.handle("products:create", G((e, t) => Z.productService.createProduct(e, t), N)), c.handle("products:update", G((e, t, n) => Z.productService.updateProduct(e, t, n))), c.handle("products:delete", async (e, t, n) => {
		try {
			return await Z.productService.deleteProduct(t, n);
		} catch (e) {
			return k.error("[Products] delete error:", e), W(e, "Error al eliminar producto");
		}
	}), c.handle("products:addStock", async (e, t, n, r, i) => {
		try {
			return await Z.productService.addStock(t, n, r, i);
		} catch (e) {
			return k.error("[Products] addStock error:", e), W(e, "Error al añadir stock");
		}
	}), c.handle("products:removeStock", async (e, t, n, r, i) => {
		try {
			return await Z.productService.removeStock(t, n, r, i);
		} catch (e) {
			return k.error("[Products] removeStock error:", e), W(e, "Error al reducir stock");
		}
	}), c.handle("products:getMovements", async (e, t, n) => {
		try {
			return await Z.productService.getInventoryMovements(t, n);
		} catch (e) {
			return k.error("[Products] getMovements error:", e), W(e, "Error al obtener movimientos");
		}
	}), c.handle("discounts:getAll", async (e, t) => {
		try {
			if (!q()) throw new J();
			return await Z.discountService.getAllDiscounts(t);
		} catch (e) {
			return k.error("[Discounts] getAll error:", e), W(e, "Error al obtener descuentos");
		}
	}), c.handle("discounts:getById", async (e, t) => {
		try {
			if (!q()) throw new J();
			return await Z.discountService.getDiscountById(t);
		} catch (e) {
			return k.error("[Discounts] getById error:", e), W(e, "Error al obtener descuento");
		}
	}), c.handle("discounts:create", G(X("ADMIN")(async (e) => {
		let t = De.parse(e);
		return await Z.discountService.createDiscount(t);
	}))), c.handle("discounts:update", G(X("ADMIN")(async (e, t) => {
		let n = De.partial().parse(t);
		return await Z.discountService.updateDiscount(e, n);
	}))), c.handle("discounts:delete", G(X("ADMIN")(async (e) => await Z.discountService.deleteDiscount(e)))), c.handle("discounts:getApplicable", async (e, t, n) => {
		try {
			if (!q()) throw new J();
			return await Z.discountService.getApplicableDiscounts(t, n);
		} catch (e) {
			return k.error("[Discounts] getApplicable error:", e), [];
		}
	}), c.handle("products:bulkUpdatePrice", G(X("ADMIN")(async (e) => {
		let t = Oe.parse(e);
		return await Z.productService.bulkUpdatePrice(t);
	}))), c.handle("sales:getAll", async (e, t, n, r, i) => {
		try {
			return await Z.saleService.getAllSales(t, n, r, i);
		} catch (e) {
			return k.error("[Sales] getAll error:", e), W(e, "Error al obtener ventas");
		}
	}), c.handle("sales:getToday", async () => {
		try {
			return await Z.saleService.getTodaySales();
		} catch (e) {
			return k.error("[Sales] getToday error:", e), W(e, "Error al obtener ventas del día");
		}
	}), c.handle("sales:getLast", async () => {
		try {
			return await Z.saleService.getLastSale();
		} catch (e) {
			return k.error("[Sales] getLast error:", e), null;
		}
	}), c.handle("sales:getStats", async (e, t, n) => {
		try {
			return await Z.saleService.getSalesStats(t, n);
		} catch (e) {
			return k.error("[Sales] getStats error:", e), W(e, "Error al obtener estadísticas");
		}
	}), c.handle("sales:getDetails", async (e, t) => {
		try {
			return await Z.saleService.getSaleDetails(t);
		} catch (e) {
			return k.error("[Sales] getDetails error:", e), W(e, "Error al obtener detalles de venta");
		}
	}), c.handle("sales:register", G(async (e, t, n) => Z.saleService.registerSale(e, t, n), Ce.omit({ items: !0 }))), c.handle("sales:cancel", async (e, t, n) => {
		try {
			return await Z.saleService.cancelSale(t, n);
		} catch (e) {
			return k.error("[Sales] cancel error:", e), W(e, "Error al cancelar venta");
		}
	}), c.handle("categories:getAll", async (e, t) => await Z.categoryService.getAllCategories(t)), c.handle("categories:getById", async (e, t) => {
		try {
			return await Z.categoryService.getCategoryById(t);
		} catch (e) {
			return k.error("[Categories] getById error:", e), W(e, "Error al obtener categoría");
		}
	}), c.handle("categories:create", G(X("ADMIN")(async (e, t) => await Z.categoryService.createCategory(e, t)), F)), c.handle("categories:update", G(X("ADMIN")(async (e, t, n) => {
		let r = F.parse(t);
		return await Z.categoryService.updateCategory(e, r, n);
	}))), c.handle("categories:delete", G(X("ADMIN")(async (e, t) => await Z.categoryService.deleteCategory(e, t)))), c.handle("users:getAll", async () => {
		try {
			return await X("ADMIN")(async () => await Z.userService.getAllUsers())();
		} catch (e) {
			return k.error("[Users] getAll error:", e), W(e, "Error al obtener usuarios");
		}
	}), c.handle("users:getById", async (e, t) => {
		try {
			return await X("ADMIN")(async () => await Z.userService.getUserById(t))();
		} catch (e) {
			return k.error("[Users] getById error:", e), W(e, "Error al obtener usuario");
		}
	}), c.handle("users:create", G(X("ADMIN")((e, t) => Z.userService.createUser(e, t)), Ee)), c.handle("users:update", G(X("ADMIN")(async (e, t, n) => {
		let r = Ee.partial().parse(t);
		return await Z.userService.updateUser(e, r, n);
	}))), c.handle("users:delete", G(X("ADMIN")((e, t) => Z.userService.deleteUser(e, t)))), c.handle("users:changePassword", G(X("ADMIN")((e, t, n) => Z.userService.changePassword(e, t, n)))), c.handle("movements:getAll", async () => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.prisma.inventoryMovement.findMany({
				include: { product: { select: {
					id: !0,
					name: !0,
					sku: !0
				} } },
				orderBy: { created_at: "desc" },
				take: 500
			});
		} catch {
			return [];
		}
	}), c.handle("suppliers:getAll", async (e, t) => {
		try {
			return await Z.supplierService.getAllSuppliers(t);
		} catch {
			return [];
		}
	}), c.handle("suppliers:getById", async (e, t) => {
		try {
			return await Z.supplierService.getSupplierById(t);
		} catch {
			return null;
		}
	}), c.handle("suppliers:create", G(X("ADMIN")((e, t) => Z.supplierService.createSupplier(e, t)), I)), c.handle("suppliers:update", G(X("ADMIN")(async (e, t, n) => {
		let r = I.partial().parse(t);
		return await Z.supplierService.updateSupplier(e, r, n);
	}))), c.handle("suppliers:delete", G(X("ADMIN")((e, t) => Z.supplierService.deleteSupplier(e, t)))), c.handle("purchases:getAll", async (e, t, n) => {
		try {
			return await Z.purchaseService.getAllPurchases(t, n);
		} catch {
			return [];
		}
	}), c.handle("purchases:getById", async (e, t) => {
		try {
			return await Z.purchaseService.getPurchaseById(t);
		} catch {
			return null;
		}
	}), c.handle("purchases:create", G(X("ADMIN")((e, t) => Z.purchaseService.createPurchase(e, t)), Te)), c.handle("purchases:receive", G(X("ADMIN")((e, t) => Z.purchaseService.receivePurchase(e, t)))), c.handle("purchases:cancel", G(X("ADMIN")((e, t) => Z.purchaseService.cancelPurchase(e, t)))), c.handle("purchases:updatePaymentStatus", G(X("ADMIN")((e, t) => Z.purchaseService.updatePaymentStatus(e, t)))), c.handle("backup:create", G(X("ADMIN")((e) => Z.backupService.createBackup(e)))), c.handle("backup:list", async () => {
		try {
			return await Z.backupService.listBackups();
		} catch (e) {
			return k.error("[IPC] Error listing backups:", e), [];
		}
	}), c.handle("backup:restore", G(X("ADMIN")((e) => Z.backupService.restoreBackup(e)))), c.handle("backup:delete", G(X("ADMIN")((e) => Z.backupService.deleteBackup(e)))), c.handle("settings:getTax", async () => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.settingsService.getTaxSettings();
		} catch (e) {
			return k.error("[Settings] getTax error:", e), W(e, "Error al obtener configuración de impuestos");
		}
	}), c.handle("settings:updateTax", async (e, t, n, r) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.settingsService.updateTaxSettings(t, n, r);
		} catch (e) {
			return k.error({ err: e }, "[Settings] updateTax error"), W(e, "Error al guardar configuración de impuestos");
		}
	}), c.handle("reports:generate", G(X("ADMIN")(async (e) => {
		let t = e.startDate ? new Date(e.startDate) : void 0, n;
		e.endDate ? (n = new Date(e.endDate), n.setHours(23, 59, 59, 999)) : t && (n = new Date(t), n.setHours(23, 59, 59, 999));
		let r = {
			...e,
			startDate: t,
			endDate: n
		}, i = await Z.reportService.generateReport(r), a = r.format === "pdf" ? "pdf" : "xlsx", { filePath: o, canceled: c } = await s.showSaveDialog({
			defaultPath: `${r.type}-${Date.now()}.${a}`,
			filters: r.format === "pdf" ? [{
				name: "PDF",
				extensions: ["pdf"]
			}] : [{
				name: "Excel",
				extensions: ["xlsx"]
			}]
		});
		return c || !o ? {
			success: !1,
			message: "Cancelado por el usuario"
		} : (await O.writeFile(o, i), {
			success: !0,
			path: o
		});
	}))), c.handle("reports:generateReceipt", G(X("ADMIN")(async (e) => {
		let t = {
			type: "sale_receipt",
			format: "pdf",
			saleId: e
		}, n = await Z.reportService.generateReport(t), { filePath: r, canceled: i } = await s.showSaveDialog({
			defaultPath: `comprobante-${e}-${Date.now()}.pdf`,
			filters: [{
				name: "PDF",
				extensions: ["pdf"]
			}]
		});
		return i || !r ? {
			success: !1,
			message: "Cancelado por el usuario"
		} : (await O.writeFile(r, n), {
			success: !0,
			path: r
		});
	}))), c.handle("reports:generateCashClose", G(X("ADMIN")(async (e) => {
		let t = {
			type: "cash_close",
			format: "pdf",
			registerId: e
		}, n = await Z.reportService.generateReport(t), { filePath: r, canceled: i } = await s.showSaveDialog({
			defaultPath: `cierre-caja-${e}-${Date.now()}.pdf`,
			filters: [{
				name: "PDF",
				extensions: ["pdf"]
			}]
		});
		return i || !r ? {
			success: !1,
			message: "Cancelado por el usuario"
		} : (await O.writeFile(r, n), {
			success: !0,
			path: r
		});
	})));
}
//#endregion
//#region src/backend/utils/migrationRunner.ts
function ut(e) {
	let t = [], n = "", r = !1, i = "";
	for (let a = 0; a < e.length; a++) {
		let o = e[a], s = e[a + 1] || "";
		if (r) {
			n += o, o === i && e[a - 1] !== "\\" && (r = !1);
			continue;
		}
		if (o === "-" && s === "-") {
			for (; a < e.length && e[a] !== "\n";) a++;
			continue;
		}
		if (o === "/" && s === "*") {
			for (a += 2; a < e.length && !(e[a] === "*" && e[a + 1] === "/");) a++;
			a += 2;
			continue;
		}
		if (o === "'" || o === "\"") {
			r = !0, i = o, n += o;
			continue;
		}
		if (o === ";") {
			let e = n.trim();
			e && t.push(e), n = "";
			continue;
		}
		n += o;
	}
	let a = n.trim();
	return a && t.push(a), t;
}
function dt() {
	let e = [];
	o.isPackaged && (e.push(u.join(process.resourcesPath, "prisma", "schema.sql")), e.push(u.join(process.resourcesPath, "schema.sql")));
	try {
		let t = u.dirname(D(import.meta.url));
		e.push(u.join(t, "..", "..", "..", "prisma", "schema.sql")), e.push(u.join(process.cwd(), "prisma", "schema.sql"));
	} catch {}
	for (let t of e) if (d.existsSync(t)) return t;
	return null;
}
async function ft(e) {
	try {
		let t = await e.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
		return Array.isArray(t) && t.length > 0;
	} catch {
		return !1;
	}
}
async function pt(e) {
	if (await ft(e)) return k.info("Database already initialized, skipping."), { applied: !1 };
	let t = dt();
	if (!t) {
		let e = "schema.sql not found in any expected location";
		return k.error(e), {
			applied: !1,
			error: e
		};
	}
	k.info(`Loading schema from ${t}`);
	let n = ut(d.readFileSync(t, "utf-8"));
	k.info(`Found ${n.length} SQL statements to execute`);
	for (let t = 0; t < n.length; t++) {
		let r = n[t];
		try {
			await e.$executeRawUnsafe(r);
		} catch (e) {
			if (e.message && e.message.includes("already exists")) {
				k.info(`Skipping statement ${t + 1} (already exists): ${r.slice(0, 60)}...`);
				continue;
			}
			let n = `Migration failed at statement ${t + 1}: ${e.message || e}`;
			return k.error(n), k.error(`SQL: ${r.slice(0, 200)}`), {
				applied: !1,
				error: n
			};
		}
	}
	k.info("Schema applied successfully!");
	try {
		await e.$disconnect(), await e.$connect(), k.info("Prisma connection refreshed");
	} catch (e) {
		return k.error({ err: e }, "Failed to refresh Prisma connection"), {
			applied: !0,
			error: "Migrations applied but failed to refresh connection"
		};
	}
	return { applied: !0 };
}
//#endregion
//#region src/backend/index.ts
re();
var Q = rt(new p({ adapter: new m({ url: process.env.DATABASE_URL }) }));
at(Q);
var mt = u.dirname(D(import.meta.url));
process.env.DIST = u.join(mt, "../dist"), process.env.VITE_PUBLIC = o.isPackaged ? process.env.DIST : u.join(process.env.DIST, "../public");
var $ = null, ht = process.env.VITE_DEV_SERVER_URL;
async function gt() {
	$ = new a({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		icon: u.join(process.env.VITE_PUBLIC, "favicon.ico"),
		webPreferences: {
			preload: u.join(mt, "index.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		},
		autoHideMenuBar: !0
	}), o.isPackaged && l.defaultSession.webRequest.onHeadersReceived((e, t) => {
		t({ responseHeaders: {
			...e.responseHeaders,
			"Content-Security-Policy": ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'"]
		} });
	}), ht ? ($.loadURL(ht), $.webContents.openDevTools()) : $.loadFile(u.join(process.env.DIST, "index.html")), $.on("blur", () => {
		setTimeout(() => {
			if ($ && !$.isDestroyed() && !$.isFocused()) {
				let e = a.getFocusedWindow();
				(!e || e === $) && $.focus();
			}
		}, 100);
	}), $.on("focus", () => {
		$ && $.webContents && $.webContents.focus();
	}), $.on("closed", () => {
		$ = null;
	});
}
c.handle("window:focus", () => $ && !$.isDestroyed() ? ($.focus(), $.webContents.focus(), !0) : !1), c.handle("window:is-ready", () => $ && !$.isDestroyed()), c.handle("dialog:showMessageBox", (e, t) => {
	let n = a.getFocusedWindow() || $;
	return s.showMessageBox(n, t);
}), c.handle("dialog:showOpenDialog", (e, t) => {
	let n = a.getFocusedWindow() || $;
	return s.showOpenDialog(n, t);
}), c.handle("dialog:showSaveDialog", (e, t) => {
	let n = a.getFocusedWindow() || $;
	return s.showSaveDialog(n, t);
}), o.on("window-all-closed", () => {
	process.platform !== "darwin" && (o.quit(), $ = null);
}), o.whenReady().then(async () => {
	let e = !1;
	try {
		await Q.prisma.$connect(), await Q.prisma.$queryRaw`PRAGMA journal_mode=WAL`, await Q.prisma.$queryRaw`PRAGMA synchronous=NORMAL`, await Q.prisma.$queryRaw`PRAGMA cache_size=10000`, await Q.prisma.$queryRaw`PRAGMA temp_store=MEMORY`, k.info("Prisma connected to SQLite successfully"), e = !0;
	} catch (e) {
		let t = [
			`Error: ${e.message || String(e)}`,
			e.code ? `Code: ${e.code}` : "",
			`DATABASE_URL: ${process.env.DATABASE_URL || "(not set)"}`,
			`resourcesPath: ${process.resourcesPath || "(not set)"}`,
			`appPath: ${o.getAppPath()}`
		].filter(Boolean).join("\n");
		k.error({ err: e }, `Failed to connect to SQLite:\n${t}`);
		try {
			await s.showMessageBox({
				type: "error",
				title: "Error de Base de Datos",
				message: "No se pudo conectar a la base de datos SQLite.",
				detail: "Revisa que la instalación sea correcta o contacta al administrador.\n\nSi el problema persiste, revisa los logs de la aplicación."
			});
		} catch {}
	}
	if (e) {
		let e = await pt(Q.prisma);
		if (e.error) {
			k.error({ err: e.error }, "Migration error");
			try {
				await s.showMessageBox({
					type: "error",
					title: "Error de Migración",
					message: "No se pudieron aplicar las migraciones de la base de datos.",
					detail: e.error
				});
			} catch {}
		}
	}
	lt(), Q.schedulerService.start(), gt(), o.on("activate", () => {
		a.getAllWindows().length === 0 && gt();
	});
});
//#endregion
