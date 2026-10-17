import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS, VEHICLE_STATUS_LABELS } from "@/lib/labels";
import type { BookingStatus, PaymentStatus, VehicleStatus } from "@/types";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

const bookingTones: Record<BookingStatus, Tone> = {
  pending: "warning",
  confirmed: "info",
  active: "success",
  completed: "neutral",
  cancelled: "danger",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge tone={bookingTones[status]}>{BOOKING_STATUS_LABELS[status]}</Badge>;
}

const paymentTones: Record<PaymentStatus, Tone> = { unpaid: "warning", paid: "success", refunded: "neutral" };

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={paymentTones[status]}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return <Badge tone={status === "available" ? "success" : "warning"}>{VEHICLE_STATUS_LABELS[status]}</Badge>;
}
