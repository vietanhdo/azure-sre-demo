import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    constant_request_rate: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '5m',
      preAllocatedVUs: 20,
      maxVUs: 100,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
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
