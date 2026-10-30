import { expect, test } from "@playwright/test";
import { ready, signInAsOwner } from "./helpers";

test("the dashboard is private: visitors are sent to the login page", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("a wrong password is rejected", async ({ page }) => {
  await page.goto("/login");
  await ready(page);
  await page.getByLabel("Email").fill("owner@fleetdesk.dev");
  await page.getByLabel("Password").fill("not-the-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Wrong email or password" })).toBeVisible();
});

test("the owner sees the overview, searches bookings and signs out", async ({ page }) => {
  await signInAsOwner(page);

  // KPI cards and charts are loaded through the GraphQL endpoint
  await expect(page.getByText("Average booking")).toBeVisible();
  await expect(page.getByText("Top vehicles")).toBeVisible();

  await page.getByRole("link", { name: "Bookings" }).click();
  await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
  await expect(page.getByRole("row").nth(1)).toBeVisible();

  await page.getByPlaceholder("Search by reference").fill("zzz-no-such-booking");
  await expect(page.getByText("No bookings found")).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("the owner can add a vehicle and it appears on the public site", async ({ page }) => {
  await signInAsOwner(page);
  await page.getByRole("link", { name: "Fleet" }).click();
  await page.getByRole("button", { name: /Add vehicle/ }).first().click();

  const form = page.getByRole("dialog");
  await form.getByLabel("Display name").fill("Suzuki Swift Test");
  await form.getByLabel("Make").fill("Suzuki");
  await form.getByLabel("Model").fill("Swift");
  await form.getByLabel("Year").fill("2024");
  await form.getByLabel("Seats").fill("5");
  await form.getByLabel("Price per day (USD)").fill("38");
  await form.getByLabel("Description").fill("A small, cheap car added by the end-to-end test.");
  await form.getByRole("button", { name: "Add vehicle" }).click();

  await expect(page.getByText("Suzuki Swift Test").first()).toBeVisible();

  await page.goto("/vehicles?search=Swift");
  await expect(page.getByText("Suzuki Swift Test")).toBeVisible();
});

test("the owner can restore the demo data after changing things", async ({ page }) => {
  await signInAsOwner(page);
  await page.goto("/dashboard/settings");
  await ready(page);

  const name = page.getByLabel("Business name");
  await expect(name).toHaveValue("Summit Rentals");
  await name.fill("Temporary Name");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("Settings saved")).toBeVisible();

     const reset = await page.request.post("/api/admin/reset-demo");
   expect(reset.ok()).toBe(true);
   await page.reload();
   await ready(page);
   await expect(page.getByLabel("Business name")).toHaveValue("Summit Rentals");
});
