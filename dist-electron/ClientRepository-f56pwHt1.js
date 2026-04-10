import knex from "knex";
import path from "path";
import { fileURLToPath } from "url";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region knexfile.ts
var __filename = fileURLToPath(import.meta.url);
path.dirname(__filename);
var config = {
	development: {
		client: "sqlite3",
		connection: { filename: path.join(process.cwd(), "dev.sqlite3") },
		useNullAsDefault: true,
		migrations: { directory: path.join(process.cwd(), "src", "migrations") }
	},
	production: {
		client: "sqlite3",
		connection: { filename: path.join(process.cwd(), "prod.sqlite3") },
		useNullAsDefault: true,
		migrations: { directory: path.join(process.cwd(), "src", "migrations") }
	}
};
//#endregion
//#region src/main/db.ts
var db = knex(config[process.env.NODE_ENV === "production" ? "production" : "development"] || config);
//#endregion
//#region src/main/repositories/ClientRepository.ts
var ClientRepository_exports = /* @__PURE__ */ __exportAll({ ClientRepository: () => ClientRepository });
var ClientRepository = class {
	static tableName = "clients";
	static async findAll() {
		return db(this.tableName).select("*");
	}
	static async findById(id) {
		return db(this.tableName).where({ id }).first();
	}
	static async findByDni(dni) {
		return db(this.tableName).where({ dni }).first();
	}
	static async create(client) {
		return db(this.tableName).insert(client).returning("id");
	}
	static async update(id, client) {
		return db(this.tableName).where({ id }).update({
			...client,
			updated_at: db.fn.now()
		});
	}
	static async delete(id) {
		return db(this.tableName).where({ id }).delete();
	}
};
//#endregion
export { ClientRepository_exports as n, db as r, ClientRepository as t };
