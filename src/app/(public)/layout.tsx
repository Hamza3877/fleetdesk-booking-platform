import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getSettings } from "@/server/services/settingsService";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <SiteHeader businessName={settings.businessName} />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} />
    </>
  );
}
