import { chromium } from '@playwright/test';
import path from 'path';

(async () => {
  const browser = await chromium.launch();

  const mockAdminDashboard = {
    operationsOverview: { difotRate: 98.6, fleetUtilization: 88.4, todayRevenue: 246500000, activeTrips: 32 },
    fleetLifecycle: {
      availableVehicles: 38,
      inUseVehicles: 32,
      maintenanceVehicles: 4,
      vehicleTypes: { 'Tractor 40ft': 28, 'Heavy 15T': 22, 'Reefer Box 10T': 14, 'Medium 8T': 10 },
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
    activeOperations: { pendingAssignments: 3 },
    systemHealth: { apiStatus: 'HEALTHY', dbLatencyMs: 4.2 },
  };

  const mockDailyStats = [
    { date: '2026-11-01', totalTrips: 34, completedTrips: 33, cancelledTrips: 1, delayedTrips: 2, avgDelayMinutes: 14, averageDeliveryTimeMinutes: 240 },
    { date: '2026-11-02', totalTrips: 42, completedTrips: 41, cancelledTrips: 1, delayedTrips: 3, avgDelayMinutes: 18, averageDeliveryTimeMinutes: 225 },
    { date: '2026-11-03', totalTrips: 38, completedTrips: 38, cancelledTrips: 0, delayedTrips: 1, avgDelayMinutes: 8, averageDeliveryTimeMinutes: 210 },
    { date: '2026-11-04', totalTrips: 45, completedTrips: 43, cancelledTrips: 2, delayedTrips: 4, avgDelayMinutes: 22, averageDeliveryTimeMinutes: 260 },
    { date: '2026-11-05', totalTrips: 48, completedTrips: 47, cancelledTrips: 1, delayedTrips: 2, avgDelayMinutes: 11, averageDeliveryTimeMinutes: 205 },
    { date: '2026-11-06', totalTrips: 52, completedTrips: 51, cancelledTrips: 1, delayedTrips: 2, avgDelayMinutes: 9, averageDeliveryTimeMinutes: 195 },
  ];

  const mockDriverPerformance = [
    { driverId: 101, fullName: 'Tran Van Minh', driverScore: 98, onTimeDeliveryRate: 99.1, totalTripsCompleted: 48, rating: 4.9, totalRevenue: 185000000, active: true },
    { driverId: 102, fullName: 'Nguyen Tuan Anh', driverScore: 95, onTimeDeliveryRate: 97.8, totalTripsCompleted: 44, rating: 4.8, totalRevenue: 162000000, active: true },
    { driverId: 103, fullName: 'Le Hoang Nam', driverScore: 94, onTimeDeliveryRate: 96.5, totalTripsCompleted: 41, rating: 4.8, totalRevenue: 148000000, active: true },
    { driverId: 104, fullName: 'Pham Quoc Bao', driverScore: 91, onTimeDeliveryRate: 94.2, totalTripsCompleted: 38, rating: 4.7, totalRevenue: 129000000, active: true },
  ];

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
      driver: { fullName: 'Tran Van Minh', phone: '+84 912 345 678', status: 'ACTIVE', complianceFlags: ['CLASS_FC_VERIFIED'] },
      vehicle: { licensePlate: '29H-842.19', capacityTons: 30.0, vehicleType: 'Heavy 4-Axle (18T)', status: 'IN_TRANSIT' },
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
      driver: { fullName: 'Nguyen Tuan Anh', phone: '+84 934 567 890', status: 'ACTIVE', complianceFlags: ['CLASS_FC_VERIFIED'] },
      vehicle: { licensePlate: '15C-773.02', capacityTons: 32.0, vehicleType: 'Tractor Trailer 40ft', status: 'ASSIGNED' },
      risk: 'ON_TRACK',
      hasUrgentOrders: false,
    },
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

  const targets = [
    { id: '04_freight_tracking', url: 'http://127.0.0.1:5173/track?tracking=TRK-882194', role: null, height: 950 },
    { id: '17_admin_reports', url: 'http://127.0.0.1:5173/admin/reports', role: 'ADMIN', height: 1050 },
    { id: '18_admin_trips_oversight', url: 'http://127.0.0.1:5173/admin/trips-oversight', role: 'ADMIN', height: 950 },
    { id: '19_admin_driver_management', url: 'http://127.0.0.1:5173/admin/users/drivers', role: 'ADMIN', height: 950 },
    { id: '20_admin_system_overview', url: 'http://127.0.0.1:5173/admin/system/overview', role: 'ADMIN', height: 950 },
  ];

  for (const t of targets) {
    const context = await browser.newContext({ viewport: { width: 1440, height: t.height }, deviceScaleFactor: 1.5 });
    const page = await context.newPage();

    if (t.role) {
      await page.addInitScript(() => {
        window.localStorage.setItem('user', JSON.stringify({ username: 'admin', role: 'ADMIN' }));
        window.localStorage.setItem('token', 'mock_token');
      });
    }

    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/customer/me/orders') && url.includes('/track')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockTracking) });
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
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockDriverPerformance) });
      }
      if (url.includes('/admin/trips/oversight')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ trips: mockTripsOversight }) });
      }
      if (url.includes('/admin/users/drivers') || url.includes('/admin/drivers')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ content: mockDriverPerformance, totalElements: mockDriverPerformance.length, totalPages: 1, number: 0 }),
        });
      }
      if (url.includes('/admin/dashboard')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockAdminDashboard) });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    });

    await page.goto(t.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const dest = `C:/Users/ttnha/.gemini/antigravity/brain/74785307-d59c-4a7d-9ed5-3349349713be/screenshots/${t.id}.png`;
    await page.screenshot({ path: dest });
    console.log('Successfully captured', t.id);
    await context.close();
  }

  await browser.close();
  console.log('Batch 2 successfully completed.');
})();
