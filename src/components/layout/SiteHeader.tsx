import { CarFront } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { buttonStyles } from "@/components/ui/Button";

export function SiteHeader({ businessName }: { businessName: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2 font-semibold">
          <span className="shrink-0 rounded-lg bg-primary p-1.5 text-primary-foreground">
            <CarFront className="size-5" aria-hidden />
          </span>
          <span className="truncate">{businessName}</span>
        </Link>
        <nav aria-label="Main" className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link href="/vehicles" className="rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-muted-foreground hover:bg-muted hover:text-foreground">
            Our fleet
          </Link>
          <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:block">
            Owner login
          </Link>
          <ThemeToggle />
          <Link href="/vehicles" className={buttonStyles({ size: "sm", className: "ml-1 hidden whitespace-nowrap sm:inline-flex" })}>
            Book now
          </Link>
        </nav>
      </div>
    </header>
  );
}
