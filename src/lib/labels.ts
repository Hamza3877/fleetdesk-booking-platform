import type {
  BookingStatus,
  FuelType,
  PaymentStatus,
  Transmission,
  VehicleCategory,
  VehicleStatus,
} from "@/types";


export const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  compact: "Compact",
  sedan: "Sedan",
  suv: "SUV",
  van: "Van",
  luxury: "Luxury",
};

export const TRANSMISSION_LABELS: Record<Transmission, string> = {
  automatic: "Automatic",
  manual: "Manual",
};

export const FUEL_LABELS: Record<FuelType, string> = {
  petrol: "Petrol",
  diesel: "Diesel",
  hybrid: "Hybrid",
  electric: "Electric",
};

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  available: "Available",
  maintenance: "In maintenance",
};

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Awaiting payment",
  confirmed: "Confirmed",
  active: "On rent",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
};
