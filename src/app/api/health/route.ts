import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";

export const dynamic = "force-dynamic";

/** Liveness + database check, used by the Docker healthcheck and uptime monitoring. */
export async function GET(): Promise<Response> {
  try {
    const db = await getDb();
    await db.execute(sql`select 1`);
    return Response.json({ status: "ok" }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    console.error("[health] database check failed", err);
    return Response.json({ status: "error", database: "unreachable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
