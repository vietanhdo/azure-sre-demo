import type { DashboardState, EventLog, FaultConfig, RevisionInfo } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Simulated dashboard state for demo mode.
 * In production, this would poll the Go backend /api/* and /fault/status endpoints.
 */

let demoMode = false;

// ── API endpoints for Azure Management
export async function fetchRevisions() {
  const response = await fetch(`${API_BASE}/azure/revisions`);
  if (!response.ok) {
    throw new Error('Failed to fetch revisions');
  }
  return await response.json();
}

// ── Simulated State ──
let simulatedFaultError = false;
let simulatedFaultLatency = false;
let eventCounter = 0;
const simulatedEvents: EventLog[] = [];

function generateId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addEvent(level: EventLog['level'], message: string) {
  simulatedEvents.unshift({
    id: generateId(),
    timestamp: new Date(),
    level,
    message,
    source: 'dashboard',
  });
  if (simulatedEvents.length > 100) simulatedEvents.pop();
}

// Seed some initial events
addEvent('info', 'Dashboard initialized — connected to backend');
addEvent('info', 'Stable revision ca-sre-backend--v1 serving 80% traffic');
addEvent('info', 'Canary revision ca-sre-backend--v2 serving 20% traffic');
addEvent('info', 'SLO target: 99.5% availability');

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getSimulatedState(): DashboardState {
  eventCounter++;

  // Periodically add events
  if (eventCounter % 5 === 0) {
    if (simulatedFaultError) {
      addEvent('error', `HTTP 500 from ca-sre-backend--v2: injected_server_error (trace: ${Math.random().toString(36).slice(2, 10)})`);
    } else {
      const msgs = [
        'GET /api/orders 200 OK 48ms',
        'GET /api/products 200 OK 32ms',
        'Health check passed — all probes healthy',
        `Scaling event: replicas adjusted to ${Math.floor(Math.random() * 5) + 2}`,
        'GET /api/version 200 OK 5ms',
      ];
      addEvent('info', msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }

  const baseErrorRate = simulatedFaultError ? randomBetween(35, 55) : randomBetween(0.1, 0.8);
  const baseLatency = simulatedFaultLatency ? randomBetween(1800, 2500) : randomBetween(42, 85);
  const sloActual = simulatedFaultError ? randomBetween(45, 65) : randomBetween(99.2, 99.9);

  const stable: RevisionInfo = {
    name: 'ca-sre-backend--v1',
    label: 'stable',
    status: 'Running',
    weight: 80,
    replicas: Math.floor(randomBetween(2, 5)),
    requestRate: Math.round(randomBetween(38, 45)),
    errorRate: randomBetween(0, 0.3),
    p95Latency: Math.round(randomBetween(40, 70)),
    image: 'acrsredemo.azurecr.io/sre-demo-backend:v1.0.0',
    commitSha: 'a1b2c3d',
  };

  const canary: RevisionInfo = {
    name: 'ca-sre-backend--v2',
    label: 'canary',
    status: simulatedFaultError ? 'Degraded' : 'Running',
    weight: 20,
    replicas: Math.floor(randomBetween(1, 3)),
    requestRate: Math.round(randomBetween(8, 12)),
    errorRate: simulatedFaultError ? randomBetween(35, 55) : randomBetween(0, 0.5),
    p95Latency: simulatedFaultLatency ? Math.round(randomBetween(1800, 2500)) : Math.round(randomBetween(45, 80)),
    image: 'acrsredemo.azurecr.io/sre-demo-backend:v2.0.0-beta',
    commitSha: 'abc123x',
  };

  const systemStatus = simulatedFaultError ? 'critical' : (baseErrorRate > 2 ? 'degraded' : 'healthy');

  return {
    status: systemStatus as DashboardState['status'],
    metrics: [
      {
        label: 'Request Rate',
        value: `${Math.round(stable.requestRate + canary.requestRate)}`,
        unit: 'req/s',
        change: randomBetween(-2, 5),
        changeDirection: 'up',
        icon: '⚡',
        color: 'blue',
      },
      {
        label: 'Success Rate',
        value: simulatedFaultError ? `${(100 - baseErrorRate).toFixed(1)}` : '99.8',
        unit: '%',
        change: simulatedFaultError ? -35 : 0.1,
        changeDirection: simulatedFaultError ? 'down' : 'up',
        icon: '✓',
        color: simulatedFaultError ? 'red' : 'green',
      },
      {
        label: 'P95 Latency',
        value: `${Math.round(baseLatency)}`,
        unit: 'ms',
        change: simulatedFaultLatency ? 1800 : randomBetween(-5, 5),
        changeDirection: simulatedFaultLatency ? 'up' : 'down',
        icon: '⏱',
        color: simulatedFaultLatency ? 'amber' : 'cyan',
      },
      {
        label: 'Error Rate',
        value: baseErrorRate.toFixed(1),
        unit: '%',
        change: simulatedFaultError ? 40 : randomBetween(-0.1, 0.1),
        changeDirection: simulatedFaultError ? 'up' : 'down',
        icon: '⚠',
        color: baseErrorRate > 5 ? 'red' : 'green',
      },
    ],
    stableRevision: stable,
    canaryRevision: canary,
    trafficSplit: { stableWeight: 80, canaryWeight: 20 },
    faultConfig: {
      errorEnabled: simulatedFaultError,
      latencyEnabled: simulatedFaultLatency,
      latencyMs: 2000,
      allocMb: simulatedFaultError ? Math.round(randomBetween(50, 120)) : Math.round(randomBetween(20, 35)),
      sysMb: Math.round(randomBetween(80, 150)),
      goroutines: Math.round(randomBetween(8, 25)),
    },
    events: [...simulatedEvents],
    sloTarget: 99.5,
    sloActual: sloActual,
    connected: true,
  };
}

// ── API Functions ──

export async function fetchDashboardState(): Promise<DashboardState> {
  if (demoMode) {
    return getSimulatedState();
  }

  try {
    const [healthRes, faultRes, versionRes] = await Promise.all([
      fetch(`${API_BASE}/healthz`),
      fetch(`${API_BASE}/fault/status`),
      fetch(`${API_BASE}/api/version`),
    ]);

    await healthRes.json();
    const fault: FaultConfig = await faultRes.json();
    await versionRes.json();

    // In real mode, we'd also query Azure Monitor / Prometheus for metrics
    // For now, generate from fault status
    simulatedFaultError = fault.errorEnabled;
    simulatedFaultLatency = fault.latencyEnabled;

    return getSimulatedState();
  } catch {
    // Fallback to demo mode on connection failure
    demoMode = true;
    return getSimulatedState();
  }
}

export async function toggleFaultError(enable: boolean): Promise<void> {
  if (demoMode) {
    simulatedFaultError = enable;
    addEvent(
      enable ? 'warn' : 'info',
      enable
        ? '🔴 FAULT INJECTION: HTTP 500 errors ENABLED on canary'
        : '🟢 FAULT INJECTION: HTTP 500 errors DISABLED'
    );
    return;
  }

  const endpoint = enable ? '/fault/error/enable' : '/fault/error/disable';
  await fetch(`${API_BASE}${endpoint}`, { method: 'POST' });
}

export async function toggleFaultLatency(enable: boolean): Promise<void> {
  if (demoMode) {
    simulatedFaultLatency = enable;
    addEvent(
      enable ? 'warn' : 'info',
      enable
        ? '🟡 FAULT INJECTION: 2000ms latency ENABLED on canary'
        : '🟢 FAULT INJECTION: Latency injection DISABLED'
    );
    return;
  }

  const endpoint = enable ? '/fault/latency/enable?ms=2000' : '/fault/latency/disable';
  await fetch(`${API_BASE}${endpoint}`, { method: 'POST' });
}

export async function triggerOOM(): Promise<void> {
  if (demoMode) {
    addEvent('error', '💀 FAULT INJECTION: OOM simulation TRIGGERED — allocating memory until OOMKilled');
    return;
  }

  await fetch(`${API_BASE}/fault/oom`, { method: 'POST' });
}
