import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const BASE_URL = 'http://127.0.0.1:5173';
const VIDEO_DIR = path.resolve('./e2e/videos');
const OUTPUT_GIF = path.resolve('../docs/assets/logiflow-demo.gif');

// Ensure directories
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}
if (!fs.existsSync(path.dirname(OUTPUT_GIF))) {
  fs.mkdirSync(path.dirname(OUTPUT_GIF), { recursive: true });
}

// Mock data definitions
const mockTracking = {
  orderId: 'TRK-882194',
  orderStatus: 'IN_TRANSIT',
  tripStatus: 'in_transit',
  estimatedPickupTime: '2026-11-06T08:00:00Z',
  estimatedDeliveryTime: '2026-11-07T16:00:00Z',
  actualPickupTime: '2026-11-06T08:15:00Z',
  currentLat: 16.0544,
  currentLng: 108.2022,
  driverName: 'Tran Van Minh (Carrier Fleet)',
  driverPhone: '+84 912 345 678',
  vehiclePlate: '29H-842.19',
  vehicleType: 'Heavy 4-Axle (18T)',
  pickupType: 'PORT_TERMINAL',
  terminalName: 'Hai Phong Gateway Terminal 2',
  containerNumber: 'MSKU-992144-8',
  statusHistory: [
    { status: 'ORDER_PLACED', timestamp: '2026-11-05T14:30:00Z', notes: 'Manifest booked & validated' },
    { status: 'ASSIGNED', timestamp: '2026-11-05T16:00:00Z', notes: 'Vehicle 29H-842.19 & driver assigned' },
    { status: 'PICKED_UP', timestamp: '2026-11-06T08:15:00Z', notes: 'Container loaded at Hai Phong Gateway' },
    { status: 'IN_TRANSIT', timestamp: '2026-11-06T14:20:00Z', notes: 'En route via Corridor QL1A, passing Da Nang checkpoint' },
  ],
};

const mockOrders = {
  orders: [
    {
      orderId: 1042,
      customerName: 'Vinamilk Logistics Hub',
      customerPhone: '+84 901 234 567',
      pickupAddress: 'Tan Binh Industrial Zone, HCMC',
      deliveryAddress: 'Tra Noc Port Terminal, Can Tho',
      pickupType: 'PORT_TERMINAL',
      containerNumber: 'MSKU-992144-8',
      weightTons: 14.5,
      distanceKm: 168.4,
      shippingFee: 12800000,
      orderStatus: 'PENDING',
      priorityLevel: 'URGENT',
      createdAt: '2026-11-06T14:30:00Z',
    },
    {
      orderId: 1041,
      customerName: 'Samsung Electronics SEVT',
      customerPhone: '+84 912 345 678',
      pickupAddress: 'Yen Binh Industrial Park, Thai Nguyen',
      deliveryAddress: 'Dinh Vu Port Terminal, Hai Phong',
      pickupType: 'PORT_TERMINAL',
      containerNumber: 'CMAU-482103-1',
      weightTons: 22.0,
      distanceKm: 154.2,
      shippingFee: 18500000,
      orderStatus: 'IN_TRANSIT',
      priorityLevel: 'NORMAL',
      createdAt: '2026-11-06T12:00:00Z',
    },
    {
      orderId: 1040,
      customerName: 'Hoa Phat Steel Group',
      customerPhone: '+84 934 567 890',
      pickupAddress: 'Dung Quat Economic Zone, Quang Ngai',
      deliveryAddress: 'Lien Chieu Industrial Zone, Da Nang',
      pickupType: 'WAREHOUSE',
      dockInfo: 'Bay 4B',
      weightTons: 28.0,
      distanceKm: 136.8,
      shippingFee: 21000000,
      orderStatus: 'ASSIGNED',
      priorityLevel: 'NORMAL',
      createdAt: '2026-11-06T10:15:00Z',
    },
    {
      orderId: 1039,
      customerName: 'Masan Consumer Supply',
      customerPhone: '+84 988 765 432',
      pickupAddress: 'Song Than Hub, Binh Duong',
      deliveryAddress: 'Bac Giang Distribution Center',
      pickupType: 'STANDARD',
      weightTons: 18.2,
      distanceKm: 1720.0,
      shippingFee: 45000000,
      orderStatus: 'DELIVERED',
      priorityLevel: 'NORMAL',
      createdAt: '2026-11-05T08:00:00Z',
    },
  ],
  totalItems: 4,
  totalPages: 1,
  currentPage: 0,
  pageSize: 10,
};

const mockTrips = {
  trips: [
    {
      tripId: 208,
      routeName: 'Corridor QL1A: Hanoi Gateway → Da Nang Hub',
      vehicleLicensePlate: '29H-842.19',
      vehicleType: 'Heavy 4-Axle (18T)',
      driverName: 'Tran Van Minh',
      scheduledDeparture: '2026-11-07T06:00:00Z',
      status: 'SCHEDULED',
      orders: [{ orderId: 1041 }, { orderId: 1042 }],
      totalDistanceKm: 765.4,
      totalWeightTons: 24.5,
    },
    {
      tripId: 207,
      routeName: 'Corridor QL5: Hai Phong Port → Bac Ninh Tech',
      vehicleLicensePlate: '15C-773.02',
      vehicleType: 'Tractor Trailer 40ft',
      driverName: 'Nguyen Tuan Anh',
      scheduledDeparture: '2026-11-06T20:00:00Z',
      status: 'IN_PROGRESS',
      orders: [{ orderId: 1040 }],
      totalDistanceKm: 112.0,
      totalWeightTons: 28.0,
    },
    {
      tripId: 206,
      routeName: 'Corridor CT01: HCMC Eastern Hub → Can Tho Terminal',
      vehicleLicensePlate: '51D-931.55',
      vehicleType: 'Reefer Box Truck (10T)',
      driverName: 'Le Hoang Nam',
      scheduledDeparture: '2026-11-06T04:30:00Z',
      status: 'COMPLETED',
      orders: [{ orderId: 1039 }],
      totalDistanceKm: 169.0,
      totalWeightTons: 9.8,
    },
  ],
  totalItems: 3,
  totalPages: 1,
  currentPage: 0,
  pageSize: 10,
};

const mockAdminDashboard = {
  operationsOverview: {
    difotRate: 98.6,
    fleetUtilization: 88.4,
    todayRevenue: 246500000,
    activeTrips: 32,
  },
  fleetLifecycle: {
    availableVehicles: 38,
    inUseVehicles: 32,
    maintenanceVehicles: 4,
    vehicleTypes: {
      'Tractor 40ft': 28,
      'Heavy 15T': 22,
      'Reefer Box 10T': 14,
      'Medium 8T': 10,
    },
  },
  complianceStatus: {
    compliantDrivers: 62,
    warningDrivers: 2,
    atRiskDrivers: 0,
    averageDriverRating: 4.86,
    onTimeDeliveryRate: 98.2,
    customerSatisfaction: 4.9,
    expiringLicenses: 1,
  },
  activeOperations: {
    pendingAssignments: 3,
  },
  systemHealth: {
    apiStatus: 'HEALTHY',
    dbLatencyMs: 4.2,
  },
};

async function recordDemoGif() {
  console.log('Recording video for demo GIF...');
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: VIDEO_DIR, size: { width: 1280, height: 720 } },
  });

  const page = await context.newPage();

  // Set up API intercepts
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/login')) {
      const postData = JSON.parse(route.request().postData() || '{}');
      const role = postData.username === 'admin' ? 'ADMIN' : 'DISPATCHER';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock_jwt_token', username: postData.username, role }),
      });
    }
    if (url.includes('/customer/me/orders') && url.includes('/track')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTracking) });
    }
    if (url.includes('/orders')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOrders) });
    }
    if (url.includes('/trips')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTrips) });
    }
    if (url.includes('/admin/dashboard')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAdminDashboard) });
    }
    if (url.includes('/notifications')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: [], unreadCount: 2 }),
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
  });

  // Scene 1: Home Landing & Shipment Tracking
  console.log('Scene 1: Home Page');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Type tracking code
  const trackInput = page.locator('input[placeholder*="Tracking Code"]');
  await trackInput.click();
  await trackInput.pressSequentially('TRK-882194', { delay: 60 });
  await page.waitForTimeout(400);

  const trackBtn = page.locator('button:has-text("Track Shipment")');
  await trackBtn.click();
  await page.waitForTimeout(2200);

  // Scene 2: Sign In Portal with Quick Demo Autofill
  console.log('Scene 2: Login Portal');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);

  // Click Quick Demo Autofill button for Dispatcher
  const dispatcherPill = page.locator('button:has-text("Dispatcher (john.dispatcher)")');
  await dispatcherPill.click();
  await page.waitForTimeout(600);

  const loginSubmit = page.locator('button:has-text("Sign In to Control Tower")');
  await loginSubmit.click();
  await page.waitForTimeout(1600);

  // Scene 3: Dispatcher Orders Desk
  console.log('Scene 3: Dispatcher Orders');
  // Inject dispatcher auth token just in case
  await page.evaluate(() => {
    localStorage.setItem('user', JSON.stringify({ username: 'john.dispatcher', role: 'DISPATCHER' }));
    localStorage.setItem('token', 'mock_jwt_token');
  });
  await page.goto(`${BASE_URL}/dispatch/orders`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  // Scene 4: Trips Manifest
  console.log('Scene 4: Trips Manifest');
  await page.goto(`${BASE_URL}/dispatch/trips`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  // Scene 5: Admin Executive Control Center
  console.log('Scene 5: Admin Executive Dashboard');
  await page.evaluate(() => {
    localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'ADMIN' }));
    localStorage.setItem('token', 'mock_jwt_token');
  });
  await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  // Finalize video recording
  await context.close();
  await browser.close();

  // Find recorded video file
  const videoFiles = fs.readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.webm'));
  if (videoFiles.length === 0) {
    throw new Error('No video recorded!');
  }
  const videoPath = path.join(VIDEO_DIR, videoFiles[videoFiles.length - 1]);
  console.log('Video saved at:', videoPath);

  // Convert to high-quality animated GIF using ffmpeg palette generation
  console.log('Converting to optimized GIF via ffmpeg...');
  const ffmpegCmd = `ffmpeg -y -i "${videoPath}" -vf "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" "${OUTPUT_GIF}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  const stats = fs.statSync(OUTPUT_GIF);
  console.log(`Animated GIF generated successfully at: ${OUTPUT_GIF} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

recordDemoGif().catch((err) => {
  console.error('GIF generation failed:', err);
  process.exit(1);
});
