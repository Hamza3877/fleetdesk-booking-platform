import { VehicleCard } from "@/components/vehicles/VehicleCard";
import type { Vehicle } from "@/types";

interface VehicleGridProps {
  vehicles: Vehicle[];
  dates?: { startDate: string; endDate: string };
  headingLevel?: "h2" | "h3";
}

export function VehicleGrid({ vehicles, dates, headingLevel }: VehicleGridProps) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <li key={vehicle.id}>
          <VehicleCard vehicle={vehicle} dates={dates} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
