import { defineConfig } from "drizzle-kit";

/**
 * `npm run db:generate` turns schema changes into versioned SQL migrations in ./drizzle.
 * Migrations are committed and applied in production by `npm run db:migrate` (the `migrate`
 * service in compose.yaml). Never edit a migration that has already been applied in production.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
});
