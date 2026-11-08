import { z } from "zod";
import { json, readJson, route } from "@/server/http";
import { createCheckout } from "@/server/services/paymentService";

const bodySchema = z.object({ bookingId: z.string().min(1) });

export const POST = route(async (request: Request) => {
  const { bookingId } = bodySchema.parse(await readJson(request));
  return json(await createCheckout(bookingId));
});
