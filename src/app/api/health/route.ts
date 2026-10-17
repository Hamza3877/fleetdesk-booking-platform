import { getRepository, isDatabaseEnabled } from "@/server/db";

export const dynamic = "force-dynamic";

/**
 * GET /api/health: "is the app and its database working?" Open it after you deploy.
 * It never shows secrets, only whether it can read the data.
 */
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
