import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    baseline: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
    // We assume the fault is injected manually or via script right after the baseline phase ends.
    // In a real automated setup, we'd use exec/setup or separate scenarios to trigger it.
    fault_phase: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 20,
      maxVUs: 100,
      startTime: '2m',
    },
    recovery_phase: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 100,
      startTime: '4m',
    },
  },
  thresholds: {
    // We expect errors in this scenario, so thresholds might fail.
    // This is useful for observing the SLO breach.
    http_req_failed: ['rate<0.05'], 
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

export default function () {
  const isOrders = Math.random() > 0.5;
  const endpoint = isOrders ? '/api/orders' : '/api/products';
  
  const res = http.get(`${BASE_URL}${endpoint}`);
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}
