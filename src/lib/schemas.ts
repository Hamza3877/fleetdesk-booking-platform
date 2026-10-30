import { z } from "zod";
import { isValidISODate, todayISO } from "@/lib/dates";
import {
  FUEL_TYPES,
  TRANSMISSIONS,
  VEHICLE_CATEGORIES,
  VEHICLE_STATUSES,
  BOOKING_STATUSES,
} from "@/types";


const isoDate = z.string().refine(isValidISODate, "Please choose a valid date");

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}


export const datesSchema = z
  .object({ startDate: isoDate, endDate: isoDate })
  .refine((value) => value.startDate >= todayISO(), {
    path: ["startDate"],
    message: "Pickup date can't be in the past",
  })
  .refine((value) => value.endDate > value.startDate, {
    path: ["endDate"],
    message: "Return date must be after the pickup date",
  });

export const customerSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your full name").max(80),
  customerEmail: z.string().trim().email("Enter a valid email address").max(120),
  customerPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Enter a valid phone number")
    .regex(/^[0-9+()\-\s]+$/, "Use digits, spaces, + and - only"),
});

export const bookingInputSchema = z
  .object({ vehicleId: z.string().min(1, "Vehicle is required") })
  .and(datesSchema)
  .and(customerSchema);

export type DatesInput = z.infer<typeof datesSchema>;
export type CustomerInput = z.infer<typeof customerSchema>;
export type BookingInput = z.infer<typeof bookingInputSchema>;

export const bookingStatusSchema = z.object({ status: z.enum(BOOKING_STATUSES) });


const currentYear = new Date().getFullYear();

export const vehicleInputSchema = z.object({
  name: z.string().trim().min(2, "Enter a name").max(60),
  make: z.string().trim().min(2, "Enter the make").max(40),
  model: z.string().trim().min(1, "Enter the model").max(40),
  year: z
    .number({ invalid_type_error: "Enter a year", required_error: "Enter a year" })
    .int()
    .min(1990, "Year must be 1990 or later")
    .max(currentYear + 1, "Year is too far in the future"),
  category: z.enum(VEHICLE_CATEGORIES),
  transmission: z.enum(TRANSMISSIONS),
  fuel: z.enum(FUEL_TYPES),
  seats: z
    .number({ invalid_type_error: "Enter seats", required_error: "Enter seats" })
    .int()
    .min(1, "At least 1 seat")
    .max(15, "At most 15 seats"),
  pricePerDay: z
    .number({ invalid_type_error: "Enter a price", required_error: "Enter a price" })
    .min(10, "Minimum price is $10 per day")
    .max(5000, "Maximum price is $5,000 per day"),
  description: z.string().trim().min(10, "Write at least 10 characters").max(500, "Keep it under 500 characters"),
  features: z.array(z.string().trim().min(1).max(40)).max(12),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour"),
  imageUrl: z
    .string()
    .max(400_000, "Image is too large")
    .refine(
      (value) => value === "" || value.startsWith("data:image/") || isHttpUrl(value),
      "Use an uploaded image or a full http(s) link",
    ),
  status: z.enum(VEHICLE_STATUSES),
  featured: z.boolean(),
});

export const vehiclePatchSchema = vehicleInputSchema.partial();

export type VehicleInput = z.infer<typeof vehicleInputSchema>;

export const vehicleFormSchema = vehicleInputSchema.omit({ features: true }).extend({
  features: z.string().max(400, "Too long"),
});

export type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export function parseFeatures(text: string): string[] {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}


export const settingsSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name").max(60),
  supportEmail: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(24),
  city: z.string().trim().min(2, "Enter your city").max(60),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export type LoginInput = z.infer<typeof loginSchema>;
