import { diffInDays } from "@/lib/dates";

export interface Quote {
  days: number;
  dailyRate: number;
  total: number;
}

export function calculateQuote(dailyRate: number, startDate: string, endDate: string): Quote {
  const days = Math.max(diffInDays(startDate, endDate), 0);
  return { days, dailyRate, total: days * dailyRate };
}
