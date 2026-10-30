import { GraphQLSchema, buildSchema, graphql } from "graphql";
import { getAnalytics } from "@/server/services/analyticsService";


export const typeDefs =`
  type Query {
    analytics(days: Int = 30): Analytics!
  }

  type Analytics {
    kpis: Kpis!
    revenueByDay: [RevenuePoint!]!
    bookingsByDay: [BookingsPoint!]!
    occupancyByDay: [OccupancyPoint!]!
    topVehicles: [TopVehicle!]!
    statusBreakdown: [StatusCount!]!
  }

  type Kpis {
    revenue: Int!
    revenueChange: Int!
    bookings: Int!
    occupancyRate: Int!
    averageBookingValue: Int!
  }

  type RevenuePoint {
    date: String!
    revenue: Int!
  }

  type BookingsPoint {
    date: String!
    bookings: Int!
  }

  type OccupancyPoint {
    date: String!
    occupancy: Int!
  }

  type TopVehicle {
    vehicleId: String!
    name: String!
    revenue: Int!
    bookings: Int!
  }

  type StatusCount {
    status: String!
    count: Int!
  }
`;

const schema: GraphQLSchema = buildSchema(typeDefs);

const rootValue = {
  analytics: async ({ days }: { days: number }) => getAnalytics(Math.min(Math.max(days, 7), 90)),
};

export function runGraphQL(query: string, variables?: Record<string, unknown>) {
  return graphql({ schema, source: query, rootValue, variableValues: variables });
}
