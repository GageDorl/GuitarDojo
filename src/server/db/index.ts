import "server-only";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { getEnv } from "@/server/env";
import { schema } from "./schema";

/**
 * Database access. Production uses PostgreSQL through postgres.js. Local development and tests
 * can use PGlite (PostgreSQL compiled to WebAssembly) via DATABASE_URL=pglite://<dir>|memory, so
 * the same schema and migrations run without Docker.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

interface DbHandle {
  db: Database;
  close: () => Promise<void>;
}

const globalForDb = globalThis as unknown as { __guitarDojoDb?: Promise<DbHandle> };

async function connect(url: string): Promise<DbHandle> {
  if (url.startsWith("pglite:")) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const { migrate } = await import("drizzle-orm/pglite/migrator");
    const location = url.slice("pglite://".length);
    const client = location === "memory" || location === "" ? new PGlite() : new PGlite(location);
    const db = drizzle(client, { schema });
    // Local databases migrate themselves on first use; production runs migrations as a separate step.
    await migrate(db, { migrationsFolder: "drizzle" });
    return { db: db as unknown as Database, close: () => client.close() };
  }
  const { default: postgres } = await import("postgres");
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const client = postgres(url, { max: 10, idle_timeout: 30, connect_timeout: 10 });
  const db = drizzle(client, { schema });
  return { db: db as unknown as Database, close: () => client.end({ timeout: 5 }) };
}

/** Shared connection (one per process, survives dev hot reloads). */
export function getDb(): Promise<Database> {
  globalForDb.__guitarDojoDb ??= connect(getEnv().DATABASE_URL);
  return globalForDb.__guitarDojoDb.then((h) => h.db);
}

/** For tests: close and forget the shared connection. */
export async function resetDbForTests(): Promise<void> {
  const handle = globalForDb.__guitarDojoDb;
  globalForDb.__guitarDojoDb = undefined;
  if (handle) await (await handle).close();
}

export { schema };
