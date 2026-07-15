import "dotenv/config";
import { BrowserWindow as e, app as t, dialog as n, ipcMain as r, session as i } from "electron";
import a from "path";
import o from "fs";
import s from "pino";
import c from "@prisma/client";
import { PrismaBetterSqlite3 as l } from "@prisma/adapter-better-sqlite3";
import { pipeline as u } from "stream";
import { promisify as d } from "util";
import { createGunzip as f, createGzip as p } from "zlib";
import { jsPDF as m } from "jspdf";
import h from "jspdf-autotable";
import g from "exceljs";
import { ZodError as ee, z as _ } from "zod";
import v from "bcryptjs";
import y from "node:crypto";
import { existsSync as b, readFileSync as x, writeFileSync as te } from "node:fs";
import { join as S } from "node:path";
import { fileURLToPath as ne } from "url";
import C from "node:fs/promises";
//#region \0rolldown/runtime.js
var w = Object.defineProperty, T = (e, t) => {
	let n = {};
	for (var r in e) w(n, r, {
		get: e[r],
		enumerable: !0
	});
	return t || w(n, Symbol.toStringTag, { value: "Module" }), n;
}, E = s({
	level: "info",
	timestamp: s.stdTimeFunctions.isoTime
}), D = !1;
function O() {
	if (D || (D = !0, !t.isPackaged)) return;
	let e = t.getPath("userData"), n = a.join(e, "dev.sqlite3");
	o.existsSync(e) || o.mkdirSync(e, { recursive: !0 }), o.existsSync(n) || E.info(`Database will be created at ${n} on first connect`), process.env.DATABASE_URL = `file:${n}`, E.info(`Database URL: ${process.env.DATABASE_URL}`);
}
//#endregion
//#region src/shared/errors.ts
var re = /* @__PURE__ */ T({
	BusinessRuleError: () => N,
	ConflictError: () => M,
	DomainError: () => k,
	NotFoundError: () => A,
	ValidationError: () => j
}), k = class extends Error {}, A = class extends k {
	code = "NOT_FOUND";
	constructor(e, t) {
		super(t ? `${e} no encontrado (${t})` : `${e} no encontrado`), this.name = "NotFoundError";
	}
}, j = class extends k {
	code = "VALIDATION";
	errors;
	constructor(e, t) {
		super(e), this.name = "ValidationError", this.errors = t || [];
	}
}, M = class extends k {
	code = "CONFLICT";
	constructor(e) {
		super(e), this.name = "ConflictError";
	}
}, N = class extends k {
	code = "BUSINESS_RULE";
	constructor(e) {
		super(e), this.name = "BusinessRuleError";
	}
}, ie = class {
	prisma;
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e, t) {
		let n = {};
		return e && (n.OR = [
			{ name: { contains: e } },
			{ sku: { contains: e } },
			{ description: { contains: e } }
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
			})).count === 0) throw new N("Stock insuficiente");
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
}, ae = class {
	prisma;
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = e ? { OR: [
			{ dni: { contains: e } },
			{ name: { contains: e } },
			{ code: { contains: e } },
			{ tax_id: { contains: e } }
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
function P(e, t, n) {
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
async function F(e, t, n) {
	let r = await e();
	if (!r) {
		let { NotFoundError: e } = await Promise.resolve().then(() => re);
		throw new e(t, n);
	}
	return r;
}
//#endregion
//#region src/infrastructure/persistence/PrismaSaleRepository.ts
var oe = class {
	prisma;
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = {};
		Object.assign(t, P("created_at", e?.startDate, e?.endDate)), e?.clientId && (t.client_id = e.clientId), e?.cashRegisterId && (t.cash_register_id = e.cashRegisterId);
		let n = e?.page ?? 1, r = e?.pageSize ?? 50, i = (n - 1) * r, a = r, [o, s] = await Promise.all([this.prisma.sale.findMany({
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
			skip: i,
			take: a,
			orderBy: { created_at: "desc" }
		}), this.prisma.sale.count({ where: t })]);
		return {
			data: o,
			total: s,
			page: n,
			pageSize: r,
			totalPages: Math.ceil(s / r)
		};
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
		Object.assign(n, P("created_at", e, t));
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
				})).count === 0) throw new N(`Stock insuficiente para el producto ${r.product_id}`);
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
	async count(e) {
		let t = {};
		return Object.assign(t, P("created_at", e?.startDate, e?.endDate)), e?.clientId && (t.client_id = e.clientId), e?.cashRegisterId && (t.cash_register_id = e.cashRegisterId), this.prisma.sale.count({ where: t });
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
	prisma;
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
		return Object.assign(n, P("opened_at", e, t)), this.prisma.cashRegister.findMany({
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
	prisma;
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = {};
		return e && (t.OR = [
			{ name: { contains: e } },
			{ ruc: { contains: e } },
			{ email: { contains: e } }
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
	prisma;
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
	prisma;
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
	prisma;
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
	async updateLoginAttempts(e, t, n) {
		await this.prisma.user.update({
			where: { username: e },
			data: {
				failed_attempts: t,
				locked_until: n
			}
		});
	}
	async resetLoginAttempts(e) {
		await this.prisma.user.update({
			where: { username: e },
			data: {
				failed_attempts: 0,
				locked_until: null
			}
		});
	}
}, fe = class {
	prisma;
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = e ? { name: { contains: e } } : {};
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
	prisma;
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
	prisma;
	constructor(e) {
		this.prisma = e;
	}
	async getStats(e, t) {
		let n = {};
		Object.assign(n, P("created_at", e, t));
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
		return Object.assign(n, P("created_at", e, t)), this.prisma.sale.groupBy({
			by: ["payment_method"],
			where: n,
			_count: { id: !0 },
			_sum: { total: !0 },
			_avg: { total: !0 }
		});
	}
	async getTopProducts(e = 10, t, n) {
		let r = {};
		Object.assign(r, P("created_at", t, n));
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
		Object.assign(r, P("created_at", t, n));
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
		Object.assign(n, P("created_at", e, t));
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
		Object.assign(n, P("opened_at", e, t));
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
	async getLastSaleWithClient() {
		let e = /* @__PURE__ */ new Date();
		e.setHours(0, 0, 0, 0);
		let t = await this.prisma.sale.findFirst({
			where: { created_at: { gte: e } },
			orderBy: { created_at: "desc" },
			include: { client: { select: {
				name: !0,
				dni: !0
			} } }
		});
		return t ? {
			sale_id: t.id,
			client_name: t.client?.name ?? null,
			client_dni: t.client?.dni ?? null,
			total: t.total,
			created_at: t.created_at
		} : null;
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
	prisma;
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
}, ge = class {
	prisma;
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = {};
		Object.assign(t, P("created_at", e?.startDate, e?.endDate)), e?.productId && (t.product_id = e.productId), e?.type && (t.type = e.type), e?.reason && (t.reason = e.reason);
		let n = e?.page ?? 1, r = e?.pageSize ?? 50, i = (n - 1) * r, a = r, [o, s] = await Promise.all([this.prisma.inventoryMovement.findMany({
			where: t,
			include: { product: { select: {
				id: !0,
				name: !0,
				sku: !0
			} } },
			skip: i,
			take: a,
			orderBy: { created_at: "desc" }
		}), this.prisma.inventoryMovement.count({ where: t })]);
		return {
			data: o,
			total: s,
			page: n,
			pageSize: r,
			totalPages: Math.ceil(s / r)
		};
	}
	async count(e) {
		let t = {};
		return Object.assign(t, P("created_at", e?.startDate, e?.endDate)), e?.productId && (t.product_id = e.productId), e?.type && (t.type = e.type), e?.reason && (t.reason = e.reason), this.prisma.inventoryMovement.count({ where: t });
	}
};
//#endregion
//#region src/backend/utils/pathValidation.ts
function _e(e, t) {
	let n = a.resolve(e), r = a.resolve(t);
	return r === n || r.startsWith(n + a.sep);
}
function I(e, t, n) {
	if (!_e(e, t)) throw Error(`${n || "Ruta"} no válida: debe estar dentro del directorio permitido`);
}
//#endregion
//#region src/infrastructure/backup/ElectronBackupService.ts
var ve = d(u), ye = class {
	getDbPath() {
		if (!t.isPackaged) return a.resolve(process.cwd(), "prisma", "dev.sqlite3");
		let e = t.getPath("userData");
		return a.join(e, "dev.sqlite3");
	}
	getBackupDir() {
		let e = !t.isPackaged, n;
		n = e ? process.cwd() : t.getPath("userData");
		let r = a.join(n, "backups");
		return o.existsSync(r) || o.mkdirSync(r, { recursive: !0 }), r;
	}
	async createBackup(e) {
		try {
			let t = this.getDbPath();
			if (!o.existsSync(t)) return {
				success: !1,
				message: "Database file not found"
			};
			let n = this.getBackupDir(), r = `backup-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").split("T")[0]}${e ? `-${e}` : ""}.sqlite.gz`, i = a.join(n, r);
			return await ve(o.createReadStream(t), p(), o.createWriteStream(i)), {
				success: !0,
				path: r
			};
		} catch (e) {
			return E.error({ err: e }, "Error creating backup"), {
				success: !1,
				message: "Error al crear respaldo"
			};
		}
	}
	async listBackups() {
		try {
			let e = this.getBackupDir();
			return o.existsSync(e) ? o.readdirSync(e).filter((e) => e.endsWith(".sqlite.gz")).map((t) => {
				let n = a.join(e, t), r = o.statSync(n);
				return {
					filename: t,
					path: t,
					size: r.size,
					created: r.mtime
				};
			}).sort((e, t) => t.created.getTime() - e.created.getTime()) : [];
		} catch (e) {
			return E.error({ err: e }, "Error listing backups"), [];
		}
	}
	async restoreBackup(e) {
		try {
			let t = this.getBackupDir();
			if (a.isAbsolute(e)) return {
				success: !1,
				message: "Ruta absoluta no permitida. Use solo el nombre del archivo."
			};
			let n = a.join(t, e);
			if (I(t, n, "Archivo de backup"), !o.existsSync(n)) return {
				success: !1,
				message: "Archivo de backup no encontrado"
			};
			let r = this.getDbPath();
			return await this.createBackup("before-restore"), await ve(o.createReadStream(n), f(), o.createWriteStream(r)), {
				success: !0,
				message: "Backup restaurado correctamente. Reinicia la aplicación."
			};
		} catch (e) {
			return E.error({ err: e }, "Error restoring backup"), {
				success: !1,
				message: "Error al restaurar respaldo"
			};
		}
	}
	async deleteBackup(e) {
		try {
			let t = this.getBackupDir();
			if (a.isAbsolute(e)) return {
				success: !1,
				message: "Ruta absoluta no permitida. Use solo el nombre del archivo."
			};
			let n = a.join(t, e);
			return I(t, n, "Archivo de backup"), o.existsSync(n) ? (o.unlinkSync(n), { success: !0 }) : {
				success: !1,
				message: "Archivo de backup no encontrado"
			};
		} catch (e) {
			return E.error({ err: e }, "Error deleting backup"), {
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
		}) || (await this.createBackup("auto"), E.info("Automatic backup created"));
	}
	async cleanupOldBackups(e = 10) {
		try {
			let t = this.getBackupDir(), n = await this.listBackups();
			if (n.length > e) {
				let r = n.slice(e);
				for (let e of r) {
					let n = a.join(t, e.path);
					o.unlinkSync(n);
				}
				E.info(`Cleaned up ${r.length} old backups`);
			}
		} catch (e) {
			E.error({ err: e }, "Error cleaning up backups");
		}
	}
}, be = class {
	async generateSalesReport(e, t, n = "Reporte de Ventas", r = !0) {
		let i = new m({
			unit: "mm",
			format: "a4"
		});
		i.setFontSize(16), i.text(n, 14, 20), i.setFontSize(10), i.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, 14, 28);
		let a = 34;
		return r && e.length > 0 && (h(i, {
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
		let r = new m({
			unit: "mm",
			format: "a4"
		});
		r.setFontSize(16), r.text(n, 14, 20), r.setFontSize(10), r.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, 14, 28), h(r, {
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
		let t = new m({
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
		let t = new m({
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
		let i = new g.Workbook();
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
		let r = new g.Workbook();
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
		let t = new g.Workbook();
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
		let t = new g.Workbook();
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
}, Se = class {
	baseUrl;
	model;
	constructor(e = process.env.IA_URL ?? "", t = "phi3:latest") {
		this.baseUrl = e, this.model = t;
	}
	async generateResponse(e, t) {
		try {
			let n = await fetch(`${this.baseUrl}/api/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: this.model,
					prompt: `${t}\n\nPregunta: ${e}\n\nRespuesta directa:`,
					stream: !1,
					options: {
						temperature: .1,
						top_p: .9
					}
				})
			});
			if (!n.ok) {
				let e = await n.text();
				throw Error(`Ollama responded with ${n.status}: ${e}`);
			}
			return (await n.json()).response.trim();
		} catch (e) {
			return E.error({ err: e }, "[Ollama] Failed to generate response"), "⚠️ El asistente IA no está disponible. Asegúrate de que Ollama esté ejecutándose.";
		}
	}
	async classifyIntent(e, t) {
		try {
			let n = await fetch(`${this.baseUrl}/api/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					model: this.model,
					prompt: `${t}\n\nUsuario: ${e}\n\nJSON:`,
					stream: !1,
					format: "json",
					options: {
						temperature: 0,
						top_p: .5
					}
				})
			});
			if (!n.ok) {
				let e = await n.text();
				throw Error(`Ollama responded with ${n.status}: ${e}`);
			}
			let r = await n.json(), i = JSON.parse(r.response.trim());
			return i && typeof i == "object" && i.intent ? i : null;
		} catch (e) {
			return E.error({ err: e }, "[Ollama] Failed to classify intent"), null;
		}
	}
}, L = _.object({
	sku: _.string().min(1, "El SKU es obligatorio."),
	name: _.string().min(1, "El nombre es obligatorio."),
	description: _.string().optional(),
	category_id: _.coerce.number().int().positive().optional().nullable(),
	supplier_id: _.coerce.number().int().positive().optional().nullable(),
	price_purchase: _.coerce.number().min(0, "El precio de compra no puede ser negativo."),
	price_sale: _.coerce.number().min(0, "El precio de venta no puede ser negativo."),
	stock: _.coerce.number().int().optional(),
	min_stock: _.coerce.number().int().min(0).optional().default(10)
}), Ce = _.object({
	product_id: _.coerce.number().int().positive("El ID del producto es obligatorio."),
	quantity: _.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
	unit_price: _.coerce.number().min(0, "El precio unitario no puede ser negativo."),
	discount_id: _.coerce.number().int().positive().optional()
}), we = _.object({
	cash_register_id: _.coerce.number().int().positive("El ID de la caja es obligatorio."),
	client_id: _.coerce.number().int().optional(),
	client_dni: _.string().optional(),
	client_name: _.string().optional(),
	payment_method: _.enum(["CASH", "CARD"]).default("CASH"),
	items: _.array(Ce).min(1, "La venta debe tener al menos un producto.")
});
_.object({ opening_amount: _.coerce.number().min(0, "El monto de apertura no puede ser negativo.") }), _.object({
	register_id: _.coerce.number().int().positive("El ID de la caja es obligatorio."),
	closing_amount: _.coerce.number().min(0, "El monto de cierre no puede ser negativo.")
});
var R = _.object({
	dni: _.string().min(1, "El DNI/Documento es obligatorio."),
	name: _.string().min(1, "El nombre es obligatorio."),
	phone: _.string().optional().nullable(),
	code: _.string().min(1, "El código de cliente es obligatorio."),
	tax_id: _.string().optional().nullable()
}), Te = _.object({ name: _.string().min(1, "El nombre de la categoría es obligatorio.").max(255) });
_.object({
	product_id: _.coerce.number().int().positive("El ID del producto es obligatorio."),
	type: _.enum(["ENTRADA", "SALIDA"], { errorMap: () => ({ message: "El tipo debe ser ENTRADA o SALIDA." }) }),
	quantity: _.coerce.number().int().positive("La cantidad debe ser mayor a 0.")
});
var Ee = _.object({
	name: _.string().min(1, "El nombre del proveedor es obligatorio."),
	ruc: _.string().optional().nullable(),
	phone: _.string().optional().nullable(),
	email: _.string().email("Email inválido").optional().nullable().or(_.literal("")),
	address: _.string().optional().nullable()
});
_.object({
	name: _.string().min(1, "El nombre del proveedor es obligatorio.").optional(),
	ruc: _.string().optional().nullable(),
	phone: _.string().optional().nullable(),
	email: _.string().email("Email inválido").optional().nullable().or(_.literal("")),
	address: _.string().optional().nullable()
});
var De = _.object({
	product_id: _.coerce.number().int().positive("El ID del producto es obligatorio."),
	quantity: _.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
	unit_cost: _.coerce.number().min(0, "El costo unitario no puede ser negativo.")
}), Oe = _.object({
	supplier_id: _.coerce.number().int().positive("El ID del proveedor es obligatorio."),
	items: _.array(De).min(1, "La orden debe tener al menos un producto."),
	payment_status: _.enum([
		"UNPAID",
		"PAID",
		"CANCELED"
	]).optional().default("UNPAID")
}), ke = _.object({
	username: _.string().min(1, "El nombre de usuario es obligatorio.").max(50),
	password: _.string().min(8, "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial").regex(/[A-Z]/, "Debe contener al menos una mayúscula").regex(/[a-z]/, "Debe contener al menos una minúscula").regex(/[0-9]/, "Debe contener al menos un número").regex(/[!@#$%^&*()_\-+=<>?/{}~|]/, "Debe contener al menos un carácter especial"),
	role: _.enum(["ADMIN", "VENDEDOR"], { errorMap: () => ({ message: "El rol debe ser ADMIN o VENDEDOR." }) }),
	question: _.string().optional(),
	answer: _.string().optional()
});
_.object({
	username: _.string().min(1, "El nombre de usuario es obligatorio.").max(50).optional(),
	role: _.enum(["ADMIN", "VENDEDOR"]).optional()
});
var Ae = _.object({
	name: _.string().min(1, "El nombre del descuento es obligatorio."),
	type: _.enum(["PERCENTAGE", "FIXED_AMOUNT"], { errorMap: () => ({ message: "El tipo debe ser PERCENTAGE o FIXED_AMOUNT." }) }),
	value: _.coerce.number().min(0, "El valor no puede ser negativo."),
	is_active: _.boolean().optional(),
	applicable_to: _.enum([
		"ALL",
		"CATEGORY",
		"SPECIFIC"
	]).optional(),
	category_id: _.coerce.number().int().positive().optional().nullable(),
	product_ids: _.array(_.coerce.number().int().positive()).optional(),
	min_purchase_amount: _.coerce.number().min(0).optional().nullable()
}), je = _.object({ query: _.string().min(1, "La consulta no puede estar vacía.") }), Me = _.record(_.enum([
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
]), _.string()).refine((e) => Object.keys(e).length > 0, { message: "Debe enviar al menos una configuración." }), Ne = class {
	productRepo;
	categoryRepo;
	auditLogRepo;
	constructor(e, t, n) {
		this.productRepo = e, this.categoryRepo = t, this.auditLogRepo = n;
	}
	async getAllProducts(e, t) {
		return this.productRepo.findAll(e, t);
	}
	async getProductById(e) {
		let t = await this.productRepo.findById(e);
		if (!t) throw new A("Producto");
		return t;
	}
	async getLowStockProducts(e) {
		return this.productRepo.findLowStock();
	}
	async createProduct(e, t = 1) {
		let n = L.parse(e);
		if (await this.productRepo.findBySku(n.sku)) throw new M(`El SKU ${n.sku} ya se encuentra registrado.`);
		if (n.category_id && !await this.categoryRepo.findById(n.category_id)) throw new A("Categoría");
		let r = n.stock || 0, i = await this.productRepo.create(n);
		return r > 0 && await this.productRepo.createMovement({
			product_id: i.id,
			type: "ENTRADA",
			quantity: r,
			reason: "INICIAL"
		}), await this.auditLogRepo.create({
			userId: t,
			action: "CREATE_PRODUCT",
			entity: "products",
			entity_id: i.id
		}), {
			success: !0,
			id: i.id
		};
	}
	async updateProduct(e, t, n = 1) {
		let r = await this.productRepo.findById(e);
		if (!r) throw new A("Producto");
		let i = L.parse(t);
		if (i.sku !== r.sku && await this.productRepo.findBySku(i.sku)) throw new M(`El SKU ${i.sku} ya se encuentra registrado.`);
		if (i.category_id && !await this.categoryRepo.findById(i.category_id)) throw new A("Categoría");
		let a = await this.productRepo.update(e, i);
		return await this.auditLogRepo.create({
			userId: n,
			action: "UPDATE_PRODUCT",
			entity: "products",
			entity_id: a.id
		}), {
			success: !0,
			product: a
		};
	}
	async deleteProduct(e, t = 1) {
		if (!await this.productRepo.findById(e)) throw new A("Producto");
		let n = await this.productRepo.getSalesCount(e);
		if (n > 0) throw new N(`No se puede eliminar el producto porque tiene ${n} venta(s) asociada(s).`);
		return await this.productRepo.delete(e), await this.auditLogRepo.create({
			userId: t,
			action: "DELETE_PRODUCT",
			entity: "products",
			entity_id: e
		}), { success: !0 };
	}
	async addStock(e, t, n = 1, r = "AJUSTE") {
		if (!await this.productRepo.findById(e)) throw new A("Producto");
		if (t <= 0) throw new j("La cantidad debe ser mayor a cero.");
		return await this.productRepo.updateStock(e, t), await this.productRepo.createMovement({
			product_id: e,
			type: "ENTRADA",
			quantity: t,
			reason: r
		}), await this.auditLogRepo.create({
			userId: n,
			action: "STOCK_ENTRADA",
			entity: "products",
			entity_id: e
		}), { success: !0 };
	}
	async removeStock(e, t, n = 1, r = "AJUSTE") {
		let i = await this.productRepo.findById(e);
		if (!i) throw new A("Producto");
		if (t <= 0) throw new j("La cantidad debe ser mayor a cero.");
		if (i.stock < t) throw new N(`Stock insuficiente. Stock actual: ${i.stock}, Cantidad solicitada: ${t}`);
		await this.productRepo.updateStock(e, -t);
		let a = await this.productRepo.findById(e);
		if (a && a.stock < 0) throw new N("Error interno: el stock no puede ser negativo");
		return await this.productRepo.createMovement({
			product_id: e,
			type: "SALIDA",
			quantity: t,
			reason: r
		}), await this.auditLogRepo.create({
			userId: n,
			action: "STOCK_SALIDA",
			entity: "products",
			entity_id: e
		}), { success: !0 };
	}
	async getInventoryMovements(e, t = 50) {
		if (!await this.productRepo.findById(e)) throw new A("Producto");
		return this.productRepo.getMovements(e, t);
	}
}, Pe = class {
	clientRepo;
	auditLogRepo;
	constructor(e, t) {
		this.clientRepo = e, this.auditLogRepo = t;
	}
	async getAllClients(e) {
		return this.clientRepo.findAll(e);
	}
	async getClientById(e) {
		return await F(() => this.clientRepo.findById(e), "Cliente", e);
	}
	async createClient(e, t = 1) {
		let n = R.parse(e);
		if (await this.clientRepo.findByDni(n.dni)) throw new M(`El DNI ${n.dni} ya se encuentra registrado.`);
		if (await this.clientRepo.findByCode(n.code)) throw new M(`El código ${n.code} ya se encuentra registrado.`);
		if (n.tax_id && await this.clientRepo.findByTaxId(n.tax_id)) throw new M(`El RUC ${n.tax_id} ya se encuentra registrado.`);
		let r = await this.clientRepo.create(n);
		return await this.auditLogRepo.create({
			userId: t,
			action: "CREATE_CLIENT",
			entity: "clients",
			entity_id: r.id
		}), {
			success: !0,
			id: r.id
		};
	}
	async updateClient(e, t, n = 1) {
		await F(() => this.clientRepo.findById(e), "Cliente", e);
		let r = R.parse(t), i = await this.clientRepo.findByDni(r.dni);
		if (i && i.id !== e) throw new M(`El DNI ${r.dni} ya se encuentra registrado.`);
		let a = await this.clientRepo.findByCode(r.code);
		if (a && a.id !== e) throw new M(`El código ${r.code} ya se encuentra registrado.`);
		if (r.tax_id) {
			let t = await this.clientRepo.findByTaxId(r.tax_id);
			if (t && t.id !== e) throw new M(`El RUC ${r.tax_id} ya se encuentra registrado.`);
		}
		let o = await this.clientRepo.update(e, r);
		return await this.auditLogRepo.create({
			userId: n,
			action: "UPDATE_CLIENT",
			entity: "clients",
			entity_id: o.id
		}), {
			success: !0,
			client: o
		};
	}
	async deleteClient(e, t = 1) {
		await F(() => this.clientRepo.findById(e), "Cliente", e);
		let n = await this.clientRepo.getSalesCount(e);
		if (n > 0) throw new N(`No se puede eliminar el cliente porque tiene ${n} venta(s) asociada(s).`);
		return await this.clientRepo.delete(e), await this.auditLogRepo.create({
			userId: t,
			action: "DELETE_CLIENT",
			entity: "clients",
			entity_id: e
		}), { success: !0 };
	}
}, Fe = class {
	saleRepo;
	productRepo;
	clientRepo;
	cashRegisterRepo;
	settingsRepo;
	auditLogRepo;
	discountRepo;
	dashboardService;
	constructor(e, t, n, r, i, a, o, s) {
		this.saleRepo = e, this.productRepo = t, this.clientRepo = n, this.cashRegisterRepo = r, this.settingsRepo = i, this.auditLogRepo = a, this.discountRepo = o, this.dashboardService = s;
	}
	async getAllSales(e, t, n, r, i, a) {
		let o = {};
		return e && (o.startDate = e), t && (o.endDate = t), n && (o.clientId = n), r && (o.cashRegisterId = r), i && (o.page = i), a && (o.pageSize = a), this.saleRepo.findAll(o);
	}
	async getSaleDetails(e) {
		let t = await this.saleRepo.findById(e);
		if (!t) throw new A("Venta");
		return t;
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
	async registerSale(e, t, n = 1) {
		let r = we.parse({
			...e,
			items: t
		});
		if (!await this.cashRegisterRepo.findOpen()) throw new N("La caja no está abierta o no existe.");
		let i = r.client_id;
		if (r.client_dni && r.client_name && !i) {
			let e = await this.clientRepo.findByDni(r.client_dni);
			i = e ? e.id : (await this.clientRepo.create({
				dni: r.client_dni,
				name: r.client_name,
				code: `CLI-${Date.now()}`
			})).id;
		}
		if (i && !await this.clientRepo.findById(i)) throw new A("Cliente");
		let a = r.items.map((e) => e.product_id), o = await this.productRepo.findByIds(a), s = new Map(o.map((e) => [e.id, e]));
		for (let e of r.items) {
			let t = s.get(e.product_id);
			if (!t) throw new A("Producto", e.product_id);
			if (t.stock < e.quantity) throw new N(`Stock insuficiente para "${t.name}". Stock actual: ${t.stock}, Cantidad solicitada: ${e.quantity}`);
		}
		let c = await Promise.all(r.items.map(async (e) => {
			let t = s.get(e.product_id), n = 0, r = e.unit_price, i = null, a = null, o = null;
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
		})), l = c.reduce((e, t) => e + t.unit_price * t.quantity, 0), u = c.reduce((e, t) => e + (t.discount_amount || 0), 0), d = await this.settingsRepo.getTaxSettings(), f = l - u;
		f = parseFloat(f.toFixed(2));
		let p = 0, m = f;
		d.taxType !== "none" && d.taxRate > 0 && (p = parseFloat((f * d.taxRate).toFixed(2)), m = parseFloat((f + p).toFixed(2)));
		let h = {
			cash_register_id: r.cash_register_id,
			client_id: i || 1,
			subtotal: f,
			tax_amount: p,
			total: m,
			discount_total: u,
			items: c,
			payment_method: r.payment_method,
			exchange_rate: e.exchange_rate || 0
		}, g = await this.saleRepo.registerSale(h);
		return this.dashboardService.invalidateCache(), await this.auditLogRepo.create({
			userId: n,
			action: "CREATE_SALE",
			entity: "sales",
			entity_id: g
		}), {
			success: !0,
			id: g
		};
	}
	async cancelSale(e, t = 1) {
		if (!await this.saleRepo.findById(e)) throw new A("Venta");
		return await this.saleRepo.cancelSale(e), this.dashboardService.invalidateCache(), await this.auditLogRepo.create({
			userId: t,
			action: "CANCEL_SALE",
			entity: "sales",
			entity_id: e
		}), { success: !0 };
	}
}, Ie = class {
	cashRegisterRepo;
	auditLogRepo;
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
		let t = await this.cashRegisterRepo.findById(e);
		if (!t) throw new A("Caja");
		return t;
	}
	async openRegister(e, t = 1) {
		if (isNaN(e) || e < 0) throw new j("El monto de apertura no puede ser negativo.");
		if (await this.cashRegisterRepo.findOpen()) throw new M("Ya hay una caja abierta para el día de hoy.");
		let n = await this.cashRegisterRepo.create(e);
		return await this.auditLogRepo.create({
			userId: t,
			action: "OPEN_CASH_REGISTER",
			entity: "cash_registers",
			entity_id: n.id
		}), {
			success: !0,
			id: n.id
		};
	}
	async closeRegister(e, t, n = 1) {
		if (isNaN(t) || t < 0) throw new j("El monto de cierre no puede ser negativo.");
		let r = await this.cashRegisterRepo.findById(e);
		if (!r) throw new A("Caja");
		let i = Number(r.opening_amount) + Number(r.total_sales), a = Math.round((Number(t) - i) * 100) / 100, o = await this.cashRegisterRepo.getSalesCount(r.id, r.opened_at), s = a === 0 ? "PERFECT" : a > 0 ? "SURPLUS" : "MISSING";
		return await this.cashRegisterRepo.close(r.id, Number(t), a, s), await this.auditLogRepo.create({
			userId: n,
			action: "CLOSE_CASH_REGISTER",
			entity: "cash_registers",
			entity_id: r.id
		}), {
			success: !0,
			registerId: r.id,
			openingAmount: r.opening_amount,
			totalSales: r.total_sales,
			expectedCash: i,
			realCash: Number(t),
			difference: a,
			status: s,
			salesCount: o
		};
	}
	async getDailySummary(e) {
		return this.cashRegisterRepo.getDailySummary(e);
	}
}, Le = class {
	supplierRepo;
	auditLogRepo;
	constructor(e, t) {
		this.supplierRepo = e, this.auditLogRepo = t;
	}
	async getAllSuppliers(e) {
		try {
			return await this.supplierRepo.findAll(e);
		} catch (e) {
			throw E.error("Get all suppliers error:", e), Error("Error al obtener proveedores");
		}
	}
	async getSupplierById(e) {
		try {
			let t = await this.supplierRepo.findById(e);
			if (!t) throw new A("Proveedor");
			return t;
		} catch (e) {
			throw E.error("Get supplier by ID error:", e), e.code === "P2025" ? new A("Proveedor") : e;
		}
	}
	async createSupplier(e, t) {
		try {
			if (e.ruc && await this.supplierRepo.findByRuc(e.ruc)) throw new M(`El RUC ${e.ruc} ya está registrado`);
			let n = await this.supplierRepo.create(e);
			return await this.auditLogRepo.create({
				userId: t,
				action: "CREATE_SUPPLIER",
				entity: "suppliers",
				entity_id: n.id
			}), n;
		} catch (e) {
			throw E.error("Create supplier error:", e), e.code === "P2002" ? new M("El RUC ya está en uso") : e;
		}
	}
	async updateSupplier(e, t, n) {
		try {
			let r = await this.supplierRepo.findById(e);
			if (!r) throw new A("Proveedor");
			if (t.ruc && t.ruc !== r.ruc && await this.supplierRepo.findByRuc(t.ruc)) throw new M(`El RUC ${t.ruc} ya está registrado`);
			let i = await this.supplierRepo.update(e, t);
			return await this.auditLogRepo.create({
				userId: n,
				action: "UPDATE_SUPPLIER",
				entity: "suppliers",
				entity_id: e
			}), i;
		} catch (e) {
			throw E.error("Update supplier error:", e), e.code === "P2025" ? new A("Proveedor") : e;
		}
	}
	async deleteSupplier(e, t) {
		try {
			if (!await this.supplierRepo.findById(e)) throw new A("Proveedor");
			if (await this.supplierRepo.hasProducts(e)) throw new N("No se puede eliminar el proveedor porque tiene producto(s) asociado(s)");
			if (await this.supplierRepo.hasPurchases(e)) throw new N("No se puede eliminar el proveedor porque tiene compra(s) asociada(s)");
			return await this.supplierRepo.delete(e), await this.auditLogRepo.create({
				userId: t,
				action: "DELETE_SUPPLIER",
				entity: "suppliers",
				entity_id: e
			}), { success: !0 };
		} catch (e) {
			throw E.error("Delete supplier error:", e), e.code === "P2025" ? new A("Proveedor") : e;
		}
	}
}, Re = class {
	purchaseRepo;
	supplierRepo;
	productRepo;
	auditLogRepo;
	constructor(e, t, n, r) {
		this.purchaseRepo = e, this.supplierRepo = t, this.productRepo = n, this.auditLogRepo = r;
	}
	async getAllPurchases(e, t) {
		try {
			return await this.purchaseRepo.findAll(e, t);
		} catch (e) {
			throw E.error("Get all purchases error:", e), Error("Error al obtener compras");
		}
	}
	async getPurchaseById(e) {
		try {
			let t = await this.purchaseRepo.findById(e);
			if (!t) throw new A("Compra");
			return t;
		} catch (e) {
			throw E.error("Get purchase by ID error:", e), e.code === "P2025" ? new A("Compra") : e;
		}
	}
	async createPurchase(e, t) {
		try {
			if (!await this.supplierRepo.findById(e.supplier_id)) throw new A("Proveedor");
			let n = e.items.map((e) => e.product_id);
			if ((await this.productRepo.findByIds(n)).length !== n.length) throw new A("Producto", "uno o más productos no existen");
			let r = await this.purchaseRepo.create(e);
			return await this.auditLogRepo.create({
				userId: t,
				action: "CREATE_PURCHASE",
				entity: "purchases",
				entity_id: r.id
			}), r;
		} catch (e) {
			throw E.error("Create purchase error:", e), e;
		}
	}
	async receivePurchase(e, t) {
		try {
			return await this.purchaseRepo.receive(e), await this.auditLogRepo.create({
				userId: t,
				action: "RECEIVE_PURCHASE",
				entity: "purchases",
				entity_id: e
			}), { success: !0 };
		} catch (e) {
			throw E.error("Receive purchase error:", e), e.code === "P2025" ? new A("Compra") : e;
		}
	}
	async updatePaymentStatus(e, t) {
		try {
			return await this.purchaseRepo.updatePaymentStatus(e, t), { success: !0 };
		} catch (e) {
			throw E.error("Update payment status error:", e), e.code === "P2025" ? new A("Compra") : e;
		}
	}
	async cancelPurchase(e, t) {
		try {
			return await this.purchaseRepo.cancel(e), await this.auditLogRepo.create({
				userId: t,
				action: "CANCEL_PURCHASE",
				entity: "purchases",
				entity_id: e
			}), { success: !0 };
		} catch (e) {
			throw E.error("Cancel purchase error:", e), e.code === "P2025" ? new A("Compra") : e;
		}
	}
}, ze = class {
	settingsRepo;
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
}, Be = 8, Ve = /[A-Z]/, He = /[a-z]/, Ue = /[0-9]/, We = /[!@#$%^&*()_\-+=<>?/{}~|]/, Ge = `La contraseña debe tener al menos ${Be} caracteres, una mayúscula, un número y un carácter especial`;
function z(e) {
	return e.length < Be || !Ve.test(e) || !He.test(e) || !Ue.test(e) || !We.test(e) ? {
		valid: !1,
		error: Ge
	} : {
		valid: !0,
		error: ""
	};
}
//#endregion
//#region src/backend/services/UserService.ts
var Ke = class {
	userRepo;
	auditLogRepo;
	constructor(e, t) {
		this.userRepo = e, this.auditLogRepo = t;
	}
	async getAllUsers() {
		try {
			return await this.userRepo.findAll();
		} catch (e) {
			throw E.error("Get all users error:", e), Error("Error al obtener usuarios");
		}
	}
	async getUserById(e) {
		try {
			let t = await this.userRepo.findById(e);
			if (!t) throw new A("Usuario");
			return t;
		} catch (e) {
			throw E.error("Get user by ID error:", e), e.code === "P2025" ? new A("Usuario") : e;
		}
	}
	async createUser(e, t) {
		try {
			if (await this.userRepo.exists(e.username)) throw new M(`El usuario '${e.username}' ya existe`);
			let n = z(e.password);
			if (!n.valid) throw new j(n.error);
			let r = await v.genSalt(10), i = await v.hash(e.password, r), a;
			if (e.question && e.answer) {
				let t = await v.genSalt(10);
				a = await v.hash(e.answer.toLowerCase().trim(), t);
			}
			let o = await this.userRepo.create({
				username: e.username,
				password_hash: i,
				role: e.role,
				security_question: e.question || null,
				security_answer_hash: a || null
			});
			return await this.auditLogRepo.create({
				userId: t,
				action: "CREATE_USER",
				entity: "users",
				entity_id: o.id
			}), o;
		} catch (e) {
			throw E.error("Create user error:", e), e.code === "P2002" ? new M("El nombre de usuario ya está en uso") : e;
		}
	}
	async updateUser(e, t, n) {
		try {
			if (t.username && await this.userRepo.exists(t.username, e)) throw new M(`El usuario '${t.username}' ya existe`);
			let r = await this.userRepo.update(e, t);
			return await this.auditLogRepo.create({
				userId: n,
				action: "UPDATE_USER",
				entity: "users",
				entity_id: e
			}), r;
		} catch (e) {
			throw E.error("Update user error:", e), e.code === "P2025" ? new A("Usuario") : e;
		}
	}
	async deleteUser(e, t) {
		try {
			if (!await this.userRepo.findById(e)) throw new A("Usuario");
			if (e === t) throw new N("No puedes eliminar tu propio usuario");
			return await this.userRepo.delete(e), await this.auditLogRepo.create({
				userId: t,
				action: "DELETE_USER",
				entity: "users",
				entity_id: e
			}), { success: !0 };
		} catch (e) {
			throw E.error("Delete user error:", e), e.code === "P2025" ? new A("Usuario") : e;
		}
	}
	async changePassword(e, t, n) {
		try {
			let r = z(t);
			if (!r.valid) throw new j(r.error);
			let i = await v.genSalt(10), a = await v.hash(t, i);
			return await this.userRepo.update(e, { password_hash: a }), await this.auditLogRepo.create({
				userId: n,
				action: "CHANGE_PASSWORD",
				entity: "users",
				entity_id: e
			}), { success: !0 };
		} catch (e) {
			throw E.error("Change password error:", e), e.code === "P2025" ? new A("Usuario") : e;
		}
	}
}, B = 5, qe = 900 * 1e3, V = /* @__PURE__ */ new Map(), Je = class {
	userRepo;
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
			return E.error({ err: e }, "Get security question error"), {
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
			if (!await v.compare(t.toLowerCase().trim(), n.security_answer_hash)) return {
				success: !1,
				error: "Respuesta incorrecta"
			};
			let r = y.randomUUID();
			return V.set(r, {
				username: e,
				expiresAt: Date.now() + 600 * 1e3
			}), {
				success: !0,
				token: r
			};
		} catch (e) {
			return E.error({ err: e }, "Verify security answer error"), {
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
		let r = z(t);
		if (!r.valid) return {
			success: !1,
			error: r.error
		};
		try {
			let r = await v.genSalt(10), i = await v.hash(t, r);
			return await this.userRepo.updateByUsername(n.username, { password_hash: i }), V.delete(e), { success: !0 };
		} catch (e) {
			return E.error({ err: e }, "Reset password error"), {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
	async setSecurityQuestion(e, t, n) {
		try {
			let r = await v.genSalt(10), i = await v.hash(n.toLowerCase().trim(), r);
			return await this.userRepo.update(e, {
				security_question: t,
				security_answer_hash: i
			}), { success: !0 };
		} catch (e) {
			return E.error({ err: e }, "Set security question error"), {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
	async login(e, t) {
		try {
			let n = await this.userRepo.findByUsername(e);
			if (!n) return {
				success: !1,
				error: "Usuario no encontrado"
			};
			let r = Date.now();
			if (n.locked_until && new Date(n.locked_until).getTime() > r) {
				let e = new Date(n.locked_until).getTime() - r, t = Math.ceil(e / 6e4);
				return {
					success: !1,
					error: `Demasiados intentos. Bloqueado por ${t} minuto${t > 1 ? "s" : ""}`,
					remainingAttempts: 0,
					locked: !0,
					lockoutRemainingMs: e
				};
			}
			if (n.failed_attempts >= B && await this.userRepo.resetLoginAttempts(e), !await v.compare(t, n.password_hash)) {
				let t = n.failed_attempts + 1, i = B - t;
				if (t >= B) {
					let n = new Date(r + qe);
					return await this.userRepo.updateLoginAttempts(e, t, n), {
						success: !1,
						error: "Demasiados intentos. Bloqueado por 15 minutos",
						remainingAttempts: 0,
						locked: !0,
						lockoutRemainingMs: qe
					};
				}
				return await this.userRepo.updateLoginAttempts(e, t, null), {
					success: !1,
					error: i > 0 ? `Contraseña incorrecta. Intentos restantes: ${i}` : "Contraseña incorrecta",
					remainingAttempts: i
				};
			}
			await this.userRepo.resetLoginAttempts(e);
			let { password_hash: i, ...a } = n;
			return {
				success: !0,
				user: a
			};
		} catch (e) {
			return E.error({ err: e }, "Login error"), e.code === "P2025" ? {
				success: !1,
				error: "Usuario no encontrado",
				remainingAttempts: 0
			} : {
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
			let t = z(e.password);
			if (!t.valid) return {
				success: !1,
				error: t.error
			};
			let n = await v.genSalt(10), r = await v.hash(e.password, n), i;
			if (e.security_question && e.security_answer) {
				let t = await v.genSalt(10);
				i = await v.hash(e.security_answer.toLowerCase().trim(), t);
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
			return E.error({ err: e }, "Register error"), e.code === "P2002" ? {
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
			if (!await v.compare(t, r.password_hash)) return {
				success: !1,
				error: "Contraseña actual incorrecta"
			};
			let i = z(n);
			if (!i.valid) return {
				success: !1,
				error: i.error
			};
			let a = await v.genSalt(10), o = await v.hash(n, a);
			return await this.userRepo.update(e, { password_hash: o }), { success: !0 };
		} catch (e) {
			return E.error({ err: e }, "Change password error"), {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
}, Ye = class {
	categoryRepo;
	auditLogRepo;
	constructor(e, t) {
		this.categoryRepo = e, this.auditLogRepo = t;
	}
	async getAllCategories(e) {
		return await this.categoryRepo.findAll(e);
	}
	async getCategoryById(e) {
		return await F(() => this.categoryRepo.findById(e), "Categoría", e);
	}
	async createCategory(e, t) {
		if (await this.categoryRepo.findByName(e.name)) throw new M(`La categoría "${e.name}" ya existe.`);
		let n = await this.categoryRepo.create(e);
		return await this.auditLogRepo.create({
			userId: t,
			action: "CREATE_CATEGORY",
			entity: "categories",
			entity_id: n.id
		}), n;
	}
	async updateCategory(e, t, n) {
		await F(() => this.categoryRepo.findById(e), "Categoría", e);
		let r = await this.categoryRepo.findByName(t.name);
		if (r && r.id !== e) throw new M(`La categoría "${t.name}" ya existe.`);
		let i = await this.categoryRepo.update(e, t);
		return await this.auditLogRepo.create({
			userId: n,
			action: "UPDATE_CATEGORY",
			entity: "categories",
			entity_id: e
		}), i;
	}
	async deleteCategory(e, t) {
		await F(() => this.categoryRepo.findById(e), "Categoría", e);
		let n = await this.categoryRepo.getProductCount(e);
		if (n > 0) throw new N(`No se puede eliminar la categoría porque tiene ${n} producto(s) asociado(s).`);
		return await this.categoryRepo.delete(e), await this.auditLogRepo.create({
			userId: t,
			action: "DELETE_CATEGORY",
			entity: "categories",
			entity_id: e
		}), { success: !0 };
	}
}, Xe = class {
	adapter;
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
	repo;
	cache;
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
	async getLastSaleWithClient() {
		return this.repo.getLastSaleWithClient();
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
	pdfGenerator;
	excelGenerator;
	dashboardService;
	saleService;
	productService;
	cashRegisterService;
	settingsService;
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
}, tt = "scheduler_", nt = class {
	reportService;
	backupService;
	dailyTimer = null;
	weeklyTimer = null;
	statePath;
	constructor(e, t) {
		this.reportService = e, this.backupService = t, this.statePath = S(process.cwd(), "scheduler-state.json");
	}
	start() {
		E.info("Starting scheduled tasks"), this.scheduleDailyReport(), this.scheduleWeeklyReport(), this.scheduleDailyBackup();
	}
	stop() {
		this.dailyTimer && clearInterval(this.dailyTimer), this.weeklyTimer && clearInterval(this.weeklyTimer), E.info("Stopped scheduled tasks");
	}
	scheduleDailyReport() {
		let e = async () => {
			try {
				let e = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				if (this.getLastRun("daily_report") === e) return;
				E.info("Generating daily report"), await this.reportService.generateReport({
					type: "daily_sales",
					format: "pdf",
					title: `Reporte Diario - ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`
				}), this.setLastRun("daily_report", e), E.info("Daily report saved");
			} catch (e) {
				E.error({ err: e }, "Error generating daily report");
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
				n.setDate(e.getDate() - e.getDay()), n.setHours(0, 0, 0, 0), E.info("Generating weekly report"), await this.reportService.generateReport({
					type: "sales_summary",
					format: "pdf",
					startDate: n,
					endDate: e,
					title: `Reporte Semanal - Semana ${t}`
				}), this.setLastRun("weekly_report", String(t)), E.info("Weekly report saved");
			} catch (e) {
				E.error({ err: e }, "Error generating weekly report");
			}
		};
		e(), this.weeklyTimer = setInterval(e, 360 * 60 * 1e3);
	}
	scheduleDailyBackup() {
		let e = async () => {
			try {
				let e = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				if (this.getLastRun("daily_backup") === e) return;
				E.info("Creating daily backup"), await this.backupService.createBackup(`auto-${e}`), this.setLastRun("daily_backup", e), E.info("Daily backup created");
			} catch (e) {
				E.error({ err: e }, "Error creating daily backup");
			}
		};
		e(), setInterval(e, 3600 * 1e3);
	}
	getLastRun(e) {
		try {
			return b(this.statePath) ? JSON.parse(x(this.statePath, "utf-8"))[tt + e] ?? "" : "";
		} catch {
			return "";
		}
	}
	setLastRun(e, t) {
		try {
			let n = {};
			b(this.statePath) && (n = JSON.parse(x(this.statePath, "utf-8"))), n[tt + e] = t, te(this.statePath, JSON.stringify(n, null, 2));
		} catch {}
	}
	getWeekNumber(e) {
		let t = new Date(e.getFullYear(), 0, 1), n = e.getTime() - t.getTime();
		return Math.ceil((n / 864e5 + t.getDay() + 1) / 7);
	}
}, rt = class {
	discountRepo;
	constructor(e) {
		this.discountRepo = e;
	}
	async getAllDiscounts(e) {
		return this.discountRepo.findAll(e);
	}
	async getDiscountById(e) {
		let t = await this.discountRepo.findById(e);
		if (!t) throw new A("Descuento");
		return t;
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
}, it = class {
	aiProvider;
	dashboardService;
	productService;
	clientService;
	constructor(e, t, n, r) {
		this.aiProvider = e, this.dashboardService = t, this.productService = n, this.clientService = r;
	}
	async processCommand(e) {
		let t = e.toLowerCase();
		if (/^sku[\s]*[:]?\s*[\w-]+/i.test(t)) return this.handleStockQuery(e);
		if (/costoso|caro|precio\.?mas|mayor\.?precio|mas\.?caro|mas caro/i.test(t) && !/crear|nuevo/.test(t)) return this.handleMostExpensiveProduct();
		if (/barato|mas\.?barato|menor\.?precio|economico|mas economico/i.test(t) && !/crear|nuevo/.test(t)) return this.handleCheapestProduct();
		if (/cuantos?\s+clientes/i.test(t)) return this.handleClientCount();
		if (/cuantos?\s+(categorías|categorias)/i.test(t)) return this.handleCategoryCount();
		if (/cuantos?\s+proveedores/i.test(t)) return this.handleSupplierCount();
		if (/cuantos?\s+productos\s+(tengo|hay|en|registrados)/i.test(t)) return this.handleProductCount();
		if (/cuantos?\s+ventas/i.test(t)) return this.handleSalesSummary(e);
		let n = await this.classifyWithLLM(e);
		if (!n) return this.handleGeneralQuery(e);
		switch (n.intent) {
			case "product_query": return this.handleStockQuery(e);
			case "sales_summary": return this.handleSalesSummary(e);
			case "entity_count": {
				let t = n.entities?.entity_type || "";
				return t.includes("producto") || t === "product" ? this.handleProductCount() : t.includes("cliente") || t === "client" ? this.handleClientCount() : t.includes("categoria") || t === "category" ? this.handleCategoryCount() : t.includes("proveedor") || t === "supplier" ? this.handleSupplierCount() : this.handleGeneralQuery(e);
			}
			case "entity_creation": return this.handleEntityCreation(e, n.entities);
			case "sale_draft": return this.handleSaleDraft(e, n.entities);
			default: return this.handleGeneralQuery(e);
		}
	}
	async classifyWithLLM(e) {
		let t = await this.aiProvider.classifyIntent(e, "Eres un clasificador de intenciones para un sistema POS. Responde SOLO un JSON con intent y entities.\n\nIntents posibles:\n- product_query: preguntas sobre precio, stock, SKU, búsqueda de productos\n- sales_summary: resumen de ventas, ganancias, ingresos\n- entity_count: cuántos productos/clientes/categorías existen\n- entity_creation: crear o registrar un nuevo producto, cliente, categoría\n- sale_draft: preparar un carrito de venta\n- general: cualquier otra consulta\n\nEjemplos:\nUsuario: cuales son los productos con poco stock\n{\"intent\":\"product_query\",\"entities\":{\"query_type\":\"low_stock\"}}\n\nUsuario: cuanto se vendio ayer\n{\"intent\":\"sales_summary\",\"entities\":{\"period\":\"yesterday\"}}\n\nUsuario: quiero saber el producto mas caro\n{\"intent\":\"product_query\",\"entities\":{\"query_type\":\"most_expensive\"}}\n\nUsuario: registra un producto nuevo llamado te verde\n{\"intent\":\"entity_creation\",\"entities\":{\"entity_type\":\"product\",\"name\":\"Te verde\"}}\n\nUsuario: crea un cliente llamado juan perez con dni 12345678\n{\"intent\":\"entity_creation\",\"entities\":{\"entity_type\":\"client\",\"name\":\"Juan Perez\",\"dni\":\"12345678\"}}\n\nUsuario: registra un cliente nuevo maria lopez\n{\"intent\":\"entity_creation\",\"entities\":{\"entity_type\":\"client\",\"name\":\"Maria Lopez\"}}\n\nUsuario: crear producto castañas precio compra 1.30 precio venta 2\n{\"intent\":\"entity_creation\",\"entities\":{\"entity_type\":\"product\",\"name\":\"Castañas\",\"price_purchase\":1.30,\"price_sale\":2}}\n\nUsuario: cuantos productos hay en total\n{\"intent\":\"entity_count\",\"entities\":{\"entity_type\":\"product\"}}\n\nUsuario: dame el precio del SKU BEB-001\n{\"intent\":\"product_query\",\"entities\":{\"query_type\":\"sku\",\"sku\":\"BEB-001\"}}\n\nUsuario: vende 2 cafes a juan perez\n{\"intent\":\"sale_draft\",\"entities\":{\"producto\":\"cafe\",\"cantidad\":2,\"cliente\":\"juan perez\"}}\n\nUsuario: quiero comprar 3 arroz\n{\"intent\":\"sale_draft\",\"entities\":{\"producto\":\"arroz\",\"cantidad\":3}}\n\nUsuario: vende una leche a maria\n{\"intent\":\"sale_draft\",\"entities\":{\"producto\":\"leche\",\"cantidad\":1,\"cliente\":\"maria\"}}\n\nUsuario: prepara carrito con pan y mantequilla\n{\"intent\":\"sale_draft\",\"entities\":{\"producto\":\"pan mantequilla\",\"cantidad\":1}}\n\nUsuario: cuales son las categorias que tengo\n{\"intent\":\"entity_count\",\"entities\":{\"entity_type\":\"category\"}}\n\nUsuario: que productos estan por vencer\n{\"intent\":\"general\"}\n\nUsuario: quien compro la ultima venta\n{\"intent\":\"general\"}");
		return !t || typeof t.intent != "string" ? null : t;
	}
	async askAssistant(e) {
		return this.processCommand(e);
	}
	extractKeywords(e) {
		let t = /* @__PURE__ */ "el.la.los.las.un.una.de.del.en.con.por.para.y.e.o.a.su.que.es.se.no.lo.como.más.pero.sus.le.ya.este.entre.porque.cuando.muy.sin.sobre.también.me.mi.tu.te.si.nos.les.hay.cual.cuales.dime.busca.encuentra.saber.puedes.podrias.quiero.necesito".split(".");
		return e.toLowerCase().replace(/[¿?¡!,.;:]/g, "").split(/\s+/).filter((e) => e.length > 1 && !t.includes(e));
	}
	async handleSalesSummary(e) {
		let t = await this.dashboardService.getStats(), n = await this.dashboardService.getTopProducts(3), r = await this.dashboardService.getSalesByPaymentMethod();
		if (t.todaySalesCount === 0) return {
			type: "TEXT",
			content: `No hay ventas registradas hoy.

📊 Totales históricos — Ingresos: S/ ${t.totalRevenue.toFixed(2)} | Ventas: ${t.totalSales} | Ganancia: S/ ${t.totalProfit.toFixed(2)}`
		};
		let i = n.map((e, t) => `${t + 1}. ${e.product_name} (${e.total_quantity} uds)`).join("\n"), a = r.map((e) => `${e.payment_method === "CASH" ? "Efectivo" : "Tarjeta"}: S/ ${(e._sum.total ?? 0).toFixed(2)}`).join(" | ");
		return {
			type: "TEXT",
			content: `📊 **Resumen de ventas - Hoy**
• Ingresos: S/ ${t.todayRevenue.toFixed(2)}
• Transacciones: ${t.todaySalesCount}
• Ganancia: S/ ${t.todayProfit.toFixed(2)}
• Ticket promedio: S/ ${t.averageSale.toFixed(2)}

🥇 **Top 3 productos:**
${i}

💳 ${a}

📈 Totales históricos: S/ ${t.totalRevenue.toFixed(2)} en ${t.totalSales} ventas`
		};
	}
	async handleStockQuery(e) {
		let t = e.toLowerCase();
		if (/costoso|caro|precio.mas|mayor.precio|mas.caro/.test(t)) return this.handleMostExpensiveProduct();
		if (/barato|menor.precio|mas.barato|economico/.test(t)) return this.handleCheapestProduct();
		let n = t.match(/sku[\s]*[:]?[\s]*([\w-]+)/i);
		if (n) {
			let e = n[1].toUpperCase(), t = (await this.productService.getAllProducts()).find((t) => t.sku.toUpperCase() === e);
			return t ? {
				type: "TEXT",
				content: `**${t.name}** (SKU: ${t.sku})
• Precio venta: **S/ ${t.price_sale.toFixed(2)}**
• Precio compra: S/ ${t.price_purchase.toFixed(2)}
• Stock: ${t.stock} unidades
• Stock mínimo: ${t.min_stock ?? 5}
• Categoría: ${t.category?.name ?? "Sin categoría"}`
			} : {
				type: "TEXT",
				content: `No encontré ningún producto con el SKU "${e}".`
			};
		}
		let r = t.replace(/[¿?¡!.,;:]/g, "").trim(), i = /* @__PURE__ */ "cuanto.cuanta.cuantos.cuantas.hay.tengo.dime.busca.encuentra.saber.puedes.quiero.necesito.stock.inventario.producto.productos.precio.precios.cual.cuales.el.la.los.las.de.del.que.me.te.se.le.un.una.con.por.para.como.mas.pero.tiene.tienen.esta.este".split("."), a = r.split(/\s+/).filter((e) => e.length > 2 && !i.includes(e)).join(" "), o = await this.productService.getAllProducts(a || r), s = o.length > 0 ? o : a ? (await this.productService.getAllProducts()).filter((e) => e.name.toLowerCase().includes(a) || e.sku.toLowerCase().includes(a)) : [];
		return s.length === 0 ? {
			type: "TEXT",
			content: `No encontré productos que coincidan con "${a || r}".`
		} : {
			type: "TEXT",
			content: `Productos encontrados:\n${[...s].sort((e, t) => t.stock - e.stock).slice(0, 10).map((e) => `• ${e.name} — S/ ${e.price_sale.toFixed(2)} — Stock: ${e.stock}${e.stock <= (e.min_stock ?? 5) ? " ⚠️" : ""}`).join("\n")}`
		};
	}
	async handleMostExpensiveProduct() {
		let e = await this.productService.getAllProducts();
		if (e.length === 0) return {
			type: "TEXT",
			content: "No hay productos registrados en el inventario."
		};
		let t = [...e].sort((e, t) => t.price_sale - e.price_sale).slice(0, 5), n = t[0];
		return {
			type: "TEXT",
			content: `El producto más costoso del inventario es **${n.name}** (SKU: ${n.sku}) con un precio de venta de **S/ ${n.price_sale.toFixed(2)}** (precio de compra: S/ ${n.price_purchase.toFixed(2)}). Stock actual: ${n.stock} unidades.

Otros productos de alto valor:
${t.slice(1).map((e, t) => `${t + 2}. ${e.name} — S/ ${e.price_sale.toFixed(2)}`).join("\n")}`
		};
	}
	async handleCheapestProduct() {
		let e = await this.productService.getAllProducts();
		if (e.length === 0) return {
			type: "TEXT",
			content: "No hay productos registrados en el inventario."
		};
		let t = [...e].sort((e, t) => e.price_sale - t.price_sale).slice(0, 5), n = t[0];
		return {
			type: "TEXT",
			content: `El producto más económico del inventario es **${n.name}** (SKU: ${n.sku}) con un precio de venta de **S/ ${n.price_sale.toFixed(2)}**. Stock actual: ${n.stock} unidades.

Otros productos económicos:
${t.slice(1).map((e, t) => `${t + 2}. ${e.name} — S/ ${e.price_sale.toFixed(2)}`).join("\n")}`
		};
	}
	async handleProductCount() {
		let e = await this.productService.getAllProducts();
		return {
			type: "TEXT",
			content: `📦 **${e.length} productos** en total.\n• Con stock: ${e.filter((e) => e.stock > 0).length}\n• Stock bajo: ${e.filter((e) => e.stock <= (e.min_stock ?? 5)).length}`
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
			let { getContainer: e } = await Promise.resolve().then(() => H);
			return {
				type: "TEXT",
				content: `📂 **${(await e().categoryService.getAllCategories()).length} categorías** registradas.`
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
			let { getContainer: e } = await Promise.resolve().then(() => H);
			return {
				type: "TEXT",
				content: `🏢 **${(await e().supplierService.getAllSuppliers()).length} proveedores** registrados.`
			};
		} catch {
			return {
				type: "TEXT",
				content: "No se pudieron obtener los proveedores."
			};
		}
	}
	handleEntityCreation(e, t) {
		let n = e.toLowerCase(), r = (t?.entity_type || "").toLowerCase(), i = () => {
			let e = n.match(/(?:llamado|llamada|nombre)\s+["""]?([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*?)(?:["""]?\s+(?:con|de|y|precio|un|una)|["""]?\s*$|,|\.)/i)?.[1]?.trim();
			if (!e || e.length <= 1) return null;
			let t = n.match(/precio\s*(?:de\s*)?compra\s*(?:de\s*)?(?:S\/|s\/|\$)?\s*([0-9]+(?:\.[0-9]+)?)/i), r = n.match(/precio\s*(?:de\s*)?venta\s*(?:de\s*)?(?:S\/|s\/|\$)?\s*([0-9]+(?:\.[0-9]+)?)/i);
			return {
				type: "ACTION",
				action: "DRAFT_PRODUCT",
				payload: {
					name: e.charAt(0).toUpperCase() + e.slice(1),
					price_purchase: t ? parseFloat(t[1]) : 0,
					price_sale: r ? parseFloat(r[1]) : 0,
					stock: 0,
					min_stock: 5
				}
			};
		}, a = () => {
			let e = n.match(/\b(\d{6,11})\b/), t = n.match(/(?:llamado|llamada|nombre|cliente|persona)\s+["""]?([a-záéíóúñ]+(?:\s+[a-záéíóúñ]+)*?)(?:["""]?\s+(?:con|de|y|dni)|["""]?\s*$|,|\.)/i);
			return !t && !e ? null : {
				type: "ACTION",
				action: "DRAFT_CLIENT",
				payload: {
					name: t?.[1] ? t[1].charAt(0).toUpperCase() + t[1].slice(1) : "",
					dni: e?.[1] || "",
					phone: null
				}
			};
		};
		if (r.includes("cliente") || r === "client") {
			let e = a();
			if (e) return Promise.resolve(e);
		}
		if (r.includes("producto") || r === "product") {
			let e = i();
			if (e) return Promise.resolve(e);
		}
		if (/cliente|persona/.test(n) && !/precio\s*(?:de\s*)?(?:compra|venta)/.test(n)) {
			let e = a();
			if (e) return Promise.resolve(e);
		}
		if (!/cliente|persona/.test(n) || /precio|producto|sku/.test(n)) {
			let e = i();
			if (e) return Promise.resolve(e);
		}
		let o = a();
		return o ? Promise.resolve(o) : Promise.resolve({
			type: "TEXT",
			content: "No pude entender los datos para crear. Especifica nombre, precio de compra y precio de venta del producto, o nombre y DNI del cliente."
		});
	}
	async handleSaleDraft(e, t) {
		let n = typeof t?.producto == "string" ? t.producto.trim() : "", r = typeof t?.cliente == "string" ? t.cliente.trim() : "", i = typeof t?.cantidad == "number" ? t.cantidad : typeof t?.cantidad == "string" && parseInt(t.cantidad, 10) || 0;
		if (n || r) {
			let [e, t] = await Promise.all([r ? this.clientService.getAllClients(r) : Promise.resolve([]), n ? this.productService.getAllProducts(n) : Promise.resolve([])]);
			return e.length === 0 && t.length === 0 ? {
				type: "TEXT",
				content: r ? `No encontré "${r}" como cliente ni "${n}" como producto.` : `No encontré ningún producto llamado "${n}".`
			} : {
				type: "ACTION",
				action: "DRAFT_SALE",
				payload: {
					client_id: e.length > 0 ? e[0].id : null,
					client_name: e.length > 0 ? e[0].name : "",
					items: t.map((e) => ({
						product_id: e.id,
						product_name: e.name,
						quantity: i > 0 ? i : 1,
						unit_price: e.price_sale
					}))
				}
			};
		}
		let a = this.extractKeywords(e).join(" ");
		if (!a) return {
			type: "TEXT",
			content: "Especifica qué producto y/o cliente para armar el carrito. Ej: \"vende 2 cafes a juan perez\"."
		};
		let [o, s] = await Promise.all([this.clientService.getAllClients(a), this.productService.getAllProducts(a)]);
		return o.length === 0 && s.length === 0 ? {
			type: "TEXT",
			content: "No encontré clientes ni productos que coincidan con tu búsqueda."
		} : {
			type: "ACTION",
			action: "DRAFT_SALE",
			payload: {
				client_id: o.length > 0 ? o[0].id : null,
				client_name: o.length > 0 ? o[0].name : "",
				items: s.map((e) => ({
					product_id: e.id,
					product_name: e.name,
					quantity: 1,
					unit_price: e.price_sale
				}))
			}
		};
	}
	async handleGeneralQuery(e) {
		let t = e.toLowerCase();
		if (/a nombre de|comprador|cliente.*venta|quien.*compro|quien.*compró/.test(t)) {
			let e = await this.dashboardService.getLastSaleWithClient();
			return e?.client_name ? {
				type: "TEXT",
				content: `La última venta fue a nombre de **${e.client_name}**${e.client_dni ? ` (${e.client_dni})` : ""}.`
			} : (await this.dashboardService.getStats()).todaySalesCount > 0 ? {
				type: "TEXT",
				content: "La última venta del día no tiene cliente registrado (venta al mostrador)."
			} : {
				type: "TEXT",
				content: "No hay ventas registradas hoy."
			};
		}
		let n = await this.dashboardService.getStats(), r = await this.productService.getAllProducts(), i = r.length > 0 ? [...r].sort((e, t) => t.price_sale - e.price_sale)[0] : null, a = r.length > 0 ? [...r].sort((e, t) => e.price_sale - t.price_sale)[0] : null, o = [];
		return /producto|inventario/.test(t) && (o.push(`📦 **${r.length} productos** en inventario.`), i && o.push(`💰 Más costoso: **${i.name}** — S/ ${i.price_sale.toFixed(2)}`), a && o.push(`💵 Más barato: **${a.name}** — S/ ${a.price_sale.toFixed(2)}`)), (/venta|ganancia|ingreso/.test(t) || o.length === 0) && o.push(`📊 Hoy: S/ ${n.todayRevenue.toFixed(2)} ingresos, ${n.todaySalesCount} ventas, S/ ${n.todayProfit.toFixed(2)} ganancia.`), {
			type: "TEXT",
			content: o.join("\n")
		};
	}
};
//#endregion
//#region src/backend/di/container.ts
function at(e) {
	let t = new ie(e), n = new ae(e), r = new oe(e), i = new se(e), a = new ce(e), o = new le(e), s = new ue(e), c = new de(e), l = new fe(e), u = new pe(e), d = new me(e), f = new he(e), p = new ge(e), m = new $e(), h = new ye(), g = new be(), ee = new xe(), _ = new Qe(d, m), v = new Ne(t, l, u), y = new Pe(n, u), b = new Ie(i, u), x = new ze(s), te = new Ke(c, u), S = new Je(c), ne = new Le(a, u), C = new Re(o, a, t, u), w = new rt(f), T = new Fe(r, t, n, i, s, u, f, _), E = new Xe(h), D = new Ye(l, u), O = new et(g, ee, _, T, v, b, x);
	return {
		prisma: e,
		userRepo: c,
		productService: v,
		clientService: y,
		saleService: T,
		cashRegisterService: b,
		settingsService: x,
		userService: te,
		authService: S,
		supplierService: ne,
		purchaseService: C,
		categoryService: D,
		dashboardService: _,
		backupService: E,
		reportService: O,
		schedulerService: new nt(O, E),
		discountService: w,
		cacheService: m,
		movementRepo: p,
		aiService: new it(new Se(), _, v, y)
	};
}
//#endregion
//#region src/backend/di/registry.ts
var H = /* @__PURE__ */ T({
	getContainer: () => ot,
	setContainer: () => st
}), U = null;
function ot() {
	if (!U) throw Error("Container not initialized");
	return U;
}
function st(e) {
	U = e;
}
//#endregion
//#region src/backend/utils/ipcWrapper.ts
function ct(e) {
	return e instanceof ee ? {
		success: !1,
		message: "Error de validación: " + e.issues.map((e) => e.message).join(", "),
		errors: e.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
		code: "VALIDATION"
	} : e instanceof k ? {
		success: !1,
		message: e.message,
		code: e.code,
		errors: e instanceof j ? e.errors : void 0
	} : (E.error({ err: e }, "Unhandled IPC Error"), {
		success: !1,
		message: "Ocurrió un error inesperado en el sistema",
		code: "INTERNAL"
	});
}
function W(e, t = "Error interno") {
	return E.error({ err: e }, `[SafeHandler] Error: ${t}`), {
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
			return ct(e);
		}
	};
}
//#endregion
//#region src/backend/auth/session.ts
var K = null;
function lt(e) {
	K = e;
}
function q() {
	return K;
}
function ut() {
	K = null;
}
//#endregion
//#region src/backend/auth/authorize.ts
var J = class extends k {
	code = "UNAUTHORIZED";
	constructor() {
		super("No autenticado");
	}
}, Y = class extends k {
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
	return ot()[t];
} });
function dt() {
	r.handle("dialog:showConfirm", async (e, t) => (await n.showMessageBox({
		type: "question",
		buttons: ["Sí", "No"],
		defaultId: 0,
		cancelId: 1,
		title: t.title || "Confirmación",
		message: t.message
	})).response === 0), r.handle("health:check", async () => {
		try {
			return await Z.prisma.$queryRaw`SELECT 1`, {
				success: !0,
				database: "connected",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		} catch (e) {
			return E.error("[Health] Database check failed:", e), {
				success: !1,
				database: "disconnected",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		}
	}), r.handle("dashboard:getStats", async (e, t, n) => {
		try {
			return await Z.dashboardService.getStats(t, n);
		} catch (e) {
			return E.error("[Dashboard] getStats error:", e), W(e, "Error al obtener estadísticas del dashboard");
		}
	}), r.handle("dashboard:getWeeklySales", async (e, t) => {
		try {
			return await Z.dashboardService.getWeeklySales(t);
		} catch (e) {
			return E.error("[Dashboard] getWeeklySales error:", e), [];
		}
	}), r.handle("dashboard:getLowStock", async (e, t) => {
		try {
			return await Z.dashboardService.getLowStockProducts(t || 50);
		} catch (e) {
			return E.error("[Dashboard] getLowStock error:", e), [];
		}
	}), r.handle("dashboard:getSalesByPayment", async (e, t, n) => {
		try {
			return await Z.dashboardService.getSalesByPaymentMethod(t, n);
		} catch (e) {
			return E.error("[Dashboard] getSalesByPayment error:", e), [];
		}
	}), r.handle("dashboard:getTopProducts", async (e, t, n, r) => {
		try {
			return await Z.dashboardService.getTopProducts(t, n, r);
		} catch (e) {
			return E.error("[Dashboard] getTopProducts error:", e), [];
		}
	}), r.handle("dashboard:getTopClients", async (e, t, n, r) => {
		try {
			return await Z.dashboardService.getTopClients(t, n, r);
		} catch (e) {
			return E.error("[Dashboard] getTopClients error:", e), [];
		}
	}), r.handle("dashboard:getSalesByHour", async (e, t, n) => {
		try {
			return await Z.dashboardService.getSalesByHour(t, n);
		} catch (e) {
			return E.error("[Dashboard] getSalesByHour error:", e), [];
		}
	}), r.handle("dashboard:getCashSummary", async (e, t, n) => {
		try {
			return await Z.dashboardService.getCashRegisterSummary(t, n);
		} catch (e) {
			return E.error("[Dashboard] getCashSummary error:", e), W(e, "Error al obtener resumen de caja");
		}
	}), r.handle("dashboard:getInventoryMetrics", async () => {
		try {
			return await Z.dashboardService.getInventoryMetrics();
		} catch (e) {
			return E.error("[Dashboard] getInventoryMetrics error:", e), W(e, "Error al obtener métricas de inventario");
		}
	}), r.handle("dashboard:invalidateCache", async () => {
		try {
			return Z.dashboardService.invalidateCache(), { success: !0 };
		} catch (e) {
			return E.error("[Dashboard] invalidateCache error:", e), W(e, "Error al limpiar caché");
		}
	}), r.handle("settings:getAll", async () => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.settingsService.getSettings();
		} catch (e) {
			return E.error("[Settings] getAll error:", e), W(e, "Error al obtener configuración");
		}
	}), r.handle("settings:update", async (e, t) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			let n = Me.safeParse(t);
			return n.success ? (await Z.settingsService.updateSettings(n.data), E.info("Settings saved successfully"), { success: !0 }) : {
				success: !1,
				message: "Error de validación: " + n.error.issues.map((e) => e.message).join(", ")
			};
		} catch (e) {
			return E.error({
				err: e,
				settings: Object.keys(t)
			}, "[Settings] update error"), W(e, "Error al guardar configuración");
		}
	}), r.handle("cash:getOpen", async () => {
		try {
			return await Z.cashRegisterService.getOpenRegister();
		} catch {
			return null;
		}
	}), r.handle("cash:getAll", async (e, t, n) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.cashRegisterService.getAllRegisters(t, n);
		} catch (e) {
			return E.error("[Cash] getAll error:", e), W(e, "Error al obtener cajas");
		}
	}), r.handle("cash:getDetails", async (e, t) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.cashRegisterService.getRegisterDetails(t);
		} catch (e) {
			return E.error("[Cash] getDetails error:", e), W(e, "Error al obtener detalles de caja");
		}
	}), r.handle("cash:getDailySummary", async (e, t) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.cashRegisterService.getDailySummary(t);
		} catch (e) {
			return E.error("[Cash] getDailySummary error:", e), W(e, "Error al obtener resumen del día");
		}
	}), r.handle("cash:open", G(X("ADMIN")((e, t) => Z.cashRegisterService.openRegister(e, t)))), r.handle("cash:close", G(X("ADMIN")((e, t, n) => Z.cashRegisterService.closeRegister(e, t, n)))), r.handle("auth:login", async (e, t, n) => {
		try {
			let e = await Z.authService.login(t, n);
			return e.success && e.user && lt({
				id: e.user.id,
				username: e.user.username,
				role: e.user.role
			}), e;
		} catch (e) {
			return E.error("[Auth] Login error:", e), W(e, "Error de autenticación");
		}
	}), r.handle("auth:logout", async () => (ut(), { success: !0 })), r.handle("auth:checkSession", async () => {
		let e = q();
		return {
			authenticated: !!e,
			user: e
		};
	}), r.handle("auth:getSecurityQuestion", async (e, t) => {
		try {
			return await Z.authService.getSecurityQuestion(t);
		} catch (e) {
			return W(e, "Error al obtener pregunta de seguridad");
		}
	}), r.handle("auth:verifySecurityAnswer", async (e, t, n) => {
		try {
			return await Z.authService.verifySecurityAnswer(t, n);
		} catch (e) {
			return W(e, "Error al verificar respuesta");
		}
	}), r.handle("auth:resetPassword", async (e, t, n) => {
		try {
			return await Z.authService.resetPassword(t, n);
		} catch (e) {
			return W(e, "Error al restablecer contraseña");
		}
	}), r.handle("auth:setSecurityQuestion", G(X("ADMIN")(async (e, t, n, r) => await Z.authService.setSecurityQuestion(t, n, r)))), r.handle("setup:status", async () => {
		try {
			return { needsSetup: await Z.userRepo.count() === 0 };
		} catch (e) {
			return E.error("[Setup] Status error:", e), { needsSetup: !0 };
		}
	}), r.handle("setup:complete", async (e, t) => {
		try {
			let e = await Z.authService.register({
				username: t.user.username,
				password: t.user.password,
				role: "ADMIN",
				password_hash: "",
				security_question: t.user.security_question,
				security_answer: t.user.security_answer
			}), n;
			if (e.success && e.user) n = e.user, E.info({ userId: n.id }, "User created during setup");
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
				}, E.info({ userId: n.id }, "User already exists, reusing");
			} else return {
				success: !1,
				message: e.error || "Error al crear el usuario"
			};
			lt({
				id: n.id,
				username: n.username,
				role: n.role
			});
			try {
				await Z.settingsService.updateSettings(t.settings), E.info({ settings: Object.keys(t.settings) }, "Settings saved during setup");
			} catch (e) {
				return E.error({
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
			return E.error({ err: e }, "[Setup] Complete error"), W(e, "Error durante la configuración inicial");
		}
	}), r.handle("clients:getAll", async (e, t) => {
		try {
			return await Z.clientService.getAllClients(t);
		} catch (e) {
			return E.error("[Clients] getAll error:", e), W(e, "Error al obtener clientes");
		}
	}), r.handle("clients:getById", async (e, t) => {
		try {
			return await Z.clientService.getClientById(t);
		} catch (e) {
			return E.error("[Clients] getById error:", e), W(e, "Error al obtener cliente");
		}
	}), r.handle("clients:create", G((e, t) => Z.clientService.createClient(e, t), R)), r.handle("clients:update", G((e, t, n) => Z.clientService.updateClient(e, t, n))), r.handle("clients:delete", async (e, t, n) => {
		try {
			return await Z.clientService.deleteClient(t, n);
		} catch (e) {
			return E.error("[Clients] delete error:", e), W(e, "Error al eliminar cliente");
		}
	}), r.handle("products:getAll", async (e, t, n) => {
		try {
			return await Z.productService.getAllProducts(t, n);
		} catch (e) {
			return E.error("[Products] getAll error:", e), W(e, "Error al obtener productos");
		}
	}), r.handle("products:getById", async (e, t) => {
		try {
			return await Z.productService.getProductById(t);
		} catch (e) {
			return E.error("[Products] getById error:", e), W(e, "Error al obtener producto");
		}
	}), r.handle("products:getLowStock", async () => {
		try {
			return await Z.dashboardService.getLowStockProducts(50);
		} catch (e) {
			return E.error("Get low stock products error:", e), [];
		}
	}), r.handle("products:create", G((e, t) => Z.productService.createProduct(e, t), L)), r.handle("products:update", G((e, t, n) => Z.productService.updateProduct(e, t, n))), r.handle("products:delete", async (e, t, n) => {
		try {
			return await Z.productService.deleteProduct(t, n);
		} catch (e) {
			return E.error("[Products] delete error:", e), W(e, "Error al eliminar producto");
		}
	}), r.handle("products:addStock", async (e, t, n, r, i) => {
		try {
			return await Z.productService.addStock(t, n, r, i);
		} catch (e) {
			return E.error("[Products] addStock error:", e), W(e, "Error al añadir stock");
		}
	}), r.handle("products:removeStock", async (e, t, n, r, i) => {
		try {
			return await Z.productService.removeStock(t, n, r, i);
		} catch (e) {
			return E.error("[Products] removeStock error:", e), W(e, "Error al reducir stock");
		}
	}), r.handle("products:getMovements", async (e, t, n) => {
		try {
			return await Z.productService.getInventoryMovements(t, n);
		} catch (e) {
			return E.error("[Products] getMovements error:", e), W(e, "Error al obtener movimientos");
		}
	}), r.handle("discounts:getAll", async (e, t) => {
		try {
			if (!q()) throw new J();
			return await Z.discountService.getAllDiscounts(t);
		} catch (e) {
			return E.error("[Discounts] getAll error:", e), W(e, "Error al obtener descuentos");
		}
	}), r.handle("discounts:getById", async (e, t) => {
		try {
			if (!q()) throw new J();
			return await Z.discountService.getDiscountById(t);
		} catch (e) {
			return E.error("[Discounts] getById error:", e), W(e, "Error al obtener descuento");
		}
	}), r.handle("discounts:create", G(X("ADMIN")(async (e) => {
		let t = Ae.parse(e);
		return await Z.discountService.createDiscount(t);
	}))), r.handle("discounts:update", G(X("ADMIN")(async (e, t) => {
		let n = Ae.partial().parse(t);
		return await Z.discountService.updateDiscount(e, n);
	}))), r.handle("discounts:delete", G(X("ADMIN")(async (e) => await Z.discountService.deleteDiscount(e)))), r.handle("discounts:getApplicable", async (e, t, n) => {
		try {
			if (!q()) throw new J();
			return await Z.discountService.getApplicableDiscounts(t, n);
		} catch (e) {
			return E.error("[Discounts] getApplicable error:", e), [];
		}
	}), r.handle("sales:getAll", async (e, t, n, r, i, a, o) => {
		try {
			return await Z.saleService.getAllSales(t, n, r, i, a, o);
		} catch (e) {
			return E.error("[Sales] getAll error:", e), W(e, "Error al obtener ventas");
		}
	}), r.handle("sales:getToday", async () => {
		try {
			return await Z.saleService.getTodaySales();
		} catch (e) {
			return E.error("[Sales] getToday error:", e), W(e, "Error al obtener ventas del día");
		}
	}), r.handle("sales:getLast", async () => {
		try {
			return await Z.saleService.getLastSale();
		} catch (e) {
			return E.error("[Sales] getLast error:", e), null;
		}
	}), r.handle("sales:getStats", async (e, t, n) => {
		try {
			return await Z.saleService.getSalesStats(t, n);
		} catch (e) {
			return E.error("[Sales] getStats error:", e), W(e, "Error al obtener estadísticas");
		}
	}), r.handle("sales:getDetails", async (e, t) => {
		try {
			return await Z.saleService.getSaleDetails(t);
		} catch (e) {
			return E.error("[Sales] getDetails error:", e), W(e, "Error al obtener detalles de venta");
		}
	}), r.handle("sales:register", G(async (e, t, n) => Z.saleService.registerSale(e, t, n), we.omit({ items: !0 }))), r.handle("sales:cancel", async (e, t, n) => {
		try {
			return await Z.saleService.cancelSale(t, n);
		} catch (e) {
			return E.error("[Sales] cancel error:", e), W(e, "Error al cancelar venta");
		}
	}), r.handle("categories:getAll", async (e, t) => await Z.categoryService.getAllCategories(t)), r.handle("categories:getById", async (e, t) => {
		try {
			return await Z.categoryService.getCategoryById(t);
		} catch (e) {
			return E.error("[Categories] getById error:", e), W(e, "Error al obtener categoría");
		}
	}), r.handle("categories:create", G(X("ADMIN")(async (e, t) => await Z.categoryService.createCategory(e, t)), Te)), r.handle("categories:update", G(X("ADMIN")(async (e, t, n) => {
		let r = Te.parse(t);
		return await Z.categoryService.updateCategory(e, r, n);
	}))), r.handle("categories:delete", G(X("ADMIN")(async (e, t) => await Z.categoryService.deleteCategory(e, t)))), r.handle("users:getAll", async () => {
		try {
			return await X("ADMIN")(async () => await Z.userService.getAllUsers())();
		} catch (e) {
			return E.error("[Users] getAll error:", e), W(e, "Error al obtener usuarios");
		}
	}), r.handle("users:getById", async (e, t) => {
		try {
			return await X("ADMIN")(async () => await Z.userService.getUserById(t))();
		} catch (e) {
			return E.error("[Users] getById error:", e), W(e, "Error al obtener usuario");
		}
	}), r.handle("users:create", G(X("ADMIN")((e, t) => Z.userService.createUser(e, t)), ke)), r.handle("users:update", G(X("ADMIN")(async (e, t, n) => {
		let r = ke.partial().parse(t);
		return await Z.userService.updateUser(e, r, n);
	}))), r.handle("users:delete", G(X("ADMIN")((e, t) => Z.userService.deleteUser(e, t)))), r.handle("users:changePassword", G(X("ADMIN")((e, t, n) => Z.userService.changePassword(e, t, n)))), r.handle("movements:getAll", async (e, t, n, r, i, a, o, s) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.movementRepo.findAll({
				page: t,
				pageSize: n,
				productId: r,
				type: i,
				reason: a,
				startDate: o,
				endDate: s
			});
		} catch {
			return [];
		}
	}), r.handle("suppliers:getAll", async (e, t) => {
		try {
			return await Z.supplierService.getAllSuppliers(t);
		} catch {
			return [];
		}
	}), r.handle("suppliers:getById", async (e, t) => {
		try {
			return await Z.supplierService.getSupplierById(t);
		} catch {
			return null;
		}
	}), r.handle("suppliers:create", G(X("ADMIN")((e, t) => Z.supplierService.createSupplier(e, t)), Ee)), r.handle("suppliers:update", G(X("ADMIN")(async (e, t, n) => {
		let r = Ee.partial().parse(t);
		return await Z.supplierService.updateSupplier(e, r, n);
	}))), r.handle("suppliers:delete", G(X("ADMIN")((e, t) => Z.supplierService.deleteSupplier(e, t)))), r.handle("purchases:getAll", async (e, t, n) => {
		try {
			return await Z.purchaseService.getAllPurchases(t, n);
		} catch {
			return [];
		}
	}), r.handle("purchases:getById", async (e, t) => {
		try {
			return await Z.purchaseService.getPurchaseById(t);
		} catch {
			return null;
		}
	}), r.handle("purchases:create", G(X("ADMIN")((e, t) => Z.purchaseService.createPurchase(e, t)), Oe)), r.handle("purchases:receive", G(X("ADMIN")((e, t) => Z.purchaseService.receivePurchase(e, t)))), r.handle("purchases:cancel", G(X("ADMIN")((e, t) => Z.purchaseService.cancelPurchase(e, t)))), r.handle("purchases:updatePaymentStatus", G(X("ADMIN")((e, t) => Z.purchaseService.updatePaymentStatus(e, t)))), r.handle("backup:create", G(X("ADMIN")((e) => Z.backupService.createBackup(e)))), r.handle("backup:list", async () => {
		try {
			return await Z.backupService.listBackups();
		} catch (e) {
			return E.error("[IPC] Error listing backups:", e), [];
		}
	}), r.handle("backup:restore", G(X("ADMIN")((e) => Z.backupService.restoreBackup(e)))), r.handle("backup:delete", G(X("ADMIN")((e) => Z.backupService.deleteBackup(e)))), r.handle("settings:getTax", async () => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.settingsService.getTaxSettings();
		} catch (e) {
			return E.error("[Settings] getTax error:", e), W(e, "Error al obtener configuración de impuestos");
		}
	}), r.handle("settings:updateTax", async (e, t, n, r) => {
		try {
			let e = q();
			if (!e) throw new J();
			if (e.role !== "ADMIN") throw new Y(["ADMIN"]);
			return await Z.settingsService.updateTaxSettings(t, n, r);
		} catch (e) {
			return E.error({ err: e }, "[Settings] updateTax error"), W(e, "Error al guardar configuración de impuestos");
		}
	}), r.handle("reports:generate", G(X("ADMIN")(async (e) => {
		let t = e.startDate ? new Date(e.startDate) : void 0, r;
		e.endDate ? (r = new Date(e.endDate), r.setHours(23, 59, 59, 999)) : t && (r = new Date(t), r.setHours(23, 59, 59, 999));
		let i = {
			...e,
			startDate: t,
			endDate: r
		}, a = await Z.reportService.generateReport(i), o = i.format === "pdf" ? "pdf" : "xlsx", { filePath: s, canceled: c } = await n.showSaveDialog({
			defaultPath: `${i.type}-${Date.now()}.${o}`,
			filters: i.format === "pdf" ? [{
				name: "PDF",
				extensions: ["pdf"]
			}] : [{
				name: "Excel",
				extensions: ["xlsx"]
			}]
		});
		return c || !s ? {
			success: !1,
			message: "Cancelado por el usuario"
		} : (await C.writeFile(s, a), {
			success: !0,
			path: s
		});
	}))), r.handle("reports:generateReceipt", G(X("ADMIN")(async (e) => {
		let t = {
			type: "sale_receipt",
			format: "pdf",
			saleId: e
		}, r = await Z.reportService.generateReport(t), { filePath: i, canceled: a } = await n.showSaveDialog({
			defaultPath: `comprobante-${e}-${Date.now()}.pdf`,
			filters: [{
				name: "PDF",
				extensions: ["pdf"]
			}]
		});
		return a || !i ? {
			success: !1,
			message: "Cancelado por el usuario"
		} : (await C.writeFile(i, r), {
			success: !0,
			path: i
		});
	}))), r.handle("reports:generateCashClose", G(X("ADMIN")(async (e) => {
		let t = {
			type: "cash_close",
			format: "pdf",
			registerId: e
		}, r = await Z.reportService.generateReport(t), { filePath: i, canceled: a } = await n.showSaveDialog({
			defaultPath: `cierre-caja-${e}-${Date.now()}.pdf`,
			filters: [{
				name: "PDF",
				extensions: ["pdf"]
			}]
		});
		return a || !i ? {
			success: !1,
			message: "Cancelado por el usuario"
		} : (await C.writeFile(i, r), {
			success: !0,
			path: i
		});
	}))), r.handle("ai:chat", G(async (e) => await Z.aiService.askAssistant(e.query), je));
}
//#endregion
//#region src/backend/utils/generatedSchema.ts
var ft = "-- CreateTable\nCREATE TABLE \"users\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"username\" TEXT NOT NULL,\n    \"password_hash\" TEXT NOT NULL,\n    \"role\" TEXT NOT NULL,\n    \"security_question\" TEXT,\n    \"security_answer_hash\" TEXT,\n    \"failed_attempts\" INTEGER NOT NULL DEFAULT 0,\n    \"locked_until\" DATETIME,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL\n);\n\n-- CreateTable\nCREATE TABLE \"clients\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"dni\" TEXT NOT NULL,\n    \"name\" TEXT NOT NULL,\n    \"phone\" TEXT,\n    \"code\" TEXT NOT NULL,\n    \"tax_id\" TEXT,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL\n);\n\n-- CreateTable\nCREATE TABLE \"categories\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"name\" TEXT NOT NULL,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL\n);\n\n-- CreateTable\nCREATE TABLE \"products\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"sku\" TEXT NOT NULL,\n    \"name\" TEXT NOT NULL,\n    \"description\" TEXT,\n    \"category_id\" INTEGER,\n    \"price_purchase\" REAL NOT NULL,\n    \"price_sale\" REAL NOT NULL,\n    \"stock\" INTEGER NOT NULL DEFAULT 0,\n    \"min_stock\" INTEGER DEFAULT 5,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL,\n    \"supplier_id\" INTEGER,\n    CONSTRAINT \"products_category_id_fkey\" FOREIGN KEY (\"category_id\") REFERENCES \"categories\" (\"id\") ON DELETE SET NULL ON UPDATE CASCADE,\n    CONSTRAINT \"products_supplier_id_fkey\" FOREIGN KEY (\"supplier_id\") REFERENCES \"suppliers\" (\"id\") ON DELETE SET NULL ON UPDATE CASCADE\n);\n\n-- CreateTable\nCREATE TABLE \"cash_registers\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"opened_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"opening_amount\" REAL NOT NULL,\n    \"total_sales\" REAL NOT NULL DEFAULT 0,\n    \"closed_at\" DATETIME,\n    \"closing_amount\" REAL,\n    \"difference\" REAL,\n    \"status\" TEXT,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL\n);\n\n-- CreateTable\nCREATE TABLE \"sales\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"cash_register_id\" INTEGER NOT NULL,\n    \"client_id\" INTEGER NOT NULL,\n    \"total\" REAL NOT NULL,\n    \"subtotal\" REAL NOT NULL DEFAULT 0,\n    \"tax_amount\" REAL NOT NULL DEFAULT 0,\n    \"discount_total\" REAL DEFAULT 0,\n    \"payment_method\" TEXT DEFAULT 'CASH',\n    \"exchange_rate\" REAL NOT NULL DEFAULT 0,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL,\n    CONSTRAINT \"sales_cash_register_id_fkey\" FOREIGN KEY (\"cash_register_id\") REFERENCES \"cash_registers\" (\"id\") ON DELETE RESTRICT ON UPDATE CASCADE,\n    CONSTRAINT \"sales_client_id_fkey\" FOREIGN KEY (\"client_id\") REFERENCES \"clients\" (\"id\") ON DELETE RESTRICT ON UPDATE CASCADE\n);\n\n-- CreateTable\nCREATE TABLE \"sale_items\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"sale_id\" INTEGER NOT NULL,\n    \"product_id\" INTEGER NOT NULL,\n    \"quantity\" INTEGER NOT NULL,\n    \"unit_price\" REAL NOT NULL,\n    \"purchase_price\" REAL NOT NULL,\n    \"discount_name\" TEXT,\n    \"discount_type\" TEXT,\n    \"discount_value\" REAL,\n    \"discount_amount\" REAL DEFAULT 0,\n    \"final_unit_price\" REAL,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL,\n    CONSTRAINT \"sale_items_sale_id_fkey\" FOREIGN KEY (\"sale_id\") REFERENCES \"sales\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE,\n    CONSTRAINT \"sale_items_product_id_fkey\" FOREIGN KEY (\"product_id\") REFERENCES \"products\" (\"id\") ON DELETE RESTRICT ON UPDATE CASCADE\n);\n\n-- CreateTable\nCREATE TABLE \"inventory_movements\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"product_id\" INTEGER NOT NULL,\n    \"type\" TEXT NOT NULL,\n    \"quantity\" INTEGER NOT NULL,\n    \"reason\" TEXT,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL,\n    CONSTRAINT \"inventory_movements_product_id_fkey\" FOREIGN KEY (\"product_id\") REFERENCES \"products\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE\n);\n\n-- CreateTable\nCREATE TABLE \"suppliers\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"name\" TEXT NOT NULL,\n    \"ruc\" TEXT,\n    \"phone\" TEXT,\n    \"email\" TEXT,\n    \"address\" TEXT,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL\n);\n\n-- CreateTable\nCREATE TABLE \"purchases\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"supplier_id\" INTEGER NOT NULL,\n    \"total_amount\" REAL NOT NULL,\n    \"status\" TEXT NOT NULL DEFAULT 'PENDING',\n    \"payment_status\" TEXT NOT NULL DEFAULT 'UNPAID',\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL,\n    CONSTRAINT \"purchases_supplier_id_fkey\" FOREIGN KEY (\"supplier_id\") REFERENCES \"suppliers\" (\"id\") ON DELETE RESTRICT ON UPDATE CASCADE\n);\n\n-- CreateTable\nCREATE TABLE \"purchase_items\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"purchase_id\" INTEGER NOT NULL,\n    \"product_id\" INTEGER NOT NULL,\n    \"quantity\" INTEGER NOT NULL,\n    \"unit_cost\" REAL NOT NULL,\n    CONSTRAINT \"purchase_items_purchase_id_fkey\" FOREIGN KEY (\"purchase_id\") REFERENCES \"purchases\" (\"id\") ON DELETE RESTRICT ON UPDATE CASCADE,\n    CONSTRAINT \"purchase_items_product_id_fkey\" FOREIGN KEY (\"product_id\") REFERENCES \"products\" (\"id\") ON DELETE RESTRICT ON UPDATE CASCADE\n);\n\n-- CreateTable\nCREATE TABLE \"audit_logs\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"user_id\" INTEGER NOT NULL,\n    \"action\" TEXT NOT NULL,\n    \"entity\" TEXT NOT NULL,\n    \"entity_id\" INTEGER NOT NULL,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL,\n    CONSTRAINT \"audit_logs_user_id_fkey\" FOREIGN KEY (\"user_id\") REFERENCES \"users\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE\n);\n\n-- CreateTable\nCREATE TABLE \"settings\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"key\" TEXT NOT NULL,\n    \"value\" TEXT NOT NULL\n);\n\n-- CreateTable\nCREATE TABLE \"discounts\" (\n    \"id\" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,\n    \"name\" TEXT NOT NULL,\n    \"type\" TEXT NOT NULL,\n    \"value\" REAL NOT NULL,\n    \"is_active\" BOOLEAN NOT NULL DEFAULT true,\n    \"applicable_to\" TEXT NOT NULL DEFAULT 'ALL',\n    \"category_id\" INTEGER,\n    \"min_purchase_amount\" REAL,\n    \"created_at\" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updated_at\" DATETIME NOT NULL,\n    CONSTRAINT \"discounts_category_id_fkey\" FOREIGN KEY (\"category_id\") REFERENCES \"categories\" (\"id\") ON DELETE SET NULL ON UPDATE CASCADE\n);\n\n-- CreateTable\nCREATE TABLE \"product_discounts\" (\n    \"product_id\" INTEGER NOT NULL,\n    \"discount_id\" INTEGER NOT NULL,\n\n    PRIMARY KEY (\"product_id\", \"discount_id\"),\n    CONSTRAINT \"product_discounts_product_id_fkey\" FOREIGN KEY (\"product_id\") REFERENCES \"products\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE,\n    CONSTRAINT \"product_discounts_discount_id_fkey\" FOREIGN KEY (\"discount_id\") REFERENCES \"discounts\" (\"id\") ON DELETE CASCADE ON UPDATE CASCADE\n);\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"users_username_key\" ON \"users\"(\"username\");\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"clients_dni_key\" ON \"clients\"(\"dni\");\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"clients_code_key\" ON \"clients\"(\"code\");\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"clients_tax_id_key\" ON \"clients\"(\"tax_id\");\n\n-- CreateIndex\nCREATE INDEX \"clients_name_idx\" ON \"clients\"(\"name\");\n\n-- CreateIndex\nCREATE INDEX \"clients_dni_idx\" ON \"clients\"(\"dni\");\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"products_sku_key\" ON \"products\"(\"sku\");\n\n-- CreateIndex\nCREATE INDEX \"products_category_id_idx\" ON \"products\"(\"category_id\");\n\n-- CreateIndex\nCREATE INDEX \"products_stock_min_stock_idx\" ON \"products\"(\"stock\", \"min_stock\");\n\n-- CreateIndex\nCREATE INDEX \"products_name_idx\" ON \"products\"(\"name\");\n\n-- CreateIndex\nCREATE INDEX \"products_sku_idx\" ON \"products\"(\"sku\");\n\n-- CreateIndex\nCREATE INDEX \"products_supplier_id_idx\" ON \"products\"(\"supplier_id\");\n\n-- CreateIndex\nCREATE INDEX \"sales_cash_register_id_idx\" ON \"sales\"(\"cash_register_id\");\n\n-- CreateIndex\nCREATE INDEX \"sales_client_id_idx\" ON \"sales\"(\"client_id\");\n\n-- CreateIndex\nCREATE INDEX \"sales_created_at_idx\" ON \"sales\"(\"created_at\");\n\n-- CreateIndex\nCREATE INDEX \"sales_cash_register_id_created_at_idx\" ON \"sales\"(\"cash_register_id\", \"created_at\");\n\n-- CreateIndex\nCREATE INDEX \"sales_client_id_created_at_idx\" ON \"sales\"(\"client_id\", \"created_at\");\n\n-- CreateIndex\nCREATE INDEX \"sales_payment_method_idx\" ON \"sales\"(\"payment_method\");\n\n-- CreateIndex\nCREATE INDEX \"sale_items_sale_id_idx\" ON \"sale_items\"(\"sale_id\");\n\n-- CreateIndex\nCREATE INDEX \"sale_items_product_id_idx\" ON \"sale_items\"(\"product_id\");\n\n-- CreateIndex\nCREATE INDEX \"inventory_movements_product_id_idx\" ON \"inventory_movements\"(\"product_id\");\n\n-- CreateIndex\nCREATE INDEX \"inventory_movements_type_idx\" ON \"inventory_movements\"(\"type\");\n\n-- CreateIndex\nCREATE INDEX \"inventory_movements_product_id_created_at_idx\" ON \"inventory_movements\"(\"product_id\", \"created_at\");\n\n-- CreateIndex\nCREATE INDEX \"inventory_movements_product_id_type_idx\" ON \"inventory_movements\"(\"product_id\", \"type\");\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"suppliers_ruc_key\" ON \"suppliers\"(\"ruc\");\n\n-- CreateIndex\nCREATE INDEX \"purchases_supplier_id_idx\" ON \"purchases\"(\"supplier_id\");\n\n-- CreateIndex\nCREATE INDEX \"purchases_status_idx\" ON \"purchases\"(\"status\");\n\n-- CreateIndex\nCREATE INDEX \"purchases_created_at_idx\" ON \"purchases\"(\"created_at\");\n\n-- CreateIndex\nCREATE INDEX \"purchase_items_purchase_id_idx\" ON \"purchase_items\"(\"purchase_id\");\n\n-- CreateIndex\nCREATE INDEX \"purchase_items_product_id_idx\" ON \"purchase_items\"(\"product_id\");\n\n-- CreateIndex\nCREATE INDEX \"audit_logs_user_id_idx\" ON \"audit_logs\"(\"user_id\");\n\n-- CreateIndex\nCREATE INDEX \"audit_logs_entity_idx\" ON \"audit_logs\"(\"entity\");\n\n-- CreateIndex\nCREATE INDEX \"audit_logs_created_at_idx\" ON \"audit_logs\"(\"created_at\");\n\n-- CreateIndex\nCREATE UNIQUE INDEX \"settings_key_key\" ON \"settings\"(\"key\");\n";
//#endregion
//#region src/backend/utils/migrationRunner.ts
function pt(e) {
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
async function mt(e) {
	try {
		let t = await e.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
		return Array.isArray(t) && t.length > 0;
	} catch {
		return !1;
	}
}
async function ht(e) {
	if (await mt(e)) return E.info("Database already initialized, skipping."), { applied: !1 };
	E.info("Loading embedded schema");
	let t = pt(ft);
	E.info(`Found ${t.length} SQL statements to execute`);
	for (let n = 0; n < t.length; n++) {
		let r = t[n];
		try {
			await e.$executeRawUnsafe(r);
		} catch (e) {
			if (e.message && e.message.includes("already exists")) {
				E.info(`Skipping statement ${n + 1} (already exists): ${r.slice(0, 60)}...`);
				continue;
			}
			let t = `Migration failed at statement ${n + 1}: ${e.message || e}`;
			return E.error(t), E.error(`SQL: ${r.slice(0, 200)}`), {
				applied: !1,
				error: t
			};
		}
	}
	E.info("Schema applied successfully!");
	try {
		await e.$disconnect(), await e.$connect(), E.info("Prisma connection refreshed");
	} catch (e) {
		return E.error({ err: e }, "Failed to refresh Prisma connection"), {
			applied: !0,
			error: "Migrations applied but failed to refresh connection"
		};
	}
	return { applied: !0 };
}
//#endregion
//#region src/backend/index.ts
var { PrismaClient: gt } = c;
O();
var Q = at(new gt({ adapter: new l({ url: process.env.DATABASE_URL }) }));
st(Q);
var _t = a.dirname(ne(import.meta.url));
process.env.DIST = a.join(_t, "../dist"), process.env.VITE_PUBLIC = t.isPackaged ? process.env.DIST : a.join(process.env.DIST, "../public");
var $ = null, vt = process.env.VITE_DEV_SERVER_URL;
async function yt() {
	$ = new e({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		icon: a.join(process.env.VITE_PUBLIC, "favicon.ico"),
		webPreferences: {
			preload: a.join(_t, "index.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		},
		autoHideMenuBar: !0
	}), t.isPackaged && i.defaultSession.webRequest.onHeadersReceived((e, t) => {
		t({ responseHeaders: {
			...e.responseHeaders,
			"Content-Security-Policy": ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'"]
		} });
	}), vt ? ($.loadURL(vt), $.webContents.openDevTools()) : $.loadFile(a.join(process.env.DIST, "index.html")), $.on("blur", () => {
		setTimeout(() => {
			if ($ && !$.isDestroyed() && !$.isFocused()) {
				let t = e.getFocusedWindow();
				(!t || t === $) && $.focus();
			}
		}, 100);
	}), $.on("focus", () => {
		$ && $.webContents && $.webContents.focus();
	}), $.on("closed", () => {
		$ = null;
	});
}
r.handle("window:focus", () => $ && !$.isDestroyed() ? ($.focus(), $.webContents.focus(), !0) : !1), r.handle("window:is-ready", () => $ && !$.isDestroyed()), r.handle("dialog:showMessageBox", (t, r) => {
	let i = e.getFocusedWindow() || $;
	return n.showMessageBox(i, r);
}), r.handle("dialog:showOpenDialog", (t, r) => {
	let i = e.getFocusedWindow() || $;
	return n.showOpenDialog(i, r);
}), r.handle("dialog:showSaveDialog", (t, r) => {
	let i = e.getFocusedWindow() || $;
	return n.showSaveDialog(i, r);
}), t.on("window-all-closed", () => {
	process.platform !== "darwin" && (t.quit(), $ = null);
}), t.whenReady().then(async () => {
	let r = !1;
	try {
		await Q.prisma.$connect(), await Q.prisma.$queryRaw`PRAGMA journal_mode=WAL`, await Q.prisma.$queryRaw`PRAGMA synchronous=NORMAL`, await Q.prisma.$queryRaw`PRAGMA cache_size=10000`, await Q.prisma.$queryRaw`PRAGMA temp_store=MEMORY`, E.info("Prisma connected to SQLite successfully"), r = !0;
	} catch (e) {
		let r = [
			`Error: ${e.message || String(e)}`,
			e.code ? `Code: ${e.code}` : "",
			`DATABASE_URL: ${process.env.DATABASE_URL || "(not set)"}`,
			`resourcesPath: ${process.resourcesPath || "(not set)"}`,
			`appPath: ${t.getAppPath()}`
		].filter(Boolean).join("\n");
		E.error({ err: e }, `Failed to connect to SQLite:\n${r}`);
		try {
			await n.showMessageBox({
				type: "error",
				title: "Error de Base de Datos",
				message: "No se pudo conectar a la base de datos SQLite.",
				detail: "Revisa que la instalación sea correcta o contacta al administrador.\n\nSi el problema persiste, revisa los logs de la aplicación."
			});
		} catch {}
	}
	if (r) {
		let e = await ht(Q.prisma);
		if (e.error) {
			E.error({ err: e.error }, "Migration error");
			try {
				await n.showMessageBox({
					type: "error",
					title: "Error de Migración",
					message: "No se pudieron aplicar las migraciones de la base de datos.",
					detail: e.error
				});
			} catch {}
		}
	}
	dt(), Q.schedulerService.start(), yt(), t.on("activate", () => {
		e.getAllWindows().length === 0 && yt();
	});
});
//#endregion
