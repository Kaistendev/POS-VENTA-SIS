import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'pos-web';
const DB_VERSION = 1;

interface KVEntry {
  key: string;
  value: unknown;
}

let dbPromise: Promise<IDBPDatabase<unknown>> | null = null;

export function getDB(): Promise<IDBPDatabase<unknown>> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('kv')) {
          db.createObjectStore('kv', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function kvGet<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const entry = await db.get('kv', key) as KVEntry | undefined;
  return entry?.value as T | undefined;
}

export async function kvSet(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('kv', { key, value });
}

export async function kvDelete(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('kv', key);
}

export async function kvKeys(): Promise<string[]> {
  const db = await getDB();
  return db.getAllKeys('kv') as Promise<string[]>;
}

export async function migrateFromLocalStorage(): Promise<boolean> {
  const migrated = await kvGet('_migrated');
  if (migrated) return false;

  const keys = Object.keys(localStorage);
  let count = 0;

  for (const key of keys) {
    if (key.startsWith('pos-')) {
      const raw = localStorage.getItem(key);
      if (raw) {
        await kvSet(key, JSON.parse(raw));
        count++;
      }
    }
  }

  if (count > 0) {
    await kvSet('_migrated', true);
  }

  return count > 0;
}

export async function clearIndexedDB(): Promise<void> {
  const db = await getDB();
  await db.clear('kv');
}

export const zustandStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await kvGet<string>(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await kvSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await kvDelete(name);
  },
};
