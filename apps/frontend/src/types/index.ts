// Types for the SRE Dashboard

export interface MetricData {
  label: string;
  value: string;
  unit?: string;
  change?: number;
  changeDirection?: 'up' | 'down';
  icon: string;
  color: 'green' | 'blue' | 'red' | 'amber' | 'purple' | 'cyan';
}

export interface RevisionInfo {
  name: string;
  label: 'stable' | 'canary';
  status: 'Running' | 'Degraded' | 'Failed' | 'Provisioning';
  weight: number;
  replicas: number;
  requestRate: number;
  errorRate: number;
  p95Latency: number;
  image: string;
  commitSha: string;
}

export interface FaultConfig {
  errorEnabled: boolean;
  latencyEnabled: boolean;
  latencyMs: number;
  allocMb: number;
  sysMb: number;
  goroutines: number;
}

export interface EventLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  message: string;
  source?: string;
}

export interface TrafficSplit {
  stableWeight: number;
  canaryWeight: number;
}

export type SystemStatus = 'healthy' | 'degraded' | 'critical';

export interface DashboardState {
  status: SystemStatus;
  metrics: MetricData[];
  stableRevision: RevisionInfo;
  canaryRevision: RevisionInfo | null;
  trafficSplit: TrafficSplit;
  faultConfig: FaultConfig;
  events: EventLog[];
  sloTarget: number;
  sloActual: number;
  connected: boolean;
}
