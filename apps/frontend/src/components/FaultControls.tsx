import { useState, useEffect } from 'react';
import { AlertOctagon, Clock, Skull, Power, PowerOff } from 'lucide-react';

export function FaultControls() {
  const [status, setStatus] = useState({ error_enabled: false, latency_enabled: false });

  const fetchStatus = async () => {
    try {
      const res = await fetch('/fault/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch fault status', err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleFault = async (type: 'error' | 'latency', enable: boolean) => {
    try {
      const endpoint = `/fault/${type}/${enable ? 'enable' : 'disable'}`;
      await fetch(endpoint, { method: 'POST' });
      fetchStatus();
    } catch (err) {
      console.error(`Failed to toggle ${type}`, err);
    }
  };

  const triggerOOM = async () => {
    try {
      await fetch('/fault/oom', { method: 'POST' });
    } catch (err) {
      console.error('Failed to trigger OOM', err);
    }
  };

  return (
    <div style={{ marginTop: '40px' }}>
      <h2 style={{ fontSize: '20px', color: '#FF0000', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertOctagon size={20} /> SRE Chaos Engineering Controls
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        
        {/* Error Fault */}
        <div style={{ backgroundColor: 'rgba(255,0,0,0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,0,0,0.2)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon color="#FF0000" size={20} /> HTTP 500 Errors
          </h3>
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>Simulate a complete backend failure by returning 500 Internal Server Error for all requests.</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => toggleFault('error', true)}
              disabled={status.error_enabled}
              style={{ flex: 1, padding: '10px', backgroundColor: status.error_enabled ? '#333' : '#FF0000', color: '#fff', border: 'none', borderRadius: '4px', cursor: status.error_enabled ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <Power size={16} /> Enable
            </button>
            <button 
              onClick={() => toggleFault('error', false)}
              disabled={!status.error_enabled}
              style={{ flex: 1, padding: '10px', backgroundColor: !status.error_enabled ? '#333' : '#008200', color: '#fff', border: 'none', borderRadius: '4px', cursor: !status.error_enabled ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <PowerOff size={16} /> Disable
            </button>
          </div>
        </div>

        {/* Latency Fault */}
        <div style={{ backgroundColor: 'rgba(255,165,0,0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,165,0,0.2)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock color="#FFA500" size={20} /> High Latency (2000ms)
          </h3>
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>Inject a 2-second delay into all API responses to simulate severe network or DB latency.</p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => toggleFault('latency', true)}
              disabled={status.latency_enabled}
              style={{ flex: 1, padding: '10px', backgroundColor: status.latency_enabled ? '#333' : '#FFA500', color: '#fff', border: 'none', borderRadius: '4px', cursor: status.latency_enabled ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <Power size={16} /> Enable
            </button>
            <button 
              onClick={() => toggleFault('latency', false)}
              disabled={!status.latency_enabled}
              style={{ flex: 1, padding: '10px', backgroundColor: !status.latency_enabled ? '#333' : '#008200', color: '#fff', border: 'none', borderRadius: '4px', cursor: !status.latency_enabled ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
              <PowerOff size={16} /> Disable
            </button>
          </div>
        </div>

        {/* OOM Fault */}
        <div style={{ backgroundColor: 'rgba(128,0,128,0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(128,0,128,0.2)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '18px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Skull color="#800080" size={20} /> OOM Simulation
          </h3>
          <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>Force an Out-Of-Memory panic in the backend container to trigger a restart.</p>
          <button 
            onClick={triggerOOM}
            style={{ width: '100%', padding: '10px', backgroundColor: '#800080', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
            <Skull size={16} /> Crash Container
          </button>
        </div>

      </div>
    </div>
  );
}

