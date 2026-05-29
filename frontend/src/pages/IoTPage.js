import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const TYPE_ICONS = { temperature:'🌡️', humidity:'💧', air_quality:'💨', traffic:'🚗', energy:'⚡', water:'🌊', noise:'🔊', waste:'🗑️' };
const STATUS_COLORS = { online:'#10b981', offline:'#ef4444', maintenance:'#f59e0b', error:'#f97316' };
const TYPE_COLORS = { temperature:'#ef4444', humidity:'#0ea5e9', air_quality:'#f59e0b', traffic:'#8b5cf6', energy:'#10b981', water:'#06b6d4', noise:'#f97316', waste:'#84cc16' };

export default function IoTPage() {
  const { authFetch, token } = useAuth();
  const [sensors,    setSensors]    = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [readings,   setReadings]   = useState([]);
  const [liveData,   setLiveData]   = useState({});
  const [alerts,     setAlerts]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [wsStatus,   setWsStatus]   = useState('connecting');
  const wsRef = useRef(null);

  // Load sensors
  useEffect(() => {
    authFetch('/api/iot/sensors').then(d => {
      if (d.success) setSensors(d.data);
      setLoading(false);
    });
  }, [authFetch]);

  // Load readings when sensor selected
  useEffect(() => {
    if (!selected) return;
    authFetch(`/api/iot/sensors/${selected.id}/readings?hours=6&limit=60`).then(d => {
      if (d.success) setReadings(d.data.map(r => ({ time: new Date(r.recorded_at).toLocaleTimeString(), value: parseFloat(r.value) })));
    });
  }, [selected, authFetch]);

  // WebSocket for live updates
  useEffect(() => {
    const wsUrl = `ws://${window.location.hostname}:5000/ws`;
    const ws    = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen  = () => setWsStatus('connected');
    ws.onclose = () => setWsStatus('disconnected');
    ws.onerror = () => setWsStatus('error');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'SENSOR_UPDATE') {
        setLiveData(ld => ({ ...ld, [msg.sensorId]: { value: msg.value, timestamp: msg.timestamp } }));
        setSensors(ss => ss.map(s => s.id === msg.sensorId ? { ...s, latest_value: msg.value, status: 'online' } : s));
        if (selected?.id === msg.sensorId) {
          setReadings(r => [...r.slice(-59), { time: new Date().toLocaleTimeString(), value: msg.value }]);
        }
      }
      if (msg.type === 'ALERT') {
        setAlerts(a => [{ id: Date.now(), ...msg, time: new Date() }, ...a.slice(0, 4)]);
      }
    };
    return () => ws.close();
  }, [selected]);

  const online  = sensors.filter(s => s.status === 'online').length;
  const offline = sensors.filter(s => s.status !== 'online').length;

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem', color: '#e2e8f0', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#f0f9ff' }}>📡 IoT Sensors</h1>
          <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '0.2rem' }}>Live sensor monitoring and data feeds</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: wsStatus === 'connected' ? '#10b981' : wsStatus === 'connecting' ? '#f59e0b' : '#ef4444', boxShadow: wsStatus === 'connected' ? '0 0 6px #10b981' : 'none' }} />
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>WebSocket: {wsStatus}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Sensors', value: sensors.length, color: '#0ea5e9' },
          { label: 'Online',        value: online,          color: '#10b981' },
          { label: 'Offline',       value: offline,         color: '#ef4444' },
          { label: 'Live Alerts',   value: alerts.length,   color: '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${s.color}`, borderRadius: 8, padding: '1rem' }}>
            <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '2rem', color: s.color, lineHeight: 1, marginTop: '0.4rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Live alerts */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: '1.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '1rem' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#fca5a5', fontSize: '0.85rem', marginBottom: '0.5rem' }}>🔔 Live Alerts</div>
          {alerts.map(a => (
            <div key={a.id} style={{ color: '#94a3b8', fontSize: '0.8rem', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ color: '#fca5a5' }}>⚠</span> Sensor {a.deviceId} — value {a.value} exceeded threshold {a.threshold} · {new Date(a.time).toLocaleTimeString()}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Sensor list */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#f0f9ff', fontSize: '0.9rem' }}>All Sensors</h3>
          </div>
          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {loading ? <p style={{ padding: '1rem', color: '#475569', fontSize: '0.82rem' }}>Loading…</p>
              : sensors.map(s => {
                const live = liveData[s.id];
                return (
                  <div key={s.id} onClick={() => setSelected(s)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.25rem', cursor: 'pointer', background: selected?.id === s.id ? 'rgba(16,185,129,0.07)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }}
                    onMouseOver={e => { if (selected?.id !== s.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseOut={e => { if (selected?.id !== s.id) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ fontSize: '1.3rem' }}>{TYPE_ICONS[s.sensor_type] || '📟'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</div>
                      <div style={{ color: '#334155', fontSize: '0.72rem' }}>{s.device_id}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ color: live ? '#10b981' : '#64748b', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.85rem' }}>
                        {live ? live.value : s.latest_value ?? '—'}
                        <span style={{ color: '#334155', fontWeight: 400, fontSize: '0.7rem' }}> {s.unit}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[s.status], boxShadow: s.status === 'online' ? `0 0 5px ${STATUS_COLORS[s.status]}` : 'none' }} />
                        <span style={{ color: STATUS_COLORS[s.status], fontSize: '0.68rem' }}>{s.status}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Selected sensor detail + chart */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8 }}>
          {!selected ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#334155', fontSize: '0.85rem', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '2rem' }}>📈</span>
              Select a sensor to view readings
            </div>
          ) : (
            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '1.8rem' }}>{TYPE_ICONS[selected.sensor_type]}</span>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#f0f9ff', fontSize: '1rem' }}>{selected.name}</div>
                  <div style={{ color: '#475569', fontSize: '0.75rem' }}>{selected.device_id} · {selected.sensor_type.replace('_',' ')}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.8rem', color: TYPE_COLORS[selected.sensor_type], lineHeight: 1 }}>
                    {liveData[selected.id]?.value ?? selected.latest_value ?? '—'}
                  </div>
                  <div style={{ color: '#475569', fontSize: '0.72rem' }}>{selected.unit}</div>
                </div>
              </div>

              {/* Threshold bar */}
              {selected.threshold && selected.latest_value && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', fontSize: '0.72rem', marginBottom: '0.4rem' }}>
                    <span>Current vs Threshold</span>
                    <span style={{ color: selected.latest_value > selected.threshold ? '#ef4444' : '#10b981' }}>
                      {((selected.latest_value / selected.threshold) * 100).toFixed(0)}% of limit
                    </span>
                  </div>
                  <div style={{ height: 6, background: '#1e293b', borderRadius: 3 }}>
                    <div style={{ width: `${Math.min((selected.latest_value / selected.threshold) * 100, 100)}%`, height: '100%', background: selected.latest_value > selected.threshold ? '#ef4444' : '#10b981', borderRadius: 3, transition: 'width 0.5s' }} />
                  </div>
                </div>
              )}

              {/* Chart */}
              <div style={{ marginTop: '1rem' }}>
                <div style={{ color: '#475569', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Last 6 hours</div>
                {readings.length === 0 ? (
                  <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '0.82rem' }}>No readings available</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={readings}>
                      <XAxis dataKey="time" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ background: '#0d1835', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#e2e8f0', fontSize: '0.8rem' }} />
                      <Line type="monotone" dataKey="value" stroke={TYPE_COLORS[selected.sensor_type]} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
