import { useDashboardData } from '../hooks/useDashboardData';
import { MetricCard } from '../components/MetricCard';
import { RevisionManager } from '../components/RevisionManager';
import { LogStreamViewer } from '../components/LogStreamViewer';
import { FaultPanel } from '../components/FaultPanel';
import { LoadGenerator } from '../components/LoadGenerator';
import { SloGauge } from '../components/SloGauge';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { toggleFaultError, toggleFaultLatency, triggerOOM } from '../utils/api';

export function Home() {
  const { data, loading, error } = useDashboardData();

  if (loading && !data) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="status-dot" style={{ color: 'var(--accent-blue)', width: '24px', height: '24px' }}></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="app-container">
        <div className="card" style={{ borderColor: 'var(--accent-red)', textAlign: 'center', padding: '40px' }}>
          <h2 style={{ color: 'var(--accent-red)', marginBottom: '16px' }}>Connection Error</h2>
          <p style={{ color: 'var(--text-muted)' }}>{error?.message || 'Failed to connect to backend API.'}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-container">
        {/* Header */}
        <header className="header animate-slide-up">
          <div className="header-left">
            <div className="header-logo">SRE</div>
            <div>
              <h1 className="header-title">Azure Autonomous Operations</h1>
              <div className="header-subtitle">Container Apps • Log Analytics • Grafana • SRE Agent</div>
            </div>
          </div>
          <div className="header-right">
            <div className={`status-badge status-badge--${data.status}`}>
              <span className="status-dot"></span>
              {data.status === 'healthy' ? 'System Healthy' : data.status === 'degraded' ? 'Degraded Performance' : 'Critical Incident'}
            </div>
          </div>
        </header>

        {/* Top Metrics */}
        <div className="metrics-grid">
          {data.metrics.map((metric, idx) => (
            <div key={metric.label} className="animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <MetricCard metric={metric} />
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="main-grid">
          {/* Left Column (Wider) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <RevisionManager />
            </div>
            
            <div className="animate-slide-up" style={{ animationDelay: '0.6s', flex: 1, minHeight: '400px' }}>
              <LogStreamViewer />
            </div>
          </div>

          {/* Right Column (Narrower) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <SloGauge target={data.sloTarget} actual={data.sloActual} />
            </div>
            
            <div className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <FaultPanel 
                config={data.faultConfig} 
                onToggleError={toggleFaultError}
                onToggleLatency={toggleFaultLatency}
                onTriggerOOM={triggerOOM}
              />
            </div>

            <div className="animate-slide-up" style={{ animationDelay: '0.7s' }}>
              <LoadGenerator />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

