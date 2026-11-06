import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const screenshotDir = 'C:\\Users\\ttnha\\.gemini\\antigravity\\brain\\74785307-d59c-4a7d-9ed5-3349349713be\\screenshots';
const docsDir = 'D:\\projects\\logiflow\\docs\\screenshots';

function saveScreenshot(sourcePath, filename) {
  const destPath = path.join(docsDir, filename);
  fs.copyFileSync(sourcePath, destPath);
  console.log(`[Captured & Mirrored]: ${filename}`);
}

(async () => {
  console.log('Starting Mobile UI capture automation in Docker...');
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  // Unified API route interceptor
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

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

    if (url.includes('/api/customer/me/orders')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            orderId: 501,
            trackingCode: 'LF-2026-8941',
            orderStatus: 'IN_TRANSIT',
            originAddress: 'Hanoi Gateway Hub, Long Bien, Hanoi',
            destinationAddress: 'Da Nang Regional Depot, Lien Chieu, Da Nang',
            cargoWeightTon: 16.5,
            packageDetails: 'Refrigerated Dairy Products (24 Pallets)',
            totalFee: 18500000,
            isUrgent: true,
            createdAt: '2026-11-06T10:00:00Z',
          },
          {
            orderId: 498,
            trackingCode: 'LF-2026-8812',
            orderStatus: 'DELIVERED',
            originAddress: 'Hai Phong Port Terminal 3',
            destinationAddress: 'Bac Ninh Industrial Park',
            cargoWeightTon: 8.2,
            packageDetails: 'Automotive Electronics Components',
            totalFee: 7800000,
            isUrgent: false,
            createdAt: '2026-11-05T08:30:00Z',
          },
        ]),
      });
    }

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
          {
            orderId: 482,
            pickupAddress: 'Tan Son Nhat Air Cargo Depot, Tan Binh, HCMC',
            pickupType: 'PALLET_LTL',
            deliveryAddress: 'Bien Hoa Industrial Zone 2, Dong Nai',
            packageDetails: 'Pharmaceutical Temperature Controlled Consignment',
            weightTons: 3.5,
            packageValue: 650000000,
            distanceKm: 42.0,
            shippingFee: 3200000,
            orderStatus: 'DELIVERED',
            paymentStatus: 'PAID',
            priorityLevel: 'URGENT',
            createdAt: '2026-11-02T09:00:00Z',
            deliveredAt: '2026-11-02T16:45:00Z',
            driverName: 'Nguyen Tuan Anh',
            driverRating: 5,
          },
        ]),
      });
    }

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

    // Default 200 OK
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Step 1: Open Login
  console.log('Loading mobile login...');
  await page.goto('http://127.0.0.1:8085/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const loginPath = path.join(screenshotDir, 'mobile_01_login.png');
  await page.screenshot({ path: loginPath });
  saveScreenshot(loginPath, 'mobile_01_login.png');

  // Step 2: Driver Login
  console.log('Logging in as Driver (driver.mike)...');
  await page.mouse.click(195, 430);
  await page.waitForTimeout(300);
  await page.keyboard.type('driver.mike', { delay: 40 });
  await page.waitForTimeout(300);

  await page.mouse.click(195, 500);
  await page.waitForTimeout(300);
  await page.keyboard.type('password123', { delay: 40 });
  await page.waitForTimeout(300);

  await page.mouse.click(195, 572);
  await page.waitForTimeout(4000);

  // Screen 2: Driver Home
  const driverHomePath = path.join(screenshotDir, 'mobile_02_driver_home.png');
  await page.screenshot({ path: driverHomePath });
  saveScreenshot(driverHomePath, 'mobile_02_driver_home.png');

  // Screen 3: Driver Trips
  console.log('Opening Driver Trips screen...');
  await page.mouse.click(120, 340); // Click "My Trips" card
  await page.waitForTimeout(3000);
  const driverTripsPath = path.join(screenshotDir, 'mobile_03_driver_trips.png');
  await page.screenshot({ path: driverTripsPath });
  saveScreenshot(driverTripsPath, 'mobile_03_driver_trips.png');

  // Screen 4: Driver Trip Detail
  console.log('Opening Driver Trip Detail screen...');
  await page.mouse.click(195, 230); // Click the trip item card
  await page.waitForTimeout(3500);
  const driverTripDetailPath = path.join(screenshotDir, 'mobile_04_driver_trip_detail.png');
  await page.screenshot({ path: driverTripDetailPath });
  saveScreenshot(driverTripDetailPath, 'mobile_04_driver_trip_detail.png');

  // Screen 5: Driver Compliance
  // Directly navigate to reload as driver to go to Compliance cleanly
  console.log('Navigating to Compliance tab...');
  await page.goto('http://127.0.0.1:8085/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.mouse.click(280, 340); // Click "Compliance" card directly on Home!
  await page.waitForTimeout(3000);
  const driverCompliancePath = path.join(screenshotDir, 'mobile_05_driver_compliance.png');
  await page.screenshot({ path: driverCompliancePath });
  saveScreenshot(driverCompliancePath, 'mobile_05_driver_compliance.png');

  // Step 6: Customer Experience
  console.log('Logging out driver and switching to Customer session...');
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.goto('http://127.0.0.1:8085/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Customer Login
  console.log('Logging in as Customer (alice.customer)...');
  await page.mouse.click(195, 430);
  await page.waitForTimeout(300);
  await page.keyboard.type('alice.customer', { delay: 40 });
  await page.waitForTimeout(300);

  await page.mouse.click(195, 500);
  await page.waitForTimeout(300);
  await page.keyboard.type('password123', { delay: 40 });
  await page.waitForTimeout(300);

  await page.mouse.click(195, 572);
  await page.waitForTimeout(4000);

  // Screen 6: Customer Home
  const customerHomePath = path.join(screenshotDir, 'mobile_06_customer_home.png');
  await page.screenshot({ path: customerHomePath });
  saveScreenshot(customerHomePath, 'mobile_06_customer_home.png');

  // Screen 7: Customer Create Order
  console.log('Opening Customer Create Order screen...');
  await page.mouse.click(117, 815);
  await page.waitForTimeout(3000);
  const customerCreateOrderPath = path.join(screenshotDir, 'mobile_07_customer_create_order.png');
  await page.screenshot({ path: customerCreateOrderPath });
  saveScreenshot(customerCreateOrderPath, 'mobile_07_customer_create_order.png');

  // Screen 8: Customer Track Orders
  console.log('Opening Customer Track Orders screen...');
  await page.mouse.click(195, 815);
  await page.waitForTimeout(3000);
  const customerTrackPath = path.join(screenshotDir, 'mobile_08_customer_track.png');
  await page.screenshot({ path: customerTrackPath });
  saveScreenshot(customerTrackPath, 'mobile_08_customer_track.png');

  // Screen 9: Customer Order History
  console.log('Opening Customer Order History screen...');
  await page.mouse.click(273, 815);
  await page.waitForTimeout(3000);
  const customerHistoryPath = path.join(screenshotDir, 'mobile_09_customer_history.png');
  await page.screenshot({ path: customerHistoryPath });
  saveScreenshot(customerHistoryPath, 'mobile_09_customer_history.png');

  await browser.close();
  console.log('ALL 9 MOBILE SCREENSHOTS COMPLETED SUCCESSFULLY!');
})();
