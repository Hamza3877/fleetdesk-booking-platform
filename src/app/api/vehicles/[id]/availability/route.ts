import { json, route, type RouteContext } from "@/server/http";
import { getBookedRanges } from "@/server/services/vehicleService";

/** GET /api/vehicles/:id/availability: the date ranges that are already taken (a plain array). */
export const GET = route(async (_request: Request, { params }: RouteContext<{ id: string }>) => {
  return json(await getBookedRanges((await params).id));
});
