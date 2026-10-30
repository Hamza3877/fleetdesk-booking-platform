import { BOOKING_STATUSES, type BookingStatus } from "@/types";


export const BOOKING_SORT_FIELDS = ["createdAt", "startDate", "totalPrice", "customerName"] as const;
export type BookingSortField = (typeof BOOKING_SORT_FIELDS)[number];

export interface BookingQuery {
  search: string;
  status: BookingStatus | "all";
  sortBy: BookingSortField;
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
}

export const DEFAULT_BOOKING_QUERY: BookingQuery = {
  search: "",
  status: "all",
  sortBy: "createdAt",
  sortDir: "desc",
  page: 1,
  pageSize: 10,
};

export const MAX_PAGE_SIZE = 50;

function toPositiveInt(value: string | null, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseBookingQuery(params: URLSearchParams): BookingQuery {
  const status = params.get("status");
  const sortBy = params.get("sortBy");
  const sortDir = params.get("sortDir");
  const defaults = DEFAULT_BOOKING_QUERY;

  return {
    search: (params.get("search") ?? "").trim().slice(0, 60),
    status: (BOOKING_STATUSES as readonly string[]).includes(status ?? "")
      ? (status as BookingStatus)
      : "all",
    sortBy: (BOOKING_SORT_FIELDS as readonly string[]).includes(sortBy ?? "")
      ? (sortBy as BookingSortField)
      : defaults.sortBy,
    sortDir: sortDir === "asc" || sortDir === "desc" ? sortDir : defaults.sortDir,
    page: toPositiveInt(params.get("page"), defaults.page),
    pageSize: Math.min(toPositiveInt(params.get("pageSize"), defaults.pageSize), MAX_PAGE_SIZE),
  };
}

export function bookingQueryToParams(query: BookingQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.status !== "all") params.set("status", query.status);
  params.set("sortBy", query.sortBy);
  params.set("sortDir", query.sortDir);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return params;
}
