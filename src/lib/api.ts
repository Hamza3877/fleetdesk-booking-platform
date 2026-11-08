import type { Analytics } from "@/types";


export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: Record<string, string[] | undefined>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
}

export async function api<T = unknown>(url: string, { method = "GET", body }: ApiOptions = {}): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (data as { error?: { message?: string; details?: Record<string, string[]> } } | null)?.error;
    throw new ApiError(error?.message ?? "Something went wrong. Please try again.", response.status, error?.details);
  }
  return data as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

const ANALYTICS_QUERY = /* GraphQL */ `
  query Analytics($days: Int!) {
    analytics(days: $days) {
      kpis { revenue revenueChange bookings occupancyRate averageBookingValue }
      revenueByDay { date revenue }
      bookingsByDay { date bookings }
      occupancyByDay { date occupancy }
      topVehicles { vehicleId name revenue bookings }
      statusBreakdown { status count }
    }
  }
`;

export async function fetchAnalytics(days: number): Promise<Analytics> {
  const result = await api<{ data?: { analytics: Analytics }; errors?: { message: string }[] }>("/api/graphql", {
    method: "POST",
    body: { query: ANALYTICS_QUERY, variables: { days } },
  });
  if (result.errors?.length || !result.data) {
    throw new Error(result.errors?.[0]?.message ?? "Could not load analytics");
  }
  return result.data.analytics;
}
