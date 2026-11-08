import { expect, type Page } from "@playwright/test";

export function daysFromToday(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

export function randomTrip() {
  const offset = 200 + Math.floor(Math.random() * 600);
  return { start: daysFromToday(offset), end: daysFromToday(offset + 3) };
}

export async function signInAsOwner(page: Page) {
  await page.goto("/login");
  await page.waitForLoadState("networkidle");
  await page.getByRole("button", { name: "Fill in demo login" }).click();
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

export async function ready(page: Page) {
  await page.waitForLoadState("networkidle");
}
