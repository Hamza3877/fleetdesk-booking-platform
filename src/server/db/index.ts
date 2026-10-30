import type { Sql } from "postgres";
import { createMemoryRepository, resetMemoryDb } from "@/server/db/memoryRepository";
import { ensureDatabaseReady, replaceAllData } from "@/server/db/postgresAdmin";
import { createPostgresRepository, createSql } from "@/server/db/postgresRepository";
import type { Repository } from "@/server/db/repository";
import { buildSeedData } from "@/server/db/seed";


const globalForRepo = globalThis as unknown as { __fleetdeskRepo?: Repository; __fleetdeskSql?: Sql };

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

export function resetRepositoryChoice(): void {
  globalForRepo.__fleetdeskRepo = undefined;
  globalForRepo.__fleetdeskSql = undefined;
}
