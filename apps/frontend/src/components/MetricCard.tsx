import type { MetricData } from '../types';

export function MetricCard({ metric }: { metric: MetricData }) {
  return (
    <div className={`metric-card metric-card--glow-${metric.color}`}>
      <div className="metric-icon" style={{ background: `var(--accent-${metric.color}-glow)`, color: `var(--accent-${metric.color})` }}>
        {metric.icon}
      </div>
      <div className="metric-label">{metric.label}</div>
      <div className="metric-value">
        {metric.value}
        {metric.unit && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '4px' }}>{metric.unit}</span>}
      </div>
      {metric.change !== undefined && (
        <div className={`metric-change metric-change--${metric.changeDirection}`}>
          {metric.changeDirection === 'up' ? '↑' : '↓'} {Math.abs(metric.change)}% from last 5m
        </div>
      )}
    </div>
  );
}
