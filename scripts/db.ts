/**
 * Database setup for Supabase / PostgreSQL.
 *
 *   npm run db:setup   create the tables, and add demo data if the database is empty
 *   npm run db:reset   wipe everything and load fresh demo data (dates are relative to today)
 *
 * It reads DATABASE_URL from .env.local (or from the environment).
 */
import { existsSync, readFileSync } from "node:fs";
import { applySchema, isEmpty, replaceAllData } from "../src/server/db/postgresAdmin";
import { createSql } from "../src/server/db/postgresRepository";
import { buildSeedData } from "../src/server/db/seed";

function loadEnvFile(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

async function main() {
  loadEnvFile(".env.local");
  loadEnvFile(".env");

  const command = process.argv[2];
  const url = process.env.DATABASE_URL;
  if (command !== "setup" && command !== "reset") {
    console.error("Usage: npm run db:setup  |  npm run db:reset");
    process.exit(1);
  }
  if (!url) {
    console.error("DATABASE_URL is not set. Copy .env.example to .env.local and paste your Supabase connection string.");
    process.exit(1);
  }

  const sql = createSql(url);
  try {
    await applySchema(sql);
    console.log("Tables are ready.");

    if (command === "reset" || (await isEmpty(sql))) {
      const data = buildSeedData();
      await replaceAllData(sql, data);
      console.log(`Loaded demo data: ${data.vehicles.length} vehicles and ${data.bookings.length} bookings.`);
    } else {
      console.log("The database already has data, so nothing was changed. Use `npm run db:reset` to start over.");
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error("\nDatabase setup failed:", error instanceof Error ? error.message : error);
  console.error("Check that DATABASE_URL is correct (Supabase: Project Settings -> Database -> Connection string).");
  process.exit(1);
});
