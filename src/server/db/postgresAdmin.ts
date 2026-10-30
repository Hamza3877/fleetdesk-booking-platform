import type { Sql, TransactionSql } from "postgres";
import { toTextArray } from "@/server/db/postgresRepository";
import { SCHEMA_SQL } from "@/server/db/schema";
import { buildSeedData, type Database } from "@/server/db/seed";


export async function applySchema(sql: Sql | TransactionSql): Promise<void> {
  await sql.unsafe(SCHEMA_SQL);
}

export async function isEmpty(sql: Sql): Promise<boolean> {
  const [{ count }] = await sql<{ count: string }[]>`select count(*) as count from vehicles`;
  return Number(count) === 0;
}

export async function replaceAllData(sql: Sql, data: Database): Promise<void> {
  await sql.begin(async (tx) => {
    await tx`truncate bookings, vehicles restart identity cascade`;
    await insertAllData(tx, data);
  });
}

async function insertAllData(tx: TransactionSql, data: Database): Promise<void> {
  for (const v of data.vehicles) {
    await tx`
      insert into vehicles (id, name, make, model, year, category, transmission, fuel, seats, price_per_day,
                            description, features, color, image_url, status, featured, created_at)
      values (${v.id}, ${v.name}, ${v.make}, ${v.model}, ${v.year}, ${v.category}, ${v.transmission}, ${v.fuel},
              ${v.seats}, ${v.pricePerDay}, ${v.description}, ${toTextArray(v.features)}::text[], ${v.color},
              ${v.imageUrl}, ${v.status}, ${v.featured}, ${v.createdAt})`;
  }

  const chunkSize = 50;
  for (let start = 0; start < data.bookings.length; start += chunkSize) {
    const rows = data.bookings.slice(start, start + chunkSize).map((b) => ({
      id: b.id,
      reference: b.reference,
      vehicle_id: b.vehicleId,
      customer_name: b.customerName,
      customer_email: b.customerEmail,
      customer_phone: b.customerPhone,
      start_date: b.startDate,
      end_date: b.endDate,
      total_price: b.totalPrice,
      status: b.status,
      payment_status: b.paymentStatus,
      created_at: b.createdAt,
    }));
    await tx`insert into bookings ${tx(rows)}`;
  }

  const highest = data.bookings.reduce((max, b) => Math.max(max, Number.parseInt(b.reference.slice(3), 10)), 1000);
  await tx`select setval('booking_reference_seq', ${highest})`;

  const s = data.settings;
  await tx`
    insert into settings (id, business_name, support_email, phone, city)
    values (1, ${s.businessName}, ${s.supportEmail}, ${s.phone}, ${s.city})
    on conflict (id) do update set
      business_name = excluded.business_name, support_email = excluded.support_email,
      phone = excluded.phone, city = excluded.city`;
}

const SETUP_LOCK_ID = 727_411;

export async function ensureDatabaseReady(sql: Sql): Promise<void> {
  const tablesExist = async (db: Sql | TransactionSql) => {
    const [{ exists }] = await db<{ exists: boolean }[]>`select to_regclass('public.vehicles') is not null as exists`;
    return exists;
  };

  if (await tablesExist(sql)) return;

  await sql.begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(${SETUP_LOCK_ID})`;
    if (await tablesExist(tx)) return; // another instance finished while we waited
    await applySchema(tx);
    await insertAllData(tx, buildSeedData());
  });
}
