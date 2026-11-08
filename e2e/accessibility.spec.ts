import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { ready, signInAsOwner } from "./helpers";


async function expectNoViolations(page: Page, name: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const summary = results.violations.map(
    (violation) => `${violation.id} (${violation.impact}): ${violation.help}\n    ${violation.nodes.slice(0, 3).map((node) => node.target.join(" ")).join("\n    ")}`,
  );
  expect(summary, `Accessibility problems on ${name}`).toEqual([]);
}

async function setTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((value) => document.documentElement.classList.toggle("dark", value === "dark"), theme);
}

const THEMES = ["light", "dark"] as const;

for (const theme of THEMES) {
  test.describe(`${theme} mode`, () => {
    test("public pages", async ({ page }) => {
      await page.goto("/");
      await ready(page);
      await page.locator('a[href^="/vehicles/veh_"]').first().waitFor();
      const vehiclePath = (await page.locator('a[href^="/vehicles/veh_"]').first().getAttribute("href")) ?? "/vehicles";
      const vehicleId = vehiclePath.split("/")[2].split("?")[0];

      const pages = [
        ["/", "home"],
        ["/vehicles", "fleet list"],
        ["/vehicles?category=suv&maxPrice=100", "filtered fleet list"],
        [vehiclePath, "vehicle page"],
        [`/book/${vehicleId}?startDate=2031-05-10&endDate=2031-05-13`, "booking page"],
        ["/login", "login"],
      ];

      for (const [path, name] of pages) {
        await page.goto(path);
        await ready(page);
        await setTheme(page, theme);
        await expectNoViolations(page, `${name} (${theme})`);
      }
    });

    test("owner dashboard", async ({ page }) => {
      await signInAsOwner(page);
      for (const [path, name] of [
        ["/dashboard", "overview"],
        ["/dashboard/bookings", "bookings"],
        ["/dashboard/fleet", "fleet"],
        ["/dashboard/settings", "settings"],
      ]) {
        await page.goto(path);
        await ready(page);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await page.waitForTimeout(1200);
        await setTheme(page, theme);
        await expectNoViolations(page, `dashboard ${name} (${theme})`);
      }
    });
  });
}
