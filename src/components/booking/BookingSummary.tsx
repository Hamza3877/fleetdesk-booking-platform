import { Card } from "@/components/ui/Card";
import { VehicleImage } from "@/components/vehicles/VehicleImage";
import { formatDate } from "@/lib/dates";
import { calculateQuote } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import type { Vehicle } from "@/types";

/** The price box shown next to every step, so the customer always sees what they will pay. */
export function BookingSummary({ vehicle, startDate, endDate }: { vehicle: Vehicle; startDate: string; endDate: string }) {
  const hasDates = Boolean(startDate && endDate && endDate > startDate);
  const quote = hasDates ? calculateQuote(vehicle.pricePerDay, startDate, endDate) : null;

  return (
    <Card className="overflow-hidden lg:sticky lg:top-24">
      <VehicleImage vehicle={vehicle} className="aspect-[16/8]" />
      <div className="space-y-4 p-5">
        <div>
          <h2 className="font-semibold">{vehicle.name}</h2>
          <p className="text-sm text-muted-foreground">{formatCurrency(vehicle.pricePerDay)} per day</p>
        </div>

        {quote ? (
          <dl className="space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Pickup</dt>
              <dd>{formatDate(startDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Return</dt>
              <dd>{formatDate(endDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {quote.days} {quote.days === 1 ? "day" : "days"} x {formatCurrency(quote.dailyRate)}
              </dt>
              <dd>{formatCurrency(quote.total)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatCurrency(quote.total)}</dd>
            </div>
          </dl>
        ) : (
          <p className="border-t border-border pt-4 text-sm text-muted-foreground">Choose your dates to see the price.</p>
        )}
      </div>
    </Card>
  );
}
