/**
 * End-to-end smoke test against a RUNNING server.
 *   1) npm run build && npm start      (or npm run dev)
 *   2) npm run smoke                   (optionally: BASE_URL=http://localhost:3000 npm run smoke)
 * It walks through the real customer and owner flows over HTTP and prints PASS / FAIL for each step.
 */
const BASE = process.env.BASE_URL ?? "http://localhost:3000";
let cookie = "";
let failures = 0;

function check(name, condition, extra = "") {
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${!condition && extra ? `  -> ${extra}` : ""}`);
  if (!condition) failures += 1;
}

async function request(path, { method = "GET", body, auth = false } = {}) {
  const response = await fetch(BASE + path, {
    method,
    redirect: "manual",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(auth && cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* HTML page */ }
  return { status: response.status, json, text, headers: response.headers };
}

const addDays = (iso, n) => new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10);
const today = new Date().toISOString().slice(0, 10);
const customer = { customerName: "Smoke Tester", customerEmail: "smoke@example.com", customerPhone: "+1 555 0199" };

// ---- Public pages render ----
for (const path of ["/", "/vehicles", "/vehicles?category=suv&maxPrice=100", "/login"]) {
  const page = await request(path);
  check(`page ${path} returns 200`, page.status === 200, String(page.status));
}
const health = await request("/api/health");
check("health endpoint says the app and data store work", health.status === 200 && health.json?.ok === true, JSON.stringify(health.json));
const list = await request("/vehicles");
check("vehicle list is server-rendered with real data", list.text.includes("Toyota Corolla"));
const missing = await request("/vehicles/does-not-exist");
check("unknown vehicle shows 404", missing.status === 404, String(missing.status));

// ---- Public API ----
const vehicles = (await request("/api/vehicles")).json;
check("API lists available vehicles only", Array.isArray(vehicles) && vehicles.length > 0 && vehicles.every((v) => v.status === "available"));
const vehicle = vehicles[0];

// A random far-future window, so the test can be run again and again against a database
// that keeps its data (the previous run's bookings never get in the way).
const start = addDays(today, 120 + Math.floor(Math.random() * 500));
const end = addDays(start, 3);
const ranges = (await request(`/api/vehicles/${vehicle.id}/availability`)).json;
check("availability endpoint returns booked ranges", Array.isArray(ranges));

// ---- Validation ----
const invalid = await request("/api/bookings", { method: "POST", body: { vehicleId: vehicle.id, startDate: start, endDate: start, ...customer } });
check("rejects return date not after pickup (400)", invalid.status === 400, String(invalid.status));
const badEmail = await request("/api/bookings", { method: "POST", body: { vehicleId: vehicle.id, startDate: start, endDate: end, ...customer, customerEmail: "nope" } });
check("rejects invalid email (400)", badEmail.status === 400, String(badEmail.status));

// ---- Customer flow: book -> checkout -> pay ----
const created = await request("/api/bookings", { method: "POST", body: { vehicleId: vehicle.id, startDate: start, endDate: end, ...customer } });
check("creates booking (201, pending, unpaid)", created.status === 201 && created.json.status === "pending" && created.json.paymentStatus === "unpaid", JSON.stringify(created.json));
check("price is days x daily rate", created.json.totalPrice === vehicle.pricePerDay * 3);
const bookingId = created.json.id;

const duplicate = await request("/api/bookings", { method: "POST", body: { vehicleId: vehicle.id, startDate: addDays(start, 1), endDate: addDays(start, 2), ...customer } });
check("double booking is blocked (409)", duplicate.status === 409, String(duplicate.status));

const checkout = await request("/api/payments/checkout", { method: "POST", body: { bookingId } });
check("checkout returns the test checkout url", checkout.json?.url === `/checkout/${bookingId}`, JSON.stringify(checkout.json));
check("checkout page renders", (await request(checkout.json.url)).status === 200);

const declined = await request("/api/payments/test-pay", { method: "POST", body: { bookingId, cardNumber: "4000 0000 0000 0002" } });
check("declined test card is rejected (400)", declined.status === 400, String(declined.status));
const paid = await request("/api/payments/test-pay", { method: "POST", body: { bookingId, cardNumber: "4242 4242 4242 4242" } });
check("test card pays and confirms booking", paid.status === 200 && paid.json.status === "confirmed" && paid.json.paymentStatus === "paid", JSON.stringify(paid.json));
const confirmation = await request(`/booking/${bookingId}`);
check("confirmation page shows the reference", confirmation.status === 200 && confirmation.text.includes(paid.json.reference));

// ---- Owner area is protected ----
check("bookings API needs login (401)", (await request("/api/bookings")).status === 401);
check("graphql needs login (401)", (await request("/api/graphql", { method: "POST", body: { query: "{ analytics { kpis { revenue } } }" } })).status === 401);
check("dashboard redirects to /login", (await request("/dashboard")).status === 307);
check("creating a vehicle needs login (401)", (await request("/api/vehicles", { method: "POST", body: {} })).status === 401);

const badLogin = await request("/api/auth/login", { method: "POST", body: { email: "owner@fleetdesk.dev", password: "wrong" } });
check("wrong password is rejected (401)", badLogin.status === 401, String(badLogin.status));

const login = await request("/api/auth/login", { method: "POST", body: { email: "owner@fleetdesk.dev", password: "demo1234" } });
check("owner can sign in", login.status === 200);
cookie = (login.headers.getSetCookie?.() ?? []).map((value) => value.split(";")[0]).join("; ");
check("session cookie is set", cookie.startsWith("fd_session="));

for (const path of ["/dashboard", "/dashboard/bookings", "/dashboard/fleet", "/dashboard/settings"]) {
  check(`page ${path} opens when signed in`, (await request(path, { auth: true })).status === 200);
}

// ---- Owner flows ----
const analytics = await request("/api/graphql", {
  method: "POST",
  auth: true,
  body: { query: "query($days:Int!){ analytics(days:$days){ kpis{ revenue bookings occupancyRate } revenueByDay{ date revenue } } }", variables: { days: 30 } },
});
check("GraphQL analytics returns 30 days of data", analytics.json?.data?.analytics?.revenueByDay?.length === 30, JSON.stringify(analytics.json)?.slice(0, 200));
check("analytics has revenue", analytics.json?.data?.analytics?.kpis?.revenue > 0);

const table = await request("/api/bookings?search=Smoke&pageSize=5", { auth: true });
check("bookings table search finds the new booking", table.json?.items?.some((b) => b.id === bookingId), JSON.stringify(table.json)?.slice(0, 200));
const sorted = await request("/api/bookings?sortBy=totalPrice&sortDir=desc&pageSize=3", { auth: true });
const prices = sorted.json?.items?.map((b) => b.totalPrice) ?? [];
check("bookings can be sorted by total price", prices.length === 3 && prices[0] >= prices[1] && prices[1] >= prices[2], String(prices));

const illegal = await request(`/api/bookings/${bookingId}`, { method: "PATCH", auth: true, body: { status: "completed" } });
check("illegal status change is blocked (409)", illegal.status === 409, String(illegal.status));
const cancelled = await request(`/api/bookings/${bookingId}`, { method: "PATCH", auth: true, body: { status: "cancelled" } });
check("owner can cancel; paid booking becomes refunded", cancelled.json?.status === "cancelled" && cancelled.json?.paymentStatus === "refunded", JSON.stringify(cancelled.json));
const rebook = await request("/api/bookings", { method: "POST", body: { vehicleId: vehicle.id, startDate: start, endDate: end, ...customer } });
check("cancelled dates are free again", rebook.status === 201, String(rebook.status));
// Clean up: cancel the booking we just made so no test data blocks the calendar.
if (rebook.status === 201) await request(`/api/bookings/${rebook.json.id}`, { method: "PATCH", auth: true, body: { status: "cancelled" } });

const newVehicle = {
  name: "Smoke Test Car", make: "Test", model: "One", year: 2024, category: "compact", transmission: "automatic", fuel: "petrol",
  seats: 4, pricePerDay: 40, description: "A car created by the smoke test.", features: ["Radio"], color: "#112233", imageUrl: "", status: "available", featured: false,
};
const addVehicle = await request("/api/vehicles", { method: "POST", auth: true, body: newVehicle });
check("owner can add a vehicle", addVehicle.status === 201, JSON.stringify(addVehicle.json));
const edit = await request(`/api/vehicles/${addVehicle.json.id}`, { method: "PATCH", auth: true, body: { pricePerDay: 45 } });
check("owner can edit a vehicle", edit.json?.pricePerDay === 45);
const invalidVehicle = await request("/api/vehicles", { method: "POST", auth: true, body: { ...newVehicle, pricePerDay: 1 } });
check("vehicle validation works (400)", invalidVehicle.status === 400, String(invalidVehicle.status));
const maintenance = await request(`/api/vehicles/${addVehicle.json.id}`, { method: "PATCH", auth: true, body: { status: "maintenance" } });
check("vehicle in maintenance disappears from public list", maintenance.status === 200 && !(await request("/api/vehicles")).json.some((v) => v.id === addVehicle.json.id));
const removed = await request(`/api/vehicles/${addVehicle.json.id}`, { method: "DELETE", auth: true });
check("owner can delete a vehicle with no bookings", removed.status === 200, String(removed.status));
const blocked = await request(`/api/vehicles/${vehicle.id}`, { method: "DELETE", auth: true });
check("vehicle with upcoming bookings can't be deleted (409)", blocked.status === 409, String(blocked.status));

const settings = await request("/api/settings", { method: "PATCH", auth: true, body: { businessName: "Summit Rentals", supportEmail: "hello@summitrentals.example", phone: "+1 (555) 014-2290", city: "Austin, TX" } });
check("settings can be saved", settings.status === 200);

const logout = await request("/api/auth/logout", { method: "POST", auth: true });
check("owner can sign out", logout.status === 200);

console.log(failures === 0 ? "\nAll smoke checks passed." : `\n${failures} check(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
