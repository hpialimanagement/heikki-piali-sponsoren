import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, InsertSponsor, sponsors } from "../drizzle/schema";
import { ENV } from './_core/env';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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
// Dateibasierte Speicherung (GitHub)
// ============================================================
const DATA_DIR = path.join(process.cwd(), 'data');
const SPONSORS_FILE = path.join(DATA_DIR, 'sponsors.json');

// Stelle sicher, dass das Verzeichnis existiert
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialisiere die Datei, falls sie nicht existiert
if (!fs.existsSync(SPONSORS_FILE)) {
  fs.writeFileSync(SPONSORS_FILE, JSON.stringify([], null, 2));
}

// Lade Sponsoren aus der Datei
function loadSponsorsFromFile(): any[] {
  try {
    const data = fs.readFileSync(SPONSORS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn("[File] Error reading sponsors:", error);
    return [];
  }
}

// Speichere Sponsoren in der Datei und committe zu Git
function saveSponsoresToFile(sponsors: any[], message: string = 'Update sponsors data') {
  try {
    fs.writeFileSync(SPONSORS_FILE, JSON.stringify(sponsors, null, 2));
    
    // Versuche, zu Git zu committen
    try {
      execSync(`git add data/sponsors.json && git commit -m "${message}" 2>/dev/null || true`, {
        cwd: process.cwd(),
        stdio: 'pipe'
      });
    } catch (gitError) {
      // Git-Fehler ignorieren
    }
  } catch (error) {
    console.error("[File] Error writing sponsors:", error);
  }
}

// In-Memory Fallback (für Entwicklung ohne Datei)
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
    // Versuche zuerst aus der Datei zu laden
    const fileSponsors = loadSponsorsFromFile();
    const fromFile = fileSponsors.find(s => s.id === id);
    if (fromFile) return fromFile;
    
    // Fallback auf In-Memory
    return inMemorySponsors.find(s => s.id === id);
  }
  const result = await db.select().from(sponsors).where(eq(sponsors.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSponsors() {
  const db = await getDb();
  if (!db) {
    // Lade aus Datei, wenn vorhanden
    const fileSponsors = loadSponsorsFromFile();
    if (fileSponsors.length > 0) {
      return fileSponsors.sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    }
    
    // Fallback auf In-Memory
    return [...inMemorySponsors].sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  return await db.select().from(sponsors).orderBy(sponsors.createdAt);
}

export async function createSponsor(data: InsertSponsor) {
  const db = await getDb();
  if (!db) {
    const sponsors = loadSponsorsFromFile();
    const nextId = sponsors.length > 0 ? Math.max(...sponsors.map(s => s.id)) + 1 : 1;
    
    const newSponsor = {
      id: nextId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    sponsors.push(newSponsor);
    saveSponsoresToFile(sponsors, `Add sponsor: ${newSponsor.companyName}`);
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
    const sponsors = loadSponsorsFromFile();
    const idx = sponsors.findIndex(s => s.id === id);
    if (idx < 0) throw new Error("Sponsor not found");
    sponsors[idx] = { ...sponsors[idx], ...data, updatedAt: new Date() };
    saveSponsoresToFile(sponsors, `Update sponsor: ${sponsors[idx].companyName}`);
    return sponsors[idx];
  }
  await db.update(sponsors).set(data).where(eq(sponsors.id, id));
  return getSponsorById(id);
}

export async function deleteSponsor(id: number) {
  const db = await getDb();
  if (!db) {
    const sponsors = loadSponsorsFromFile();
    const deleted = sponsors.find(s => s.id === id);
    const filtered = sponsors.filter(s => s.id !== id);
    saveSponsoresToFile(filtered, `Delete sponsor: ${deleted?.companyName || 'Unknown'}`);
    return true;
  }
  await db.delete(sponsors).where(eq(sponsors.id, id));
  return true;
}
