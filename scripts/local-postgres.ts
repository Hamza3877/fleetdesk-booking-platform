/**
 * A throwaway PostgreSQL server for trying database mode WITHOUT a Supabase account.
 *
 *   npm run db:local       (leave it running in one terminal)
 *
 * Then put this in .env.local and run `npm run db:setup`:
 *   DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5433/postgres
 *
 * It uses PGlite (PostgreSQL compiled to WebAssembly) and keeps its files in ./.pglite
 */
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

async function main() {
  const port = Number(process.env.LOCAL_DB_PORT ?? 5433);
  const db = await PGlite.create({ dataDir: "./.pglite", extensions: { btree_gist } });
  const server = new PGLiteSocketServer({ db, port, host: "127.0.0.1", maxConnections: 8 });
  await server.start();

  console.log(`Local PostgreSQL is running on ${server.getServerConn()}`);
  console.log(`DATABASE_URL=postgres://postgres:postgres@127.0.0.1:${port}/postgres`);
  console.log("Press Ctrl+C to stop.");

  const shutdown = async () => {
    await server.stop();
    await db.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((error) => {
  console.error("Could not start the local database:", error instanceof Error ? error.message : error);
  process.exit(1);
});
