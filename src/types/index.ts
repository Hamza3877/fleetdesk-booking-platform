/**
 * Shared domain types. Both the server (services, API routes) and the client
 * (components, hooks) import from here, so the data shape is defined once.
 *
 * Dates are plain "YYYY-MM-DD" strings (no times, no time zones) because a rental
 * only cares about which days a car is out.
 */

export const VEHICLE_CATEGORIES = ["compact", "sedan", "suv", "van", "luxury"] as const;
export const TRANSMISSIONS = ["automatic", "manual"] as const;
export const FUEL_TYPES = ["petrol", "diesel", "hybrid", "electric"] as const;
export const VEHICLE_STATUSES = ["available", "maintenance"] as const;
export const BOOKING_STATUSES = ["pending", "confirmed", "active", "completed", "cancelled"] as const;
export const PAYMENT_STATUSES = ["unpaid", "paid", "refunded"] as const;

export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];
export type Transmission = (typeof TRANSMISSIONS)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  category: VehicleCategory;
  transmission: Transmission;
  fuel: FuelType;
  seats: number;
  pricePerDay: number;
  description: string;
  features: string[];
  /** Brand colour used for the illustration when there is no photo. */
  color: string;
  /** Optional photo URL. When empty we draw an illustration instead. */
  imageUrl: string;
  status: VehicleStatus;
  /** Featured vehicles are shown on the landing page. */
  featured: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  /** Human friendly reference such as FD-1042, shown to customers. */
  reference: string;
  vehicleId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  /** Pickup day. */
  startDate: string;
  /** Return day. The car is free again for a new booking starting that day. */
  endDate: string;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

export interface BookingListItem extends Booking {
  vehicleName: string;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BusinessSettings {
  businessName: string;
  supportEmail: string;
  phone: string;
  city: string;
}

/** What the dashboard overview needs. Served through the GraphQL endpoint. */
export interface Analytics {
  kpis: {
    revenue: number;
    /** Percent change compared with the previous period of the same length. */
    revenueChange: number;
    bookings: number;
    /** 0-100 */
    occupancyRate: number;
    averageBookingValue: number;
  };
  revenueByDay: { date: string; revenue: number }[];
  bookingsByDay: { date: string; bookings: number }[];
  occupancyByDay: { date: string; occupancy: number }[];
  topVehicles: { vehicleId: string; name: string; revenue: number; bookings: number }[];
  statusBreakdown: { status: BookingStatus; count: number }[];
}
