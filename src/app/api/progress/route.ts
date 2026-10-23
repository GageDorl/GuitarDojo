import { handleGetProgress } from "@/server/progress/handlers";

export const dynamic = "force-dynamic";

export const GET = (request: Request) => handleGetProgress(request);
