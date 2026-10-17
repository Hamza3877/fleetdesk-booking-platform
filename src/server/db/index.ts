import type { Sql } from "postgres";
import { createMemoryRepository, resetMemoryDb } from "@/server/db/memoryRepository";
import { ensureDatabaseReady, replaceAllData } from "@/server/db/postgresAdmin";
import { createPostgresRepository, createSql } from "@/server/db/postgresRepository";
import type { Repository } from "@/server/db/repository";
import { buildSeedData } from "@/server/db/seed";

/**
 * Picks the data store for the whole app:
 *   - DATABASE_URL is set  -> PostgreSQL (Supabase)
 *   - otherwise            -> demo data in memory
 *
 * It is created once and kept on `globalThis` so hot reloading doesn't open new connections.
 */

const globalForRepo = globalThis as unknown as { __fleetdeskRepo?: Repository; __fleetdeskSql?: Sql };

/**
 * A new database has no tables yet. Before the app's first query, create them and load the demo data
 * (once, see ensureDatabaseReady). If that fails (for example a wrong password) it is tried again on the next request.
 */
function createSetupCheck(sql: Sql): () => Promise<void> {
  let pending: Promise<void> | undefined;
  return () => {
    pending ??= ensureDatabaseReady(sql).catch((error) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}

/** Makes every method of a repository wait for the one-time setup check first. */
function waitForSetup<T extends object>(repo: T, setupCheck: () => Promise<void>): T {
  const wrapped: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(repo)) {
    wrapped[name] =
      typeof value === "function"
        ? async (...args: unknown[]) => {
            await setupCheck();
            return value.apply(repo, args);
          }
        : value;
  }
  return wrapped as T;
}

export function isDatabaseEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function getRepository(): Repository {
  if (!globalForRepo.__fleetdeskRepo) {
    const url = process.env.DATABASE_URL;
    if (url) {
      const sql = createSql(url);
      const repo = createPostgresRepository(sql);
      const setupCheck = createSetupCheck(sql);
      globalForRepo.__fleetdeskSql = sql;
      globalForRepo.__fleetdeskRepo = {
        vehicles: waitForSetup(repo.vehicles, setupCheck),
        bookings: waitForSetup(repo.bookings, setupCheck),
        settings: waitForSetup(repo.settings, setupCheck),
      };
    } else {
      globalForRepo.__fleetdeskRepo = createMemoryRepository();
    }
  }
  return globalForRepo.__fleetdeskRepo;
}

/**
 * Put the demo data back (fresh vehicles, bookings and settings, with dates relative to today).
 * Used by the "Reset demo data" button, so a live demo link can be restored after visitors have played with it.
 */
export async function resetDemoData(): Promise<void> {
  getRepository(); // makes sure the store (and its connection) exists
  const sql = globalForRepo.__fleetdeskSql;
  if (sql) {
    await ensureDatabaseReady(sql); // the tables must exist before they can be emptied
    await replaceAllData(sql, buildSeedData());
  } else {
    resetMemoryDb();
  }
}

/** Forget the chosen store so the next call picks again. Used by tests. */
export function resetRepositoryChoice(): void {
  globalForRepo.__fleetdeskRepo = undefined;
  globalForRepo.__fleetdeskSql = undefined;
}
