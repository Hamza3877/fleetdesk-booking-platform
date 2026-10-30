import { addDays, isDayBooked, lastDays, todayISO } from "@/lib/dates";
import { getRepository } from "@/server/db";
import { releaseExpiredHolds } from "@/server/services/bookingService";
import { BOOKING_STATUSES, type Analytics, type Booking } from "@/types";


const isPaid = (booking: Booking) => booking.paymentStatus === "paid";

function sumRevenue(bookings: Booking[], from: string, to: string): number {
  return bookings
    .filter((booking) => isPaid(booking) && booking.startDate >= from && booking.startDate <= to)
    .reduce((sum, booking) => sum + booking.totalPrice, 0);
}

export async function getAnalytics(days: number, today: string = todayISO()): Promise<Analytics> {
  await releaseExpiredHolds();

  const repo = getRepository();
  const [vehicles, bookings] = await Promise.all([repo.vehicles.list(), repo.bookings.list()]);
  const window = lastDays(today, days);
  const periodStart = window[0];
  const previousStart = addDays(periodStart, -days);
  const previousEnd = addDays(periodStart, -1);

  const paidInPeriod = bookings.filter(
    (booking) => isPaid(booking) && booking.startDate >= periodStart && booking.startDate <= today,
  );

  const revenue = paidInPeriod.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const previousRevenue = sumRevenue(bookings, previousStart, previousEnd);
  const revenueChange = previousRevenue === 0 ? (revenue > 0 ? 100 : 0) : ((revenue - previousRevenue) / previousRevenue) * 100;

  const fleetInService = vehicles.filter((vehicle) => vehicle.status === "available").length;
  const onRent = bookings.filter((booking) => booking.status !== "cancelled");

  const occupancyByDay = window.map((date) => {
    const vehiclesOut = new Set(
      onRent
        .filter((booking) => isDayBooked([booking], date))
        .map((booking) => booking.vehicleId),
    ).size;
    const occupancy = fleetInService === 0 ? 0 : Math.min((vehiclesOut / fleetInService) * 100, 100);
    return { date, occupancy: Math.round(occupancy) };
  });

  const averageOccupancy =
    occupancyByDay.reduce((sum, day) => sum + day.occupancy, 0) / Math.max(occupancyByDay.length, 1);

  const topVehicles = vehicles
    .map((vehicle) => {
      const own = paidInPeriod.filter((booking) => booking.vehicleId === vehicle.id);
      return {
        vehicleId: vehicle.id,
        name: vehicle.name,
        revenue: own.reduce((sum, booking) => sum + booking.totalPrice, 0),
        bookings: own.length,
      };
    })
    .filter((vehicle) => vehicle.bookings > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return {
    kpis: {
      revenue,
      revenueChange: Math.round(revenueChange),
      bookings: paidInPeriod.length,
      occupancyRate: Math.round(averageOccupancy),
      averageBookingValue: paidInPeriod.length === 0 ? 0 : Math.round(revenue / paidInPeriod.length),
    },
    revenueByDay: window.map((date) => ({
      date,
      revenue: paidInPeriod.filter((booking) => booking.startDate === date).reduce((sum, b) => sum + b.totalPrice, 0),
    })),
    bookingsByDay: window.map((date) => ({
      date,
      bookings: paidInPeriod.filter((booking) => booking.startDate === date).length,
    })),
    occupancyByDay,
    topVehicles,
    statusBreakdown: BOOKING_STATUSES.map((status) => ({
      status,
      count: bookings.filter((booking) => booking.status === status).length,
    })),
  };
}
