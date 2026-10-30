import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";
import { parseVehicleFilters } from "@/lib/vehicleFilters";
import { listVehicles } from "@/server/services/vehicleService";

export const metadata: Metadata = {
  title: "Our fleet",
  description: "Browse available rental cars. Filter by type, price and dates.",
};

export default async function VehiclesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseVehicleFilters(await searchParams);
  // Rendered on the server: the HTML already contains the results, so it is fast and good for SEO.
  const vehicles = await listVehicles({ ...filters, status: "available" });
  const dates = filters.startDate && filters.endDate ? { startDate: filters.startDate, endDate: filters.endDate } : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Our fleet</h1>
      <p className="mt-1 mb-6 text-muted-foreground">Add your dates to see only the cars that are free.</p>

      <VehicleFilters initial={filters} />

      <p className="mt-6 mb-4 text-sm text-muted-foreground" aria-live="polite">
        {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"} found
      </p>

      {vehicles.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="No vehicles match your search"
          description="Try different dates, a higher price or another type."
          action={
            <Link href="/vehicles" className={buttonStyles({ variant: "secondary" })}>
              Clear filters
            </Link>
          }
        />
      ) : (
        <VehicleGrid vehicles={vehicles} dates={dates} headingLevel="h2" />
      )}
    </div>
  );
}
