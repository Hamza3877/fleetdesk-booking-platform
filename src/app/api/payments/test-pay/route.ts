import { z } from "zod";
import { json, readJson, route } from "@/server/http";
import { payWithTestCard } from "@/server/services/paymentService";

const schema = z.object({
  bookingId: z.string().min(1),
  cardNumber: z.string().min(1, "Enter a card number"),
});

/** The built-in test checkout. Only test card numbers are accepted. */
export const POST = route(async (request: Request) => {
  const { bookingId, cardNumber } = schema.parse(await readJson(request));
  return json(await payWithTestCard(bookingId, cardNumber));
});
