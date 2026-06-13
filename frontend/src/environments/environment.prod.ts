export const environment = {
  production: true,
  // Relative path → served same-origin and proxied to the backend by nginx (see frontend/nginx.conf).
  // This makes the container portable (no hard-coded host/port) and avoids cross-origin requests.
  apiUrl: '/api'
};
