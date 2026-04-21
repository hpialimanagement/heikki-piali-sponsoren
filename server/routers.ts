import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createSponsor, updateSponsor, deleteSponsor, getAllSponsors, getSponsorById } from "./db";
import { TRPCError } from "@trpc/server";

const MASTER_PASSWORD = "Management67";

// Middleware to check password authentication
const authenticatedProcedure = publicProcedure.use(({ ctx, next }) => {
  const isAuthenticated = ctx.req.cookies?.[COOKIE_NAME] === "authenticated";
  if (!isAuthenticated) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentifizierung erforderlich",
    });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ input, ctx }) => {
        if (input.password !== MASTER_PASSWORD) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Falsches Passwort",
          });
        }
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.setHeader("Set-Cookie", [
          `${COOKIE_NAME}=authenticated; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=86400`,
        ]);
        return { success: true };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    me: publicProcedure.query(({ ctx }) => {
      const isAuthenticated = ctx.req.cookies?.[COOKIE_NAME] === "authenticated";
      return { isAuthenticated };
    }),
  }),

  sponsors: router({
    list: authenticatedProcedure.query(async () => {
      return await getAllSponsors();
    }),
    
    get: authenticatedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getSponsorById(input.id);
      }),
    
    create: authenticatedProcedure
      .input(z.object({
        companyName: z.string().min(1),
        contactPerson: z.string().min(1),
        email: z.string().email(),
        notes: z.string().optional(),
        status: z.enum([
          "Noch nicht kontaktiert",
          "E-Mail in Vorbereitung",
          "E-Mail gesendet",
          "Antwort erhalten",
          "Absage",
          "Zusage/Partner"
        ]).default("Noch nicht kontaktiert"),
      }))
      .mutation(async ({ input }) => {
        return await createSponsor(input);
      }),
    
    update: authenticatedProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().min(1).optional(),
        contactPerson: z.string().min(1).optional(),
        email: z.string().email().optional(),
        notes: z.string().optional(),
        status: z.enum([
          "Noch nicht kontaktiert",
          "E-Mail in Vorbereitung",
          "E-Mail gesendet",
          "Antwort erhalten",
          "Absage",
          "Zusage/Partner"
        ]).optional(),
        emailSentDate: z.date().optional().nullable(),
        responseDate: z.date().optional().nullable(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        return await updateSponsor(id, data);
      }),
    
    delete: authenticatedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteSponsor(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
