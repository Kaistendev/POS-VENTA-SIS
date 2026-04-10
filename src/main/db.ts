import knex from "knex";
import config from "../../knexfile.js";

// En producción el archivo config se exporta distinto o usa las variables de app
const environment =
  process.env.NODE_ENV === "production" ? "production" : "development";
const db = knex((config as any)[environment] || config);

export default db;
