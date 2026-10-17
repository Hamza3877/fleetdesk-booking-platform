import { parseBookingQuery } from "@/lib/bookingQuery";
import { bookingInputSchema } from "@/lib/schemas";
import { requireOwner } from "@/server/auth";
import { json, readJson, route } from "@/server/http";
import { createBooking, listBookings } from "@/server/services/bookingService";

/** GET /api/bookings: owner's table (search, filter, sort, pagination). */
export const GET = route(async (request: Request) => {
  await requireOwner();
  const query = parseBookingQuery(new URL(request.url).searchParams);
  return json(await listBookings(query));
});

/** POST /api/bookings: a customer starts a booking. It is "pending" until paid. */
export const POST = route(async (request: Request) => {
  const input = bookingInputSchema.parse(await readJson(request));
  return json(await createBooking(input), 201);
});
