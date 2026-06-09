import type { FaultConfig } from '../types';

interface FaultPanelProps {
  config: FaultConfig;
  onToggleError: (enabled: boolean) => void;
  onToggleLatency: (enabled: boolean) => void;
  onTriggerOOM: () => void;
}

export function FaultPanel({ config, onToggleError, onToggleLatency, onTriggerOOM }: FaultPanelProps) {
  return (
    <div className="card" style={{ borderColor: config.errorEnabled || config.latencyEnabled ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-glass)' }}>
      <div className="card-header">
        <h3 className="card-title" style={{ color: config.errorEnabled || config.latencyEnabled ? 'var(--accent-red)' : 'var(--text-secondary)' }}>
          Chaos & Fault Injection
        </h3>
        {config.errorEnabled || config.latencyEnabled ? (
          <div className="card-badge" style={{ background: 'var(--accent-red)', color: 'white', animation: 'pulse-border 2s infinite' }}>Active</div>
        ) : (
          <div className="card-badge" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>Inactive</div>
        )}
      </div>

      <div className="fault-panel">
        <div className="fault-control">
          <div className="fault-control-label">
            <span className="fault-control-icon">🔥</span>
            <div>
              <div>HTTP 500 Errors</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Inject internal server errors</div>
            </div>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={config.errorEnabled} 
              onChange={(e) => onToggleError(e.target.checked)} 
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="fault-control">
          <div className="fault-control-label">
            <span className="fault-control-icon">⏱</span>
            <div>
              <div>High Latency ({config.latencyMs}ms)</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Inject response delay</div>
            </div>
          </div>
          <label className="toggle">
            <input 
              type="checkbox" 
              checked={config.latencyEnabled} 
              onChange={(e) => onToggleLatency(e.target.checked)} 
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="fault-control" style={{ marginTop: '8px', borderStyle: 'dashed' }}>
          <div className="fault-control-label">
            <span className="fault-control-icon">💀</span>
            <div>
              <div>OOM Simulation</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                Alloc: {config.allocMb}MB | Sys: {config.sysMb}MB
              </div>
            </div>
          </div>
          <button className="btn btn-danger" onClick={onTriggerOOM}>
            Trigger OOM
          </button>
        </div>
      </div>
    </div>
  );
}
