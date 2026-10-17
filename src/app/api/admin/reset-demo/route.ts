import { requireOwner } from "@/server/auth";
import { resetDemoData } from "@/server/db";
import { json, route } from "@/server/http";

/** POST /api/admin/reset-demo: owner puts the demo data back (see the Settings page). */
export const POST = route(async () => {
  await requireOwner();
  await resetDemoData();
  return json({ ok: true });
});
