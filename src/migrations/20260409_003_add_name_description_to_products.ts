import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("products", (t) => {
    t.string("name").notNullable().defaultTo("");
    t.text("description");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("products", (t) => {
    t.dropColumn("name");
    t.dropColumn("description");
  });
}
