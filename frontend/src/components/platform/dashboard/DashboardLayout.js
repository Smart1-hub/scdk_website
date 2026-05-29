import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const NAV = [
  { to: '/app',          icon: '📊', label: 'Overview',      roles: ['admin','manager','viewer'] },
  { to: '/app/projects', icon: '🗂️', label: 'Projects',      roles: ['admin','manager','viewer'] },
  { to: '/app/gis',      icon: '🗺️', label: 'GIS Map',       roles: ['admin','manager','viewer'] },
  { to: '/app/iot',      icon: '📡', label: 'IoT Sensors',   roles: ['admin','manager','viewer'] },
  { to: '/app/twin',     icon: '🔮', label: 'Digital Twin',  roles: ['admin','manager'] },
  { to: '/app/ai',       icon: '🤖', label: 'AI Assistant',  roles: ['admin','manager','viewer'] },
  { to: '/app/admin',    icon: '⚙️', label: 'Admin Panel',   roles: ['admin'] },
];

const ROLE_COLORS = { admin: '#ef4444', manager: '#f59e0b', viewer: '#10b981' };

export default function DashboardLayout() {
  const { user, logout, canAccess } = useAuth();
  const navigate  = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/app/login'); };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#06091a', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
        .nav-link { display: flex; align-items: center; gap: 0.75rem; padding: 0.65rem 1rem; border-radius: 6px; color: #475569; font-size: 0.88rem; font-weight: 500; text-decoration: none; transition: all 0.2s; cursor: pointer; white-space: nowrap; }
        .nav-link:hover { background: rgba(255,255,255,0.04); color: #94a3b8; }
        .nav-link.active { background: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.2); }
      `}</style>

      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 64 : 240,
        background: '#080d22',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        flexShrink: 0, overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{ padding: '1.25rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', minHeight: 64 }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #0ea5e9, #10b981)', clipPath: 'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', flexShrink: 0 }} />
          {!collapsed && <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#f0f9ff', fontSize: '1.15rem' }}>SCDK</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }}>
          {NAV.filter(n => canAccess(n.roles)).map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/app'} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{n.icon}</span>
              {!collapsed && n.label}
            </NavLink>
          ))}
        </nav>

        {/* User + collapse */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0.75rem 0.5rem' }}>
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${ROLE_COLORS[user?.role] || '#10b981'}, #06091a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.firstName} {user?.lastName}</div>
                <div style={{ color: ROLE_COLORS[user?.role], fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{user?.role}</div>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)} style={{ width: '100%', padding: '0.5rem', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '1rem', borderRadius: '4px', transition: 'color 0.2s' }}
            onMouseOver={e => e.target.style.color = '#94a3b8'} onMouseOut={e => e.target.style.color = '#475569'}>
            {collapsed ? '→' : '←'}
          </button>
          <button onClick={handleLogout} className="nav-link" style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', justifyContent: collapsed ? 'center' : 'flex-start' }}>
            <span>🚪</span>{!collapsed && 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </div>
  );
}
