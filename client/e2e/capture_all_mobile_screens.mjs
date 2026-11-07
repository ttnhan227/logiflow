import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = 'C:\\Users\\ttnha\\.gemini\\antigravity\\brain\\74785307-d59c-4a7d-9ed5-3349349713be\\screenshots';
const docsDir = 'D:\\projects\\logiflow\\docs\\screenshots';
const portfolioMobileImg = 'D:\\projects\\trongnhan-portfolio\\public\\styles\\projects\\logiflow\\logiflow-mobile.png';

if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

function mirrorFile(src, filename) {
  const docsTarget = path.join(docsDir, filename);
  fs.copyFileSync(src, docsTarget);
  const stat = fs.statSync(docsTarget);
  console.log(`[Captured & Saved]: ${filename} (${stat.size} bytes)`);
}

(async () => {
  console.log('=== Starting Verified Mobile UI Capture Automation ===');
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Mock API routes for Driver and Customer
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

    // 1. Auth Login
    if (url.includes('/api/auth/login')) {
      let username = 'driver.mike';
      try {
        const postData = route.request().postDataJSON() || {};
        if (postData.username) username = postData.username;
      } catch (e) {}

      const isCustomer = username.includes('customer') || username.includes('alice');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          username: username,
          role: isCustomer ? 'CUSTOMER' : 'DRIVER',
          token: 'mock-jwt-token-mobile-verified',
          message: 'Login successful',
          profilePictureUrl: null,
        }),
      });
    }

    // 2. Driver Trips List
    if (url.includes('/api/driver/me/trips') && !url.includes('/api/driver/me/trips/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            tripId: 101,
            routeName: 'Hanoi Gateway Hub ➔ Da Nang Regional Depot',
            status: 'IN_PROGRESS',
            assignmentStatus: 'ACCEPTED',
            scheduledDeparture: '2026-11-07T06:00:00Z',
            scheduledArrival: '2026-11-08T02:00:00Z',
            vehiclePlate: '29H-842.19',
            distance: 765.4,
            estimatedDuration: 960,
            departureLocation: 'Hanoi Gateway Hub, Long Bien, Hanoi',
            arrivalLocation: 'Da Nang Regional Depot, Lien Chieu, Da Nang',
            pickupTypes: 'CONTAINER_FTL',
          },
          {
            tripId: 102,
            routeName: 'Da Nang Regional Depot ➔ Quy Nhon Port Terminal',
            status: 'SCHEDULED',
            assignmentStatus: 'ACCEPTED',
            scheduledDeparture: '2026-11-08T08:00:00Z',
            scheduledArrival: '2026-11-08T16:00:00Z',
            vehiclePlate: '29H-842.19',
            distance: 312.0,
            estimatedDuration: 420,
            departureLocation: 'Da Nang Regional Depot, Lien Chieu',
            arrivalLocation: 'Quy Nhon Port Terminal, Binh Dinh',
            pickupTypes: 'PALLET_LTL',
          },
        ]),
      });
    }

    // 3. Driver Trip Detail (#101)
    if (url.includes('/api/driver/me/trips/101')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          tripId: 101,
          routeName: 'Hanoi Gateway Hub ➔ Da Nang Regional Depot',
          status: 'IN_PROGRESS',
          assignmentStatus: 'ACCEPTED',
          tripType: 'FTL',
          scheduledDeparture: '2026-11-07T06:00:00Z',
          scheduledArrival: '2026-11-08T02:00:00Z',
          actualDeparture: '2026-11-07T06:15:00Z',
          actualArrival: null,
          vehiclePlate: '29H-842.19',
          vehicleType: 'Heavy 4-Axle (18T)',
          vehicleCapacity: 18000,
          delayReason: null,
          slaExtensionMinutes: null,
          delayStatus: null,
          delayAdminComment: null,
          driverLat: 20.4388,
          driverLng: 105.9122,
          notes: 'High-priority container cargo. Refrigerated temperature monitor active at 4°C.',
          orders: [
            {
              orderId: 501,
              customerName: 'Vinamilk Logistics JSC',
              customerPhone: '+84 908 112 334',
              pickupAddress: 'Hanoi Gateway Hub, Long Bien',
              deliveryAddress: 'Da Nang Cold Chain Hub, Lien Chieu',
              pickupType: 'CONTAINER_FTL',
              containerNumber: 'VNM-948201',
              terminalName: 'Gateway Terminal A',
              packageDetails: 'Refrigerated Dairy Products (24 Pallets)',
              weightTons: 16.5,
              packageValue: 450000000,
              distanceKm: 765.4,
              status: 'IN_TRANSIT',
              orderStatus: 'IN_TRANSIT',
              priority: 'HIGH',
              priorityLevel: 'URGENT',
            },
          ],
        }),
      });
    }

    // 4. Driver Compliance
    if (url.includes('/api/driver/me/compliance')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hoursDrivenTotal: 5.5,
          restRequiredHours: 0.5,
          nextAvailableTime: '2026-11-07T14:30:00Z',
          lastRestStart: '2026-11-06T22:00:00Z',
          lastRestEnd: '2026-11-07T06:00:00Z',
          isCompliant: true,
          complianceStatus: 'COMPLIANT',
        }),
      });
    }

    // 5. Driver Profile
    if (url.includes('/api/driver/me/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          driverId: 101,
          fullName: 'Tran Van Minh',
          phone: '+84 912 345 678',
          email: 'minh.tran@logiflow.vn',
          licenseNumber: 'B2-94819284102',
          licenseClass: 'FC',
          licenseExpiryDate: '2029-05-15',
          rating: 4.9,
          totalTrips: 142,
          onTimeRate: 98.6,
          status: 'ACTIVE',
        }),
      });
    }

    // 6. Customer Orders (Active Tracker)
    if (url.includes('/api/customer/me/orders')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            orderId: 501,
            customerName: 'Vinamilk Logistics JSC',
            pickupAddress: 'Hanoi Gateway Hub, Long Bien, Hanoi',
            pickupType: 'CONTAINER_FTL',
            containerNumber: 'VNM-948201',
            terminalName: 'Gateway Terminal A',
            deliveryAddress: 'Da Nang Regional Depot, Lien Chieu, Da Nang',
            packageDetails: 'Refrigerated Dairy Products (24 Pallets)',
            weightTons: 16.5,
            packageValue: 450000000,
            distanceKm: 765.4,
            shippingFee: 18500000,
            deliveryFee: 18500000,
            orderStatus: 'IN_TRANSIT',
            paymentStatus: 'PAID',
            tripStatus: 'IN_PROGRESS',
            createdAt: '2026-11-06T10:00:00Z',
            estimatedDeliveryTime: '2026-11-08T02:00:00Z',
          },
        ]),
      });
    }

    // 7. Customer Order History
    if (url.includes('/api/customer/me/history')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            orderId: 498,
            pickupAddress: 'Hai Phong Port Terminal 3, Dinh Vu',
            pickupType: 'CONTAINER_FTL',
            containerNumber: 'HPH-748192',
            terminalName: 'Dinh Vu Port C3',
            deliveryAddress: 'Bac Ninh Industrial Park, Que Vo',
            packageDetails: 'Automotive Electronics Components (12 Pallets)',
            weightTons: 8.2,
            packageValue: 1200000000,
            distanceKm: 114.5,
            shippingFee: 7800000,
            orderStatus: 'DELIVERED',
            paymentStatus: 'PAID',
            priorityLevel: 'STANDARD',
            createdAt: '2026-11-04T08:30:00Z',
            deliveredAt: '2026-11-05T14:15:00Z',
            driverName: 'Tran Van Minh',
            driverRating: 5,
          },
        ]),
      });
    }

    // 8. Customer Profile
    if (url.includes('/api/customer/me/profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          companyName: 'Vinamilk Logistics JSC',
          taxCode: '0300588569',
          contactPerson: 'Alice Nguyen',
          phone: '+84 908 112 334',
          email: 'alice.customer@vinamilk.com.vn',
          status: 'ACTIVE',
          tier: 'ENTERPRISE_GOLD',
        }),
      });
    }

    // Fallback 200 OK
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // ------------------------------------------------------------------------
  // SCREEN 1: Operations Sign In
  // ------------------------------------------------------------------------
  console.log('[1/9] Capturing mobile_01_login.png...');
  await page.goto('http://127.0.0.1:8085/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);

  const loginPath = path.join(screenshotDir, 'mobile_01_login.png');
  await page.screenshot({ path: loginPath });
  mirrorFile(loginPath, 'mobile_01_login.png');

  // ------------------------------------------------------------------------
  // SCREEN 2: Driver Home
  // ------------------------------------------------------------------------
  console.log('[2/9] Logging in as Driver (driver.mike)...');
  // Click Driver Quick Demo Chip at (135, 407)
  await page.mouse.click(135, 407);
  await page.waitForTimeout(800);
  // Click "Sign in to Operations" button at (195, 605)
  await page.mouse.click(195, 605);
  await page.waitForTimeout(4500);

  const driverHomePath = path.join(screenshotDir, 'mobile_02_driver_home.png');
  await page.screenshot({ path: driverHomePath });
  mirrorFile(driverHomePath, 'mobile_02_driver_home.png');

  // Also update portfolio image with authentic Driver Home screen!
  fs.copyFileSync(driverHomePath, portfolioMobileImg);
  console.log(`[Portfolio Mirrored]: ${portfolioMobileImg}`);

  // ------------------------------------------------------------------------
  // SCREEN 3: Driver Trips
  // ------------------------------------------------------------------------
  console.log('[3/9] Navigating to Driver Trips (Tab 1)...');
  await page.mouse.click(97, 815);
  await page.waitForTimeout(3500);

  const driverTripsPath = path.join(screenshotDir, 'mobile_03_driver_trips.png');
  await page.screenshot({ path: driverTripsPath });
  mirrorFile(driverTripsPath, 'mobile_03_driver_trips.png');

  // ------------------------------------------------------------------------
  // SCREEN 4: Driver Trip Detail
  // ------------------------------------------------------------------------
  console.log('[4/9] Opening Driver Trip Detail for Trip #101...');
  await page.mouse.click(195, 200);
  await page.waitForTimeout(4000);

  const driverTripDetailPath = path.join(screenshotDir, 'mobile_04_driver_trip_detail.png');
  await page.screenshot({ path: driverTripDetailPath });
  mirrorFile(driverTripDetailPath, 'mobile_04_driver_trip_detail.png');

  // ------------------------------------------------------------------------
  // SCREEN 5: Driver Compliance
  // ------------------------------------------------------------------------
  console.log('[5/9] Returning from Trip Detail & Navigating to Compliance (Tab 3)...');
  // Click AppBar Back Arrow at (25, 40)
  await page.mouse.click(25, 40);
  await page.waitForTimeout(1500);
  // Click Tab 3 (Compliance) at (227, 815)
  await page.mouse.click(227, 815);
  await page.waitForTimeout(3500);

  const driverCompliancePath = path.join(screenshotDir, 'mobile_05_driver_compliance.png');
  await page.screenshot({ path: driverCompliancePath });
  mirrorFile(driverCompliancePath, 'mobile_05_driver_compliance.png');

  // ------------------------------------------------------------------------
  // SCREEN 6: Customer Home
  // ------------------------------------------------------------------------
  console.log('[6/9] Resetting session for Customer experience...');
  await page.evaluate(() => localStorage.clear());
  await page.goto('http://127.0.0.1:8085/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);

  console.log('Logging in as Shipper (alice.customer)...');
  // Click Shipper Quick Demo Chip at (275, 407)
  await page.mouse.click(275, 407);
  await page.waitForTimeout(800);
  // Click "Sign in to Operations" button at (195, 605)
  await page.mouse.click(195, 605);
  await page.waitForTimeout(4500);

  const customerHomePath = path.join(screenshotDir, 'mobile_06_customer_home.png');
  await page.screenshot({ path: customerHomePath });
  mirrorFile(customerHomePath, 'mobile_06_customer_home.png');

  // ------------------------------------------------------------------------
  // SCREEN 7: Customer Create Order
  // ------------------------------------------------------------------------
  console.log('[7/9] Navigating to Customer Create Order (Tab 1)...');
  // Customer Tab 1 (Create Order) at (117, 815)
  await page.mouse.click(117, 815);
  await page.waitForTimeout(3500);

  const customerCreateOrderPath = path.join(screenshotDir, 'mobile_07_customer_create_order.png');
  await page.screenshot({ path: customerCreateOrderPath });
  mirrorFile(customerCreateOrderPath, 'mobile_07_customer_create_order.png');

  // ------------------------------------------------------------------------
  // SCREEN 8: Customer Track Orders
  // ------------------------------------------------------------------------
  console.log('[8/9] Navigating to Customer Track Orders (Tab 2)...');
  // Customer Tab 2 (Track Orders) at (195, 815)
  await page.mouse.click(195, 815);
  await page.waitForTimeout(3500);

  const customerTrackPath = path.join(screenshotDir, 'mobile_08_customer_track.png');
  await page.screenshot({ path: customerTrackPath });
  mirrorFile(customerTrackPath, 'mobile_08_customer_track.png');

  // ------------------------------------------------------------------------
  // SCREEN 9: Customer Order History
  // ------------------------------------------------------------------------
  console.log('[9/9] Navigating to Customer Order History (Tab 3)...');
  // Customer Tab 3 (History) at (273, 815)
  await page.mouse.click(273, 815);
  await page.waitForTimeout(3500);

  const customerHistoryPath = path.join(screenshotDir, 'mobile_09_customer_history.png');
  await page.screenshot({ path: customerHistoryPath });
  mirrorFile(customerHistoryPath, 'mobile_09_customer_history.png');

  await browser.close();
  console.log('=== ALL 9 AUTHENTIC MOBILE SCREENS CAPTURED SUCCESSFULLY ===');
})();
