import { useState, useRef, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export function LoadGenerator() {
  const [active, setActive] = useState(false);
  const [requestsSent, setRequestsSent] = useState(0);
  const [targetRps, setTargetRps] = useState(50);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startSpamming = () => {
    setActive(true);
    // Fire requests rapidly
    intervalRef.current = setInterval(() => {
      fetch(`${API_BASE}/fault/cpu`, { method: 'POST' }).catch(() => {});
      setRequestsSent((prev) => prev + 1);
    }, 1000 / targetRps);
  };

  const stopSpamming = () => {
    setActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  return (
    <div className="card" style={{ borderColor: active ? 'rgba(234, 179, 8, 0.5)' : 'var(--border-glass)' }}>
      <div className="card-header">
        <h3 className="card-title" style={{ color: active ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>
          🚀 API Load Generator
        </h3>
        {active ? (
          <div className="card-badge" style={{ background: 'var(--accent-amber)', color: '#000', animation: 'pulse-border 1s infinite' }}>Spamming</div>
        ) : (
          <div className="card-badge" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>Idle</div>
        )}
      </div>

      <div className="fault-panel">
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Simulate a traffic spike by spamming the CPU stress endpoint. This will consume backend resources and potentially trigger autoscaling.
        </p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <span style={{ fontSize: '0.875rem' }}>Rate (req/sec):</span>
          <input 
            type="range" 
            min="10" max="200" step="10" 
            value={targetRps} 
            onChange={(e) => setTargetRps(parseInt(e.target.value))}
            style={{ width: '100px' }}
            disabled={active}
          />
          <span style={{ fontWeight: 'bold' }}>{targetRps}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Sent: <strong style={{ color: '#fff' }}>{requestsSent}</strong> reqs
          </div>
          {active ? (
            <button className="btn btn-danger" onClick={stopSpamming} style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
              Stop Spamming
            </button>
          ) : (
            <button className="btn" onClick={startSpamming} style={{ background: 'rgba(234, 179, 8, 0.2)', color: '#eab308' }}>
              Start Spamming
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
