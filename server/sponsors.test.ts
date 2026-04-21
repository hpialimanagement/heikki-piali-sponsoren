import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(isAuthenticated: boolean = false): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      cookies: isAuthenticated ? { [COOKIE_NAME]: "authenticated" } : {},
    } as any as TrpcContext["req"],
    res: {
      setHeader: () => {},
      clearCookie: () => {},
    } as any as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth", () => {
  it("login with correct password", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({ password: "Management67" });
    expect(result).toEqual({ success: true });
  });

  it("login with incorrect password throws error", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.auth.login({ password: "WrongPassword" });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Falsches Passwort");
    }
  });

  it("me returns isAuthenticated false when not authenticated", async () => {
    const { ctx } = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result.isAuthenticated).toBe(false);
  });

  it("me returns isAuthenticated true when authenticated", async () => {
    const { ctx } = createAuthContext(true);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result.isAuthenticated).toBe(true);
  });
});

describe("sponsors (protected)", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("list throws error when not authenticated", async () => {
    const { ctx } = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.sponsors.list();
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Authentifizierung erforderlich");
    }
  });

  it("create throws error when not authenticated", async () => {
    const { ctx } = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.sponsors.create({
        companyName: "Test Corp",
        contactPerson: "John Doe",
        email: "john@example.com",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Authentifizierung erforderlich");
    }
  });

  it("update throws error when not authenticated", async () => {
    const { ctx } = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.sponsors.update({
        id: 1,
        companyName: "Updated Corp",
      });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Authentifizierung erforderlich");
    }
  });

  it("delete throws error when not authenticated", async () => {
    const { ctx } = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.sponsors.delete({ id: 1 });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Authentifizierung erforderlich");
    }
  });

  it("get throws error when not authenticated", async () => {
    const { ctx } = createAuthContext(false);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.sponsors.get({ id: 1 });
      expect.fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toContain("Authentifizierung erforderlich");
    }
  });

  it("create validates required fields", async () => {
    const { ctx } = createAuthContext(true);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.sponsors.create({
        companyName: "",
        contactPerson: "John Doe",
        email: "john@example.com",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toBeDefined();
    }
  });

  it("create validates email format", async () => {
    const { ctx } = createAuthContext(true);
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.sponsors.create({
        companyName: "Test Corp",
        contactPerson: "John Doe",
        email: "invalid-email",
      });
      expect.fail("Should have thrown validation error");
    } catch (error: any) {
      expect(error.message).toBeDefined();
    }
  });

  it("create accepts valid status values", async () => {
    const { ctx } = createAuthContext(true);
    const caller = appRouter.createCaller(ctx);

    // Mock the database function
    const mockSponsor = {
      id: 1,
      companyName: "Test Corp",
      contactPerson: "John Doe",
      email: "john@example.com",
      notes: null,
      status: "E-Mail gesendet" as const,
      emailSentDate: null,
      responseDate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(db, "createSponsor").mockResolvedValue(mockSponsor);

    const result = await caller.sponsors.create({
      companyName: "Test Corp",
      contactPerson: "John Doe",
      email: "john@example.com",
      status: "E-Mail gesendet",
    });

    expect(result).toBeDefined();
    expect(result?.status).toBe("E-Mail gesendet");
  });

  it("update accepts valid status values", async () => {
    const { ctx } = createAuthContext(true);
    const caller = appRouter.createCaller(ctx);

    const mockSponsor = {
      id: 1,
      companyName: "Test Corp",
      contactPerson: "John Doe",
      email: "john@example.com",
      notes: null,
      status: "Antwort erhalten" as const,
      emailSentDate: new Date(),
      responseDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.spyOn(db, "updateSponsor").mockResolvedValue(mockSponsor);

    const result = await caller.sponsors.update({
      id: 1,
      status: "Antwort erhalten",
      responseDate: new Date(),
    });

    expect(result).toBeDefined();
    expect(result?.status).toBe("Antwort erhalten");
  });
});
