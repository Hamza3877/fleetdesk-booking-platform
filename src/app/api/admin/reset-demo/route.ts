import { requireOwner } from "@/server/auth";
import { resetDemoData } from "@/server/db";
import { json, route } from "@/server/http";

export const POST = route(async () => {
  await requireOwner();
  await resetDemoData();
  return json({ ok: true });
});
