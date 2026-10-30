"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { addDays, formatMonthYear, isDayBooked, parseISODate, toISODate, todayISO } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { DateRange } from "@/types";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface AvailabilityCalendarProps {
  bookedRanges: DateRange[];
  selected?: { startDate: string; endDate: string };
}

export function AvailabilityCalendar({ bookedRanges, selected }: AvailabilityCalendarProps) {
  const today = todayISO();
  const [monthStart, setMonthStart] = useState(() => `${(selected?.startDate || today).slice(0, 7)}-01`);

  const firstWeekday = parseISODate(monthStart).getUTCDay();
  const daysInMonth = new Date(Date.UTC(Number(monthStart.slice(0, 4)), Number(monthStart.slice(5, 7)), 0)).getUTCDate();

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => addDays(monthStart, index)),
  ];

  function changeMonth(direction: 1 | -1) {
    const date = parseISODate(monthStart);
    date.setUTCMonth(date.getUTCMonth() + direction);
    setMonthStart(toISODate(date));
  }

  const isCurrentMonth = monthStart.slice(0, 7) === today.slice(0, 7);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold" aria-live="polite">
          {formatMonthYear(monthStart)}
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            disabled={isCurrentMonth}
            aria-label="Previous month"
            className="rounded-md p-1.5 hover:bg-muted disabled:opacity-30"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="rounded-md p-1.5 hover:bg-muted">
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {WEEKDAYS.map((day) => (
          <div key={day} className="py-1 font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        {cells.map((day, index) => {
          if (!day) return <div key={`blank-${index}`} />;

          const isPast = day < today;
          const isBooked = isDayBooked(bookedRanges, day);
          const isSelected = selected && day >= selected.startDate && day < selected.endDate;
          const state = isPast ? "past" : isBooked ? "booked" : "free";

          return (
            <div
              key={day}
              title={state === "booked" ? "Already booked" : undefined}
              aria-label={`${day}, ${state === "free" ? "available" : state === "booked" ? "booked" : "past"}`}
              className={cn(
                "rounded-md py-2 text-sm",
                state === "free" && "border border-border bg-card",
                state === "booked" && "bg-muted text-muted-foreground line-through",
                state === "past" && "text-muted-foreground",
                isSelected && state === "free" && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {Number(day.slice(8))}
            </div>
          );
        })}
      </div>

      <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded border border-border bg-card" /> Available
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-muted" /> Booked
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-3 rounded bg-primary" /> Your dates
        </li>
      </ul>
    </div>
  );
}
