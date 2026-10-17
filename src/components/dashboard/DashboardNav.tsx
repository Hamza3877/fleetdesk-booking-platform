"use client";

import { CalendarCheck, CarFront, ExternalLink, LayoutDashboard, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/fleet", label: "Fleet", icon: CarFront },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/** Sidebar on large screens, top bar on phones. */
export function DashboardNav({ businessName, email }: { businessName: string; email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="border-b border-border bg-card lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
      <div className="flex h-full flex-col gap-4 p-4 lg:gap-6">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-semibold">
            <span className="rounded-lg bg-primary p-1.5 text-primary-foreground">
              <CarFront className="size-5" aria-hidden />
            </span>
            {businessName}
          </p>
          <div className="lg:hidden">
            <ThemeToggle />
          </div>
        </div>

        <nav aria-label="Dashboard" className="flex gap-1 overflow-x-auto lg:flex-col">
          {links.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden space-y-3 lg:block">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ExternalLink className="size-4" aria-hidden /> View public site
          </Link>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <p className="truncate text-xs text-muted-foreground" title={email}>
              {email}
            </p>
            <ThemeToggle />
          </div>
          <Button variant="secondary" size="sm" className="w-full" onClick={logout}>
            <LogOut className="size-4" aria-hidden /> Sign out
          </Button>
        </div>
      </div>
    </aside>
  );
}
