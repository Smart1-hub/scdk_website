import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const STAT_STYLE = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '1.5rem' };

const MOCK_ACTIVITY = [
  { month: 'Jan', projects: 2, sensors: 12 }, { month: 'Feb', projects: 2, sensors: 18 },
  { month: 'Mar', projects: 3, sensors: 24 }, { month: 'Apr', projects: 3, sensors: 28 },
  { month: 'May', projects: 3, sensors: 35 }, { month: 'Jun', projects: 3, sensors: 40 },
];

const STATUS_COLORS = { active: '#10b981', planning: '#0ea5e9', completed: '#6366f1', on_hold: '#f59e0b', cancelled: '#ef4444' };

export default function OverviewPage() {
  const { authFetch, user } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [projects, setProjects] = useState([]);
  const [alerts,  setAlerts]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, p] = await Promise.all([
          user.role === 'admin' ? authFetch('/api/admin/stats') : Promise.resolve(null),
          authFetch('/api/projects?limit=5'),
        ]);
        if (s?.success)  setStats(s.data);
        if (p?.success) { setProjects(p.data); }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [authFetch, user.role]);

  if (loading) return <LoadingScreen />;

  return (
    <div style={{ padding: '2rem', color: '#e2e8f0' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#f0f9ff' }}>
          Good {getGreeting()}, {user?.firstName} 👋
        </h1>
        <p style={{ color: '#475569', marginTop: '0.3rem', fontSize: '0.9rem' }}>Here's what's happening across the platform.</p>
      </div>

      {/* Stat cards */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Users',       value: stats.users.total,     sub: `${stats.users.active} active`,     color: '#0ea5e9', icon: '👥' },
            { label: 'Projects',          value: stats.projects.total,   sub: `${stats.projects.active} active`,  color: '#10b981', icon: '🗂️' },
            { label: 'IoT Sensors',       value: stats.sensors.total,   sub: `${stats.sensors.online} online`,   color: '#f59e0b', icon: '📡' },
            { label: 'Unread Alerts',     value: stats.alerts.unread,   sub: `${stats.alerts.total} total`,      color: '#ef4444', icon: '🔔' },
          ].map(s => (
            <div key={s.label} style={{ ...STAT_STYLE, borderTop: `2px solid ${s.color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>{s.label}</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: '2.2rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ color: '#475569', fontSize: '0.78rem', marginTop: '0.4rem' }}>{s.sub}</div>
                </div>
                <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={STAT_STYLE}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#f0f9ff', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Sensor Deployments Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MOCK_ACTIVITY}>
              <defs>
                <linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1835', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#e2e8f0' }} />
              <Area type="monotone" dataKey="sensors" stroke="#10b981" strokeWidth={2} fill="url(#sGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={STAT_STYLE}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#f0f9ff', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Project Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MOCK_ACTIVITY}>
              <XAxis dataKey="month" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#0d1835', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, color: '#e2e8f0' }} />
              <Bar dataKey="projects" fill="#0ea5e9" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Projects */}
      <div style={STAT_STYLE}>
        <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#f0f9ff', fontSize: '0.9rem', marginBottom: '1.25rem' }}>Recent Projects</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {projects.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#f0f9ff', fontWeight: 500, fontSize: '0.9rem' }}>{p.name}</div>
                <div style={{ color: '#475569', fontSize: '0.78rem' }}>{p.city}, {p.country}</div>
              </div>
              <span style={{ padding: '0.2rem 0.65rem', background: `${STATUS_COLORS[p.status]}18`, color: STATUS_COLORS[p.status], fontSize: '0.72rem', fontWeight: 600, borderRadius: 4, textTransform: 'capitalize' }}>{p.status}</span>
              <div style={{ textAlign: 'right', minWidth: 60 }}>
                <div style={{ color: '#10b981', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.9rem' }}>{p.progress}%</div>
                <div style={{ width: 60, height: 4, background: '#1e293b', borderRadius: 2, marginTop: '0.3rem' }}>
                  <div style={{ width: `${p.progress}%`, height: '100%', background: 'linear-gradient(90deg, #0ea5e9, #10b981)', borderRadius: 2 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning'; if (h < 17) return 'afternoon'; return 'evening';
}

function LoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#475569', fontFamily: "'DM Sans',sans-serif" }}>
      Loading dashboard…
    </div>
  );
}
