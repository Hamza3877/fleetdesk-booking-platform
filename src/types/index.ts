
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
  color: string;
  imageUrl: string;
  status: VehicleStatus;
  featured: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  reference: string;
  vehicleId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startDate: string;
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

export interface Analytics {
  kpis: {
    revenue: number;
    revenueChange: number;
    bookings: number;
    occupancyRate: number;
    averageBookingValue: number;
  };
  revenueByDay: { date: string; revenue: number }[];
  bookingsByDay: { date: string; bookings: number }[];
  occupancyByDay: { date: string; occupancy: number }[];
  topVehicles: { vehicleId: string; name: string; revenue: number; bookings: number }[];
  statusBreakdown: { status: BookingStatus; count: number }[];
}
