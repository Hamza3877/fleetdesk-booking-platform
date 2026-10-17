import { vehicleInputSchema } from "@/lib/schemas";
import { parseVehicleFilters, searchParamsToRecord } from "@/lib/vehicleFilters";
import { getSession, requireOwner } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { createVehicle, listVehicles } from "@/server/services/vehicleService";

/** GET /api/vehicles: public list. Add ?scope=all (owner only) to include vehicles in maintenance. */
export const GET = route(async (request: Request) => {
  const params = new URL(request.url).searchParams;
  const filters = parseVehicleFilters(searchParamsToRecord(params));

  const wantsAll = params.get("scope") === "all";
  if (wantsAll && (await getSession())) {
    return json(await listVehicles(filters));
  }
  return json(await listVehicles({ ...filters, status: "available" }));
});

/** POST /api/vehicles: owner adds a vehicle. */
export const POST = route(async (request: Request) => {
  await requireOwner();
  const input = vehicleInputSchema.parse(await readJson(request));
  return json(await createVehicle(input), 201);
});
