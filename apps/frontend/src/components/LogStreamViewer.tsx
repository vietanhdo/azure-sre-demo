import React, { useEffect, useState, useRef } from 'react';

interface LogEntry {
  TimeGenerated: string;
  RevisionName: string;
  ContainerName: string;
  Log: string;
}

export const LogStreamViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_URL || '';
    const eventSource = new EventSource(`${API_BASE}/api/azure/logs/stream`);

    eventSource.onopen = () => {
      setConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.error) {
          setError(data.error);
          return;
        }
        setLogs(prev => {
          const newLogs = [...prev, data];
          // Keep last 100 logs
          if (newLogs.length > 100) return newLogs.slice(newLogs.length - 100);
          return newLogs;
        });
      } catch (err) {
        console.error("Failed to parse log event", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      setError("Connection to log stream lost. Reconnecting...");
      setConnected(false);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Helper to parse the JSON string in Log_s
  const renderLogContent = (logStr: string) => {
    try {
      const parsed = JSON.parse(logStr);
      const traceId = parsed.trace_id ? `[Trace: ${parsed.trace_id}] ` : '';
      const msg = parsed.msg || parsed.message || '';
      return (
        <span>
          <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{traceId}</span>
          {msg}
        </span>
      );
    } catch {
      return logStr;
    }
  };

  return (
    <div style={{ backgroundColor: '#000', padding: '15px', borderRadius: '8px', color: '#0f0', fontFamily: 'monospace', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#fff' }}>⚡ Live Console Stream</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: connected ? '#4ade80' : '#ef4444', boxShadow: connected ? '0 0 8px #4ade80' : 'none' }}></div>
          <span style={{ fontSize: '12px', color: '#aaa' }}>{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      {error && <div style={{ color: '#ef4444', marginBottom: '10px', fontSize: '12px' }}>{error}</div>}

      <div style={{ overflowY: 'auto', flex: 1, fontSize: '12px', lineHeight: '1.4' }}>
        {logs.length === 0 && connected && <div style={{ color: '#555' }}>Waiting for logs...</div>}
        {logs.map((log, idx) => (
          <div key={idx} style={{ marginBottom: '6px', borderBottom: '1px dashed #222', paddingBottom: '4px' }}>
            <span style={{ color: '#888' }}>[{new Date(log.TimeGenerated).toLocaleTimeString()}]</span>{' '}
            <span style={{ color: '#60a5fa' }}>[{log.RevisionName.split('--')[1] || log.RevisionName}]</span>{' '}
            <span style={{ color: '#ccc' }}>{renderLogContent(log.Log)}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
