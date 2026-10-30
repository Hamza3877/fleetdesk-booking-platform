import { cn } from "@/lib/utils";

/** Grey pulsing placeholder shown while data loads (better than a blank screen or a spinner). */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-md bg-muted", className)} />;
}
