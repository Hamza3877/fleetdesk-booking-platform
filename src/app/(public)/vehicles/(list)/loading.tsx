import { Skeleton } from "@/components/ui/Skeleton";

/** Shown instantly while the server prepares the vehicle list. */
export default function VehiclesLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10" aria-busy="true" aria-label="Loading vehicles">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="mt-6 h-40" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-72" />
        ))}
      </div>
    </div>
  );
}
