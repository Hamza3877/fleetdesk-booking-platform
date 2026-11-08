import { expect, it } from "vitest";
import { describeWithBackends } from "@/server/testing/backends";
import { getAnalytics } from "@/server/services/analyticsService";

describeWithBackends("analyticsService", () => {
  it("returns one data point per day for each chart", async () => {
    const analytics = await getAnalytics(30);
    expect(analytics.revenueByDay).toHaveLength(30);
    expect(analytics.bookingsByDay).toHaveLength(30);
    expect(analytics.occupancyByDay).toHaveLength(30);
  });

  it("keeps the KPIs consistent with the chart data", async () => {
    const analytics = await getAnalytics(30);
    const chartRevenue = analytics.revenueByDay.reduce((sum, day) => sum + day.revenue, 0);
    const chartBookings = analytics.bookingsByDay.reduce((sum, day) => sum + day.bookings, 0);

    expect(analytics.kpis.revenue).toBe(chartRevenue);
    expect(analytics.kpis.bookings).toBe(chartBookings);
    expect(analytics.kpis.revenue).toBeGreaterThan(0);
  });

  it("keeps occupancy between 0 and 100", async () => {
    for (const day of (await getAnalytics(90)).occupancyByDay) {
      expect(day.occupancy).toBeGreaterThanOrEqual(0);
      expect(day.occupancy).toBeLessThanOrEqual(100);
    }
  });
});
