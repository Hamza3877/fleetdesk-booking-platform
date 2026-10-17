import { CheckCircle2, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingStatusBadge, PaymentBadge } from "@/components/ui/Badge";
import { buttonStyles } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatLongDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { getBooking } from "@/server/services/bookingService";
import { confirmStripeSession } from "@/server/services/paymentService";
import { getSettings } from "@/server/services/settingsService";
import { getVehicle } from "@/server/services/vehicleService";

export const metadata: Metadata = { title: "Your booking" };

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function BookingConfirmationPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { session_id: sessionId } = await searchParams;

  // Coming back from real Stripe Checkout: ask Stripe if the payment really went through.
  if (sessionId) await confirmStripeSession(sessionId).catch(() => undefined);

  const booking = await getBooking(id);
  if (!booking) notFound();

  const [vehicle, settings] = await Promise.all([getVehicle(booking.vehicleId), getSettings()]);
  const isPaid = booking.paymentStatus === "paid";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-8 text-center">
        {isPaid ? (
          <CheckCircle2 className="mx-auto size-14 text-success" aria-hidden />
        ) : (
          <Clock className="mx-auto size-14 text-warning" aria-hidden />
        )}
        <h1 className="mt-4 text-3xl font-bold">{isPaid ? "You're all set!" : "Payment not completed yet"}</h1>
        <p className="mt-2 text-muted-foreground">
          {isPaid
            ? `Thanks, ${booking.customerName.split(" ")[0]}. A confirmation was sent to ${booking.customerEmail}.`
            : "Your car is held for a short time. Finish paying to confirm your booking."}
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div>
            <p className="text-sm text-muted-foreground">Booking reference</p>
            <p className="text-2xl font-bold tracking-wide">{booking.reference}</p>
          </div>
          <div className="flex gap-2">
            <BookingStatusBadge status={booking.status} />
            <PaymentBadge status={booking.paymentStatus} />
          </div>
        </div>

        <dl className="grid gap-4 py-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Vehicle</dt>
            <dd className="font-medium">{vehicle?.name ?? "Vehicle"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Total</dt>
            <dd className="font-medium">{formatCurrency(booking.totalPrice)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pickup</dt>
            <dd className="font-medium">{formatLongDate(booking.startDate)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Return</dt>
            <dd className="font-medium">{formatLongDate(booking.endDate)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Driver</dt>
            <dd className="font-medium">{booking.customerName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Pickup location</dt>
            <dd className="font-medium">{settings.businessName}, {settings.city}</dd>
          </div>
        </dl>

        <p className="border-t border-border pt-4 text-sm text-muted-foreground">
          Questions? Contact {settings.supportEmail} or call {settings.phone}. Bring your driver&apos;s licence and this reference to pickup.
        </p>
      </Card>

      <div className="mt-6 flex justify-center gap-3">
        {!isPaid && booking.status !== "cancelled" && (
          <Link href={`/checkout/${booking.id}`} className={buttonStyles()}>
            Pay now
          </Link>
        )}
        <Link href="/vehicles" className={buttonStyles({ variant: "secondary" })}>
          Browse more cars
        </Link>
      </div>
    </div>
  );
}
