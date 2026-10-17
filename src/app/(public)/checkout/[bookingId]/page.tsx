import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TestCheckoutForm } from "@/components/booking/TestCheckoutForm";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import { getBooking } from "@/server/services/bookingService";
import { getVehicle } from "@/server/services/vehicleService";

export const metadata: Metadata = { title: "Secure payment" };

export default async function CheckoutPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const booking = await getBooking((await params).bookingId);
  if (!booking) notFound();
  if (booking.paymentStatus === "paid") redirect(`/booking/${booking.id}`);

  const vehicle = await getVehicle(booking.vehicleId);

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="mb-1 text-2xl font-bold">Secure payment</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {vehicle?.name}, {formatDate(booking.startDate)} to {formatDate(booking.endDate)}. Total {formatCurrency(booking.totalPrice)}.
      </p>
      <Card className="p-6">
        <TestCheckoutForm bookingId={booking.id} total={booking.totalPrice} />
      </Card>
    </div>
  );
}
