import { json, route, type RouteContext } from "@/server/http";
import { getBookedRanges } from "@/server/services/vehicleService";

export const GET = route(async (_request: Request, { params }: RouteContext<{ id: string }>) => {
  return json(await getBookedRanges((await params).id));
});
