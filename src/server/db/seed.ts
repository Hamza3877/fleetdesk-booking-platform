import { addDays, todayISO } from "@/lib/dates";
import type { Booking, BookingStatus, BusinessSettings, PaymentStatus, Vehicle } from "@/types";


export interface Database {
  vehicles: Vehicle[];
  bookings: Booking[];
  settings: BusinessSettings;
}

const SEED_CREATED_AT = "2026-01-05T09:00:00.000Z";

type VehicleSeed = Omit<Vehicle, "createdAt" | "imageUrl" | "status" | "featured"> &
  Partial<Pick<Vehicle, "status" | "featured">>;

const vehicleSeeds: VehicleSeed[] = [
  {
    id: "veh_corolla", name: "Toyota Corolla", make: "Toyota", model: "Corolla", year: 2024,
    category: "compact", transmission: "automatic", fuel: "petrol", seats: 5, pricePerDay: 42, color: "#2563eb",
    description: "Easy to drive and easy on fuel. A great pick for city trips and airport runs.",
    features: ["Bluetooth", "Apple CarPlay", "Backup camera", "Lane assist"],
  },
  {
    id: "veh_leaf", name: "Nissan Leaf", make: "Nissan", model: "Leaf", year: 2023,
    category: "compact", transmission: "automatic", fuel: "electric", seats: 5, pricePerDay: 55, color: "#0d9488",
    description: "Quiet, zero-emission and surprisingly roomy. Perfect for getting around town.",
    features: ["One-pedal driving", "Apple CarPlay", "Backup camera", "Heated seats"],
  },
  {
    id: "veh_civic", name: "Honda Civic", make: "Honda", model: "Civic", year: 2023,
    category: "sedan", transmission: "automatic", fuel: "petrol", seats: 5, pricePerDay: 48, color: "#dc2626",
    description: "A comfortable, reliable sedan with plenty of boot space for the whole weekend.",
    features: ["Bluetooth", "Android Auto", "Cruise control", "Backup camera"],
  },
  {
    id: "veh_model3", name: "Tesla Model 3", make: "Tesla", model: "Model 3", year: 2024,
    category: "sedan", transmission: "automatic", fuel: "electric", seats: 5, pricePerDay: 89, color: "#475569",
    description: "Fast, smooth and packed with tech. Long range makes road trips effortless.",
    features: ["Autopilot", "Glass roof", "Navigation", "Premium audio"], featured: true,
  },
  {
    id: "veh_rav4", name: "Toyota RAV4 Hybrid", make: "Toyota", model: "RAV4", year: 2024,
    category: "suv", transmission: "automatic", fuel: "hybrid", seats: 5, pricePerDay: 72, color: "#16a34a",
    description: "Spacious family SUV with excellent mileage and all-wheel drive.",
    features: ["All-wheel drive", "Apple CarPlay", "Blind-spot monitor", "Roof rails"], featured: true,
  },
  {
    id: "veh_explorer", name: "Ford Explorer", make: "Ford", model: "Explorer", year: 2023,
    category: "suv", transmission: "automatic", fuel: "petrol", seats: 7, pricePerDay: 95, color: "#1e293b",
    description: "Three rows of seats and lots of power for big groups and long drives.",
    features: ["7 seats", "Towing package", "Navigation", "Rear climate control"],
  },
  {
    id: "veh_wrangler", name: "Jeep Wrangler", make: "Jeep", model: "Wrangler", year: 2023,
    category: "suv", transmission: "manual", fuel: "petrol", seats: 4, pricePerDay: 105, color: "#ea580c",
    description: "Open-air adventure machine for trails and weekend escapes.",
    features: ["4x4", "Removable roof", "Skid plates", "Bluetooth"], status: "maintenance",
  },
  {
    id: "veh_ioniq5", name: "Hyundai Ioniq 5", make: "Hyundai", model: "Ioniq 5", year: 2024,
    category: "suv", transmission: "automatic", fuel: "electric", seats: 5, pricePerDay: 85, color: "#7c3aed",
    description: "Retro-futuristic electric crossover with ultra-fast charging.",
    features: ["Fast charging", "Heads-up display", "Vehicle-to-load", "Navigation"],
  },
  {
    id: "veh_pacifica", name: "Chrysler Pacifica Hybrid", make: "Chrysler", model: "Pacifica", year: 2023,
    category: "van", transmission: "automatic", fuel: "hybrid", seats: 7, pricePerDay: 110, color: "#0ea5e9",
    description: "The easiest way to move a family: sliding doors, big storage, quiet ride.",
    features: ["Sliding doors", "Rear entertainment", "Stow 'n Go seats", "Apple CarPlay"],
  },
  {
    id: "veh_carnival", name: "Kia Carnival", make: "Kia", model: "Carnival", year: 2023,
    category: "van", transmission: "automatic", fuel: "petrol", seats: 8, pricePerDay: 98, color: "#b45309",
    description: "Eight seats, a huge cargo area and a comfortable ride for group travel.",
    features: ["8 seats", "Power sliding doors", "Tri-zone climate", "Backup camera"],
  },
  {
    id: "veh_bmw5", name: "BMW 5 Series", make: "BMW", model: "5 Series", year: 2024,
    category: "luxury", transmission: "automatic", fuel: "petrol", seats: 5, pricePerDay: 145, color: "#111827",
    description: "Executive comfort with sporty handling. Arrive in style.",
    features: ["Leather seats", "Head-up display", "Harman Kardon audio", "Adaptive cruise"], featured: true,
  },
  {
    id: "veh_eclass", name: "Mercedes-Benz E-Class", make: "Mercedes-Benz", model: "E-Class", year: 2024,
    category: "luxury", transmission: "automatic", fuel: "petrol", seats: 5, pricePerDay: 160, color: "#94a3b8",
    description: "A calm, refined flagship sedan for business trips and special occasions.",
    features: ["Massage seats", "Ambient lighting", "Burmester audio", "Driver assist"],
  },
];

const customerNames = [
  "Olivia Carter", "Liam Johnson", "Emma Davis", "Noah Wilson", "Ava Martinez", "Ethan Brown",
  "Sophia Taylor", "Mason Anderson", "Isabella Thomas", "Lucas Moore", "Mia Jackson", "Logan White",
  "Amelia Harris", "James Clark", "Harper Lewis", "Benjamin Walker", "Evelyn Hall", "Henry Young",
  "Abigail King", "Daniel Wright",
];


function createRandom(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSeedData(today: string = todayISO()): Database {
  const random = createRandom(2026);
  const pick = <T,>(items: T[]): T => items[Math.floor(random() * items.length)];
  const between = (min: number, max: number) => min + Math.floor(random() * (max - min + 1));

  const vehicles: Vehicle[] = vehicleSeeds.map((seed) => ({
    ...seed,
    imageUrl: "",
    status: seed.status ?? "available",
    featured: seed.featured ?? false,
    createdAt: SEED_CREATED_AT,
  }));

  const bookings: Booking[] = [];
  const timelineStart = addDays(today, -60);
  const timelineEnd = addDays(today, 30);

  
  for (const vehicle of vehicles) {
    if (vehicle.status === "maintenance") continue;

    let cursor = addDays(timelineStart, between(0, 6));
    while (cursor < timelineEnd) {
      const days = between(1, 6);
      const startDate = cursor;
      const endDate = addDays(cursor, days);
      cursor = addDays(endDate, between(0, 4));

      
      if (startDate > today && random() < 0.35) continue;

      let status: BookingStatus;
      let paymentStatus: PaymentStatus = "paid";
      if (endDate <= today) {
        status = random() < 0.08 ? "cancelled" : "completed";
      } else if (startDate <= today) {
        status = "active";
      } else {
        status = random() < 0.06 ? "cancelled" : "confirmed";
      }
      if (status === "cancelled") paymentStatus = "refunded";

      const customerName = pick(customerNames);
      const nameSlug = customerName.toLowerCase().replace(" ", ".");
      const leadDays = between(2, 21);
            const createdOn = addDays(startDate, -leadDays);

      bookings.push({
        id: `bk_${String(bookings.length + 1).padStart(3, "0")}`,
        reference: `FD-${1000 + bookings.length + 1}`,
        vehicleId: vehicle.id,
        customerName,
        customerEmail: `${nameSlug}@example.com`,
        customerPhone: `+1 555 01${between(10, 99)}`,
        startDate,
        endDate,
        totalPrice: days * vehicle.pricePerDay,
        status,
        paymentStatus,
        createdAt: `${createdOn > today ? addDays(today, -1) : createdOn}T10:00:00.000Z`,
      });
    }
  }

  return {
    vehicles,
    bookings,
    settings: {
      businessName: "Summit Rentals",
      supportEmail: "hello@summitrentals.example",
      phone: "+1 (555) 014-2290",
      city: "Austin, TX",
    },
  };
}
