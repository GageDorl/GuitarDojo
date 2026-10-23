import "server-only";
import { type AccessDecision, type AccessSubject, type Entitlement, ANONYMOUS, decideAccess } from "@/lib/access";
import { COURSE_ACCESS, lessonPolicy } from "@/content";
import type { CourseAccessRule } from "@/content/access";
import type { SessionUser } from "@/server/auth";

let rules: Readonly<Record<string, CourseAccessRule>> = COURSE_ACCESS;

/** For tests: simulate paid courses without changing the real (all-free) rule table. */
export function setAccessRulesForTests(next: Readonly<Record<string, CourseAccessRule>> = COURSE_ACCESS) {
  rules = next;
}

/**
 * Where entitlements come from. During the free beta nothing is sold, so there are none.
 *
 * FUTURE (payments): add an `entitlement` table (user_id, scope_kind, scope_id, source,
 * starts_at, expires_at, external_ref) and implement this with a query. A payment provider's
 * webhook (e.g. POST /api/webhooks/stripe) verifies the event signature, then inserts, extends
 * or expires entitlement rows. Nothing else in the app changes.
 */
export interface EntitlementProvider {
  getEntitlements(userId: string): Promise<readonly Entitlement[]>;
}

export const noEntitlements: EntitlementProvider = { getEntitlements: async () => [] };

let provider: EntitlementProvider = noEntitlements;

export function setEntitlementProviderForTests(p: EntitlementProvider = noEntitlements) {
  provider = p;
}

export async function subjectFor(user: SessionUser | null): Promise<AccessSubject> {
  if (!user) return ANONYMOUS;
  return { userId: user.id, role: user.role, entitlements: await provider.getEntitlements(user.id) };
}

/**
 * Server-side authorization for a lesson. Public lessons are allowed without touching the
 * session, which keeps free pages statically rendered.
 */
export async function authorizeLesson(
  courseId: string,
  lessonId: string,
  getUser: () => Promise<SessionUser | null>,
): Promise<AccessDecision> {
  const policy = lessonPolicy(courseId, lessonId, rules);
  if (policy.kind === "public") return { allowed: true, via: "public" };
  return decideAccess(policy, await subjectFor(await getUser()), { courseId });
}
