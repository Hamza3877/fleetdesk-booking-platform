import { NotFoundError, ValidationError } from "@/server/errors";
import { getBooking, markBookingPaid } from "@/server/services/bookingService";
import { getVehicle } from "@/server/services/vehicleService";
import type { Booking } from "@/types";


const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const stripeKey = () => process.env.STRIPE_SECRET_KEY;

export const isStripeEnabled = () => Boolean(stripeKey()?.startsWith("sk_test_"));

export const TEST_CARD_SUCCESS = "4242424242424242";
export const TEST_CARD_DECLINED = "4000000000000002";

async function stripeRequest(path: string, body?: URLSearchParams): Promise<Record<string, unknown>> {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${stripeKey()}`,
      ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
  });
  const data = (await response.json()) as Record<string, unknown> & { error?: { message?: string } };
  if (!response.ok) throw new ValidationError(data.error?.message ?? "Stripe could not process this request");
  return data;
}

export async function createCheckout(bookingId: string): Promise<{ url: string }> {
  const booking = await getBooking(bookingId);
  if (!booking) throw new NotFoundError("Booking not found");
  if (booking.paymentStatus === "paid") return { url: confirmationPath(booking) };
  if (booking.status === "cancelled") throw new ValidationError("This booking was cancelled. Please start a new one.");

  if (!isStripeEnabled()) return { url: `/checkout/${booking.id}` };

  const vehicle = await getVehicle(booking.vehicleId);
  const params = new URLSearchParams({
    mode: "payment",
    customer_email: booking.customerEmail,
    success_url: `${siteUrl()}${confirmationPath(booking)}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl()}/checkout/cancelled?booking=${booking.id}`,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(booking.totalPrice * 100),
    "line_items[0][price_data][product_data][name]": `${vehicle?.name ?? "Vehicle"} rental (${booking.startDate} to ${booking.endDate})`,
    "metadata[bookingId]": booking.id,
  });
  const session = await stripeRequest("checkout/sessions", params);
  return { url: String(session.url) };
}

export async function payWithTestCard(bookingId: string, cardNumber: string): Promise<Booking> {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits === TEST_CARD_DECLINED) throw new ValidationError("Your card was declined. Try the test card 4242 4242 4242 4242.");
  if (digits !== TEST_CARD_SUCCESS) throw new ValidationError("This is a test checkout. Use the test card 4242 4242 4242 4242.");
  return markBookingPaid(bookingId);
}

export async function confirmStripeSession(sessionId: string): Promise<Booking | undefined> {
  if (!isStripeEnabled()) return undefined;
  const session = await stripeRequest(`checkout/sessions/${encodeURIComponent(sessionId)}`);
  const bookingId = (session.metadata as { bookingId?: string } | undefined)?.bookingId;
  if (session.payment_status !== "paid" || !bookingId) return undefined;
  return markBookingPaid(bookingId);
}

export function confirmationPath(booking: Pick<Booking, "id">): string {
  return `/booking/${booking.id}`;
}
