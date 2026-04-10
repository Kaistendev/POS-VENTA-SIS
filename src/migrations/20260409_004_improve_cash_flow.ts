import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  // 1. Mejorar tabla de Caja
  await knex.schema.alterTable("cash_registers", (t) => {
    t.timestamp("closed_at");
    t.decimal("closing_amount", 10, 2);
    t.string("status").defaultTo("OPEN"); // OPEN or CLOSED
    t.decimal("cash_sales", 10, 2).defaultTo(0);
    t.decimal("card_sales", 10, 2).defaultTo(0);
  });

  // 2. Mejorar tabla de Ventas
  await knex.schema.alterTable("sales", (t) => {
    t.string("payment_method").defaultTo("CASH"); // CASH or CARD
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("cash_registers", (t) => {
    t.dropColumn("closed_at");
    t.dropColumn("closing_amount");
    t.dropColumn("status");
    t.dropColumn("cash_sales");
    t.dropColumn("card_sales");
  });
  await knex.schema.alterTable("sales", (t) => {
    t.dropColumn("payment_method");
  });
}
