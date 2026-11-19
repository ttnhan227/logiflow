export function getStompAuthToken() {
  const rawToken = localStorage.getItem('token');
  if (!rawToken) return null;
  const cleaned = rawToken.replace(/^"|"$/g, '').trim();
  return cleaned || null;
}

export function getStompConnectHeaders() {
  const token = getStompAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
