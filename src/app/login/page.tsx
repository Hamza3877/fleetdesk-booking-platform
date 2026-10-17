import { CarFront } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { demoCredentials, getSession } from "@/server/auth";

export const metadata: Metadata = { title: "Owner login" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSession()) redirect("/dashboard");

  return (
    <main id="main" className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-semibold">
          <span className="rounded-lg bg-primary p-1.5 text-primary-foreground">
            <CarFront className="size-5" aria-hidden />
          </span>
          FleetDesk
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-bold">Owner login</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">Sign in to manage bookings, your fleet and revenue.</p>
          <LoginForm demo={demoCredentials()} />
        </div>
      </div>
    </main>
  );
}
