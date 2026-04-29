import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { createSponsor, updateSponsor, deleteSponsor, getAllSponsors, getSponsorById } from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    login: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(({ ctx }) => {
        // Kein Passwort erforderlich - immer erfolgreich
        const cookieOptions = getSessionCookieOptions(ctx.req);
        const tenYearsInSeconds = 10 * 365 * 24 * 60 * 60;
        ctx.res.setHeader("Set-Cookie", [
          `${COOKIE_NAME}=authenticated; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=${tenYearsInSeconds}`,
        ]);
        return { success: true };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    
    me: publicProcedure.query(() => {
      // Immer authentifiziert
      return { isAuthenticated: true };
    }),
  }),

  sponsors: router({
    // Sponsoren-Liste: ÖFFENTLICH
    list: publicProcedure.query(async () => {
      return await getAllSponsors();
    }),
    
    get: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await getSponsorById(input.id);
      }),
    
    // Sponsor erstellen: ÖFFENTLICH
    create: publicProcedure
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
    
    // Sponsor aktualisieren: ÖFFENTLICH
    update: publicProcedure
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
    
    // Sponsor löschen: ÖFFENTLICH
    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await deleteSponsor(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
