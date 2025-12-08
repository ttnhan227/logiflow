import api from './api';
import authService from './auth/authService';
import driverRegistrationService from './auth/driverRegistrationService';
import userService from './admin/userService';
import uploadService from './upload/uploadService';
import profileService from './profile/profileService';
import settingsService from './admin/settingsService';
import dashboardService from './admin/dashboardService';
import routeService from './admin/routeService';
import vehicleService from './admin/vehicleService';
import reportsService from './admin/reportsService';
import ordersOversightService from './admin/ordersOversightService';

export {
  api,
  authService,
  driverRegistrationService,
  userService,
  uploadService,
  profileService,
  settingsService,
  dashboardService,
  routeService,
  vehicleService,
  reportsService,
  ordersOversightService,
};

// Example usage:
// import { authService, userService } from '../services';
