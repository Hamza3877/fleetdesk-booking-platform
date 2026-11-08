"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { VehicleImage } from "@/components/vehicles/VehicleImage";
import { VehicleSpecs } from "@/components/vehicles/VehicleSpecs";
import { CATEGORY_LABELS } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";
import type { Vehicle } from "@/types";

interface VehicleCardProps {
  vehicle: Vehicle;
  dates?: { startDate: string; endDate: string };
  headingLevel?: "h2" | "h3";
}

export function VehicleCard({ vehicle, dates, headingLevel: Heading = "h3" }: VehicleCardProps) {
  const query = dates ? `?startDate=${dates.startDate}&endDate=${dates.endDate}` : "";

  return (
        <motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.1 }}
  transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
  whileHover={{ y: -6 }}
>
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/vehicles/${vehicle.id}${query}`} className="block focus-visible:outline-offset-[-2px]">
        <VehicleImage vehicle={vehicle} className="aspect-[16/10] transition-transform duration-500 group-hover:scale-105" />
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Heading className="font-semibold group-hover:text-primary">{vehicle.name}</Heading>
              <p className="text-xs text-muted-foreground">{vehicle.year}</p>
            </div>
            <Badge tone="info">{CATEGORY_LABELS[vehicle.category]}</Badge>
          </div>
          <VehicleSpecs vehicle={vehicle} />
          <p className="pt-1">
            <span className="text-xl font-bold">{formatCurrency(vehicle.pricePerDay)}</span>
            <span className="text-sm text-muted-foreground"> / day</span>
          </p>
        </div>
      </Link>
    </Card>
    </motion.div>
  );
}
