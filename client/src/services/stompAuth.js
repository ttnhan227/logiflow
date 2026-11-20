import authService from './auth/authService';

export function getStompAuthToken() {
  return authService.getCurrentUser() ? 'cookie-session' : null;
}

export function getStompConnectHeaders() {
  return {};
}
