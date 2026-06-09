export function SloGauge({ target, actual }: { target: number; actual: number }) {
  const isBreached = actual < target;
  
  // Simple circular gauge math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (actual / 100) * circumference;
  
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="card-header" style={{ width: '100%' }}>
        <h3 className="card-title">SLO Status</h3>
        <div className="card-badge" style={{ 
          background: isBreached ? 'var(--accent-red)' : 'rgba(16, 185, 129, 0.2)',
          color: isBreached ? 'white' : 'var(--accent-green)',
          animation: isBreached ? 'pulse-border 2s infinite' : 'none'
        }}>
          {isBreached ? 'BREACHED' : 'HEALTHY'}
        </div>
      </div>
      
      <div className="slo-gauge" style={{ width: '140px', height: '140px', margin: '16px 0' }}>
        <svg viewBox="0 0 100 100">
          <circle 
            className="slo-gauge-track" 
            cx="50" cy="50" r={radius} 
          />
          <circle 
            className="slo-gauge-fill" 
            cx="50" cy="50" r={radius} 
            strokeDasharray={circumference} 
            strokeDashoffset={offset} 
            stroke={isBreached ? 'var(--accent-red)' : 'var(--accent-green)'} 
          />
        </svg>
        <div className="slo-gauge-center">
          <div className="slo-gauge-value" style={{ color: isBreached ? 'var(--accent-red)' : 'inherit' }}>
            {actual.toFixed(1)}%
          </div>
          <div className="slo-gauge-label">
            Target: {target}%
          </div>
        </div>
      </div>
      
      {isBreached && (
        <div style={{ fontSize: '0.75rem', color: 'var(--accent-red)', textAlign: 'center', marginTop: '8px' }}>
          Azure SRE Agent is analyzing the root cause...
        </div>
      )}
    </div>
  );
}
