import { Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { BusinessSettings } from "@/types";

export function SiteFooter({ settings }: { settings: BusinessSettings }) {
  return (
    <footer className="mt-20 border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-semibold">{settings.businessName}</p>
          <p className="mt-2 text-sm text-muted-foreground">Simple online booking. Clear prices. No surprises at the counter.</p>
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <MapPin className="size-4" aria-hidden /> {settings.city}
          </li>
          <li className="flex items-center gap-2">
            <Phone className="size-4" aria-hidden /> {settings.phone}
          </li>
          <li className="flex items-center gap-2">
            <Mail className="size-4" aria-hidden /> {settings.supportEmail}
          </li>
        </ul>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/vehicles" className="text-muted-foreground hover:text-foreground">
              Browse vehicles
            </Link>
          </li>
          <li>
            <Link href="/login" className="text-muted-foreground hover:text-foreground">
              Owner dashboard
            </Link>
          </li>
        </ul>
      </div>
      <p className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        Hamza Rentals • Project • Built with Next.js & Supabase
      </p>
    </footer>
  );
}
