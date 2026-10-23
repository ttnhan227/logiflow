import { chromium } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:5173';

const VIEWPORTS = [
  { name: 'Desktop', width: 1440, height: 900 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];

// Complete inventory of routes mapped in App.jsx
const ROUTES_TO_AUDIT = [
  // Public
  { path: '/', role: null, name: 'Home' },
  { path: '/about', role: null, name: 'About' },
  { path: '/services', role: null, name: 'Services' },
  { path: '/fleet', role: null, name: 'Fleet' },
  { path: '/coverage', role: null, name: 'Coverage' },
  { path: '/track', role: null, name: 'Track' },
  { path: '/contact', role: null, name: 'Contact' },
  { path: '/faq', role: null, name: 'FAQ' },
  { path: '/business', role: null, name: 'Business' },
  { path: '/drivers', role: null, name: 'Drivers' },
  { path: '/mobile-app', role: null, name: 'Mobile App' },
  { path: '/insights', role: null, name: 'Insights' },
  // Auth
  { path: '/login', role: null, name: 'Login' },
  { path: '/register/driver', role: null, name: 'Driver Register' },
  { path: '/register/customer', role: null, name: 'Customer Register' },
  // Profile
  { path: '/profile', role: 'ADMIN', name: 'Profile' },
  { path: '/profile/edit', role: 'ADMIN', name: 'Profile Edit' },
  // Dispatch
  { path: '/dispatch/orders', role: 'DISPATCHER', name: 'Dispatch Orders' },
  { path: '/dispatch/orders/import', role: 'DISPATCHER', name: 'Dispatch Order Import' },
  { path: '/dispatch/orders/101', role: 'DISPATCHER', name: 'Dispatch Order Detail' },
  { path: '/dispatch/drivers', role: 'DISPATCHER', name: 'Available Drivers' },
  { path: '/dispatch/trips', role: 'DISPATCHER', name: 'Dispatch Trips' },
  { path: '/dispatch/trips/create', role: 'DISPATCHER', name: 'Dispatch Trip Create' },
  { path: '/dispatch/trips/1', role: 'DISPATCHER', name: 'Dispatch Trip Detail' },
  { path: '/dispatch/trips/1/assign', role: 'DISPATCHER', name: 'Dispatch Trip Assign' },
  { path: '/dispatch/notifications', role: 'DISPATCHER', name: 'Dispatch Notifications' },
  { path: '/dispatch/reports', role: 'DISPATCHER', name: 'Dispatch Reports' },
  // Admin
  { path: '/admin/dashboard', role: 'ADMIN', name: 'Admin Dashboard' },
  { path: '/admin/users/drivers', role: 'ADMIN', name: 'Admin Drivers' },
  { path: '/admin/users/customers', role: 'ADMIN', name: 'Admin Customers' },
  { path: '/admin/users/dispatchers', role: 'ADMIN', name: 'Admin Dispatchers' },
  { path: '/admin/users/1', role: 'ADMIN', name: 'Admin User Detail' },
  { path: '/admin/users/1/edit', role: 'ADMIN', name: 'Admin User Edit' },
  { path: '/admin/system/overview', role: 'ADMIN', name: 'Admin System Overview' },
  { path: '/admin/audit-logs', role: 'ADMIN', name: 'Admin Audit Logs' },
  { path: '/admin/registration-requests', role: 'ADMIN', name: 'Admin Registration Requests' },
  { path: '/admin/registration-requests/1', role: 'ADMIN', name: 'Admin Registration Request Detail' },
  { path: '/admin/vehicles', role: 'ADMIN', name: 'Admin Vehicles' },
  { path: '/admin/reports', role: 'ADMIN', name: 'Admin Reports' },
  { path: '/admin/trips-oversight', role: 'ADMIN', name: 'Admin Trips Oversight' },
  { path: '/admin/trips-oversight/1', role: 'ADMIN', name: 'Admin Trips Oversight Detail' },
  { path: '/admin/notifications', role: 'ADMIN', name: 'Admin Notifications' },
  { path: '/admin/payment-requests', role: 'ADMIN', name: 'Admin Payment Requests' },
];

async function runAudit() {
  console.log(`Starting Live UI/UX & Responsive Audit against ${BASE_URL}...`);
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const vp of VIEWPORTS) {
    console.log(`\n======================================================`);
    console.log(`AUDITING VIEWPORT: ${vp.name} (${vp.width}x${vp.height})`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });

    const page = await context.newPage();

    // Mock all backend API requests to ensure every page loads cleanly
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/auth/me') || url.includes('/users/me')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 1, username: 'admin', role: 'ADMIN', name: 'Admin User' }),
        });
      }

      if (url.includes('/orders') || url.includes('/trips') || url.includes('/vehicles') || url.includes('/drivers')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [
              {
                id: 1,
                tripId: 1,
                orderId: 101,
                trackingNumber: 'LF-VN-000101',
                orderStatus: 'IN_TRANSIT',
                tripStatus: 'IN_TRANSIT',
                risk: 'ON_TRACK',
                originCity: 'Ho Chi Minh City',
                destinationCity: 'Da Nang',
                totalDistanceKm: 850,
                totalWeightTon: 12.5,
                weightTon: 12.5,
                packageValue: 15000000,
                plate: '51C-98214',
                driver: { id: 1, name: 'Nguyen Van A', phone: '0901234567' },
                vehicle: { id: 1, plate: '51C-98214', type: 'TRUCK' },
                createdAt: new Date().toISOString(),
              },
            ],
            total: 1,
            data: [],
          }),
        });
      }

      // Default mock JSON response
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    });

    for (const r of ROUTES_TO_AUDIT) {
      const consoleErrors = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text());
      });
      page.on('pageerror', (err) => {
        consoleErrors.push(err.message);
      });

      // Set user session in localStorage before navigation if required
      if (r.role) {
        await page.addInitScript(({ role }) => {
          localStorage.setItem('token', 'mock-valid-jwt-token');
          localStorage.setItem('user', JSON.stringify({
            id: 1,
            username: role.toLowerCase(),
            role: role,
            name: `${role} User`,
          }));
        }, { role: r.role });
      } else {
        await page.addInitScript(() => {
          localStorage.clear();
        });
      }

      try {
        await page.goto(`${BASE_URL}${r.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForTimeout(500); // Allow react suspense / effects

        // Check horizontal overflow
        const overflow = await page.evaluate(() => {
          return {
            scrollWidth: document.documentElement.scrollWidth,
            clientWidth: window.innerWidth,
            hasOverflow: document.documentElement.scrollWidth > window.innerWidth,
          };
        });

        // Check page title / heading
        const pageTitle = await page.title();
        const hasMain = await page.locator('main, #root > div').count() > 0;

        const result = {
          viewport: vp.name,
          route: r.path,
          name: r.name,
          status: 'SUCCESS',
          hasOverflow: overflow.hasOverflow,
          overflowDelta: overflow.scrollWidth - overflow.clientWidth,
          errorsCount: consoleErrors.length,
          errors: consoleErrors.slice(0, 3),
        };

        results.push(result);

        const statusIcon = overflow.hasOverflow ? '⚠️ OVERFLOW' : (consoleErrors.length > 0 ? '⚠️ ERR' : '✅ OK');
        console.log(`[${vp.name}] ${r.path.padEnd(35)} -> ${statusIcon} (overflow: ${result.overflowDelta}px, errs: ${consoleErrors.length})`);
      } catch (err) {
        results.push({
          viewport: vp.name,
          route: r.path,
          name: r.name,
          status: 'FAILED',
          error: err.message,
        });
        console.log(`[${vp.name}] ${r.path.padEnd(35)} -> ❌ FAIL: ${err.message}`);
      }
    }

    await context.close();
  }

  await browser.close();

  // Summary
  const overflows = results.filter((r) => r.hasOverflow);
  const failures = results.filter((r) => r.status === 'FAILED');
  console.log(`\n======================================================`);
  console.log(`AUDIT COMPLETE: ${results.length} checks performed.`);
  console.log(`Failures: ${failures.length}`);
  console.log(`Overflow defects: ${overflows.length}`);
  if (overflows.length > 0) {
    console.log(`\nOverflowing pages:`);
    overflows.forEach((o) => console.log(`- [${o.viewport}] ${o.route} (${o.overflowDelta}px overflow)`));
  }
}

runAudit().catch(console.error);
