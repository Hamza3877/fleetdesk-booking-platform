"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, DollarSign, Gauge, Receipt } from "lucide-react";
import { useState } from "react";
import { BookingsChart, OccupancyChart, RevenueChart } from "@/components/dashboard/charts";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { fetchAnalytics, errorMessage } from "@/lib/api";
import { BOOKING_STATUS_LABELS } from "@/lib/labels";
import { formatCurrency, formatPercent } from "@/lib/utils";

const RANGES = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
];

export function OverviewDashboard() {
  const [days, setDays] = useState(30);
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: ["analytics", days], queryFn: () => fetchAnalytics(days) });

  const rangeSelect = (
    <div>
      <label htmlFor="range" className="sr-only">
        Time range
      </label>
      <select
        id="range"
        value={days}
        onChange={(event) => setDays(Number(event.target.value))}
        className="h-10 rounded-lg border border-input bg-card px-3 text-sm"
      >
        {RANGES.map((range) => (
          <option key={range.days} value={range.days}>
            {range.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <PageHeader title="Overview" description="How your rental business is doing." action={rangeSelect} />

      {isError && <ErrorMessage message={errorMessage(error)} onRetry={() => refetch()} />}

      {isPending && (
        <div className="space-y-6" aria-busy="true" aria-label="Loading overview">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-32" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Revenue" value={formatCurrency(data.kpis.revenue)} icon={DollarSign} change={data.kpis.revenueChange} hint="vs previous period" />
            <StatCard label="Bookings" value={String(data.kpis.bookings)} icon={CalendarCheck} hint="paid pickups" />
            <StatCard label="Occupancy" value={formatPercent(data.kpis.occupancyRate)} icon={Gauge} hint="average of the period" />
            <StatCard label="Average booking" value={formatCurrency(data.kpis.averageBookingValue)} icon={Receipt} hint="per paid booking" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <RevenueChart data={data.revenueByDay} />
            <BookingsChart data={data.bookingsByDay} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <OccupancyChart data={data.occupancyByDay} />

            <Card className="p-5">
              <h3 className="font-semibold">Top vehicles</h3>
              <p className="mb-4 text-sm text-muted-foreground">By revenue in this period</p>
              {data.topVehicles.length === 0 ? (
                <p className="text-sm text-muted-foreground">No paid bookings in this period yet.</p>
              ) : (
                <ol className="space-y-3">
                  {data.topVehicles.map((vehicle, index) => (
                    <li key={vehicle.vehicleId} className="flex items-center gap-3 text-sm">
                      <span className="flex size-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">{index + 1}</span>
                      <span className="flex-1 truncate">{vehicle.name}</span>
                      <span className="font-medium">{formatCurrency(vehicle.revenue)}</span>
                    </li>
                  ))}
                </ol>
              )}

              <h3 className="mt-6 mb-3 text-sm font-semibold">All bookings by status</h3>
              <ul className="space-y-1.5 text-sm">
                {data.statusBreakdown.map((item) => (
                  <li key={item.status} className="flex justify-between text-muted-foreground">
                    <span>{BOOKING_STATUS_LABELS[item.status]}</span>
                    <span className="font-medium text-foreground">{item.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
