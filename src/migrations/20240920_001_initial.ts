import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. users
  await knex.schema.createTable("users", (t) => {
    t.increments("id").primary();
    t.string("username").notNullable().unique();
    t.string("password_hash").notNullable();
    t.string("role").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 2. clients
  await knex.schema.createTable("clients", (t) => {
    t.increments("id").primary();
    t.string("dni").notNullable().unique();
    t.string("name").notNullable();
    t.string("phone");
    t.string("code").notNullable().unique();
    t.string("tax_id").unique();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 3. products
  await knex.schema.createTable("products", (t) => {
    t.increments("id").primary();
    t.string("sku").notNullable().unique();
    t.decimal("price_sale", 10, 2).notNullable();
    t.integer("stock").notNullable().defaultTo(0);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 4. cash_registers
  await knex.schema.createTable("cash_registers", (t) => {
    t.increments("id").primary();
    t.timestamp("opened_at").notNullable().defaultTo(knex.fn.now());
    t.decimal("opening_amount", 10, 2).notNullable();
    t.decimal("total_sales", 10, 2).notNullable().defaultTo(0);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 5. sales
  await knex.schema.createTable("sales", (t) => {
    t.increments("id").primary();
    t.integer("cash_register_id").unsigned().notNullable().references("id").inTable("cash_registers");
    t.integer("client_id").unsigned().notNullable().references("id").inTable("clients");
    t.decimal("total", 10, 2).notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 6. sale_items
  await knex.schema.createTable("sale_items", (t) => {
    t.increments("id").primary();
    t.integer("sale_id").unsigned().notNullable().references("id").inTable("sales");
    t.integer("product_id").unsigned().notNullable().references("id").inTable("products");
    t.integer("quantity").notNullable();
    t.decimal("unit_price", 10, 2).notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 7. inventory_movements
  await knex.schema.createTable("inventory_movements", (t) => {
    t.increments("id").primary();
    t.integer("product_id").unsigned().notNullable().references("id").inTable("products");
    t.string("type").notNullable(); // ENTRADA or SALIDA
    t.integer("quantity").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // 8. audit_logs
  await knex.schema.createTable("audit_logs", (t) => {
    t.increments("id").primary();
    t.integer("user_id").unsigned().notNullable().references("id").inTable("users");
    t.string("action").notNullable();
    t.string("entity").notNullable();
    t.integer("entity_id").notNullable();
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  // Triggers para logic_business (incrementar y decrementar stock automático)
  await knex.raw(`
    CREATE TRIGGER trg_inventory_entrada
    AFTER INSERT ON inventory_movements
    WHEN NEW.type = 'ENTRADA'
    BEGIN
      UPDATE products 
      SET stock = stock + NEW.quantity 
      WHERE id = NEW.product_id;
    END;
  `);

  await knex.raw(`
    CREATE TRIGGER trg_inventory_salida
    AFTER INSERT ON inventory_movements
    WHEN NEW.type = 'SALIDA'
    BEGIN
      UPDATE products 
      SET stock = stock - NEW.quantity 
      WHERE id = NEW.product_id;
    END;
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Eliminar triggers
  await knex.raw(`DROP TRIGGER IF EXISTS trg_inventory_entrada`);
  await knex.raw(`DROP TRIGGER IF EXISTS trg_inventory_salida`);

  // Eliminar tablas en orden inverso respetando FK restrictions
  await knex.schema.dropTableIfExists("audit_logs");
  await knex.schema.dropTableIfExists("inventory_movements");
  await knex.schema.dropTableIfExists("sale_items");
  await knex.schema.dropTableIfExists("sales");
  await knex.schema.dropTableIfExists("cash_registers");
  await knex.schema.dropTableIfExists("products");
  await knex.schema.dropTableIfExists("clients");
  await knex.schema.dropTableIfExists("users");
}
