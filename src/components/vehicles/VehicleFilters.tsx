"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { addDays, todayISO } from "@/lib/dates";
import { CATEGORY_LABELS } from "@/lib/labels";
import type { VehicleFilters as Filters } from "@/lib/vehicleFilters";
import { VEHICLE_CATEGORIES } from "@/types";

const PRICE_OPTIONS = [
  { value: "", label: "Any price" },
  { value: "50", label: "Up to $50 / day" },
  { value: "80", label: "Up to $80 / day" },
  { value: "120", label: "Up to $120 / day" },
  { value: "200", label: "Up to $200 / day" },
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All types" },
  ...VEHICLE_CATEGORIES.map((category) => ({ value: category, label: CATEGORY_LABELS[category] })),
];

/**
 * The filter bar is a normal HTML form. Submitting it changes the URL (?category=suv&maxPrice=80),
 * and the page re-renders on the server with the new filters. Benefits: results can be shared as
 * a link, the back button works, and search engines can read the results.
 */
export function VehicleFilters({ initial }: { initial: Filters }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initial.startDate ?? "");
  const [endDate, setEndDate] = useState(initial.endDate ?? "");
  const today = todayISO();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const key of ["search", "category", "maxPrice"]) {
      const value = String(data.get(key) ?? "").trim();
      if (value) params.set(key, value);
    }
    if (startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    }
    router.push(`/vehicles${params.size ? `?${params}` : ""}`);
  }

  function handleStartChange(value: string) {
    setStartDate(value);
    // Keep the return date after the pickup date.
    if (!endDate || endDate <= value) setEndDate(value ? addDays(value, 1) : "");
  }

  const hasFilters = Object.keys(initial).length > 0;

  return (
    <form onSubmit={handleSubmit} aria-label="Filter vehicles" className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="lg:col-span-2">
        <Input label="Search" name="search" type="search" placeholder="Name or make" defaultValue={initial.search ?? ""} />
      </div>
      <Select label="Type" name="category" options={CATEGORY_OPTIONS} defaultValue={initial.category ?? ""} />
      <Select label="Price" name="maxPrice" options={PRICE_OPTIONS} defaultValue={initial.maxPrice ? String(initial.maxPrice) : ""} />
      <Input label="Pickup" type="date" min={today} value={startDate} onChange={(event) => handleStartChange(event.target.value)} />
      <Input
        label="Return"
        type="date"
        min={startDate ? addDays(startDate, 1) : addDays(today, 1)}
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
      />
      <div className="flex gap-2 sm:col-span-2 lg:col-span-6">
        <Button type="submit">
          <Search className="size-4" aria-hidden /> Search
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={() => router.push("/vehicles")}>
            Clear filters
          </Button>
        )}
      </div>
    </form>
  );
}
