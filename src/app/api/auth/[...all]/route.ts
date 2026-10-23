import { getAuth } from "@/server/auth";

export const dynamic = "force-dynamic";

/** Better Auth endpoints: sign-up, sign-in, sign-out, verification, password reset, session. */
async function handler(request: Request): Promise<Response> {
  const auth = await getAuth();
  return auth.handler(request);
}

export const GET = handler;
export const POST = handler;
