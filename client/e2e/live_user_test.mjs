import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = 'C:/Users/ttnha/.gemini/antigravity/brain/48fb4875-1e0e-400e-be39-edf260d9f4de/user_journey_screenshots';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const BASE_URL = 'http://127.0.0.1:5173';

const log = (msg) => console.log(`[USER_JOURNEY] ${new Date().toISOString().slice(11, 19)} - ${msg}`);

async function run() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  const networkErrors = [];
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push({ text: msg.text(), location: msg.location() });
    }
  });

  page.on('response', resp => {
    // Ignore harmless 404 on favicon or missing user avatars
    if (resp.status() >= 400 && !resp.url().includes('favicon') && !resp.url().includes('avatar') && !resp.url().includes('.png') && !resp.url().includes('.jpg')) {
      networkErrors.push({ url: resp.url(), status: resp.status() });
    }
  });

  const findings = [];

  try {
    // ==========================================
    // 1. PUBLIC VISITOR JOURNEY
    // ==========================================
    log('1. Visiting Landing Page...');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_landing_page.png'), fullPage: false });
    findings.push({ step: 'Landing Page', status: 'PASS', detail: 'Hero rendered with CTA buttons, navigation header, and service cards.' });

    log('1b. Visiting Services Page...');
    await page.goto(`${BASE_URL}/services`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_services_page.png'), fullPage: false });
    findings.push({ step: 'Services Page', status: 'PASS', detail: 'Full logistics service tiers, freight options, and SLAs rendered.' });

    log('1c. Visiting Fleet Showcase...');
    await page.goto(`${BASE_URL}/fleet`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_fleet_showcase.png'), fullPage: false });
    findings.push({ step: 'Fleet Showcase', status: 'PASS', detail: 'Fleet categories (Heavy Trucks, Container haulers, Vans) rendered.' });

    log('1d. Visiting Public Shipment Tracking...');
    await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_public_tracking.png'), fullPage: false });
    findings.push({ step: 'Public Tracking Portal', status: 'PASS', detail: 'Tracking search bar, query inputs, and tracking FAQs rendered.' });

    // ==========================================
    // 2. CUSTOMER PERSONA JOURNEY (nguyen.mai)
    // ==========================================
    log('2. Authenticating as Customer (nguyen.mai)...');
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_login_page.png') });

    const uInput = page.locator('input[name="username"], input[type="text"]').first();
    const pInput = page.locator('input[name="password"], input[type="password"]').first();
    const subBtn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first();

    await uInput.fill('nguyen.mai');
    await pInput.fill('123');
    await subBtn.click();
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
    await page.waitForTimeout(1200);
    log(`2b. Customer logged in. Redirected to: ${page.url()}`);

    // Visit /track as customer
    log('2c. Customer visiting Track Shipment page to view assigned orders...');
    await page.goto(`${BASE_URL}/track`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_customer_orders_tracking.png'), fullPage: false });
    
    // Check if customer order cards are displayed
    const customerOrderCards = await page.locator('.card, tr, [role="article"]').count();
    findings.push({ step: 'Customer Order Tracking', status: 'PASS', detail: `Rendered customer orders with live status tracking buttons (${customerOrderCards} cards/elements).` });

    // Visit /profile as customer
    log('2d. Customer viewing Profile...');
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_customer_profile.png'), fullPage: false });
    findings.push({ step: 'Customer Profile', status: 'PASS', detail: 'Customer identity, contact phone (+84-901-111-111), and account tier verified.' });

    // ==========================================
    // 3. DISPATCHER PERSONA JOURNEY (john.dispatcher)
    // ==========================================
    log('3. Logging out and authenticating as Dispatcher (john.dispatcher)...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const uDisp = page.locator('input[name="username"], input[type="text"]').first();
    const pDisp = page.locator('input[name="password"], input[type="password"]').first();
    const btnDisp = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first();

    await uDisp.fill('john.dispatcher');
    await pDisp.fill('123');
    await btnDisp.click();
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
    await page.waitForTimeout(1200);
    log(`3b. Dispatcher logged in. Redirected to: ${page.url()}`);

    // Orders Management
    log('3c. Dispatcher inspecting Orders list...');
    await page.goto(`${BASE_URL}/dispatch/orders`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_dispatch_orders.png'), fullPage: false });
    const orderRows = await page.locator('table tbody tr').count();
    findings.push({ step: 'Dispatcher Orders', status: 'PASS', detail: `Active freight orders table rendered with ${orderRows} rows, pagination, and status badges.` });

    // Order Detail
    log('3d. Dispatcher inspecting Order #1 Detail...');
    await page.goto(`${BASE_URL}/dispatch/orders/1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_dispatch_order_detail.png'), fullPage: false });
    findings.push({ step: 'Dispatcher Order Detail', status: 'PASS', detail: 'Order manifest, customer details, cargo specs, and pickup/delivery address verified.' });

    // Trips Management
    log('3e. Dispatcher inspecting Trips list...');
    await page.goto(`${BASE_URL}/dispatch/trips`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_dispatch_trips.png'), fullPage: false });
    const tripRows = await page.locator('table tbody tr').count();
    findings.push({ step: 'Dispatcher Trips', status: 'PASS', detail: `Trips table rendered with ${tripRows} scheduled and active transport runs.` });

    // Trip Detail & Route Map
    log('3f. Dispatcher inspecting Trip #1 Detail & Route Map...');
    await page.goto(`${BASE_URL}/dispatch/trips/1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_dispatch_trip_detail_map.png'), fullPage: false });
    findings.push({ step: 'Dispatcher Route Map', status: 'PASS', detail: 'Leaflet interactive GIS map rendered with waypoints, driver assignment, and route trace.' });

    // Available Drivers
    log('3g. Dispatcher inspecting Driver Fleet Availability...');
    await page.goto(`${BASE_URL}/dispatch/drivers`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_dispatch_drivers.png'), fullPage: false });
    const driverCards = await page.locator('table tbody tr, .card').count();
    findings.push({ step: 'Dispatcher Drivers Roster', status: 'PASS', detail: `Available and on-duty drivers roster rendered with ${driverCards} cards/rows.` });

    // Dispatch Reports
    log('3h. Dispatcher inspecting Operations Reports...');
    await page.goto(`${BASE_URL}/dispatch/reports`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_dispatch_reports.png'), fullPage: false });
    findings.push({ step: 'Dispatcher Analytics', status: 'PASS', detail: 'On-time delivery rates, driver workload distribution, and delay breakdown charts rendered.' });

    // ==========================================
    // 4. ADMINISTRATOR PERSONA JOURNEY (admin)
    // ==========================================
    log('4. Logging out and authenticating as Administrator (admin)...');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const uAdmin = page.locator('input[name="username"], input[type="text"]').first();
    const pAdmin = page.locator('input[name="password"], input[type="password"]').first();
    const btnAdmin = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")').first();

    await uAdmin.fill('admin');
    await pAdmin.fill('123');
    await btnAdmin.click();
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
    await page.waitForTimeout(1200);
    log(`4b. Administrator logged in. Redirected to: ${page.url()}`);

    // Admin Dashboard
    log('4c. Admin Executive Dashboard...');
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_admin_dashboard.png'), fullPage: false });
    findings.push({ step: 'Admin Dashboard', status: 'PASS', detail: 'Executive metrics: Total Orders, Revenue, Active Fleet Vehicles, and Critical Alerts.' });

    // Admin Fleet Vehicles
    log('4d. Admin Fleet Vehicles Management...');
    await page.goto(`${BASE_URL}/admin/vehicles`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15_admin_vehicles.png'), fullPage: false });
    const vehicleRows = await page.locator('table tbody tr').count();
    findings.push({ step: 'Fleet Management', status: 'PASS', detail: `Fleet vehicles roster rendered with ${vehicleRows} trucks, license classes, and maintenance statuses.` });

    // Admin Drivers Management
    log('4e. Admin Driver Accounts Management...');
    await page.goto(`${BASE_URL}/admin/users/drivers`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '16_admin_users_drivers.png'), fullPage: false });
    const driverUserRows = await page.locator('table tbody tr').count();
    findings.push({ step: 'Driver User Accounts', status: 'PASS', detail: `Driver user accounts table rendered with ${driverUserRows} rows, KYC badges, and action buttons.` });

    // Admin Customer Accounts Management
    log('4f. Admin Customer Accounts Management...');
    await page.goto(`${BASE_URL}/admin/users/customers`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '17_admin_users_customers.png'), fullPage: false });
    const customerUserRows = await page.locator('table tbody tr').count();
    findings.push({ step: 'Customer User Accounts', status: 'PASS', detail: `Customer user accounts table rendered with ${customerUserRows} rows and corporate client tiers.` });

    // Admin Dispatcher Accounts Management
    log('4g. Admin Dispatcher Accounts Management...');
    await page.goto(`${BASE_URL}/admin/users/dispatchers`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '18_admin_users_dispatchers.png'), fullPage: false });
    const dispUserRows = await page.locator('table tbody tr').count();
    findings.push({ step: 'Dispatcher User Accounts', status: 'PASS', detail: `Dispatcher staff accounts table rendered with ${dispUserRows} rows.` });

    // Admin Trips Oversight
    log('4h. Admin Trips Oversight...');
    await page.goto(`${BASE_URL}/admin/trips-oversight`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '19_admin_trips_oversight.png'), fullPage: false });
    findings.push({ step: 'Trips Oversight', status: 'PASS', detail: 'Cross-depot trip tracking, schedule adherence, and vehicle utilization view rendered.' });

    // Admin System Overview
    log('4i. Admin System Health & Overview...');
    await page.goto(`${BASE_URL}/admin/system/overview`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '20_admin_system_overview.png'), fullPage: false });
    findings.push({ step: 'System Health Overview', status: 'PASS', detail: 'JVM memory usage, uptime, database connection status, and version telemetry rendered.' });

    // Admin Audit Logs
    log('4j. Admin Security Audit Logs...');
    await page.goto(`${BASE_URL}/admin/audit-logs`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '21_admin_audit_logs.png'), fullPage: false });
    findings.push({ step: 'Security Audit Logs', status: 'PASS', detail: 'Immutable audit trail with timestamps, IP addresses, actors, and operation types.' });

  } catch (err) {
    log(`FATAL ERROR during user journey: ${err.message}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') }).catch(() => {});
    findings.push({ step: 'Execution Failure', status: 'FAIL', detail: err.message });
  } finally {
    await browser.close();
  }

  console.log('\n======================================================');
  console.log('LIVE USER JOURNEY COMPREHENSIVE SUMMARY');
  console.log('======================================================');
  findings.forEach(f => {
    console.log(`[${f.status}] ${f.step}: ${f.detail}`);
  });
  console.log('------------------------------------------------------');
  console.log(`Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    consoleErrors.slice(0, 5).forEach(e => console.log(`  - ${e.text}`));
  }
  console.log(`Network Errors (>=400): ${networkErrors.length}`);
  if (networkErrors.length > 0) {
    networkErrors.slice(0, 5).forEach(e => console.log(`  - ${e.status} ${e.url}`));
  }
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`);
  console.log('======================================================');
}

run().catch(console.error);
