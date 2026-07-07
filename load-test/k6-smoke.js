import http from 'k6/http';
import { check, sleep } from 'k6';

// Baseline load test: logs in once, then hammers a few read endpoints with a ramp of virtual users.
// Run:  k6 run load-test/k6-smoke.js   (override BASE_URL / EMAIL / PASSWORD via env).
const BASE = __ENV.BASE_URL || 'http://localhost:8073';
const EMAIL = __ENV.EMAIL || 'admin@mtncameroon.cm';
const PASSWORD = __ENV.PASSWORD || 'password123';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // ramp up to 20 virtual users
    { duration: '1m', target: 20 },    // hold
    { duration: '20s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],    // < 1% errors
    http_req_duration: ['p(95)<800'],  // p95 latency under 800ms
  },
};

export function setup() {
  const res = http.post(`${BASE}/api/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'login 200': (r) => r.status === 200 });
  return { token: res.json('token') };
}

export default function (data) {
  const params = { headers: { Authorization: `Bearer ${data.token}` } };
  const endpoints = ['/api/dashboard/admin', '/api/custom-fields', '/api/okrs', '/api/wiki-pages'];
  for (const ep of endpoints) {
    const r = http.get(`${BASE}${ep}`, params);
    check(r, { [`${ep} 200`]: (res) => res.status === 200 });
  }
  sleep(1);
}
