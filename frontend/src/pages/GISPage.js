import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png', iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png', shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png' });

const STATUS_COLORS  = { active: '#10b981', planning: '#0ea5e9', completed: '#6366f1', on_hold: '#f59e0b', cancelled: '#ef4444' };
const SENSOR_COLORS  = { temperature: '#ef4444', humidity: '#0ea5e9', air_quality: '#f59e0b', traffic: '#8b5cf6', energy: '#10b981', water: '#06b6d4', noise: '#f97316', waste: '#84cc16' };

export default function GISPage() {
  const { authFetch } = useAuth();
  const [projects, setProjects] = useState({ features: [] });
  const [sensors,  setSensors]  = useState({ features: [] });
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const [p, s] = await Promise.all([
          authFetch('/api/projects/map'),
          authFetch('/api/iot/sensors/geojson'),
        ]);
        if (p.success) setProjects(p.data);
        if (s.success) setSensors(s.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [authFetch]);

  const filteredProjects = activeTab === 'all'
    ? projects.features
    : projects.features.filter(f => f.properties.status === activeTab);

  return (
    <div style={{ display: 'flex', height: '100%', color: '#e2e8f0', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        .leaflet-container { background: #0d1835 !important; }
        .leaflet-tile { filter: brightness(0.7) saturate(0.8) hue-rotate(195deg); }
        .leaflet-popup-content-wrapper { background: #0d1835; border: 1px solid rgba(255,255,255,0.1); color: #e2e8f0; border-radius: 6px; box-shadow: 0 8px 32px rgba(0,0,0,0.6); }
        .leaflet-popup-tip { background: #0d1835; }
        .leaflet-popup-close-button { color: #64748b !important; }
        .leaflet-control-layers { background: #0d1835 !important; border: 1px solid rgba(255,255,255,0.1) !important; color: #e2e8f0 !important; }
      `}</style>

      {/* Left panel */}
      <div style={{ width: 280, background: '#080d22', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#f0f9ff', fontSize: '1rem' }}>🗺️ GIS Dashboard</h2>
          <p style={{ color: '#475569', fontSize: '0.78rem', marginTop: '0.2rem' }}>Project tracking across locations</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', padding: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexWrap: 'wrap' }}>
          {['all','active','planning','completed'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: '0.3rem 0.6rem', background: activeTab === t ? 'rgba(16,185,129,0.15)' : 'transparent', border: activeTab === t ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent', color: activeTab === t ? '#10b981' : '#475569', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Project list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {loading ? (
            <p style={{ color: '#475569', fontSize: '0.82rem', padding: '1rem' }}>Loading…</p>
          ) : filteredProjects.length === 0 ? (
            <p style={{ color: '#475569', fontSize: '0.82rem', padding: '1rem' }}>No projects found.</p>
          ) : filteredProjects.map(f => {
            const p = f.properties;
            return (
              <div key={p.id} onClick={() => setSelected(p)}
                style={{ padding: '0.85rem', borderRadius: 6, cursor: 'pointer', background: selected?.id === p.id ? 'rgba(16,185,129,0.08)' : 'transparent', border: selected?.id === p.id ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent', marginBottom: '0.25rem', transition: 'all 0.2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 500, color: '#e2e8f0', fontSize: '0.85rem', lineHeight: 1.3 }}>{p.name}</div>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[p.status] || '#475569', flexShrink: 0, marginTop: 4 }} />
                </div>
                <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.3rem' }}>{p.city}, {p.country}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <div style={{ flex: 1, height: 3, background: '#1e293b', borderRadius: 2 }}>
                    <div style={{ width: `${p.progress}%`, height: '100%', background: '#10b981', borderRadius: 2 }} />
                  </div>
                  <span style={{ color: '#10b981', fontSize: '0.7rem', fontWeight: 700 }}>{p.progress}%</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: '#475569', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>Sensor Types</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
            {Object.entries(SENSOR_COLORS).map(([type, color]) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                <span style={{ color: '#64748b', fontSize: '0.7rem', textTransform: 'capitalize' }}>{type.replace('_',' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(6,9,26,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, color: '#10b981', fontFamily: "'DM Sans',sans-serif" }}>
            Loading map data…
          </div>
        )}
        <MapContainer center={[4.0, 15.0]} zoom={4} style={{ height: '100%', width: '100%' }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Dark">
              <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Project markers */}
          {filteredProjects.map(f => {
            const p   = f.properties;
            const lng = f.geometry?.coordinates?.[0];
            const lat = f.geometry?.coordinates?.[1];
            if (!lat || !lng) return null;
            return (
              <Marker key={p.id} position={[lat, lng]}>
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#f0f9ff', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{p.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '0.75rem' }}>{p.city}, {p.country} · {p.code}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', background: `${STATUS_COLORS[p.status]}25`, color: STATUS_COLORS[p.status], fontSize: '0.7rem', fontWeight: 600, borderRadius: 3, textTransform: 'capitalize' }}>{p.status}</span>
                    </div>
                    <div style={{ background: '#1e293b', borderRadius: 3, height: 4, marginTop: '0.5rem' }}>
                      <div style={{ width: `${p.progress}%`, height: '100%', background: '#10b981', borderRadius: 3 }} />
                    </div>
                    <div style={{ color: '#10b981', fontSize: '0.75rem', marginTop: '0.3rem', textAlign: 'right' }}>{p.progress}% complete</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Sensor circle markers */}
          {sensors.features.map(f => {
            const s   = f.properties;
            const lng = f.geometry?.coordinates?.[0];
            const lat = f.geometry?.coordinates?.[1];
            if (!lat || !lng) return null;
            return (
              <CircleMarker key={s.id} center={[lat, lng]} radius={6}
                pathOptions={{ color: SENSOR_COLORS[s.type] || '#475569', fillColor: SENSOR_COLORS[s.type] || '#475569', fillOpacity: s.status === 'online' ? 0.8 : 0.3, weight: 2 }}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#f0f9ff', fontSize: '0.85rem', marginBottom: '0.3rem' }}>{s.name}</div>
                    <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{s.deviceId}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.status === 'online' ? '#10b981' : '#ef4444' }} />
                      <span style={{ color: s.status === 'online' ? '#10b981' : '#ef4444', fontSize: '0.72rem', fontWeight: 600 }}>{s.status}</span>
                    </div>
                    {s.latestValue !== null && (
                      <div style={{ color: '#e2e8f0', fontSize: '0.82rem', marginTop: '0.4rem' }}>Latest: <strong>{s.latestValue}</strong></div>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
