import { Knex } from "knex";
import path from "path";
import { fileURLToPath } from "url";

// Resolving __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "sqlite3",
    connection: {
      filename: path.join(process.cwd(), "dev.sqlite3"),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(process.cwd(), "src", "migrations"),
    },
  },
  production: {
    client: "sqlite3",
    connection: {
      filename: path.join(process.cwd(), "prod.sqlite3"),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.join(process.cwd(), "src", "migrations"),
    },
  },
};

export default config;
