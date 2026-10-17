import { CalendarCheck, CreditCard, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { VehicleImage } from "@/components/vehicles/VehicleImage";
import { VehicleGrid } from "@/components/vehicles/VehicleGrid";
import { CATEGORY_LABELS } from "@/lib/labels";
import { listVehicles } from "@/server/services/vehicleService";
import { getSettings } from "@/server/services/settingsService";
import { VEHICLE_CATEGORIES } from "@/types";

const steps = [
  { icon: CalendarCheck, title: "Pick your dates", text: "See live availability and the full price before you commit." },
  { icon: CreditCard, title: "Pay securely", text: "Checkout takes under a minute. No hidden fees." },
  { icon: KeyRound, title: "Pick up and go", text: "Show your confirmation at pickup and drive away." },
];

export default async function HomePage() {
  const [featured, { businessName, city }] = await Promise.all([
    listVehicles({ status: "available", featured: true }),
    getSettings(),
  ]);

  return (
    <>
      <section className="border-b border-border bg-gradient-to-b from-accent/70 to-background">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1.2fr_1fr]">
          <FadeIn className="max-w-2xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-border">
              <ShieldCheck className="size-4 text-success" aria-hidden /> Free cancellation up to 24 hours before pickup
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Rent the right car in {city.split(",")[0]}, in minutes.</h1>
            <p className="mt-5 text-lg text-muted-foreground">
              {businessName} makes renting simple: choose a car, see the real price, and book online. No phone calls, no paperwork queues.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/vehicles" className={buttonStyles({ size: "lg" })}>
                Browse the fleet
              </Link>
              <Link href="/login" className={buttonStyles({ variant: "secondary", size: "lg" })}>
                I own a rental business
              </Link>
            </div>
          </FadeIn>
          {featured[0] && (
            <FadeIn delay={0.15} className="hidden lg:block">
              <div className="rounded-3xl border border-border bg-card p-3 shadow-xl">
                <VehicleImage vehicle={featured[0]} className="aspect-[4/3] rounded-2xl" />
                <div className="flex items-center justify-between px-3 py-3">
                  <p className="font-semibold">{featured[0].name}</p>
                  <p className="text-sm text-muted-foreground">from ${featured[0].pricePerDay} / day</p>
                </div>
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16" aria-labelledby="featured-heading">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 id="featured-heading" className="text-2xl font-bold">
              Popular right now
            </h2>
            <p className="mt-1 text-muted-foreground">Hand-picked favourites from our fleet.</p>
          </div>
          <Link href="/vehicles" className="text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        <VehicleGrid vehicles={featured} />
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-6 text-2xl font-bold">
          Find your type
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {VEHICLE_CATEGORIES.map((category) => (
            <li key={category}>
              <Link
                href={`/vehicles?category=${category}`}
                className="block rounded-xl border border-border bg-card px-4 py-5 text-center font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {CATEGORY_LABELS[category]}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16" aria-labelledby="how-heading">
        <h2 id="how-heading" className="mb-8 text-2xl font-bold">
          How it works
        </h2>
        <ol className="grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="rounded-xl border border-border bg-card p-6">
              <span className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="font-semibold">
                {index + 1}. {title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
