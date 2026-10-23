import { handleImport } from "@/server/progress/handlers";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => handleImport(request);
