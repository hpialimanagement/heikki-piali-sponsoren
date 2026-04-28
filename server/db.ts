import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, InsertSponsor, sponsors } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================
// In-Memory Fallback (used when no DATABASE_URL is set)
// Data persists during runtime but resets on server restart
// ============================================================
let inMemorySponsors: any[] = [];
let nextSponsorId = 1;
let inMemoryUsers: any[] = [];

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    const idx = inMemoryUsers.findIndex(u => u.openId === user.openId);
    const userData = { ...user, lastSignedIn: user.lastSignedIn || new Date() };
    if (idx >= 0) {
      inMemoryUsers[idx] = { ...inMemoryUsers[idx], ...userData };
    } else {
      inMemoryUsers.push(userData);
    }
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    return inMemoryUsers.find(u => u.openId === openId);
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSponsorById(id: number) {
  const db = await getDb();
  if (!db) {
    return inMemorySponsors.find(s => s.id === id);
  }
  const result = await db.select().from(sponsors).where(eq(sponsors.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSponsors() {
  const db = await getDb();
  if (!db) {
    return [...inMemorySponsors].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  return await db.select().from(sponsors).orderBy(sponsors.createdAt);
}

export async function createSponsor(data: InsertSponsor) {
  const db = await getDb();
  if (!db) {
    const newSponsor = {
      id: nextSponsorId++,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemorySponsors.push(newSponsor);
    return newSponsor;
  }
  const result = await db.insert(sponsors).values(data);
  const id = result[0]?.insertId;
  if (!id) throw new Error("Failed to create sponsor");
  return getSponsorById(id);
}

export async function updateSponsor(id: number, data: Partial<InsertSponsor>) {
  const db = await getDb();
  if (!db) {
    const idx = inMemorySponsors.findIndex(s => s.id === id);
    if (idx < 0) throw new Error("Sponsor not found");
    inMemorySponsors[idx] = { ...inMemorySponsors[idx], ...data, updatedAt: new Date() };
    return inMemorySponsors[idx];
  }
  await db.update(sponsors).set(data).where(eq(sponsors.id, id));
  return getSponsorById(id);
}

export async function deleteSponsor(id: number) {
  const db = await getDb();
  if (!db) {
    inMemorySponsors = inMemorySponsors.filter(s => s.id !== id);
    return true;
  }
  await db.delete(sponsors).where(eq(sponsors.id, id));
  return true;
}
