import type { Metadata } from "next";
import { BookingsTable } from "@/components/dashboard/BookingsTable";

export const metadata: Metadata = { title: "Bookings" };

export default function BookingsPage() {
  return <BookingsTable />;
}
