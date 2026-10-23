/**
 * Test helpers: a fresh in-memory PostgreSQL (PGlite) with all migrations applied, plus users.
 */
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import type { Database } from "@/server/db";
import { schema } from "@/server/db/schema";

export async function freshDb(): Promise<{ db: Database; close: () => Promise<void> }> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  return { db: db as unknown as Database, close: () => client.close() };
}

export async function insertUser(db: Database, id: string, email = `${id}@example.com`) {
  await db.insert(schema.user).values({ id, name: id, email, emailVerified: true });
}
