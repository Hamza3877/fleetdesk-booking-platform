import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Vehicle, VehicleCategory } from "@/types";

/**
 * Shows the vehicle photo when the owner added one. Otherwise it draws a simple car
 * illustration in the vehicle's colour, so the demo looks good with no image files.
 */

// Body shape per category: [body height, cabin height, cabin start x, cabin end x]
const SHAPES: Record<VehicleCategory, { body: number; cabin: number; from: number; to: number }> = {
  compact: { body: 30, cabin: 26, from: 82, to: 190 },
  sedan: { body: 30, cabin: 26, from: 90, to: 200 },
  suv: { body: 38, cabin: 30, from: 70, to: 215 },
  van: { body: 46, cabin: 34, from: 50, to: 225 },
  luxury: { body: 28, cabin: 24, from: 92, to: 205 },
};

function CarIllustration({ color, category }: { color: string; category: VehicleCategory }) {
  const shape = SHAPES[category];
  const bodyTop = 108 - shape.body;
  const cabinTop = bodyTop - shape.cabin;

  return (
    <svg viewBox="0 0 280 150" className="h-full w-full" role="img" aria-label={`${category} car illustration`}>
      <ellipse cx="140" cy="128" rx="112" ry="7" fill="black" opacity="0.12" />
      <path
        d={`M${shape.from} ${bodyTop} L${shape.from + 14} ${cabinTop} H${shape.to - 18} L${shape.to} ${bodyTop} Z`}
        fill={color}
        opacity="0.85"
      />
      <path
        d={`M${shape.from + 20} ${bodyTop - 2} L${shape.from + 30} ${cabinTop + 5} H${shape.to - 28} L${shape.to - 12} ${bodyTop - 2} Z`}
        fill="white"
        opacity="0.75"
      />
      <rect x="28" y={bodyTop} width="224" height={shape.body} rx="12" fill={color} />
      <rect x="236" y={bodyTop + 8} width="14" height="7" rx="3" fill="#fde68a" />
      <rect x="30" y={bodyTop + 8} width="10" height="7" rx="3" fill="#fca5a5" />
      {[78, 204].map((x) => (
        <g key={x}>
          <circle cx={x} cy="110" r="17" fill="#0f172a" />
          <circle cx={x} cy="110" r="8" fill="#cbd5e1" />
        </g>
      ))}
    </svg>
  );
}

export function VehicleImage({ vehicle, className, priority }: { vehicle: Pick<Vehicle, "name" | "imageUrl" | "color" | "category">; className?: string; priority?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden bg-gradient-to-br from-muted to-accent", className)}>
      {vehicle.imageUrl ? (
        // unoptimized: owners can paste any image link without us configuring allowed domains.
        <Image src={vehicle.imageUrl} alt={vehicle.name} fill unoptimized priority={priority} sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center p-4">
          <CarIllustration color={vehicle.color} category={vehicle.category} />
        </div>
      )}
    </div>
  );
}
