import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://127.0.0.1:5173';
const OUTPUT_DIR = 'C:/Users/ttnha/.gemini/antigravity/brain/74785307-d59c-4a7d-9ed5-3349349713be/screenshots';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

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
    {
      tripId: 205,
      routeName: 'Corridor QL14: Dak Lak Hub → Da Nang Port',
      vehicleLicensePlate: '47C-552.18',
      vehicleType: 'Medium Truck (8T)',
      driverName: 'Pham Quoc Bao',
      scheduledDeparture: '2026-11-05T18:00:00Z',
      status: 'DELAYED',
      orders: [{ orderId: 1038 }],
      totalDistanceKm: 520.0,
      totalWeightTons: 7.5,
    },
  ],
  totalItems: 4,
  totalPages: 1,
  currentPage: 0,
  pageSize: 10,
};

const mockTripsOversight = [
  {
    tripId: 208,
    tripStatus: 'in_progress',
    tripType: 'FTL',
    scheduledDeparture: '2026-11-07T06:00:00Z',
    scheduledArrival: '2026-11-08T02:00:00Z',
    originAddress: 'Hanoi Gateway Hub, Gia Lam',
    destinationAddress: 'Da Nang Regional Depot, Lien Chieu',
    originCity: 'Hanoi',
    destinationCity: 'Da Nang',
    totalDistanceKm: 765.4,
    totalWeightTon: 24.5,
    driver: {
      fullName: 'Tran Van Minh',
      phone: '+84 912 345 678',
      status: 'ACTIVE',
      complianceFlags: ['CLASS_FC_VERIFIED', 'DEFENSIVE_DRIVING_CERT'],
    },
    vehicle: {
      licensePlate: '29H-842.19',
      capacityTons: 30.0,
      vehicleType: 'Heavy 4-Axle (18T)',
      status: 'IN_TRANSIT',
    },
    risk: 'ON_TRACK',
    hasUrgentOrders: true,
  },
  {
    tripId: 207,
    tripStatus: 'assigned',
    tripType: 'PORT_DRAYAGE',
    scheduledDeparture: '2026-11-06T20:00:00Z',
    scheduledArrival: '2026-11-07T00:30:00Z',
    originAddress: 'Dinh Vu Port Terminal, Hai Phong',
    destinationAddress: 'Bac Ninh Tech Park',
    originCity: 'Hai Phong',
    destinationCity: 'Bac Ninh',
    totalDistanceKm: 112.0,
    totalWeightTon: 28.0,
    driver: {
      fullName: 'Nguyen Tuan Anh',
      phone: '+84 934 567 890',
      status: 'ACTIVE',
      complianceFlags: ['CLASS_FC_VERIFIED'],
    },
    vehicle: {
      licensePlate: '15C-773.02',
      capacityTons: 32.0,
      vehicleType: 'Tractor Trailer 40ft',
      status: 'ASSIGNED',
    },
    risk: 'ON_TRACK',
    hasUrgentOrders: false,
  },
];

const mockDailyStats = [
  { date: '2026-11-01', totalTrips: 34, completedTrips: 33, cancelledTrips: 1, delayedTrips: 2, avgDelayMinutes: 14, averageDeliveryTimeMinutes: 240 },
  { date: '2026-11-02', totalTrips: 42, completedTrips: 41, cancelledTrips: 1, delayedTrips: 3, avgDelayMinutes: 18, averageDeliveryTimeMinutes: 225 },
  { date: '2026-11-03', totalTrips: 38, completedTrips: 38, cancelledTrips: 0, delayedTrips: 1, avgDelayMinutes: 8, averageDeliveryTimeMinutes: 210 },
  { date: '2026-11-04', totalTrips: 45, completedTrips: 43, cancelledTrips: 2, delayedTrips: 4, avgDelayMinutes: 22, averageDeliveryTimeMinutes: 260 },
  { date: '2026-11-05', totalTrips: 48, completedTrips: 47, cancelledTrips: 1, delayedTrips: 2, avgDelayMinutes: 11, averageDeliveryTimeMinutes: 205 },
  { date: '2026-11-06', totalTrips: 52, completedTrips: 51, cancelledTrips: 1, delayedTrips: 2, avgDelayMinutes: 9, averageDeliveryTimeMinutes: 195 },
];

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

const mockDriverPerformance = [
  { driverId: 101, fullName: 'Tran Van Minh', driverScore: 98, onTimeDeliveryRate: 99.1, totalTripsCompleted: 48, rating: 4.9, totalRevenue: 185000000, active: true },
  { driverId: 102, fullName: 'Nguyen Tuan Anh', driverScore: 95, onTimeDeliveryRate: 97.8, totalTripsCompleted: 44, rating: 4.8, totalRevenue: 162000000, active: true },
  { driverId: 103, fullName: 'Le Hoang Nam', driverScore: 94, onTimeDeliveryRate: 96.5, totalTripsCompleted: 41, rating: 4.8, totalRevenue: 148000000, active: true },
  { driverId: 104, fullName: 'Pham Quoc Bao', driverScore: 91, onTimeDeliveryRate: 94.2, totalTripsCompleted: 38, rating: 4.7, totalRevenue: 129000000, active: true },
];

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

const mockNotifications = [
  {
    notificationId: 801,
    title: 'Trip #207 Dispatched',
    message: 'Carrier 15C-773.02 departed Hai Phong Port en route to Bac Ninh Tech hub.',
    severity: 'INFO',
    createdAt: '2026-11-06T20:05:00Z',
    isRead: false,
    actionUrl: '/dispatch/trips/207',
  },
  {
    notificationId: 802,
    title: 'Urgent Order #1042 Awaiting Assignment',
    message: 'Vinamilk Logistics Hub requested high-priority Reefer transit for Can Tho Port.',
    severity: 'WARNING',
    createdAt: '2026-11-06T14:35:00Z',
    isRead: false,
    actionUrl: '/dispatch/orders/1042',
  },
  {
    notificationId: 803,
    title: 'DIFOT Target Achieved',
    message: 'Daily on-time delivery metric exceeded enterprise SLA target (98.6% vs 95.0%).',
    severity: 'INFO',
    createdAt: '2026-11-06T12:00:00Z',
    isRead: true,
    actionUrl: '/admin/reports',
  },
];

async function captureScreenshots() {
  console.log('Launching Chromium for high-fidelity app screenshot capture...');
  const browser = await chromium.launch({ headless: true });

  const tasks = [
    { id: '01_home_desktop', url: `${BASE_URL}/`, viewport: { width: 1440, height: 900 }, role: null, title: 'Home Page & Corridor Map (Desktop)' },
    { id: '02_home_mobile', url: `${BASE_URL}/`, viewport: { width: 375, height: 812 }, role: null, title: 'Home Page Hero (Mobile Responsive)' },
    { id: '03_login_page', url: `${BASE_URL}/login`, viewport: { width: 1200, height: 800 }, role: null, title: 'Sign In & Quick Demo Autofill Bar' },
    { id: '04_freight_tracking', url: `${BASE_URL}/track?tracking=TRK-882194`, viewport: { width: 1440, height: 950 }, role: null, title: 'Freight Tracking Console' },
    { id: '05_fleet_showcase', url: `${BASE_URL}/fleet`, viewport: { width: 1440, height: 900 }, role: null, title: 'Commercial Carrier Fleet Showcase' },
    { id: '06_coverage_network', url: `${BASE_URL}/coverage`, viewport: { width: 1440, height: 900 }, role: null, title: 'Vietnam Trunk Corridors & Coverage' },
    { id: '07_freight_services', url: `${BASE_URL}/services`, viewport: { width: 1440, height: 900 }, role: null, title: 'Enterprise Freight Services' },
    { id: '08_faq_knowledgebase', url: `${BASE_URL}/faq`, viewport: { width: 1440, height: 900 }, role: null, title: 'Logistics FAQ & Operations Guidance' },
    { id: '09_shipper_registration', url: `${BASE_URL}/register/customer`, viewport: { width: 1200, height: 850 }, role: null, title: 'Shipper Account Registration' },
    { id: '10_driver_registration', url: `${BASE_URL}/register/driver`, viewport: { width: 1200, height: 900 }, role: null, title: 'Commercial Driver Onboarding' },
    { id: '11_dispatch_orders', url: `${BASE_URL}/dispatch/orders`, viewport: { width: 1440, height: 900 }, role: 'DISPATCHER', title: 'Dispatch Orders Queue & Filter Bar' },
    { id: '12_dispatch_order_import', url: `${BASE_URL}/dispatch/orders/import`, viewport: { width: 1440, height: 900 }, role: 'DISPATCHER', title: 'Manifest Batch Upload & Validation' },
    { id: '13_dispatch_trips', url: `${BASE_URL}/dispatch/trips`, viewport: { width: 1440, height: 900 }, role: 'DISPATCHER', title: 'Linehaul Dispatch Trips Manifest' },
    { id: '14_dispatch_reports', url: `${BASE_URL}/dispatch/reports`, viewport: { width: 1440, height: 950 }, role: 'DISPATCHER', title: 'Dispatch Delay Latency & SLA Analytics' },
    { id: '15_dispatch_notifications', url: `${BASE_URL}/dispatch/notifications`, viewport: { width: 1440, height: 900 }, role: 'DISPATCHER', title: 'Dispatch Operations Notifications Feed' },
    { id: '16_admin_dashboard', url: `${BASE_URL}/admin/dashboard`, viewport: { width: 1440, height: 1000 }, role: 'ADMIN', title: 'Executive Operations Command & DIFOT Overview' },
    { id: '17_admin_reports', url: `${BASE_URL}/admin/reports`, viewport: { width: 1440, height: 1000 }, role: 'ADMIN', title: 'Executive Business Intelligence & Driver Scorecards' },
    { id: '18_admin_trips_oversight', url: `${BASE_URL}/admin/trips-oversight`, viewport: { width: 1440, height: 900 }, role: 'ADMIN', title: 'Enterprise Trips Oversight & Telemetry' },
    { id: '19_admin_driver_management', url: `${BASE_URL}/admin/users/drivers`, viewport: { width: 1440, height: 900 }, role: 'ADMIN', title: 'Carrier Driver Fleet Governance' },
    { id: '20_admin_system_overview', url: `${BASE_URL}/admin/system/overview`, viewport: { width: 1440, height: 900 }, role: 'ADMIN', title: 'System Health & Regulatory Telemetry' },
  ];

  for (const t of tasks) {
    const context = await browser.newContext({
      viewport: t.viewport,
      deviceScaleFactor: 1.5,
    });

    const page = await context.newPage();

    // Catch-all route interceptor for all /api endpoints
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      if (url.includes('/customer/me/orders') && url.includes('/track')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTracking) });
      }
      if (url.includes('/orders')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockOrders) });
      }
      if (url.includes('/trips/oversight')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ trips: mockTripsOversight, totalItems: mockTripsOversight.length, totalPages: 1 }),
        });
      }
      if (url.includes('/trips')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockTrips),
        });
      }
      if (url.includes('/dispatch/reports/daily') || url.includes('/reports/daily')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockDailyStats) });
      }
      if (url.includes('/admin/dashboard/active-drivers')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { driverId: 101, lat: 21.0285, lng: 105.8542, name: 'Tran Van Minh', status: 'IN_TRANSIT' },
            { driverId: 102, lat: 10.8231, lng: 106.6297, name: 'Nguyen Tuan Anh', status: 'AVAILABLE' },
          ]),
        });
      }
      if (url.includes('/admin/dashboard') || url.includes('/dashboard')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAdminDashboard) });
      }
      if (url.includes('/admin/reports/performance')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalTrips: 259,
            completionRate: 98.8,
            totalActiveDrivers: 64,
            averageTripsPerDriver: 4.1,
            dailyStats: mockDailyStats,
          }),
        });
      }
      if (url.includes('/admin/reports/driver-performance')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockDriverPerformance),
        });
      }
      if (url.includes('/admin/users/drivers') || url.includes('/admin/drivers')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: mockDriverPerformance,
            totalElements: mockDriverPerformance.length,
            totalPages: 1,
            number: 0,
          }),
        });
      }
      if (url.includes('/notifications')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: mockNotifications,
            unreadCount: 2,
            totalElements: mockNotifications.length,
          }),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    if (t.role) {
      await page.addInitScript((role) => {
        const user = { username: role === 'ADMIN' ? 'admin' : 'john.dispatcher', role };
        window.localStorage.setItem('user', JSON.stringify(user));
        window.localStorage.setItem('token', 'mock_jwt_token_for_audit');
      }, t.role);
    }

    try {
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 8000 }).catch(() => {});
      await page.waitForTimeout(1200);

      const filePath = path.join(OUTPUT_DIR, `${t.id}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(`[Captured] ${t.id}.png -> ${t.title}`);
    } catch (err) {
      console.error(`Failed to capture ${t.id}:`, err);
    } finally {
      await context.close();
    }
  }

  await browser.close();
  console.log('All screenshots captured successfully in:', OUTPUT_DIR);
}

captureScreenshots();
