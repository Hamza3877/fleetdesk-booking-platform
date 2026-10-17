// @vitest-environment node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import type { Sql } from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getRepository, resetRepositoryChoice } from "@/server/db";
import { ensureDatabaseReady } from "@/server/db/postgresAdmin";
import { createSql } from "@/server/db/postgresRepository";
import { SCHEMA_SQL } from "@/server/db/schema";
import { buildSeedData } from "@/server/db/seed";

describe("schema copies", () => {
  it("the SQL embedded in the app is identical to supabase/schema.sql", () => {
    const file = readFileSync(join(process.cwd(), "supabase", "schema.sql"), "utf8");
    expect(SCHEMA_SQL).toBe(file);
  });
});

/** A brand-new, completely empty database, like a Supabase project nobody has set up yet. */
describe("first run on an empty database", () => {
  let pglite: PGlite;
  let server: PGLiteSocketServer;
  let sql: Sql;

  beforeAll(async () => {
    pglite = await PGlite.create({ extensions: { btree_gist } });
    server = new PGLiteSocketServer({ db: pglite, port: 0, host: "127.0.0.1", maxConnections: 4 });
    await server.start();
    process.env.DATABASE_URL = `postgres://postgres:postgres@${server.getServerConn()}/postgres`;
    process.env.DATABASE_POOL_MAX = "1";
    resetRepositoryChoice();
    sql = createSql(process.env.DATABASE_URL);
  }, 60_000);

  afterAll(async () => {
    resetRepositoryChoice();
    delete process.env.DATABASE_URL;
    await sql.end({ timeout: 2 });
    await server.stop();
    await pglite.close();
  }, 30_000);

  it("creates the tables and loads the demo data on the first request, with no setup command", async () => {
    // Nothing exists yet.
    const [{ exists }] = await sql<{ exists: boolean }[]>`select to_regclass('public.vehicles') is not null as exists`;
    expect(exists).toBe(false);

    // The app just asks for data, as the home page would.
    const vehicles = await getRepository().vehicles.list();
    expect(vehicles.length).toBe(buildSeedData().vehicles.length);
    expect((await getRepository().settings.get()).businessName).toBe("Summit Rentals");
  });

  it("does not load the demo data a second time, and keeps what was changed", async () => {
    await getRepository().settings.save({ businessName: "My Own Name", supportEmail: "a@b.co", phone: "+1 555 0100", city: "Lahore" });
    await ensureDatabaseReady(sql);
    await ensureDatabaseReady(sql);
    expect((await getRepository().settings.get()).businessName).toBe("My Own Name");
    expect((await getRepository().vehicles.list()).length).toBe(buildSeedData().vehicles.length);
  });
});
