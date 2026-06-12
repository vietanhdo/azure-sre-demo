import React, { useEffect, useState } from 'react';
import { fetchRevisions } from '../utils/api';

interface RevisionInfo {
  name: string;
  active: boolean;
  replicas: number;
  trafficWeight: number;
  replicaList: string[];
}

export const RevisionManager: React.FC = () => {
  const [revisions, setRevisions] = useState<RevisionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchRevisions();
        setRevisions(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to load revisions');
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading && revisions.length === 0) return <div style={{ color: '#aaa', padding: '20px' }}>Loading revisions...</div>;
  if (error && revisions.length === 0) return <div style={{ color: '#ff4444', padding: '20px' }}>{error}</div>;

  return (
    <div style={{ backgroundColor: '#1a1b1e', padding: '20px', borderRadius: '8px', color: '#fff', height: '100%' }}>
      <h3 style={{ margin: '0 0 15px 0', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
        🚀 Running Revisions
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', maxHeight: '400px' }}>
        {revisions.map((rev) => (
          <div key={rev.name} style={{ borderLeft: `4px solid ${rev.trafficWeight > 0 ? '#4ade80' : '#60a5fa'}`, padding: '10px', backgroundColor: '#2a2b2e', borderRadius: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '14px' }}>{rev.name}</strong>
              <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#333' }}>
                Traffic: {rev.trafficWeight}%
              </span>
            </div>
            
            <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '5px' }}>
              Replicas ({rev.replicas}):
            </div>
            {rev.replicaList && rev.replicaList.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#888' }}>
                {rev.replicaList.map(rep => (
                  <li key={rep}>{rep}</li>
                ))}
              </ul>
            ) : (
              <div style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>No replicas running</div>
            )}
          </div>
        ))}
        {revisions.length === 0 && <div style={{ color: '#888' }}>No active revisions found.</div>}
      </div>
    </div>
  );
};
