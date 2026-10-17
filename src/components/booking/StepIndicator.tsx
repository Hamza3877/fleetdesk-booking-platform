import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = ["Dates", "Your details", "Review and pay"];

export function StepIndicator({ current }: { current: number }) {
  return (
    <ol aria-label="Booking progress" className="flex items-center gap-2 text-sm">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const isDone = number < current;
        const isCurrent = number === current;
        return (
          <li key={label} className="flex items-center gap-2" aria-current={isCurrent ? "step" : undefined}>
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                isDone && "border-primary bg-primary text-primary-foreground",
                isCurrent && "border-primary text-primary",
                !isDone && !isCurrent && "border-border text-muted-foreground",
              )}
            >
              {isDone ? <Check className="size-4" aria-hidden /> : number}
            </span>
            <span className={cn("hidden sm:inline", isCurrent ? "font-semibold" : "text-muted-foreground")}>{label}</span>
            {number < STEPS.length && <span aria-hidden className="mx-1 h-px w-6 bg-border sm:w-10" />}
          </li>
        );
      })}
    </ol>
  );
}
