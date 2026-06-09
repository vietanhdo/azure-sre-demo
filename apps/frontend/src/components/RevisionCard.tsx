import type { RevisionInfo } from '../types';

export function RevisionCard({ revision }: { revision: RevisionInfo }) {
  const isHealthy = revision.status === 'Running' && revision.errorRate < 5;
  const isCanary = revision.label === 'canary';

  return (
    <div className="revision-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div className="revision-name">{revision.name}</div>
          <div className="revision-status">
            <span className="status-dot" style={{ color: isHealthy ? 'var(--accent-green)' : 'var(--accent-red)' }}></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isHealthy ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {revision.status}
            </span>
          </div>
        </div>
        <div className="card-badge" style={{ 
          background: isCanary ? 'rgba(139, 92, 246, 0.2)' : 'rgba(59, 130, 246, 0.2)',
          color: isCanary ? 'var(--accent-purple)' : 'var(--accent-blue)'
        }}>
          {revision.label}
        </div>
      </div>

      <div className="revision-metrics">
        <div className="revision-metric-row">
          <span className="revision-metric-label">Replicas</span>
          <span className="revision-metric-value">{revision.replicas}</span>
        </div>
        <div className="revision-metric-row">
          <span className="revision-metric-label">Request Rate</span>
          <span className="revision-metric-value">{revision.requestRate} req/s</span>
        </div>
        <div className="revision-metric-row">
          <span className="revision-metric-label">Error Rate</span>
          <span className="revision-metric-value" style={{ color: revision.errorRate > 5 ? 'var(--accent-red)' : 'inherit' }}>
            {revision.errorRate.toFixed(1)}%
          </span>
        </div>
        <div className="revision-metric-row">
          <span className="revision-metric-label">P95 Latency</span>
          <span className="revision-metric-value" style={{ color: revision.p95Latency > 1000 ? 'var(--accent-amber)' : 'inherit' }}>
            {revision.p95Latency}ms
          </span>
        </div>
      </div>
      
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)' }}>
        <div style={{ fontSize: '0.625rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <div>Image: {revision.image.split('/').pop()}</div>
          <div>Commit: {revision.commitSha}</div>
        </div>
      </div>
    </div>
  );
}
