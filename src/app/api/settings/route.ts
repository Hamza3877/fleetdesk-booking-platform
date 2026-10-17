import { settingsSchema } from "@/lib/schemas";
import { requireOwner } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { getSettings, updateSettings } from "@/server/services/settingsService";

export const GET = route(async () => json(await getSettings()));

export const PATCH = route(async (request: Request) => {
  await requireOwner();
  return json(await updateSettings(settingsSchema.parse(await readJson(request))));
});
