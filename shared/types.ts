/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

export type Sponsor = {
  id: number;
  companyName: string;
  contactPerson: string;
  email: string;
  notes?: string | null;
  status: "Noch nicht kontaktiert" | "E-Mail in Vorbereitung" | "E-Mail gesendet" | "Antwort erhalten" | "Absage" | "Zusage/Partner";
  emailSentDate?: Date | null;
  responseDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};
