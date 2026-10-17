import { vehiclePatchSchema } from "@/lib/schemas";
import { requireOwner } from "@/server/auth";
import { NotFoundError } from "@/server/errors";
import { json, readJson, route, type RouteContext } from "@/server/http";
import { deleteVehicle, getVehicle, updateVehicle } from "@/server/services/vehicleService";

type Context = RouteContext<{ id: string }>;

export const GET = route(async (_request: Request, { params }: Context) => {
  const vehicle = await getVehicle((await params).id);
  if (!vehicle) throw new NotFoundError("Vehicle not found");
  return json(vehicle);
});

export const PATCH = route(async (request: Request, { params }: Context) => {
  await requireOwner();
  const changes = vehiclePatchSchema.parse(await readJson(request));
  return json(await updateVehicle((await params).id, changes));
});

export const DELETE = route(async (_request: Request, { params }: Context) => {
  await requireOwner();
  await deleteVehicle((await params).id);
  return json({ ok: true });
});
