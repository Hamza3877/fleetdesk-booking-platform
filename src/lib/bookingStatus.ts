import type { BookingStatus } from "@/types";

export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["completed"],
  completed: [],
  cancelled: [],
};

export const TRANSITION_LABELS: Partial<Record<BookingStatus, string>> = {
  active: "Mark as picked up",
  completed: "Mark as returned",
  cancelled: "Cancel booking",
};
