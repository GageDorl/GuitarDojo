import { handlePostEvents } from "@/server/progress/handlers";

export const dynamic = "force-dynamic";

export const POST = (request: Request) => handlePostEvents(request);
