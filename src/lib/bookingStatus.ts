import type { BookingStatus } from "@/types";

/**
 * How a booking moves through its life:
 *
 *   pending ──customer pays──▶ confirmed ──pickup──▶ active ──return──▶ completed
 *      │                           │
 *      └──────── cancelled ◀───────┘
 *
 * "pending" means the customer is still in checkout. Payment (not the owner) moves it to
 * "confirmed", so the only thing an owner can do with a pending booking is cancel it.
 * The same rules are used by the server (to enforce them) and the dashboard (to show buttons).
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["completed"],
  completed: [],
  cancelled: [],
};

/** Button text for each action the owner can take. */
export const TRANSITION_LABELS: Partial<Record<BookingStatus, string>> = {
  active: "Mark as picked up",
  completed: "Mark as returned",
  cancelled: "Cancel booking",
};
