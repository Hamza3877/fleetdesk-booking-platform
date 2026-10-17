import { Fuel, Settings2, Users } from "lucide-react";
import { FUEL_LABELS, TRANSMISSION_LABELS } from "@/lib/labels";
import type { Vehicle } from "@/types";

export function VehicleSpecs({ vehicle }: { vehicle: Pick<Vehicle, "seats" | "transmission" | "fuel"> }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <Users className="size-4" aria-hidden /> {vehicle.seats} seats
      </li>
      <li className="flex items-center gap-1.5">
        <Settings2 className="size-4" aria-hidden /> {TRANSMISSION_LABELS[vehicle.transmission]}
      </li>
      <li className="flex items-center gap-1.5">
        <Fuel className="size-4" aria-hidden /> {FUEL_LABELS[vehicle.fuel]}
      </li>
    </ul>
  );
}
