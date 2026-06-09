import type { TrafficSplit as TrafficSplitType } from '../types';

export function TrafficSplit({ split }: { split: TrafficSplitType }) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Traffic Distribution</h3>
        <div className="card-badge" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>ACA Ingress</div>
      </div>
      
      <div className="traffic-split">
        <div className="traffic-legend">
          <div className="traffic-legend-item">
            <div className="traffic-legend-dot traffic-legend-dot--stable"></div>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Stable Revision</div>
              <div className="traffic-weight">{split.stableWeight}%</div>
            </div>
          </div>
          <div className="traffic-legend-item" style={{ textAlign: 'right' }}>
            <div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Canary Revision</div>
              <div className="traffic-weight">{split.canaryWeight}%</div>
            </div>
            <div className="traffic-legend-dot traffic-legend-dot--canary"></div>
          </div>
        </div>
        
        <div className="traffic-bar-container">
          <div className="traffic-bar-stable" style={{ width: `${split.stableWeight}%` }}></div>
          <div className="traffic-bar-canary" style={{ width: `${split.canaryWeight}%` }}></div>
        </div>
      </div>
    </div>
  );
}
