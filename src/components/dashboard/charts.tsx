"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/Card";
import { formatShortDate } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";
import type { Analytics } from "@/types";

const axisProps = {
  tickLine: false,
  axisLine: false,
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
} as const;

const tooltipStyle = {
  background: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 13,
} as const;

function ChartCard({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mb-4 text-sm text-muted-foreground">{description}</p>
            <div role="img" aria-label={`${title}. ${description}`} className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

const dateTick = (value: unknown) => formatShortDate(String(value));

export function RevenueChart({ data }: { data: Analytics["revenueByDay"] }) {
  return (
    <ChartCard title="Revenue" description="Paid bookings by pickup day">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 4 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tickFormatter={dateTick} minTickGap={32} {...axisProps} />
        <YAxis tickFormatter={(value) => `$${value}`} width={52} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={dateTick} formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
        <Area type="monotone" dataKey="revenue" stroke="var(--chart-1)" strokeWidth={2} fill="url(#revenueFill)" />
      </AreaChart>
    </ChartCard>
  );
}

export function BookingsChart({ data }: { data: Analytics["bookingsByDay"] }) {
  return (
    <ChartCard title="Bookings per day" description="New pickups each day">
      <BarChart data={data} margin={{ left: 0, right: 8, top: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tickFormatter={dateTick} minTickGap={32} {...axisProps} />
        <YAxis allowDecimals={false} width={32} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={dateTick} cursor={{ fill: "var(--muted)" }} formatter={(value) => [Number(value), "Bookings"]} />
        <Bar dataKey="bookings" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

export function OccupancyChart({ data }: { data: Analytics["occupancyByDay"] }) {
  return (
    <ChartCard title="Fleet occupancy" description="Share of vehicles on rent each day">
      <LineChart data={data} margin={{ left: 0, right: 8, top: 4 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tickFormatter={dateTick} minTickGap={32} {...axisProps} />
        <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} width={44} {...axisProps} />
        <Tooltip contentStyle={tooltipStyle} labelFormatter={dateTick} formatter={(value) => [`${Number(value)}%`, "Occupancy"]} />
        <Line type="monotone" dataKey="occupancy" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartCard>
  );
}
