import type { Metadata } from "next";
import { FleetManager } from "@/components/dashboard/FleetManager";

export const metadata: Metadata = { title: "Fleet" };

export default function FleetPage() {
  return <FleetManager />;
}
