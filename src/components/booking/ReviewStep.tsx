import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/dates";
import { calculateQuote } from "@/lib/pricing";
import type { CustomerInput, DatesInput } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import type { Vehicle } from "@/types";

interface ReviewStepProps {
  vehicle: Vehicle;
  dates: DatesInput;
  customer: CustomerInput;
  loading: boolean;
  errorMessage?: string;
  onEditDates: () => void;
  onEditCustomer: () => void;
  onPay: () => void;
}

export function ReviewStep({ vehicle, dates, customer, loading, errorMessage, onEditDates, onEditCustomer, onPay }: ReviewStepProps) {
  const quote = calculateQuote(vehicle.pricePerDay, dates.startDate, dates.endDate);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Check everything, then pay</h2>

      <section className="rounded-lg border border-border p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium">Trip</h3>
          <button type="button" onClick={onEditDates} className="text-sm font-medium text-primary hover:underline">
            Change
          </button>
        </div>
        <p className="text-sm">
          {vehicle.name}, {formatDate(dates.startDate)} to {formatDate(dates.endDate)} ({quote.days} {quote.days === 1 ? "day" : "days"})
        </p>
      </section>

      <section className="rounded-lg border border-border p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-medium">Driver</h3>
          <button type="button" onClick={onEditCustomer} className="text-sm font-medium text-primary hover:underline">
            Change
          </button>
        </div>
        <p className="text-sm">{customer.customerName}</p>
        <p className="text-sm text-muted-foreground">
          {customer.customerEmail} · {customer.customerPhone}
        </p>
      </section>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        Your car is held for 30 minutes while you pay. Payment runs in test mode, so no real money is charged.
      </p>

      {errorMessage && (
        <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm font-medium text-danger">
          {errorMessage}
        </p>
      )}

      <Button size="lg" className="w-full sm:w-auto" loading={loading} onClick={onPay}>
        Pay {formatCurrency(quote.total)}
      </Button>
    </div>
  );
}
