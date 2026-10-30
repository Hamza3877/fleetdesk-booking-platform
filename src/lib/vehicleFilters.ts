import { isValidISODate } from "@/lib/dates";
import { VEHICLE_CATEGORIES, type VehicleCategory, type VehicleStatus } from "@/types";

export interface VehicleFilters {
  search?: string;
  category?: VehicleCategory;
  maxPrice?: number;
  startDate?: string;
  endDate?: string;
  status?: VehicleStatus;
  featured?: boolean;
}

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseVehicleFilters(raw: RawParams): VehicleFilters {
  const filters: VehicleFilters = {};

  const search = first(raw.search)?.trim();
  if (search) filters.search = search.slice(0, 60);

  const category = first(raw.category);
  if (category && (VEHICLE_CATEGORIES as readonly string[]).includes(category)) {
    filters.category = category as VehicleCategory;
  }

  const maxPrice = Number(first(raw.maxPrice));
  if (Number.isFinite(maxPrice) && maxPrice > 0) filters.maxPrice = maxPrice;

  const startDate = first(raw.startDate);
  const endDate = first(raw.endDate);
  if (startDate && endDate && isValidISODate(startDate) && isValidISODate(endDate) && endDate > startDate) {
    filters.startDate = startDate;
    filters.endDate = endDate;
  }

  return filters;
}

export function searchParamsToRecord(params: URLSearchParams): RawParams {
  return Object.fromEntries(params.entries());
}
