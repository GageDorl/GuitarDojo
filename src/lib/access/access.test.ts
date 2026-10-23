import { describe, expect, it } from "vitest";
import { COURSE_ACCESS, coursePolicy, lessonPolicy } from "@/content/access";
import { type AccessPolicy, type AccessSubject, ANONYMOUS, decideAccess } from ".";
import { COURSES } from "@/content";

const now = new Date("2026-06-01T00:00:00Z");
const member = (overrides: Partial<AccessSubject> = {}): AccessSubject => ({ userId: "u1", role: "user", entitlements: [], ...overrides });
const premium: AccessPolicy = { kind: "entitlement", products: ["premium"] };

describe("decideAccess", () => {
  it("lets anyone open public content", () => {
    expect(decideAccess({ kind: "public" }, ANONYMOUS, { courseId: "c" })).toEqual({ allowed: true, via: "public" });
  });

  it("requires sign-in for account-only content", () => {
    expect(decideAccess({ kind: "account" }, ANONYMOUS, { courseId: "c" })).toEqual({ allowed: false, reason: "sign-in-required" });
    expect(decideAccess({ kind: "account" }, member(), { courseId: "c" }).allowed).toBe(true);
  });

  it("requires an active entitlement for premium content", () => {
    expect(decideAccess(premium, ANONYMOUS, { courseId: "c", now })).toMatchObject({ allowed: false, reason: "sign-in-required" });
    expect(decideAccess(premium, member(), { courseId: "c", now })).toMatchObject({ allowed: false, reason: "entitlement-required" });
    const subscriber = member({ entitlements: [{ scope: { kind: "product", productId: "premium" }, source: "subscription", expiresAt: "2026-07-01T00:00:00Z" }] });
    expect(decideAccess(premium, subscriber, { courseId: "c", now })).toEqual({ allowed: true, via: "entitlement" });
    const buyer = member({ entitlements: [{ scope: { kind: "course", courseId: "c" }, source: "purchase" }] });
    expect(decideAccess(premium, buyer, { courseId: "c", now }).allowed).toBe(true);
    expect(decideAccess(premium, buyer, { courseId: "other", now }).allowed).toBe(false);
  });

  it("ignores expired and not-yet-started entitlements", () => {
    const expired = member({ entitlements: [{ scope: { kind: "product", productId: "premium" }, source: "promotion", expiresAt: "2026-05-01T00:00:00Z" }] });
    const future = member({ entitlements: [{ scope: { kind: "product", productId: "premium" }, source: "complimentary", startsAt: "2026-07-01T00:00:00Z" }] });
    expect(decideAccess(premium, expired, { courseId: "c", now }).allowed).toBe(false);
    expect(decideAccess(premium, future, { courseId: "c", now }).allowed).toBe(false);
  });

  it("treats admin as a preview permission, not a purchase", () => {
    expect(decideAccess(premium, member({ role: "admin" }), { courseId: "c", now })).toEqual({ allowed: true, via: "staff-preview" });
  });
});

describe("content access rules", () => {
  it("keeps every course free and public during the beta", () => {
    expect(Object.keys(COURSE_ACCESS)).toHaveLength(0);
    for (const course of COURSES) {
      expect(coursePolicy(course.id)).toEqual({ kind: "public" });
      for (const m of course.modules) for (const l of m.lessons) expect(lessonPolicy(course.id, l.id).kind).toBe("public");
    }
  });

  it("supports a free preview lesson inside a paid course", () => {
    const rules = { paid: { course: premium, lessons: { intro: { kind: "public" } as AccessPolicy } } };
    expect(lessonPolicy("paid", "intro", rules).kind).toBe("public");
    expect(lessonPolicy("paid", "lesson-2", rules)).toEqual(premium);
    expect(lessonPolicy("free-course", "x", rules).kind).toBe("public");
  });
});
