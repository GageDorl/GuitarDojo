/**
 * Content access control: one pure function that answers "may this person open this lesson?".
 *
 * Three independent inputs feed it, and none of them know about the others:
 *  - the content's access POLICY (src/content/access.ts; every course defaults to public),
 *  - who the person is: signed in or not, and their permission ROLE,
 *  - their commercial ENTITLEMENTS (subscriptions, purchases, promotions, admin grants).
 *
 * Rendering never decides access; the server calls this before sending lesson content, and the
 * progress API calls it before accepting events. Payment providers will only ever *create
 * entitlements*; they never call this module directly.
 */

/** What a piece of content requires. Stable product ids name things that can be sold or granted. */
export type AccessPolicy =
  /** Anyone, no account needed. The default for all current content (free public beta). */
  | { readonly kind: "public" }
  /** Free, but requires a signed-in account. */
  | { readonly kind: "account" }
  /** Requires an entitlement to the course itself or to any of the listed products. */
  | { readonly kind: "entitlement"; readonly products: readonly string[] };

export const PUBLIC: AccessPolicy = { kind: "public" };

/** How an entitlement was obtained. Commercial origin is recorded, never inferred from roles. */
export type EntitlementSource = "subscription" | "purchase" | "promotion" | "complimentary" | "admin-grant";

/** A right to access something, optionally time-limited. */
export interface Entitlement {
  readonly scope: { readonly kind: "course"; readonly courseId: string } | { readonly kind: "product"; readonly productId: string };
  readonly source: EntitlementSource;
  readonly startsAt?: string;
  /** ISO time after which the entitlement no longer applies; absent means it doesn't expire. */
  readonly expiresAt?: string | null;
}

/** Permission roles (who can administer the site). Separate from entitlements (what they've paid for). */
export type Role = "user" | "admin";

export interface AccessSubject {
  readonly userId: string | null;
  readonly role: Role;
  readonly entitlements: readonly Entitlement[];
}

export const ANONYMOUS: AccessSubject = { userId: null, role: "user", entitlements: [] };

export type AccessDecision =
  | { readonly allowed: true; readonly via: "public" | "account" | "entitlement" | "staff-preview" }
  | { readonly allowed: false; readonly reason: "sign-in-required" }
  | { readonly allowed: false; readonly reason: "entitlement-required"; readonly products: readonly string[] };

export function isEntitlementActive(e: Entitlement, now: Date): boolean {
  if (e.startsAt && new Date(e.startsAt) > now) return false;
  if (e.expiresAt && new Date(e.expiresAt) <= now) return false;
  return true;
}

/**
 * Staff may preview paid content to review it. This is a *permission*, not a purchase: it is
 * kept separate so analytics and billing never mistake admins for customers.
 */
export function canPreviewAllContent(role: Role): boolean {
  return role === "admin";
}

export function decideAccess(
  policy: AccessPolicy,
  subject: AccessSubject,
  context: { readonly courseId: string; readonly now?: Date },
): AccessDecision {
  if (policy.kind === "public") return { allowed: true, via: "public" };
  if (!subject.userId) return { allowed: false, reason: "sign-in-required" };
  if (policy.kind === "account") return { allowed: true, via: "account" };

  const now = context.now ?? new Date();
  const grants = subject.entitlements.some(
    (e) =>
      isEntitlementActive(e, now) &&
      ((e.scope.kind === "course" && e.scope.courseId === context.courseId) ||
        (e.scope.kind === "product" && policy.products.includes(e.scope.productId))),
  );
  if (grants) return { allowed: true, via: "entitlement" };
  if (canPreviewAllContent(subject.role)) return { allowed: true, via: "staff-preview" };
  return { allowed: false, reason: "entitlement-required", products: policy.products };
}
