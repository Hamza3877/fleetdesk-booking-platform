import postgres, { type Sql } from "postgres";
import { MAX_PAGE_SIZE, type BookingQuery } from "@/lib/bookingQuery";
import type { Repository } from "@/server/db/repository";
import { ConflictError } from "@/server/errors";
import type { Booking, BookingListItem, BusinessSettings, Vehicle } from "@/types";

/**
 * The real database (PostgreSQL, for example Supabase). Used when DATABASE_URL is set.
 *
 * Each query is plain SQL with a small "mapper" that turns a database row (snake_case)
 * into the object the app uses (camelCase). Dates are returned as "YYYY-MM-DD" text so
 * they match the rest of the app.
 */

// ---------- connection ----------

const isLocalDatabase = (url: string) => /@(localhost|127\.0\.0\.1)[:/]/.test(url);

export function createSql(url: string): Sql {
  const isLocal = isLocalDatabase(url);

  // max_pipeline is a real postgres.js option that its type definitions leave out, so the options live in a variable.
  const options = {
    // Supabase's pooled connection (port 6543) doesn't support prepared statements.
    prepare: false,
    // Supabase needs SSL. Local databases (tests) don't.
    ssl: isLocal ? (false as const) : ("require" as const),
    // On serverless hosts every instance opens its own connections, so keep the pool small.
    // The free local database (PGlite, used by `npm run db:local` and the tests) is a
    // single-connection engine, so it gets exactly one. Supabase handles several fine.
    // On Vercel every function instance gets just one, so many instances can't use up Supabase's connection limit.
    max: Number(process.env.DATABASE_POOL_MAX ?? (isLocal || process.env.VERCEL ? 1 : 3)),
    // One query at a time per connection. A page often asks for two things at once (the layout and the page),
    // and sending them back-to-back down one pooled connection can leave Supabase's pooler waiting forever.
    max_pipeline: 1,
    idle_timeout: 20,
    connect_timeout: 15,
    fetch_types: false,
    onnotice: () => {},
  };

  return postgres(url, options);
}

// ---------- row <-> object mappers ----------

type Row = Record<string, unknown>;

// "features" is a text[] column. to_json() hands it back as a normal JSON array.
const VEHICLE_COLUMNS = (sql: Sql) => sql`
  id, name, make, model, year, category, transmission, fuel, seats, price_per_day, description,
  to_json(features) as features, color, image_url, status, featured, created_at`;

/** A JavaScript list as a PostgreSQL text[] value: ["a", "b"] becomes {"a","b"} (send it with ::text[]). */
export function toTextArray(values: string[]): string {
  const quoted = values.map((value) => `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`);
  return `{${quoted.join(",")}}`;
}

/** The booking columns to select. `prefix` is a fixed table alias written in this file (like "b."), never user input. */
const bookingColumns = (sql: Sql, prefix = "") =>
  sql.unsafe(
    `${prefix}id, ${prefix}reference, ${prefix}vehicle_id, ${prefix}customer_name, ${prefix}customer_email, ` +
      `${prefix}customer_phone, to_char(${prefix}start_date, 'YYYY-MM-DD') as start_date, ` +
      `to_char(${prefix}end_date, 'YYYY-MM-DD') as end_date, ${prefix}total_price, ${prefix}status, ` +
      `${prefix}payment_status, ${prefix}created_at`,
  );

const toIso = (value: unknown) => (value instanceof Date ? value.toISOString() : String(value));

function toVehicle(row: Row): Vehicle {
  return {
    id: row.id as string,
    name: row.name as string,
    make: row.make as string,
    model: row.model as string,
    year: row.year as number,
    category: row.category as Vehicle["category"],
    transmission: row.transmission as Vehicle["transmission"],
    fuel: row.fuel as Vehicle["fuel"],
    seats: row.seats as number,
    pricePerDay: row.price_per_day as number,
    description: row.description as string,
    features: row.features as string[],
    color: row.color as string,
    imageUrl: row.image_url as string,
    status: row.status as Vehicle["status"],
    featured: row.featured as boolean,
    createdAt: toIso(row.created_at),
  };
}

function toBooking(row: Row): Booking {
  return {
    id: row.id as string,
    reference: row.reference as string,
    vehicleId: row.vehicle_id as string,
    customerName: row.customer_name as string,
    customerEmail: row.customer_email as string,
    customerPhone: row.customer_phone as string,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
    totalPrice: row.total_price as number,
    status: row.status as Booking["status"],
    paymentStatus: row.payment_status as Booking["paymentStatus"],
    createdAt: toIso(row.created_at),
  };
}

/** Postgres reports "these dates overlap" as error 23P01 (exclusion_violation). */
function rethrowOverlap(error: unknown): never {
  if ((error as { code?: string })?.code === "23P01") {
    throw new ConflictError("Those dates were just taken. Please pick different dates.");
  }
  throw error;
}

/** Make a user's search text safe to use inside ILIKE (% and _ are wildcards there). */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (character) => `\\${character}`);

const SORT_COLUMNS: Record<BookingQuery["sortBy"], string> = {
  createdAt: "created_at",
  startDate: "start_date",
  totalPrice: "total_price",
  customerName: "customer_name",
};

// ---------- repository ----------

export function createPostgresRepository(sql: Sql): Repository {
  return {
    vehicles: {
      async list() {
        const rows = await sql<Row[]>`select ${VEHICLE_COLUMNS(sql)} from vehicles order by created_at, id`;
        return rows.map(toVehicle);
      },
      async get(id) {
        const [row] = await sql<Row[]>`select ${VEHICLE_COLUMNS(sql)} from vehicles where id = ${id}`;
        return row && toVehicle(row);
      },
      async insert(vehicle) {
        const [row] = await sql<Row[]>`
          insert into vehicles (id, name, make, model, year, category, transmission, fuel, seats, price_per_day,
                                description, features, color, image_url, status, featured, created_at)
          values (${vehicle.id}, ${vehicle.name}, ${vehicle.make}, ${vehicle.model}, ${vehicle.year},
                  ${vehicle.category}, ${vehicle.transmission}, ${vehicle.fuel}, ${vehicle.seats},
                  ${vehicle.pricePerDay}, ${vehicle.description}, ${toTextArray(vehicle.features)}::text[],
                  ${vehicle.color}, ${vehicle.imageUrl}, ${vehicle.status}, ${vehicle.featured}, ${vehicle.createdAt})
          returning ${VEHICLE_COLUMNS(sql)}`;
        return toVehicle(row);
      },
      async update(id, changes) {
        const current = await this.get(id);
        if (!current) return undefined;
        const next = { ...current, ...changes };
        const [row] = await sql<Row[]>`
          update vehicles set
            name = ${next.name}, make = ${next.make}, model = ${next.model}, year = ${next.year},
            category = ${next.category}, transmission = ${next.transmission}, fuel = ${next.fuel},
            seats = ${next.seats}, price_per_day = ${next.pricePerDay}, description = ${next.description},
            features = ${toTextArray(next.features)}::text[], color = ${next.color}, image_url = ${next.imageUrl},
            status = ${next.status}, featured = ${next.featured}
          where id = ${id}
          returning ${VEHICLE_COLUMNS(sql)}`;
        return row && toVehicle(row);
      },
      async remove(id) {
        const rows = await sql`delete from vehicles where id = ${id} returning id`;
        return rows.length > 0;
      },
    },

    bookings: {
      async list() {
        const rows = await sql<Row[]>`select ${bookingColumns(sql)} from bookings order by created_at, id`;
        return rows.map(toBooking);
      },
      async get(id) {
        const [row] = await sql<Row[]>`select ${bookingColumns(sql)} from bookings where id = ${id}`;
        return row && toBooking(row);
      },
      async listBlocking({ vehicleId, endsAfter } = {}) {
        const rows = await sql<Row[]>`
          select ${bookingColumns(sql)} from bookings
          where status <> 'cancelled'
            ${vehicleId ? sql`and vehicle_id = ${vehicleId}` : sql``}
            ${endsAfter ? sql`and end_date > ${endsAfter}::date` : sql``}
          order by start_date`;
        return rows.map(toBooking);
      },
      async hasAnyForVehicle(vehicleId) {
        const rows = await sql`select 1 from bookings where vehicle_id = ${vehicleId} limit 1`;
        return rows.length > 0;
      },
      async insert(booking) {
        try {
          const [row] = await sql<Row[]>`
            insert into bookings (id, reference, vehicle_id, customer_name, customer_email, customer_phone,
                                  start_date, end_date, total_price, status, payment_status, created_at)
            values (${booking.id}, 'FD-' || nextval('booking_reference_seq'), ${booking.vehicleId},
                    ${booking.customerName}, ${booking.customerEmail}, ${booking.customerPhone},
                    ${booking.startDate}::date, ${booking.endDate}::date, ${booking.totalPrice},
                    ${booking.status}, ${booking.paymentStatus}, ${booking.createdAt})
            returning ${bookingColumns(sql)}`;
          return toBooking(row);
        } catch (error) {
          return rethrowOverlap(error);
        }
      },
      async update(id, changes) {
        try {
          const [row] = await sql<Row[]>`
            update bookings set
              status = coalesce(${changes.status ?? null}, status),
              payment_status = coalesce(${changes.paymentStatus ?? null}, payment_status)
            where id = ${id}
            returning ${bookingColumns(sql)}`;
          return row && toBooking(row);
        } catch (error) {
          return rethrowOverlap(error);
        }
      },
      async cancelExpiredHolds(createdBeforeMs) {
        const rows = await sql`
          update bookings set status = 'cancelled'
          where status = 'pending' and payment_status = 'unpaid' and created_at < ${new Date(createdBeforeMs)}
          returning id`;
        return rows.length;
      },
      async search(query) {
        const pageSize = Math.min(Math.max(query.pageSize, 1), MAX_PAGE_SIZE);
        const pattern = `%${escapeLike(query.search)}%`;

        // One query shape for the count and the page. "t" joins in the vehicle name for searching and display.
        const base = sql`
          from (
            select ${bookingColumns(sql, "b.")}, v.name as vehicle_name
            from bookings b join vehicles v on v.id = b.vehicle_id
          ) t
          where (${query.status} = 'all' or t.status = ${query.status})
            and (${query.search} = ''
                 or (t.reference || ' ' || t.customer_name || ' ' || t.customer_email || ' ' || t.vehicle_name)
                    ilike ${pattern})`;

        const [{ count }] = await sql<{ count: string }[]>`select count(*) as count ${base}`;
        const total = Number(count);
        const totalPages = Math.max(Math.ceil(total / pageSize), 1);
        const page = Math.min(Math.max(query.page, 1), totalPages);

        // Column names can't be sent as values, so they come from a fixed list (never from the user).
        const column = sql(SORT_COLUMNS[query.sortBy]);
        const direction = query.sortDir === "asc" ? sql`asc` : sql`desc`;
        const rows = await sql<Row[]>`
          select * ${base}
          order by ${column} ${direction}, id
          limit ${pageSize} offset ${(page - 1) * pageSize}`;

        const items = rows.map((row): BookingListItem => ({ ...toBooking(row), vehicleName: row.vehicle_name as string }));
        return { items, total, page, pageSize, totalPages };
      },
    },

    settings: {
      async get() {
        const [row] = await sql<Row[]>`select business_name, support_email, phone, city from settings where id = 1`;
        return toSettings(row);
      },
      async save(settings) {
        const [row] = await sql<Row[]>`
          insert into settings (id, business_name, support_email, phone, city)
          values (1, ${settings.businessName}, ${settings.supportEmail}, ${settings.phone}, ${settings.city})
          on conflict (id) do update set
            business_name = excluded.business_name, support_email = excluded.support_email,
            phone = excluded.phone, city = excluded.city
          returning business_name, support_email, phone, city`;
        return toSettings(row);
      },
    },
  };
}

function toSettings(row: Row | undefined): BusinessSettings {
  if (!row) throw new Error("Settings row is missing. Run `npm run db:setup` to create the tables.");
  return {
    businessName: row.business_name as string,
    supportEmail: row.support_email as string,
    phone: row.phone as string,
    city: row.city as string,
  };
}
