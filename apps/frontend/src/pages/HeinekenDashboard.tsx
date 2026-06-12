import { useState, useEffect } from 'react';
import { Activity, Thermometer, Clock, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';
import { FaultControls } from '../components/FaultControls';

interface Metric {
  label: string;
  value: string;
  unit: string;
  status: string;
  trend: string;
}

interface HeinekenData {
  status: string;
  location: string;
  timestamp: string;
  breweryDora: Metric[];
  systemMetrics: Metric[];
}

export function HeinekenDashboard() {
  const [data, setData] = useState<HeinekenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v2/heineken/metrics');
      if (!res.ok) throw new Error('Failed to fetch brewery metrics');
      const json = await res.json();
      setData(json);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a2612', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#008200', fontSize: '24px', fontWeight: 'bold' }}>Brewing Data...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a2612', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: '#1f1f1f', padding: '40px', borderRadius: '8px', border: '1px solid #FF0000', textAlign: 'center' }}>
          <h2 style={{ color: '#FF0000' }}>Systems Offline</h2>
          <p style={{ color: '#aaa' }}>{error}</p>
          <button onClick={fetchMetrics} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#008200', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a2612', color: '#fff', padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid rgba(0,130,0,0.3)', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '32px' }}>
            <span style={{ color: '#FF0000', fontSize: '40px' }}>★</span>
            HEINEKEN <span style={{ color: '#008200', fontWeight: '300' }}>Brewery SRE</span>
          </h1>
          <p style={{ margin: '8px 0 0', color: '#aaa' }}>{data?.location} • Live Monitoring</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(0,130,0,0.1)', padding: '8px 16px', borderRadius: '20px', border: '1px solid #008200' }}>
            {data?.status === 'healthy' ? <CheckCircle size={18} color="#008200" /> : <AlertTriangle size={18} color="#FF0000" />}
            <span style={{ color: data?.status === 'healthy' ? '#008200' : '#FF0000', fontWeight: 'bold', textTransform: 'uppercase' }}>
              {data?.status}
            </span>
          </div>
          <button onClick={fetchMetrics} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}>
            <RefreshCcw size={20} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </header>

      {/* DORA Metrics Grid */}
      <h2 style={{ fontSize: '20px', color: '#aaa', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={20} /> Brewery DORA Metrics
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {data?.breweryDora.map((metric, idx) => (
          <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(0,130,0,0.2)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', backgroundColor: metric.status === 'good' ? '#008200' : '#FF0000' }} />
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#aaa', fontWeight: '500' }}>{metric.label}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff' }}>{metric.value}</span>
              <span style={{ color: '#008200', fontWeight: '600' }}>{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* System Metrics */}
      <h2 style={{ fontSize: '20px', color: '#aaa', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Thermometer size={20} /> System Health
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {data?.systemMetrics.map((metric, idx) => (
          <div key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {metric.label.includes('Temp') ? <Thermometer color="#aaa" /> : <Clock color="#aaa" />}
              <span style={{ fontSize: '18px', color: '#ccc' }}>{metric.label}</span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {metric.value} <span style={{ fontSize: '16px', color: '#aaa', fontWeight: 'normal' }}>{metric.unit}</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Fault Controls */}
      <FaultControls />
      
      {/* Global CSS for spin animation */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
