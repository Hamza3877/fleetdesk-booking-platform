"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AvailabilityCalendar } from "@/components/vehicles/AvailabilityCalendar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { addDays, formatDate, hasRangeConflict, todayISO } from "@/lib/dates";
import { calculateQuote } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import type { DateRange } from "@/types";

interface BookingPanelProps {
  vehicleId: string;
  pricePerDay: number;
  bookedRanges: DateRange[];
  initialDates?: { startDate: string; endDate: string };
}

/** Right-hand card on the vehicle page: calendar, date pickers, live price, and the "Book" button. */
export function BookingPanel({ vehicleId, pricePerDay, bookedRanges, initialDates }: BookingPanelProps) {
  const router = useRouter();
  const today = todayISO();
  const [startDate, setStartDate] = useState(initialDates?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialDates?.endDate ?? "");

  const hasDates = Boolean(startDate && endDate);
  const quote = hasDates ? calculateQuote(pricePerDay, startDate, endDate) : null;

  // One place decides whether the chosen dates are usable, and what to tell the customer.
  let problem = "";
  if (hasDates && endDate <= startDate) problem = "The return date must be after the pickup date.";
  else if (hasDates && hasRangeConflict(bookedRanges, { startDate, endDate })) {
    problem = "This car is already booked for part of that range. Check the calendar for free days.";
  }
  const canBook = hasDates && !problem;

  function handleStartChange(value: string) {
    setStartDate(value);
    if (value && (!endDate || endDate <= value)) setEndDate(addDays(value, 1));
  }

  return (
    <Card className="p-5 lg:sticky lg:top-24">
      <p>
        <span className="text-3xl font-bold">{formatCurrency(pricePerDay)}</span>
        <span className="text-muted-foreground"> / day</span>
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Input label="Pickup" type="date" min={today} value={startDate} onChange={(event) => handleStartChange(event.target.value)} />
        <Input label="Return" type="date" min={startDate ? addDays(startDate, 1) : addDays(today, 1)} value={endDate} onChange={(event) => setEndDate(event.target.value)} />
      </div>

      {problem && (
        <p role="alert" className="mt-3 text-sm font-medium text-danger">
          {problem}
        </p>
      )}

      {canBook && quote && (
        <dl className="mt-4 space-y-2 rounded-lg bg-muted p-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {formatCurrency(quote.dailyRate)} x {quote.days} {quote.days === 1 ? "day" : "days"}
            </dt>
            <dd>{formatCurrency(quote.total)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatCurrency(quote.total)}</dd>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatDate(startDate)} to {formatDate(endDate)}
          </p>
        </dl>
      )}

      <Button
        size="lg"
        className="mt-4 w-full"
        disabled={!canBook}
        onClick={() => router.push(`/book/${vehicleId}?startDate=${startDate}&endDate=${endDate}`)}
      >
        {canBook ? "Continue to booking" : "Choose your dates"}
      </Button>

      <div className="mt-6 border-t border-border pt-5">
        <AvailabilityCalendar key={canBook ? startDate.slice(0, 7) : "none"} bookedRanges={bookedRanges} selected={canBook ? { startDate, endDate } : undefined} />
      </div>
    </Card>
  );
}
