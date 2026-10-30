import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { getSession } from "@/server/auth";
import { getSettings } from "@/server/services/settingsService";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | Dashboard" } };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { businessName } = await getSettings();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <DashboardNav businessName={businessName} email={session.email} />
      <main id="main" className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        {children}
      </main>
    </div>
  );
}
