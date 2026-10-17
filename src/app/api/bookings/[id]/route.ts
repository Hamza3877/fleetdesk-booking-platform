import { bookingStatusSchema } from "@/lib/schemas";
import { requireOwner } from "@/server/auth";
import { NotFoundError } from "@/server/errors";
import { json, readJson, route, type RouteContext } from "@/server/http";
import { getBooking, updateBookingStatus } from "@/server/services/bookingService";

type Context = RouteContext<{ id: string }>;

export const GET = route(async (_request: Request, { params }: Context) => {
  const booking = await getBooking((await params).id);
  if (!booking) throw new NotFoundError("Booking not found");
  return json(booking);
});

/** PATCH /api/bookings/:id: owner changes the status (confirm, start rental, complete, cancel). */
export const PATCH = route(async (request: Request, { params }: Context) => {
  await requireOwner();
  const { status } = bookingStatusSchema.parse(await readJson(request));
  return json(await updateBookingStatus((await params).id, status));
});
