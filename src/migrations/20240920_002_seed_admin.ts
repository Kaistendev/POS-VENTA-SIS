import type { Knex } from "knex";
import bcrypt from "bcryptjs";

export async function up(knex: Knex): Promise<void> {
  // Verificamos si ya existe un admin para evitar duplicados si se reinician las migraciones
  const adminExists = await knex("users").where({ username: "admin" }).first();

  if (!adminExists) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin", salt);

    await knex("users").insert({
      username: "admin",
      password_hash: hashedPassword,
      role: "ADMIN",
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    });

    console.log('--- ADMIN USER CREATED SUCCESSFULLY (admin / admin) ---');
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex("users").where({ username: "admin" }).del();
}
