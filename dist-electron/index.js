import { a as e, i as t, n, r, t as i } from "./errors-CBdiC9hv.js";
import "dotenv/config";
import { BrowserWindow as a, app as o, dialog as s, ipcMain as c } from "electron";
import l from "path";
import u from "fs";
import { fileURLToPath as d } from "url";
import { createRequire as f } from "module";
import p from "@prisma/client";
import { pipeline as m } from "stream";
import { promisify as h } from "util";
import { createGunzip as g, createGzip as _ } from "zlib";
import { jsPDF as v } from "jspdf";
import y from "jspdf-autotable";
import b from "exceljs";
import { ZodError as x, z as S } from "zod";
import C from "bcryptjs";
import { existsSync as w, readFileSync as T, writeFileSync as E } from "node:fs";
import { join as D } from "node:path";
import O from "node:fs/promises";
//#region src/main/env.ts
var k = !1;
function A(e) {
	let t = [];
	t.push(l.join(process.resourcesPath, "app.asar.unpacked", "node_modules", ".prisma", "client", e)), t.push(l.join(process.resourcesPath, "node_modules", ".prisma", "client", e)), t.push(l.join(process.resourcesPath, "..", "app.asar.unpacked", "node_modules", ".prisma", "client", e)), t.push(l.join(o.getAppPath(), "node_modules", ".prisma", "client", e)), t.push(l.join(o.getAppPath().replace("app.asar", "app.asar.unpacked"), "node_modules", ".prisma", "client", e));
	try {
		let n = l.dirname(d(import.meta.url));
		t.push(l.join(n.replace("app.asar", "app.asar.unpacked"), "..", "node_modules", ".prisma", "client", e)), t.push(l.join(n, "..", "node_modules", ".prisma", "client", e)), t.push(l.join(n.replace("app.asar", "app.asar.unpacked"), "..", "node_modules", "@prisma", "client", e));
	} catch {}
	try {
		let n = f(import.meta.url).resolve("@prisma/client"), r = l.dirname(n);
		t.push(l.join(r, "..", "..", ".prisma", "client", e)), t.push(l.join(r.replace("app.asar", "app.asar.unpacked"), "..", "..", ".prisma", "client", e));
	} catch {}
	let n = process.platform === "win32" ? "prisma-engine.dll.node" : "prisma-engine.so.node";
	t.push(l.join(process.resourcesPath, n));
	let r = /* @__PURE__ */ new Set();
	for (let e of t) if (!r.has(e)) {
		r.add(e);
		try {
			if (u.existsSync(e)) return e;
		} catch {}
	}
	return null;
}
function j() {
	if (k) return;
	if (k = !0, !o.isPackaged) {
		console.log("[Prisma] Running in development mode");
		return;
	}
	let e = o.getPath("userData"), t = l.join(e, "dev.sqlite3");
	u.existsSync(e) || u.mkdirSync(e, { recursive: !0 }), u.existsSync(t) || (console.log(`[Prisma] Creating fresh database at ${t}`), u.writeFileSync(t, "")), process.env.DATABASE_URL = `file:${t}`, console.log(`[Prisma] Database URL: ${process.env.DATABASE_URL}`);
	let n = process.platform === "win32" ? "query_engine-windows.dll.node" : "libquery_engine-debian-openssl-3.0.x.so.node", r = A(n);
	r ? (process.env.PRISMA_QUERY_ENGINE_LIBRARY = r, console.log(`[Prisma] Using engine: ${r}`)) : (console.error(`[Prisma] Engine NOT FOUND! Tried multiple locations. Engine name: ${n}`), console.error(`[Prisma] resourcesPath: ${process.resourcesPath}`), console.error(`[Prisma] getAppPath(): ${o.getAppPath()}`));
}
//#endregion
//#region src/infrastructure/persistence/PrismaProductRepository.ts
var ee = class {
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
		await this.prisma.product.update({
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
}, M = class {
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
function N(e, t, n) {
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
async function P(e, t, n) {
	let r = await e();
	if (!r) {
		let { NotFoundError: e } = await import("./errors-CBdiC9hv.js").then((e) => e.o);
		throw new e(t, n);
	}
	return r;
}
//#endregion
//#region src/infrastructure/persistence/PrismaSaleRepository.ts
var F = class {
	constructor(e) {
		this.prisma = e;
	}
	async findAll(e) {
		let t = {};
		return Object.assign(t, N("created_at", e?.startDate, e?.endDate)), e?.clientId && (t.client_id = e.clientId), e?.cashRegisterId && (t.cash_register_id = e.cashRegisterId), this.prisma.sale.findMany({
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
		Object.assign(n, N("created_at", e, t));
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
				payment_method: e.payment_method,
				exchange_rate: e.exchange_rate || 0
			} });
			for (let r of e.items) await t.saleItem.create({ data: {
				sale_id: n.id,
				product_id: r.product_id,
				quantity: r.quantity,
				unit_price: r.unit_price,
				purchase_price: r.purchase_price
			} }), await t.product.update({
				where: { id: r.product_id },
				data: { stock: { decrement: r.quantity } }
			}), await t.inventoryMovement.create({ data: {
				product_id: r.product_id,
				type: "SALIDA",
				quantity: r.quantity,
				reason: "VENTA"
			} });
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
}, te = class {
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
		return Object.assign(n, N("opened_at", e, t)), this.prisma.cashRegister.findMany({
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
}, ne = class {
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
}, re = class {
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
}, ie = class {
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
}, ae = class {
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
	async count() {
		return this.prisma.user.count();
	}
}, oe = class {
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
}, se = class {
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
}, ce = class {
	constructor(e) {
		this.prisma = e;
	}
	async getStats(e, t) {
		let n = {};
		Object.assign(n, N("created_at", e, t));
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
		return Object.assign(n, N("created_at", e, t)), this.prisma.sale.groupBy({
			by: ["payment_method"],
			where: n,
			_count: { id: !0 },
			_sum: { total: !0 },
			_avg: { total: !0 }
		});
	}
	async getTopProducts(e = 10, t, n) {
		let r = {};
		Object.assign(r, N("created_at", t, n));
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
		Object.assign(r, N("created_at", t, n));
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
		Object.assign(n, N("created_at", e, t));
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
		Object.assign(n, N("opened_at", e, t));
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
}, I = h(m), le = class {
	getDbPath() {
		if (!o.isPackaged) return l.resolve(process.cwd(), "prisma", "dev.sqlite3");
		let e = o.getPath("userData");
		return l.join(e, "dev.sqlite3");
	}
	getBackupDir() {
		let e = !o.isPackaged, t;
		t = e ? process.cwd() : o.getPath("userData");
		let n = l.join(t, "backups");
		return u.existsSync(n) || u.mkdirSync(n, { recursive: !0 }), n;
	}
	async createBackup(e) {
		try {
			let t = this.getDbPath();
			if (!u.existsSync(t)) return {
				success: !1,
				message: "Database file not found"
			};
			let n = this.getBackupDir(), r = `backup-${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").split("T")[0]}${e ? `-${e}` : ""}.sqlite.gz`, i = l.join(n, r);
			return await I(u.createReadStream(t), _(), u.createWriteStream(i)), {
				success: !0,
				path: i
			};
		} catch (e) {
			return console.error("[ElectronBackupService] Error creating backup:", e), {
				success: !1,
				message: e.message
			};
		}
	}
	async listBackups() {
		try {
			let e = this.getBackupDir();
			return u.existsSync(e) ? u.readdirSync(e).filter((e) => e.endsWith(".sqlite.gz")).map((t) => {
				let n = l.join(e, t), r = u.statSync(n);
				return {
					filename: t,
					path: n,
					size: r.size,
					created: r.mtime
				};
			}).sort((e, t) => t.created.getTime() - e.created.getTime()) : [];
		} catch (e) {
			return console.error("[ElectronBackupService] Error listing backups:", e), [];
		}
	}
	async restoreBackup(e) {
		try {
			if (!u.existsSync(e)) return {
				success: !1,
				message: "Backup file not found"
			};
			let t = this.getDbPath();
			return await this.createBackup("before-restore"), await I(u.createReadStream(e), g(), u.createWriteStream(t)), {
				success: !0,
				message: "Backup restored successfully. Restart the app to see changes."
			};
		} catch (e) {
			return console.error("[ElectronBackupService] Error restoring backup:", e), {
				success: !1,
				message: e.message
			};
		}
	}
	async deleteBackup(e) {
		try {
			return u.existsSync(e) ? (u.unlinkSync(e), { success: !0 }) : {
				success: !1,
				message: "Backup file not found"
			};
		} catch (e) {
			return console.error("[ElectronBackupService] Error deleting backup:", e), {
				success: !1,
				message: e.message
			};
		}
	}
	async createScheduledBackup() {
		let e = await this.listBackups(), t = /* @__PURE__ */ new Date(), n = new Date(t.getFullYear(), t.getMonth(), t.getDate());
		e.find((e) => {
			let t = new Date(e.created);
			return new Date(t.getFullYear(), t.getMonth(), t.getDate()).getTime() === n.getTime();
		}) || (await this.createBackup("auto"), console.log("[ElectronBackupService] Automatic backup created"));
	}
	async cleanupOldBackups(e = 10) {
		try {
			let t = await this.listBackups();
			if (t.length > e) {
				let n = t.slice(e);
				for (let e of n) u.unlinkSync(e.path);
				console.log(`[ElectronBackupService] Cleaned up ${n.length} old backups`);
			}
		} catch (e) {
			console.error("[ElectronBackupService] Error cleaning up backups:", e);
		}
	}
}, ue = class {
	async generateSalesReport(e, t, n = "Reporte de Ventas", r = !0) {
		let i = new v({
			unit: "mm",
			format: "a4"
		});
		i.setFontSize(16), i.text(n, 14, 20), i.setFontSize(10), i.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, 14, 28);
		let a = 34;
		return r && e.length > 0 && (y(i, {
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
		let r = new v({
			unit: "mm",
			format: "a4"
		});
		r.setFontSize(16), r.text(n, 14, 20), r.setFontSize(10), r.text(`Generado: ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`, 14, 28), y(r, {
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
		let t = new v({
			unit: "mm",
			format: [80, 120 + e.items.length * 6]
		}), n = 10;
		if (e.logoBase64) try {
			t.addImage(e.logoBase64, "PNG", 30, n, 20, 20), n += 22;
		} catch {}
		return t.setFontSize(10), t.text(e.businessName, 40, n, { align: "center" }), n += 5, t.setFontSize(7), e.businessAddress && (t.text(e.businessAddress, 40, n, { align: "center" }), n += 4), e.businessPhone && (t.text(`Tel: ${e.businessPhone}`, 40, n, { align: "center" }), n += 4), e.businessTaxId && (t.text(`RUC: ${e.businessTaxId}`, 40, n, { align: "center" }), n += 4), n += 3, t.setFontSize(8), t.text("=".repeat(32), 5, n), n += 4, t.text(`Ticket: #${e.saleId}`, 5, n), n += 4, t.text(`Fecha: ${e.createdAt.toLocaleString("es-PE")}`, 5, n), n += 4, t.text(`Cliente: ${e.clientName}`, 5, n), n += 4, e.clientDni && (t.text(`DNI: ${e.clientDni}`, 5, n), n += 4), e.clientTaxId && (t.text(`RUC: ${e.clientTaxId}`, 5, n), n += 4), t.text(`Pago: ${e.paymentMethod === "CASH" ? "EFECTIVO" : "TARJETA"}`, 5, n), n += 4, t.text("-".repeat(32), 5, n), n += 5, e.items.forEach((e) => {
			t.text(`${e.quantity} x ${e.productName}`, 5, n), t.text(`$ ${e.totalPrice.toFixed(2)}`, 75, n, { align: "right" }), n += 5;
		}), t.text("-".repeat(32), 5, n + 2), n += 6, t.setFontSize(8), t.text("Subtotal:", 5, n), t.text(`$ ${e.subtotal.toFixed(2)}`, 75, n, { align: "right" }), n += 5, e.taxAmount > 0 && (t.text(`${e.taxType.toUpperCase()} (${(e.taxRate * 100).toFixed(1)}%):`, 5, n), t.text(`$ ${e.taxAmount.toFixed(2)}`, 75, n, { align: "right" }), n += 5), t.setFontSize(10), t.text("TOTAL:", 5, n + 2), t.text(`$ ${e.total.toFixed(2)}`, 75, n + 2, { align: "right" }), n += 8, t.setFontSize(7), t.text(e.ticketFooter || "Gracias por su compra", 40, n, { align: "center" }), new Uint8Array(t.output("arraybuffer"));
	}
	async generateCashCloseReport(e) {
		let t = new v({
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
}, L = class {
	async generateSalesReport(e, t, n = "Reporte de Ventas", r = !0) {
		let i = new b.Workbook();
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
		let r = new b.Workbook();
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
		let t = new b.Workbook();
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
		let t = new b.Workbook();
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
}, R = S.object({
	sku: S.string().min(1, "El SKU es obligatorio."),
	name: S.string().min(1, "El nombre es obligatorio."),
	description: S.string().optional(),
	category_id: S.coerce.number().int().positive().optional().nullable(),
	supplier_id: S.coerce.number().int().positive().optional().nullable(),
	price_purchase: S.coerce.number().min(0, "El precio de compra no puede ser negativo."),
	price_sale: S.coerce.number().min(0, "El precio de venta no puede ser negativo."),
	stock: S.coerce.number().int().optional(),
	min_stock: S.coerce.number().int().min(0).optional().default(10)
}), z = S.object({
	product_id: S.coerce.number().int().positive("El ID del producto es obligatorio."),
	quantity: S.coerce.number().int().positive("La cantidad debe ser mayor a 0."),
	unit_price: S.coerce.number().min(0, "El precio unitario no puede ser negativo.")
}), B = S.object({
	cash_register_id: S.coerce.number().int().positive("El ID de la caja es obligatorio."),
	client_id: S.coerce.number().int().optional(),
	client_dni: S.string().optional(),
	client_name: S.string().optional(),
	payment_method: S.enum(["CASH", "CARD"]).default("CASH"),
	items: S.array(z).min(1, "La venta debe tener al menos un producto.")
});
S.object({ opening_amount: S.coerce.number().min(0, "El monto de apertura no puede ser negativo.") }), S.object({
	register_id: S.coerce.number().int().positive("El ID de la caja es obligatorio."),
	closing_amount: S.coerce.number().min(0, "El monto de cierre no puede ser negativo.")
});
var V = S.object({
	dni: S.string().min(1, "El DNI/Documento es obligatorio."),
	name: S.string().min(1, "El nombre es obligatorio."),
	phone: S.string().optional().nullable(),
	code: S.string().min(1, "El código de cliente es obligatorio."),
	tax_id: S.string().optional().nullable()
}), H = S.object({ name: S.string().min(1, "El nombre de la categoría es obligatorio.").max(255) });
S.object({
	product_id: S.coerce.number().int().positive("El ID del producto es obligatorio."),
	type: S.enum(["ENTRADA", "SALIDA"], { errorMap: () => ({ message: "El tipo debe ser ENTRADA o SALIDA." }) }),
	quantity: S.coerce.number().int().positive("La cantidad debe ser mayor a 0.")
});
//#endregion
//#region src/main/services/ProductService.ts
var U = class {
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
		let i = R.parse(e);
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
		let o = R.parse(r);
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
		return await this.productRepo.updateStock(n, -r), await this.productRepo.createMovement({
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
}, de = class {
	constructor(e, t) {
		this.clientRepo = e, this.auditLogRepo = t;
	}
	async getAllClients(e) {
		return this.clientRepo.findAll(e);
	}
	async getClientById(e) {
		return await P(() => this.clientRepo.findById(e), "Cliente", e);
	}
	async createClient(e, t = 1) {
		let r = V.parse(e);
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
		await P(() => this.clientRepo.findById(e), "Cliente", e);
		let i = V.parse(t), a = await this.clientRepo.findByDni(i.dni);
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
		await P(() => this.clientRepo.findById(e), "Cliente", e);
		let n = await this.clientRepo.getSalesCount(e);
		if (n > 0) throw new i(`No se puede eliminar el cliente porque tiene ${n} venta(s) asociada(s).`);
		return await this.clientRepo.delete(e), await this.auditLogRepo.create({
			userId: t,
			action: "DELETE_CLIENT",
			entity: "clients",
			entity_id: e
		}), { success: !0 };
	}
}, fe = class {
	constructor(e, t, n, r, i, a, o) {
		this.saleRepo = e, this.productRepo = t, this.clientRepo = n, this.cashRegisterRepo = r, this.settingsRepo = i, this.auditLogRepo = a, this.dashboardService = o;
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
		let a = B.parse({
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
		let u = a.items.map((e) => {
			let t = l.get(e.product_id);
			return {
				product_id: e.product_id,
				quantity: e.quantity,
				unit_price: e.unit_price,
				purchase_price: t?.price_purchase || 0
			};
		}), d = u.reduce((e, t) => e + t.unit_price * t.quantity, 0), f = await this.settingsRepo.getTaxSettings(), p = d, m = 0, h = d;
		f.taxType !== "none" && f.taxRate > 0 && (m = parseFloat((d * f.taxRate).toFixed(2)), h = parseFloat((p + m).toFixed(2)));
		let g = {
			cash_register_id: a.cash_register_id,
			client_id: o || 1,
			subtotal: p,
			tax_amount: m,
			total: h,
			items: u,
			payment_method: a.payment_method,
			exchange_rate: e.exchange_rate || 0
		}, _ = await this.saleRepo.registerSale(g);
		return this.dashboardService.invalidateCache(), await this.auditLogRepo.create({
			userId: r,
			action: "CREATE_SALE",
			entity: "sales",
			entity_id: _
		}), {
			success: !0,
			id: _
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
}, pe = class {
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
}, me = class {
	constructor(e, t) {
		this.supplierRepo = e, this.auditLogRepo = t;
	}
	async getAllSuppliers(e) {
		try {
			return await this.supplierRepo.findAll(e);
		} catch (e) {
			throw console.error("Get all suppliers error:", e), Error("Error al obtener proveedores");
		}
	}
	async getSupplierById(e) {
		try {
			let n = await this.supplierRepo.findById(e);
			if (!n) throw new t("Proveedor");
			return n;
		} catch (e) {
			throw console.error("Get supplier by ID error:", e), e.code === "P2025" ? new t("Proveedor") : e;
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
			throw console.error("Create supplier error:", e), e.code === "P2002" ? new n("El RUC ya está en uso") : e;
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
			throw console.error("Update supplier error:", e), e.code === "P2025" ? new t("Proveedor") : e;
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
			throw console.error("Delete supplier error:", e), e.code === "P2025" ? new t("Proveedor") : e;
		}
	}
}, he = class {
	constructor(e, t, n, r) {
		this.purchaseRepo = e, this.supplierRepo = t, this.productRepo = n, this.auditLogRepo = r;
	}
	async getAllPurchases(e, t) {
		try {
			return await this.purchaseRepo.findAll(e, t);
		} catch (e) {
			throw console.error("Get all purchases error:", e), Error("Error al obtener compras");
		}
	}
	async getPurchaseById(e) {
		try {
			let n = await this.purchaseRepo.findById(e);
			if (!n) throw new t("Compra");
			return n;
		} catch (e) {
			throw console.error("Get purchase by ID error:", e), e.code === "P2025" ? new t("Compra") : e;
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
			throw console.error("Create purchase error:", e), e;
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
			throw console.error("Receive purchase error:", e), e.code === "P2025" ? new t("Compra") : e;
		}
	}
	async updatePaymentStatus(e, n) {
		try {
			return await this.purchaseRepo.updatePaymentStatus(e, n), { success: !0 };
		} catch (e) {
			throw console.error("Update payment status error:", e), e.code === "P2025" ? new t("Compra") : e;
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
			throw console.error("Cancel purchase error:", e), e.code === "P2025" ? new t("Compra") : e;
		}
	}
}, ge = class {
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
}, _e = class {
	constructor(e, t) {
		this.userRepo = e, this.auditLogRepo = t;
	}
	async getAllUsers() {
		try {
			return await this.userRepo.findAll();
		} catch (e) {
			throw console.error("Get all users error:", e), Error("Error al obtener usuarios");
		}
	}
	async getUserById(e) {
		try {
			let n = await this.userRepo.findById(e);
			if (!n) throw new t("Usuario");
			return n;
		} catch (e) {
			throw console.error("Get user by ID error:", e), e.code === "P2025" ? new t("Usuario") : e;
		}
	}
	async createUser(t, r) {
		try {
			if (await this.userRepo.exists(t.username)) throw new n(`El usuario '${t.username}' ya existe`);
			if (t.password.length < 6) throw new e("La contraseña debe tener al menos 6 caracteres");
			let i = await C.genSalt(10), a = await C.hash(t.password, i), o = await this.userRepo.create({
				username: t.username,
				password_hash: a,
				role: t.role
			});
			return await this.auditLogRepo.create({
				userId: r,
				action: "CREATE_USER",
				entity: "users",
				entity_id: o.id
			}), o;
		} catch (e) {
			throw console.error("Create user error:", e), e.code === "P2002" ? new n("El nombre de usuario ya está en uso") : e;
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
			throw console.error("Update user error:", e), e.code === "P2025" ? new t("Usuario") : e;
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
			throw console.error("Delete user error:", e), e.code === "P2025" ? new t("Usuario") : e;
		}
	}
	async changePassword(n, r, i) {
		try {
			if (r.length < 6) throw new e("La contraseña debe tener al menos 6 caracteres");
			let t = await C.genSalt(10), a = await C.hash(r, t);
			return await this.userRepo.update(n, { password_hash: a }), await this.auditLogRepo.create({
				userId: i,
				action: "CHANGE_PASSWORD",
				entity: "users",
				entity_id: n
			}), { success: !0 };
		} catch (e) {
			throw console.error("Change password error:", e), e.code === "P2025" ? new t("Usuario") : e;
		}
	}
}, ve = class {
	constructor(e) {
		this.userRepo = e;
	}
	async login(e, t) {
		try {
			let n = await this.userRepo.findByUsername(e);
			if (!n) return {
				success: !1,
				error: "Usuario no encontrado"
			};
			if (!await C.compare(t, n.password_hash)) return {
				success: !1,
				error: "Contraseña incorrecta"
			};
			let { password_hash: r, ...i } = n;
			return {
				success: !0,
				user: i
			};
		} catch (e) {
			return console.error("Login error:", e), e.code === "P2025" ? {
				success: !1,
				error: "Usuario no encontrado"
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
			if (e.password.length < 6) return {
				success: !1,
				error: "La contraseña debe tener al menos 6 caracteres"
			};
			let t = await C.genSalt(10), n = await C.hash(e.password, t), r = await this.userRepo.create({
				username: e.username,
				password_hash: n,
				role: e.role
			});
			return {
				success: !0,
				user: {
					id: r.id,
					username: r.username,
					role: r.role,
					created_at: r.created_at,
					updated_at: r.updated_at
				}
			};
		} catch (e) {
			return console.error("Register error:", e), e.code === "P2002" ? {
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
			if (n.length < 6) return {
				success: !1,
				error: "La contraseña debe tener al menos 6 caracteres"
			};
			let i = await C.genSalt(10), a = await C.hash(n, i);
			return await this.userRepo.update(e, { password_hash: a }), { success: !0 };
		} catch (e) {
			return console.error("Change password error:", e), {
				success: !1,
				error: "Error interno del servidor"
			};
		}
	}
}, ye = class {
	constructor(e, t) {
		this.categoryRepo = e, this.auditLogRepo = t;
	}
	async getAllCategories(e) {
		return await this.categoryRepo.findAll(e);
	}
	async getCategoryById(e) {
		return await P(() => this.categoryRepo.findById(e), "Categoría", e);
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
		await P(() => this.categoryRepo.findById(e), "Categoría", e);
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
		await P(() => this.categoryRepo.findById(e), "Categoría", e);
		let n = await this.categoryRepo.getProductCount(e);
		if (n > 0) throw new i(`No se puede eliminar la categoría porque tiene ${n} producto(s) asociado(s).`);
		return await this.categoryRepo.delete(e), await this.auditLogRepo.create({
			userId: t,
			action: "DELETE_CATEGORY",
			entity: "categories",
			entity_id: e
		}), { success: !0 };
	}
}, be = class {
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
}, xe = "dashboard:stats", Se = class {
	constructor(e, t) {
		this.repo = e, this.cache = t;
	}
	async getStats(e, t) {
		return e || t ? this.repo.getStats(e, t) : this.cache.getOrSet(xe, () => this.repo.getStats());
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
}, Ce = class {
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
}, we = class {
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
			totalPrice: Number(e.unit_price) * e.quantity
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
}, W = "scheduler_", Te = class {
	dailyTimer = null;
	weeklyTimer = null;
	statePath;
	constructor(e, t) {
		this.reportService = e, this.backupService = t, this.statePath = D(process.cwd(), "scheduler-state.json");
	}
	start() {
		console.log("[Scheduler] Starting scheduled tasks..."), this.scheduleDailyReport(), this.scheduleWeeklyReport(), this.scheduleDailyBackup();
	}
	stop() {
		this.dailyTimer && clearInterval(this.dailyTimer), this.weeklyTimer && clearInterval(this.weeklyTimer), console.log("[Scheduler] Stopped scheduled tasks");
	}
	scheduleDailyReport() {
		let e = async () => {
			try {
				let e = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				if (this.getLastRun("daily_report") === e) return;
				console.log("[Scheduler] Generating daily report..."), await this.reportService.generateReport({
					type: "daily_sales",
					format: "pdf",
					title: `Reporte Diario - ${(/* @__PURE__ */ new Date()).toLocaleDateString("es-PE")}`
				}), this.setLastRun("daily_report", e), console.log("[Scheduler] Daily report saved");
			} catch (e) {
				console.error("[Scheduler] Error generating daily report:", e);
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
				n.setDate(e.getDate() - e.getDay()), n.setHours(0, 0, 0, 0), console.log("[Scheduler] Generating weekly report..."), await this.reportService.generateReport({
					type: "sales_summary",
					format: "pdf",
					startDate: n,
					endDate: e,
					title: `Reporte Semanal - Semana ${t}`
				}), this.setLastRun("weekly_report", String(t)), console.log("[Scheduler] Weekly report saved");
			} catch (e) {
				console.error("[Scheduler] Error generating weekly report:", e);
			}
		};
		e(), this.weeklyTimer = setInterval(e, 360 * 60 * 1e3);
	}
	scheduleDailyBackup() {
		let e = async () => {
			try {
				let e = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
				if (this.getLastRun("daily_backup") === e) return;
				console.log("[Scheduler] Creating daily backup..."), await this.backupService.createBackup(`auto-${e}`), this.setLastRun("daily_backup", e), console.log("[Scheduler] Daily backup created");
			} catch (e) {
				console.error("[Scheduler] Error creating daily backup:", e);
			}
		};
		e(), setInterval(e, 3600 * 1e3);
	}
	getLastRun(e) {
		try {
			return w(this.statePath) ? JSON.parse(T(this.statePath, "utf-8"))[W + e] ?? "" : "";
		} catch {
			return "";
		}
	}
	setLastRun(e, t) {
		try {
			let n = {};
			w(this.statePath) && (n = JSON.parse(T(this.statePath, "utf-8"))), n[W + e] = t, E(this.statePath, JSON.stringify(n, null, 2));
		} catch {}
	}
	getWeekNumber(e) {
		let t = new Date(e.getFullYear(), 0, 1), n = e.getTime() - t.getTime();
		return Math.ceil((n / 864e5 + t.getDay() + 1) / 7);
	}
};
//#endregion
//#region src/main/di/container.ts
function Ee(e) {
	let t = new ee(e), n = new M(e), r = new F(e), i = new te(e), a = new ne(e), o = new re(e), s = new ie(e), c = new ae(e), l = new oe(e), u = new se(e), d = new ce(e), f = new Ce(), p = new le(), m = new ue(), h = new L(), g = new Se(d, f), _ = new U(t, l, u), v = new de(n, u), y = new pe(i, u), b = new ge(s), x = new _e(c, u), S = new ve(c), C = new me(a, u), w = new he(o, a, t, u), T = new fe(r, t, n, i, s, u, g), E = new be(p), D = new ye(l, u), O = new we(m, h, g, T, _, y, b);
	return {
		prisma: e,
		userRepo: c,
		productService: _,
		clientService: v,
		saleService: T,
		cashRegisterService: y,
		settingsService: b,
		userService: x,
		authService: S,
		supplierService: C,
		purchaseService: w,
		categoryService: D,
		dashboardService: g,
		backupService: E,
		reportService: O,
		schedulerService: new Te(O, E),
		cacheService: f
	};
}
//#endregion
//#region src/main/di/registry.ts
var G = null;
function De() {
	if (!G) throw Error("Container not initialized");
	return G;
}
function Oe(e) {
	G = e;
}
//#endregion
//#region src/main/utils/ipcWrapper.ts
function ke(t) {
	return t instanceof x ? {
		success: !1,
		message: "Error de validación: " + t.issues.map((e) => e.message).join(", "),
		errors: t.issues.map((e) => `${e.path.join(".")}: ${e.message}`),
		code: "VALIDATION"
	} : t instanceof r ? {
		success: !1,
		message: t.message,
		code: t.code,
		errors: t instanceof e ? t.errors : void 0
	} : (console.error("Unhandled IPC Error:", t), {
		success: !1,
		message: t.message || "Ocurrió un error inesperado en el sistema",
		code: "INTERNAL"
	});
}
function K(e, t) {
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
			return ke(e);
		}
	};
}
//#endregion
//#region src/main/ipc.ts
var q = new Proxy({}, { get(e, t) {
	return De()[t];
} });
function J() {
	c.handle("dialog:showConfirm", async (e, t) => (await s.showMessageBox({
		type: "question",
		buttons: ["Sí", "No"],
		defaultId: 0,
		cancelId: 1,
		title: t.title || "Confirmación",
		message: t.message
	})).response === 0), c.handle("health:check", async () => {
		try {
			return await q.prisma.$queryRaw`SELECT 1`, {
				success: !0,
				database: "connected",
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		} catch (e) {
			return {
				success: !1,
				database: "disconnected",
				error: e.message,
				timestamp: (/* @__PURE__ */ new Date()).toISOString()
			};
		}
	}), c.handle("dashboard:getStats", async (e, t, n) => {
		try {
			return await q.dashboardService.getStats(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("dashboard:getWeeklySales", async (e, t) => {
		try {
			return await q.dashboardService.getWeeklySales(t);
		} catch {
			return [];
		}
	}), c.handle("dashboard:getLowStock", async (e, t) => {
		try {
			return await q.dashboardService.getLowStockProducts(t || 50);
		} catch (e) {
			return console.error("[IPC] Error getting low stock:", e), [];
		}
	}), c.handle("dashboard:getSalesByPayment", async (e, t, n) => {
		try {
			return await q.dashboardService.getSalesByPaymentMethod(t, n);
		} catch {
			return [];
		}
	}), c.handle("dashboard:getTopProducts", async (e, t, n, r) => {
		try {
			return await q.dashboardService.getTopProducts(t, n, r);
		} catch {
			return [];
		}
	}), c.handle("dashboard:getTopClients", async (e, t, n, r) => {
		try {
			return await q.dashboardService.getTopClients(t, n, r);
		} catch {
			return [];
		}
	}), c.handle("dashboard:getSalesByHour", async (e, t, n) => {
		try {
			return await q.dashboardService.getSalesByHour(t, n);
		} catch {
			return [];
		}
	}), c.handle("dashboard:getCashSummary", async (e, t, n) => {
		try {
			return await q.dashboardService.getCashRegisterSummary(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("dashboard:getInventoryMetrics", async () => {
		try {
			return await q.dashboardService.getInventoryMetrics();
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("dashboard:invalidateCache", async () => {
		try {
			return q.dashboardService.invalidateCache(), { success: !0 };
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("settings:getAll", async () => {
		try {
			return await q.settingsService.getSettings();
		} catch {
			return {};
		}
	}), c.handle("settings:update", async (e, t) => {
		try {
			return await q.settingsService.updateSettings(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("cash:getOpen", async () => {
		try {
			return await q.cashRegisterService.getOpenRegister();
		} catch {
			return null;
		}
	}), c.handle("cash:getAll", async (e, t, n) => {
		try {
			return await q.cashRegisterService.getAllRegisters(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener cajas"
			};
		}
	}), c.handle("cash:getDetails", async (e, t) => {
		try {
			return await q.cashRegisterService.getRegisterDetails(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener detalles de caja"
			};
		}
	}), c.handle("cash:getDailySummary", async (e, t) => {
		try {
			return await q.cashRegisterService.getDailySummary(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener resumen del día"
			};
		}
	}), c.handle("cash:open", K((e, t) => q.cashRegisterService.openRegister(e, t))), c.handle("cash:close", K((e, t, n) => q.cashRegisterService.closeRegister(e, t, n))), c.handle("auth:login", async (e, t, n) => {
		try {
			return await q.authService.login(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error de autenticación"
			};
		}
	}), c.handle("setup:status", async () => {
		try {
			return { needsSetup: await q.userRepo.count() === 0 };
		} catch (e) {
			return {
				needsSetup: !0,
				error: e.message
			};
		}
	}), c.handle("setup:complete", async (e, t) => {
		try {
			let e = await q.authService.register({
				username: t.user.username,
				password: t.user.password,
				role: "ADMIN",
				password_hash: ""
			});
			return e.success ? (await q.settingsService.updateSettings(t.settings), {
				success: !0,
				user: e.user
			}) : {
				success: !1,
				message: e.error || "Error al crear el usuario"
			};
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error durante la configuración inicial"
			};
		}
	}), c.handle("clients:getAll", async (e, t) => {
		try {
			return await q.clientService.getAllClients(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener clientes"
			};
		}
	}), c.handle("clients:getById", async (e, t) => {
		try {
			return await q.clientService.getClientById(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener cliente"
			};
		}
	}), c.handle("clients:create", K((e, t) => q.clientService.createClient(e, t), V)), c.handle("clients:update", K((e, t, n) => q.clientService.updateClient(e, t, n))), c.handle("clients:delete", async (e, t, n) => {
		try {
			return await q.clientService.deleteClient(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al eliminar cliente"
			};
		}
	}), c.handle("products:getAll", async (e, t, n) => {
		try {
			return await q.productService.getAllProducts(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener productos"
			};
		}
	}), c.handle("products:getById", async (e, t) => {
		try {
			return await q.productService.getProductById(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener producto"
			};
		}
	}), c.handle("products:getLowStock", async () => {
		try {
			return await q.dashboardService.getLowStockProducts(50);
		} catch (e) {
			return console.error("Get low stock products error:", e), [];
		}
	}), c.handle("products:create", K((e, t) => q.productService.createProduct(e, t), R)), c.handle("products:update", K((e, t, n) => q.productService.updateProduct(e, t, n))), c.handle("products:delete", async (e, t, n) => {
		try {
			return await q.productService.deleteProduct(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al eliminar producto"
			};
		}
	}), c.handle("products:addStock", async (e, t, n, r, i) => {
		try {
			return await q.productService.addStock(t, n, r, i);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al añadir stock"
			};
		}
	}), c.handle("products:removeStock", async (e, t, n, r, i) => {
		try {
			return await q.productService.removeStock(t, n, r, i);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al reducir stock"
			};
		}
	}), c.handle("products:getMovements", async (e, t, n) => {
		try {
			return await q.productService.getInventoryMovements(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener movimientos"
			};
		}
	}), c.handle("sales:getAll", async (e, t, n, r, i) => {
		try {
			return await q.saleService.getAllSales(t, n, r, i);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener ventas"
			};
		}
	}), c.handle("sales:getToday", async () => {
		try {
			return await q.saleService.getTodaySales();
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener ventas del día"
			};
		}
	}), c.handle("sales:getLast", async () => {
		try {
			return await q.saleService.getLastSale();
		} catch {
			return null;
		}
	}), c.handle("sales:getStats", async (e, t, n) => {
		try {
			return await q.saleService.getSalesStats(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener estadísticas"
			};
		}
	}), c.handle("sales:getDetails", async (e, t) => {
		try {
			return await q.saleService.getSaleDetails(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener detalles de venta"
			};
		}
	}), c.handle("sales:register", K(async (e, t, n) => q.saleService.registerSale(e, t, n), B.omit({ items: !0 }))), c.handle("sales:cancel", async (e, t, n) => {
		try {
			return await q.saleService.cancelSale(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al cancelar venta"
			};
		}
	}), c.handle("categories:getAll", async (e, t) => await q.categoryService.getAllCategories(t)), c.handle("categories:getById", async (e, t) => {
		try {
			return await q.categoryService.getCategoryById(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener categoría"
			};
		}
	}), c.handle("categories:create", K(async (e, t) => await q.categoryService.createCategory(e, t), H)), c.handle("categories:update", K(async (e, t, n) => {
		let r = H.parse(t);
		return await q.categoryService.updateCategory(e, r, n);
	})), c.handle("categories:delete", K(async (e, t) => await q.categoryService.deleteCategory(e, t))), c.handle("users:getAll", async () => {
		try {
			return await q.userService.getAllUsers();
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener usuarios"
			};
		}
	}), c.handle("users:getById", async (e, t) => {
		try {
			return await q.userService.getUserById(t);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al obtener usuario"
			};
		}
	}), c.handle("users:create", async (e, t, n) => {
		try {
			return {
				success: !0,
				user: await q.userService.createUser(t, n)
			};
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al crear usuario"
			};
		}
	}), c.handle("users:update", async (e, t, n, r) => {
		try {
			return {
				success: !0,
				user: await q.userService.updateUser(t, n, r)
			};
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al actualizar usuario"
			};
		}
	}), c.handle("users:delete", async (e, t, n) => {
		try {
			return await q.userService.deleteUser(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al eliminar usuario"
			};
		}
	}), c.handle("users:changePassword", async (e, t, n, r) => {
		try {
			return await q.userService.changePassword(t, n, r);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al cambiar contraseña"
			};
		}
	}), c.handle("movements:getAll", async () => {
		try {
			return await q.prisma.inventoryMovement.findMany({
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
			return await q.supplierService.getAllSuppliers(t);
		} catch {
			return [];
		}
	}), c.handle("suppliers:getById", async (e, t) => {
		try {
			return await q.supplierService.getSupplierById(t);
		} catch {
			return null;
		}
	}), c.handle("suppliers:create", async (e, t, n) => {
		try {
			return {
				success: !0,
				supplier: await q.supplierService.createSupplier(t, n)
			};
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al crear proveedor"
			};
		}
	}), c.handle("suppliers:update", async (e, t, n, r) => {
		try {
			return {
				success: !0,
				supplier: await q.supplierService.updateSupplier(t, n, r)
			};
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al actualizar proveedor"
			};
		}
	}), c.handle("suppliers:delete", async (e, t, n) => {
		try {
			return await q.supplierService.deleteSupplier(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al eliminar proveedor"
			};
		}
	}), c.handle("purchases:getAll", async (e, t, n) => {
		try {
			return await q.purchaseService.getAllPurchases(t, n);
		} catch {
			return [];
		}
	}), c.handle("purchases:getById", async (e, t) => {
		try {
			return await q.purchaseService.getPurchaseById(t);
		} catch {
			return null;
		}
	}), c.handle("purchases:create", async (e, t, n) => {
		try {
			return {
				success: !0,
				purchase: await q.purchaseService.createPurchase(t, n)
			};
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al crear orden de compra"
			};
		}
	}), c.handle("purchases:receive", async (e, t, n) => {
		try {
			return await q.purchaseService.receivePurchase(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al recibir compra"
			};
		}
	}), c.handle("purchases:cancel", async (e, t, n) => {
		try {
			return await q.purchaseService.cancelPurchase(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al cancelar compra"
			};
		}
	}), c.handle("purchases:updatePaymentStatus", async (e, t, n) => {
		try {
			return await q.purchaseService.updatePaymentStatus(t, n);
		} catch (e) {
			return {
				success: !1,
				message: e.message || "Error al actualizar estado de pago"
			};
		}
	}), c.handle("backup:create", async (e, t) => {
		try {
			return await q.backupService.createBackup(t);
		} catch (e) {
			return console.error("[IPC] Error creating backup:", e), {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("backup:list", async () => {
		try {
			return await q.backupService.listBackups();
		} catch (e) {
			return console.error("[IPC] Error listing backups:", e), [];
		}
	}), c.handle("backup:restore", async (e, t) => {
		try {
			return await q.backupService.restoreBackup(t);
		} catch (e) {
			return console.error("[IPC] Error restoring backup:", e), {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("backup:delete", async (e, t) => {
		try {
			return await q.backupService.deleteBackup(t);
		} catch (e) {
			return console.error("[IPC] Error deleting backup:", e), {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("settings:getTax", async () => {
		try {
			return await q.settingsService.getTaxSettings();
		} catch (e) {
			return console.error("[IPC] Error getting tax settings:", e), {
				taxRate: 0,
				taxType: "none",
				taxIncluded: !1
			};
		}
	}), c.handle("settings:updateTax", async (e, t, n, r) => {
		try {
			return await q.settingsService.updateTaxSettings(t, n, r);
		} catch (e) {
			return console.error("[IPC] Error updating tax settings:", e), {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("reports:generate", async (e, t) => {
		try {
			let e = t.startDate ? new Date(t.startDate) : void 0, n;
			t.endDate ? (n = new Date(t.endDate), n.setHours(23, 59, 59, 999)) : e && (n = new Date(e), n.setHours(23, 59, 59, 999));
			let r = {
				...t,
				startDate: e,
				endDate: n
			}, i = await q.reportService.generateReport(r), a = r.format === "pdf" ? "pdf" : "xlsx", { filePath: o, canceled: c } = await s.showSaveDialog({
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
		} catch (e) {
			return console.error("[IPC] Error generating report:", e), {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("reports:generateReceipt", async (e, t) => {
		try {
			let e = {
				type: "sale_receipt",
				format: "pdf",
				saleId: t
			}, n = await q.reportService.generateReport(e), { filePath: r, canceled: i } = await s.showSaveDialog({
				defaultPath: `comprobante-${t}-${Date.now()}.pdf`,
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
		} catch (e) {
			return console.error("[IPC] Error generating receipt:", e), {
				success: !1,
				message: e.message
			};
		}
	}), c.handle("reports:generateCashClose", async (e, t) => {
		try {
			let e = {
				type: "cash_close",
				format: "pdf",
				registerId: t
			}, n = await q.reportService.generateReport(e), { filePath: r, canceled: i } = await s.showSaveDialog({
				defaultPath: `cierre-caja-${t}-${Date.now()}.pdf`,
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
		} catch (e) {
			return console.error("[IPC] Error generating cash close report:", e), {
				success: !1,
				message: e.message
			};
		}
	});
}
//#endregion
//#region src/main/utils/migrationRunner.ts
function Ae(e) {
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
function je() {
	let e = [];
	o.isPackaged && (e.push(l.join(process.resourcesPath, "prisma", "schema.sql")), e.push(l.join(process.resourcesPath, "schema.sql")));
	try {
		let t = l.dirname(d(import.meta.url));
		e.push(l.join(t, "..", "prisma", "schema.sql"));
	} catch {}
	for (let t of e) if (u.existsSync(t)) return t;
	return null;
}
async function Me(e) {
	try {
		let t = await e.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' AND name='users'");
		return Array.isArray(t) && t.length > 0;
	} catch {
		return !1;
	}
}
async function Ne(e) {
	if (await Me(e)) return console.log("[Migration] Database already initialized, skipping."), { applied: !1 };
	let t = je();
	if (!t) {
		let e = "schema.sql not found in any expected location";
		return console.error("[Migration] " + e), {
			applied: !1,
			error: e
		};
	}
	console.log(`[Migration] Loading schema from ${t}`);
	let n = Ae(u.readFileSync(t, "utf-8"));
	console.log(`[Migration] Found ${n.length} SQL statements to execute`);
	for (let t = 0; t < n.length; t++) {
		let r = n[t];
		try {
			await e.$executeRawUnsafe(r);
		} catch (e) {
			if (e.message && e.message.includes("already exists")) {
				console.log(`[Migration] Skipping statement ${t + 1} (already exists): ${r.slice(0, 60)}...`);
				continue;
			}
			let n = `Migration failed at statement ${t + 1}: ${e.message || e}`;
			return console.error("[Migration] " + n), console.error("[Migration] SQL: " + r.slice(0, 200)), {
				applied: !1,
				error: n
			};
		}
	}
	return console.log("[Migration] Schema applied successfully!"), { applied: !0 };
}
//#endregion
//#region src/main/index.ts
var { PrismaClient: Pe } = p;
j();
var Y = Ee(new Pe({ datasources: { db: { url: process.env.DATABASE_URL } } }));
Oe(Y);
var X = l.dirname(d(import.meta.url));
process.env.DIST = l.join(X, "../dist"), process.env.VITE_PUBLIC = o.isPackaged ? process.env.DIST : l.join(process.env.DIST, "../public");
var Z = null, Q = process.env.VITE_DEV_SERVER_URL;
async function $() {
	Z = new a({
		width: 1200,
		height: 800,
		minWidth: 900,
		minHeight: 600,
		icon: l.join(process.env.VITE_PUBLIC, "favicon.ico"),
		webPreferences: {
			preload: l.join(X, "index.mjs"),
			contextIsolation: !0,
			nodeIntegration: !1
		},
		autoHideMenuBar: !0
	}), Q ? (Z.loadURL(Q), Z.webContents.openDevTools()) : Z.loadFile(l.join(process.env.DIST, "index.html")), Z.on("blur", () => {
		setTimeout(() => {
			if (Z && !Z.isDestroyed() && !Z.isFocused()) {
				let e = a.getFocusedWindow();
				(!e || e === Z) && Z.focus();
			}
		}, 100);
	}), Z.on("focus", () => {
		Z && Z.webContents && Z.webContents.focus();
	}), Z.on("closed", () => {
		Z = null;
	});
}
c.handle("window:focus", () => Z && !Z.isDestroyed() ? (Z.focus(), Z.webContents.focus(), !0) : !1), c.handle("window:is-ready", () => Z && !Z.isDestroyed()), c.handle("dialog:showMessageBox", (e, t) => {
	let n = a.getFocusedWindow() || Z;
	return s.showMessageBox(n, t);
}), c.handle("dialog:showOpenDialog", (e, t) => {
	let n = a.getFocusedWindow() || Z;
	return s.showOpenDialog(n, t);
}), c.handle("dialog:showSaveDialog", (e, t) => {
	let n = a.getFocusedWindow() || Z;
	return s.showSaveDialog(n, t);
}), o.on("window-all-closed", () => {
	process.platform !== "darwin" && (o.quit(), Z = null);
}), o.whenReady().then(async () => {
	let e = !1;
	try {
		await Y.prisma.$connect(), await Y.prisma.$queryRaw`PRAGMA journal_mode=WAL`, await Y.prisma.$queryRaw`PRAGMA synchronous=NORMAL`, await Y.prisma.$queryRaw`PRAGMA cache_size=10000`, await Y.prisma.$queryRaw`PRAGMA temp_store=MEMORY`, console.log("✅ Prisma connected to SQLite successfully."), e = !0;
	} catch (e) {
		let t = [
			`Error: ${e.message || String(e)}`,
			e.code ? `Code: ${e.code}` : "",
			`DATABASE_URL: ${process.env.DATABASE_URL || "(not set)"}`,
			`PRISMA_QUERY_ENGINE_LIBRARY: ${process.env.PRISMA_QUERY_ENGINE_LIBRARY || "(not set)"}`,
			`resourcesPath: ${process.resourcesPath || "(not set)"}`,
			`appPath: ${o.getAppPath()}`
		].filter(Boolean).join("\n");
		console.error("❌ Failed to connect to SQLite:\n" + t);
		try {
			await s.showMessageBox({
				type: "error",
				title: "Error de Base de Datos",
				message: "No se pudo conectar a la base de datos SQLite.",
				detail: `El motor de Prisma no pudo cargarse.\n\n${t}\n\nVerifica que el empaquetado incluya los archivos nativos correctamente.`
			});
		} catch {}
	}
	if (e) {
		let e = await Ne(Y.prisma);
		if (e.error) {
			console.error("❌ Migration error:", e.error);
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
	J(), Y.schedulerService.start(), $(), o.on("activate", () => {
		a.getAllWindows().length === 0 && $();
	});
});
//#endregion
