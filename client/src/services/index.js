import api from './api';
import authService from './auth/authService';
import driverRegistrationService from './auth/driverRegistrationService';
import customerRegistrationService from './auth/customerRegistrationService';
import userService from './admin/userService';
import uploadService from './upload/uploadService';
import profileService from './profile/profileService';
import settingsService from './admin/settingsService';
import dashboardService from './admin/dashboardService';
import routeService from './admin/routeService';
import vehicleService from './admin/vehicleService';
import reportsService from './admin/reportsService';
import tripsOversightService from './admin/tripsOversightService';
import orderService from './dispatch/orderService';
import dispatchDriverService from './dispatch/driverService';
import tripService from './dispatch/tripService';
import dispatchReportsService from './dispatch/reportsService';
import dispatchRouteService from './dispatch/routeService';
import dispatchVehicleService from './dispatch/vehicleService';
import customerOrderService from './customer/orderService';
import paymentService from './paymentService';
import trackingClient from './trackingClient';
import chatService from './chatService';
import chatClient from './chatClient';

export {
  api,
  authService,
  driverRegistrationService,
  customerRegistrationService,
  userService,
  uploadService,
  profileService,
  settingsService,
  dashboardService,
  routeService,
  vehicleService,
  reportsService,
  tripsOversightService,
  orderService,
  dispatchDriverService,
  tripService,
  dispatchReportsService,
  dispatchRouteService,
  dispatchVehicleService,
  customerOrderService,
  paymentService,
  trackingClient,
  chatService,
  chatClient,
};

// Example usage:
// import { authService, userService } from '../services';
