import { getRepository, isDatabaseEnabled } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = isDatabaseEnabled() ? "postgres" : "memory";
  try {
    const vehicles = await getRepository().vehicles.list();
    return Response.json({ ok: true, database, vehicles: vehicles.length });
  } catch (error) {
    console.error("Health check failed:", error);
    return Response.json(
      {
        ok: false,
        database,
        message:
          database === "postgres"
            ? "Can't read the database. Check DATABASE_URL and that you ran `npm run db:setup` once."
            : "Something went wrong.",
      },
      { status: 503 },
    );
  }
}
