import { afterAll, beforeAll, beforeEach, describe } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { Sql } from "postgres";
import { resetRepositoryChoice } from "@/server/db";
import { resetMemoryDb } from "@/server/db/memoryRepository";
import { applySchema, replaceAllData } from "@/server/db/postgresAdmin";
import { createSql } from "@/server/db/postgresRepository";
import { buildSeedData } from "@/server/db/seed";

/**
 * Runs the same test suite against BOTH data stores:
 *   - "memory"    the in-memory demo store
 *   - "postgres"  a real PostgreSQL engine (PGlite, PostgreSQL compiled to WebAssembly),
 *                 reached through the very same driver and SQL the app uses with Supabase
 *
 * If a rule works in one store but not the other, a test fails. That is how we know the
 * SQL is right without needing a Supabase account.
 */

const BACKENDS = ["memory", "postgres"] as const;
type Backend = (typeof BACKENDS)[number];

let pglite: PGlite | undefined;
let server: PGLiteSocketServer | undefined;
let adminSql: Sql | undefined;

async function start(backend: Backend) {
  resetRepositoryChoice();

  if (backend === "memory") {
    delete process.env.DATABASE_URL;
    return;
  }

  pglite = await PGlite.create({ extensions: { btree_gist } });
  server = new PGLiteSocketServer({ db: pglite, port: 0, host: "127.0.0.1", maxConnections: 4 });
  await server.start();

  process.env.DATABASE_URL = `postgres://postgres:postgres@${server.getServerConn()}/postgres`;
  process.env.DATABASE_POOL_MAX = "1";
  adminSql = createSql(process.env.DATABASE_URL);
  await applySchema(adminSql);
}

async function reset(backend: Backend) {
  if (backend === "memory") {
    resetMemoryDb();
  } else if (adminSql) {
    await replaceAllData(adminSql, buildSeedData());
  }
}

async function stop() {
  resetRepositoryChoice();
  delete process.env.DATABASE_URL;
  await adminSql?.end({ timeout: 2 });
  await server?.stop();
  await pglite?.close();
  adminSql = server = pglite = undefined;
}

/** Like `describe`, but repeats the whole suite for each data store, starting from fresh demo data every test. */
export function describeWithBackends(title: string, suite: (backend: Backend) => void) {
  describe.each(BACKENDS)(`${title} [%s]`, (backend) => {
    beforeAll(() => start(backend), 60_000);
    afterAll(stop, 30_000);
    beforeEach(() => reset(backend), 30_000);
    suite(backend);
  });
}
