import type { EventLog as EventLogType } from '../types';

export function EventLog({ events }: { events: EventLogType[] }) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="card-header">
        <h3 className="card-title">Event Stream</h3>
        <div className="card-badge" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>Live</div>
      </div>
      
      <div className="event-log" style={{ flex: 1 }}>
        {events.map((event) => (
          <div key={event.id} className="event-log-entry animate-fade-in">
            <div className="event-log-time">
              {event.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div className={`event-log-level event-log-level--${event.level}`}>
              {event.level === 'warn' ? 'WRN' : event.level === 'error' ? 'ERR' : 'INF'}
            </div>
            <div className="event-log-message" title={event.message}>
              {event.message}
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Waiting for events...
          </div>
        )}
      </div>
    </div>
  );
}
