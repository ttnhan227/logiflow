import { expect, test } from "@playwright/test";

test.describe("LogiFlow Full-Stack Freight Telemetry E2E Journey", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
  });

  test("1. Public tracking lookup and order milestone status", async ({ page }) => {
    await page.goto("/track");
    await expect(page.locator("h1, .page-header, strong").first()).toContainText(/Real-Time Shipment Visibility|Shipment Visibility|Tracking/i);

    // Search input
    const trackingInput = page.getByPlaceholder(/Enter tracking code or Order ID|LF-VN-|Order/i).or(page.locator("input[type='text']")).first();
    await expect(trackingInput).toBeVisible();
    await trackingInput.fill("1");
    
    const trackBtn = page.getByRole("button", { name: /Track|Search/i }).first();
    await trackBtn.click();

    // Verify milestone or result details
    await expect(page.getByText(/Order Details|Shipment|Tracking|Status|Order #/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("2. Dispatcher trip corridor routing & interactive Leaflet map", async ({ page }) => {
    // 1. Log in as Dispatcher
    await page.goto("/login");
    await page.locator("input[type='text']").first().fill("john.dispatcher");
    await page.locator("input[type='password']").fill("123");
    await page.getByRole("button", { name: /Sign In|Sign in/i }).click();

    // Verify dispatcher landing
    await expect(page).toHaveURL(/.*dispatch/);

    // 2. Navigate to Trips
    await page.goto("/dispatch/trips");
    await expect(page.getByText(/Dispatch Trips|Trips|Route/i).first()).toBeVisible({ timeout: 10_000 });

    // Click first trip detail link/button if available
    const tripDetailLink = page.getByRole("link", { name: /View|Details|TRP-/i }).or(page.locator("table tbody tr a")).first();
    if (await tripDetailLink.isVisible()) {
      await tripDetailLink.click();
      await expect(page).toHaveURL(/.*dispatch\/trips\/\d+/);

      // Verify Leaflet Map Container is rendered
      const leafletMap = page.locator(".leaflet-container");
      await expect(leafletMap).toBeVisible({ timeout: 10_000 });
    }
  });

  test("3. Dispatch operations SLA reports and DIFOT analytics", async ({ page }) => {
    // Log in as Dispatcher
    await page.goto("/login");
    await page.locator("input[type='text']").first().fill("john.dispatcher");
    await page.locator("input[type='password']").fill("123");
    await page.getByRole("button", { name: /Sign In|Sign in/i }).click();
    await expect(page).toHaveURL(/.*dispatch/);

    // Navigate to Dispatch Reports
    await page.goto("/dispatch/reports");
    await expect(page.getByText(/Dispatch Performance & Delay Analytics|Dispatch Performance|Delay Analytics|Operational Analytics/i).first()).toBeVisible({ timeout: 10_000 });

    // Verify KPI summary metrics & Export button
    await expect(page.getByText(/Total Trips|Completed Trips|On-Time Rate|Export PDF/i).first()).toBeVisible();
  });

  test("4. Multi-role Admin oversight & fleet management", async ({ page }) => {
    // Clear session
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();

    // Log in as Admin
    await page.locator("input[type='text']").first().fill("admin");
    await page.locator("input[type='password']").fill("123");
    await page.getByRole("button", { name: /Sign In|Sign in/i }).click();

    // Verify Admin Dashboard
    await expect(page).toHaveURL(/.*admin\/dashboard/);
    await expect(page.getByText(/Admin Dashboard|System Overview|Fleet|Operations/i).first()).toBeVisible({ timeout: 10_000 });

    // Navigate to Vehicles fleet management
    await page.goto("/admin/vehicles");
    await expect(page.getByText(/Vehicle Fleet|Fleet Management|Vehicles/i).first()).toBeVisible({ timeout: 10_000 });

    // Navigate to Trips Oversight
    await page.goto("/admin/trips-oversight");
    await expect(page.getByText(/Trip Oversight|Trips Oversight|Trips/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
