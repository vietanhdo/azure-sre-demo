import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '5m',
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

export function setup() {
  // Trigger OOM
  const res = http.post(`${BASE_URL}/fault/oom`);
  console.log(`Triggered OOM: ${res.status}`);
}

export default function () {
  // Monitor health every 500ms
  const res = http.get(`${BASE_URL}/healthz`, { timeout: '1s' });
  
  const isHealthy = check(res, {
    'is healthy': (r) => r.status === 200,
  });

  if (!isHealthy) {
    console.log(`Health check failed! Status: ${res.status}, Error: ${res.error}`);
  }

  sleep(0.5);
}
