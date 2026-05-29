import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS  = { admin:'#ef4444', manager:'#f59e0b', viewer:'#10b981' };
const STATUS_COLORS = { active:'#10b981', inactive:'#475569', suspended:'#ef4444' };

export default function AdminPage() {
  const { authFetch } = useAuth();
  const [users,   setUsers]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email:'', password:'', firstName:'', lastName:'', role:'viewer', department:'' });
  const [formErr, setFormErr] = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    Promise.all([authFetch('/api/admin/users'), authFetch('/api/admin/stats')])
      .then(([u, s]) => {
        if (u.success) setUsers(u.data);
        if (s.success) setStats(s.data);
        setLoading(false);
      });
  }, [authFetch]);

  const createUser = async () => {
    if (!form.email || !form.password || !form.firstName || !form.lastName) { setFormErr('All fields marked are required.'); return; }
    setSaving(true); setFormErr('');
    const d = await authFetch('/api/admin/users', { method: 'POST', body: JSON.stringify(form) });
    if (d.success) { setUsers(u => [d.data, ...u]); setShowForm(false); setForm({ email:'', password:'', firstName:'', lastName:'', role:'viewer', department:'' }); }
    else setFormErr(d.message);
    setSaving(false);
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const d = await authFetch(`/api/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify({ status: newStatus }) });
    if (d.success) setUsers(us => us.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
  };

  const changeRole = async (userId, role) => {
    const d = await authFetch(`/api/admin/users/${userId}`, { method: 'PATCH', body: JSON.stringify({ role }) });
    if (d.success) setUsers(us => us.map(u => u.id === userId ? { ...u, role } : u));
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '1.5rem', color: '#e2e8f0', fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap'); select,input{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;padding:0.65rem 0.85rem;border-radius:4px;font-family:'DM Sans',sans-serif;font-size:0.88rem;outline:none;width:100%;} select option{background:#0d1835;}`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#f0f9ff' }}>⚙️ Admin Panel</h1>
          <p style={{ color: '#475569', fontSize: '0.85rem', marginTop: '0.2rem' }}>User management and platform settings</p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ padding: '0.6rem 1.25rem', background: 'linear-gradient(135deg,#0ea5e9,#10b981)', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.06em', border: 'none', borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase' }}>
          {showForm ? '✕ Cancel' : '+ Add User'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Users',    value: stats.users.total,    color: '#0ea5e9' },
            { label: 'Active Users',   value: stats.users.active,   color: '#10b981' },
            { label: 'Total Projects', value: stats.projects.total, color: '#6366f1' },
            { label: 'Online Sensors', value: stats.sensors.online, color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderTop: `2px solid ${s.color}`, borderRadius: 8, padding: '1rem' }}>
              <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: '2rem', color: s.color, lineHeight: 1, marginTop: '0.4rem' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* New user form */}
      {showForm && (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#f0f9ff', fontSize: '0.95rem', marginBottom: '1.25rem' }}>Create New User</h3>
          {formErr && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '0.65rem 1rem', borderRadius: 4, fontSize: '0.82rem', marginBottom: '1rem' }}>{formErr}</div>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.35rem' }}>First Name *</label><input value={form.firstName} onChange={e => setForm(f => ({...f, firstName: e.target.value}))} placeholder="Ada" /></div>
            <div><label style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.35rem' }}>Last Name *</label><input value={form.lastName} onChange={e => setForm(f => ({...f, lastName: e.target.value}))} placeholder="Lovelace" /></div>
            <div><label style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.35rem' }}>Email *</label><input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="ada@scdk.io" /></div>
            <div><label style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.35rem' }}>Password *</label><input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" /></div>
            <div>
              <label style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.35rem' }}>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                <option value="viewer">Viewer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div><label style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.35rem' }}>Department</label><input value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} placeholder="Engineering" /></div>
          </div>
          <button onClick={createUser} disabled={saving}
            style={{ marginTop: '1.25rem', padding: '0.7rem 2rem', background: saving ? '#1e293b' : 'linear-gradient(135deg,#0ea5e9,#10b981)', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.82rem', border: 'none', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      )}

      {/* Users table */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#f0f9ff', fontSize: '0.9rem' }}>Platform Users</h3>
        </div>
        {loading ? <p style={{ padding: '1.5rem', color: '#475569' }}>Loading…</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['User','Email','Role','Status','Department','Last Login','Actions'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg,${ROLE_COLORS[u.role]},#06091a)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {u.first_name?.[0]}{u.last_name?.[0]}
                        </div>
                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{u.first_name} {u.last_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#64748b' }}>{u.email}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                        style={{ background: `${ROLE_COLORS[u.role]}18`, border: `1px solid ${ROLE_COLORS[u.role]}40`, color: ROLE_COLORS[u.role], padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', width: 'auto' }}>
                        <option value="viewer">Viewer</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLORS[u.status] }} />
                        <span style={{ color: STATUS_COLORS[u.status], textTransform: 'capitalize', fontSize: '0.78rem' }}>{u.status}</span>
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: '#475569' }}>{u.department || '—'}</td>
                    <td style={{ padding: '0.85rem 1rem', color: '#334155', whiteSpace: 'nowrap' }}>{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <button onClick={() => toggleStatus(u)}
                        style={{ padding: '0.25rem 0.6rem', background: 'transparent', border: `1px solid ${u.status === 'active' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, color: u.status === 'active' ? '#ef4444' : '#10b981', borderRadius: 4, cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }}>
                        {u.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
