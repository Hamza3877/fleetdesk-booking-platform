import { expect, test } from "@playwright/test";
import { randomTrip, ready } from "./helpers";

test("a customer finds a car, books it and pays with the test card", async ({ page }) => {
  const trip = randomTrip();

  // 1. Find a car
  await page.goto("/");
  await page.getByRole("link", { name: "Browse the fleet" }).click();
  await expect(page.getByRole("heading", { name: "Our fleet" })).toBeVisible();
  await page.locator('a[href^="/vehicles/veh_"]').first().click();
  await ready(page);

  // 2. Pick dates on the vehicle page. The price shows up live.
  // Retried as a whole: on a cold server the first typing can land just before React is ready.
  await expect(async () => {
    await page.getByLabel("Pickup").fill(trip.start);
    await page.getByLabel("Return").fill(trip.end);
    await expect(page.getByText("x 3 days")).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
  const vehicleUrl = page.url();
  await page.getByRole("button", { name: "Continue to booking" }).click();
  await ready(page);

  // 3. Step 1 is already filled in. Step 2: details (with validation).
  await expect(page.getByRole("heading", { name: "When do you need the car?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Who is driving?" })).toBeVisible();

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Please enter your full name")).toBeVisible();

  await page.getByLabel("Full name").fill("Ayesha Khan");
  await page.getByLabel("Email").fill("ayesha@example.com");
  await page.getByLabel("Phone").fill("+92 300 1234567");
  await page.getByRole("button", { name: "Continue" }).click();

  // 4. Review and pay
  await expect(page.getByRole("heading", { name: "Check everything, then pay" })).toBeVisible();
  await expect(page.getByText("Ayesha Khan")).toBeVisible();
  await page.getByRole("button", { name: /^Pay \$/ }).click();

  // 5. Test checkout page (the card is pre-filled with the working test card)
  await expect(page).toHaveURL(/\/checkout\/bk_/);
  await ready(page);
  await page.getByRole("button", { name: /Pay \$/ }).click();

  // 6. Confirmation
  await expect(page).toHaveURL(/\/booking\/bk_/);
  await expect(page.getByRole("heading", { name: "You're all set!" })).toBeVisible();
  await expect(page.getByText(/FD-\d+/).first()).toBeVisible();

  // 7. The same dates can't be booked again: the calendar panel warns and the button stays disabled.
  await page.goto(vehicleUrl);
  await ready(page);
  await page.getByLabel("Pickup").fill(trip.start);
  await page.getByLabel("Return").fill(trip.end);
  await expect(page.getByRole("alert").filter({ hasText: "already booked" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose your dates" })).toBeDisabled();
});

test("a declined test card shows an error and keeps the booking unpaid", async ({ page }) => {
  const trip = randomTrip();
  await page.goto("/vehicles");
  await page.locator('a[href^="/vehicles/veh_"]').nth(1).click();
  await ready(page);
  await page.getByLabel("Pickup").fill(trip.start);
  await page.getByLabel("Return").fill(trip.end);
  await page.getByRole("button", { name: "Continue to booking" }).click();
  await ready(page);
  await expect(page.getByRole("heading", { name: "When do you need the car?" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Who is driving?" })).toBeVisible();
  await page.getByLabel("Full name").fill("Declined Tester");
  await page.getByLabel("Email").fill("declined@example.com");
  await page.getByLabel("Phone").fill("+1 555 0100");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "Check everything, then pay" })).toBeVisible();
  await page.getByRole("button", { name: /^Pay \$/ }).click();

  await expect(page).toHaveURL(/\/checkout\/bk_/);
  await ready(page);
  await page.getByLabel("Card number").fill("4000 0000 0000 0002");
  await page.getByRole("button", { name: /Pay \$/ }).click();
  await expect(page.getByText("Your card was declined")).toBeVisible();
});
