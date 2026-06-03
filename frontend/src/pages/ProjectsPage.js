import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const STATUS_COLS   = ['todo','in_progress','review','done'];
const STATUS_LABELS = { todo:'To Do', in_progress:'In Progress', review:'Review', done:'Done' };
const STATUS_COLORS = { todo:'#475569', in_progress:'#0ea5e9', review:'#f59e0b', done:'#10b981' };
const PRIORITY_COLORS = { low:'#64748b', medium:'#0ea5e9', high:'#f59e0b', critical:'#ef4444' };
const PROJECT_STATUS_COLORS = { active:'#10b981', planning:'#0ea5e9', completed:'#6366f1', on_hold:'#f59e0b', cancelled:'#ef4444' };

const INIT_FORM = { name:'', code:'', description:'', country:'', city:'', lat:'', lng:'', startDate:'', endDate:'', budget:'', tags:'' };

export default function ProjectsPage() {
  const { authFetch, canAccess } = useAuth();
  const [projects,  setProjects]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [tasks,     setTasks]     = useState({});
  const [view,      setView]      = useState('list');
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [form,      setForm]      = useState(INIT_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formErr,   setFormErr]   = useState('');

  useEffect(() => {
    authFetch('/api/projects').then(d => {
      if (d.success) setProjects(d.data);
      setLoading(false);
    });
  }, [authFetch]);

  const loadTasks = async (projectId) => {
    const d = await authFetch(`/api/projects/${projectId}/tasks`);
    if (d.success) setTasks(d.kanban);
  };

  const selectProject = (p) => { setSelected(p); loadTasks(p.id); setView('kanban'); };

  const moveTask = async (taskId, newStatus) => {
    const allTasks = Object.values(tasks).flat();
    const task = allTasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    setTasks(prev => {
      const next = { ...prev };
      next[task.status] = prev[task.status].filter(t => t.id !== taskId);
      next[newStatus]   = [...(prev[newStatus] || []), { ...task, status: newStatus }];
      return next;
    });
    await authFetch(`/api/tasks/${taskId}`, { method:'PATCH', body:JSON.stringify({ status: newStatus }) });
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name || !form.code) { setFormErr('Project name and code are required.'); return; }
    setSaving(true); setFormErr('');
    try {
      const payload = {
        name:        form.name,
        code:        form.code.toUpperCase(),
        description: form.description,
        country:     form.country,
        city:        form.city,
        lat:         form.lat   ? parseFloat(form.lat)    : null,
        lng:         form.lng   ? parseFloat(form.lng)    : null,
        startDate:   form.startDate  || null,
        endDate:     form.endDate    || null,
        budget:      form.budget     ? parseFloat(form.budget) : null,
        tags:        form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      };
      const d = await authFetch('/api/projects', { method:'POST', body:JSON.stringify(payload) });
      if (d.success) {
        setProjects(p => [d.data, ...p]);
        setShowForm(false);
        setForm(INIT_FORM);
      } else {
        setFormErr(d.message || 'Failed to create project.');
      }
    } catch (err) {
      setFormErr('Failed to create project. Please try again.');
    }
    setSaving(false);
  };

  const inputStyle = {
    background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)',
    color:'#e2e8f0', padding:'0.7rem 0.9rem', borderRadius:4, width:'100%',
    fontSize:'0.88rem', outline:'none', fontFamily:'inherit',
    transition:'border-color 0.2s',
  };
  const labelStyle = { display:'block', color:'#64748b', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.35rem' };

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', fontFamily:"'DM Sans',sans-serif", color:'#e2e8f0' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap'); input:focus,textarea:focus,select:focus{border-color:#10b981!important;}`}</style>

      {/* Header */}
      <div style={{ padding:'1.5rem 1.5rem 0', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <div>
          <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:'#f0f9ff' }}>🗂️ Projects</h1>
          <p style={{ color:'#475569', fontSize:'0.85rem', marginTop:'0.2rem' }}>{projects.length} projects across {[...new Set(projects.map(p=>p.country).filter(Boolean))].length} countries</p>
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {['list','kanban'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ padding:'0.5rem 1rem', background: view===v ? 'rgba(16,185,129,0.12)' : 'transparent', border: view===v ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)', color: view===v ? '#10b981' : '#475569', borderRadius:4, cursor:'pointer', fontSize:'0.8rem', fontWeight:600, textTransform:'capitalize', transition:'all 0.2s' }}>
              {v === 'list' ? '☰ List' : '⊞ Kanban'}
            </button>
          ))}
          {canAccess(['admin','manager']) && (
            <button onClick={() => { setShowForm(s => !s); setFormErr(''); }}
              style={{ padding:'0.5rem 1rem', background: showForm ? 'transparent' : 'linear-gradient(135deg,#0ea5e9,#10b981)', color: showForm ? '#ef4444' : '#fff', border: showForm ? '1px solid rgba(239,68,68,0.4)' : 'none', borderRadius:4, cursor:'pointer', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.78rem', letterSpacing:'0.06em', textTransform:'uppercase' }}>
              {showForm ? '✕ Cancel' : '+ New Project'}
            </button>
          )}
        </div>
      </div>

      {/* New Project Form */}
      {showForm && (
        <div style={{ margin:'0 1.5rem 1.5rem', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'1.75rem' }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#f0f9ff', fontSize:'0.95rem', marginBottom:'1.25rem' }}>Create New Project</h3>
          {formErr && (
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5', padding:'0.65rem 1rem', borderRadius:4, fontSize:'0.82rem', marginBottom:'1rem' }}>
              {formErr}
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'1rem' }}>
            <div>
              <label style={labelStyle}>Project Name *</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Accra Smart Grid" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Project Code *</label>
              <input name="code" value={form.code} onChange={handleChange} placeholder="SCDK-GHA-002" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Country</label>
              <input name="country" value={form.country} onChange={handleChange} placeholder="Ghana" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Accra" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input name="endDate" type="date" value={form.endDate} onChange={handleChange} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Budget (USD)</label>
              <input name="budget" type="number" value={form.budget} onChange={handleChange} placeholder="5000000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Tags (comma separated)</label>
              <input name="tags" value={form.tags} onChange={handleChange} placeholder="GIS, IoT, Urban Planning" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Latitude</label>
              <input name="lat" type="number" value={form.lat} onChange={handleChange} placeholder="5.6037" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Longitude</label>
              <input name="lng" type="number" value={form.lng} onChange={handleChange} placeholder="-0.1870" style={inputStyle} />
            </div>
          </div>
          <div style={{ marginTop:'1rem' }}>
            <label style={labelStyle}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Describe the project scope and objectives..." rows={3}
              style={{ ...inputStyle, resize:'vertical' }} />
          </div>
          <div style={{ display:'flex', gap:'1rem', marginTop:'1.25rem' }}>
            <button onClick={handleSubmit} disabled={saving}
              style={{ padding:'0.75rem 2rem', background: saving ? '#1e293b' : 'linear-gradient(135deg,#0ea5e9,#10b981)', color:'#fff', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.82rem', border:'none', borderRadius:4, cursor: saving ? 'not-allowed' : 'pointer', letterSpacing:'0.06em', textTransform:'uppercase', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating…' : 'Create Project'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(INIT_FORM); setFormErr(''); }}
              style={{ padding:'0.75rem 1.5rem', background:'transparent', color:'#475569', border:'1px solid rgba(255,255,255,0.08)', borderRadius:4, cursor:'pointer', fontSize:'0.82rem' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div style={{ flex:1, overflowY:'auto', padding:'0 1.5rem 1.5rem' }}>
          {loading ? <p style={{ color:'#475569' }}>Loading…</p> : projects.length === 0 ? (
            <div style={{ textAlign:'center', padding:'4rem', color:'#334155' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🗂️</div>
              <p>No projects yet. Click <strong style={{ color:'#10b981' }}>+ New Project</strong> to create one.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1rem' }}>
              {projects.map(p => (
                <div key={p.id} onClick={() => selectProject(p)}
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:8, padding:'1.5rem', cursor:'pointer', transition:'all 0.2s', borderTop:`2px solid ${PROJECT_STATUS_COLORS[p.status] || '#475569'}` }}
                  onMouseOver={e => { e.currentTarget.style.borderColor='rgba(16,185,129,0.3)'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.06)'; e.currentTarget.style.background='rgba(255,255,255,0.03)'; }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                    <span style={{ color:'#475569', fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.1em' }}>{p.code}</span>
                    <span style={{ padding:'0.2rem 0.6rem', background:`${PROJECT_STATUS_COLORS[p.status]}18`, color:PROJECT_STATUS_COLORS[p.status], fontSize:'0.7rem', fontWeight:600, borderRadius:4, textTransform:'capitalize' }}>{p.status}</span>
                  </div>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#f0f9ff', fontSize:'0.95rem', marginBottom:'0.3rem' }}>{p.name}</h3>
                  <p style={{ color:'#475569', fontSize:'0.78rem', marginBottom:'0.75rem' }}>📍 {p.city}{p.city && p.country ? ', ' : ''}{p.country}</p>
                  {p.description && <p style={{ color:'#64748b', fontSize:'0.8rem', lineHeight:1.6, marginBottom:'1rem', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.description}</p>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                    <span style={{ color:'#475569', fontSize:'0.75rem' }}>Progress</span>
                    <span style={{ color:'#10b981', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.85rem' }}>{p.progress}%</span>
                  </div>
                  <div style={{ height:4, background:'#1e293b', borderRadius:2 }}>
                    <div style={{ width:`${p.progress}%`, height:'100%', background:'linear-gradient(90deg,#0ea5e9,#10b981)', borderRadius:2 }} />
                  </div>
                  <div style={{ display:'flex', gap:'1rem', marginTop:'1rem' }}>
                    {p.member_count !== undefined && <span style={{ color:'#475569', fontSize:'0.75rem' }}>👥 {p.member_count}</span>}
                    {p.task_count   !== undefined && <span style={{ color:'#475569', fontSize:'0.75rem' }}>✅ {p.tasks_done}/{p.task_count}</span>}
                    {p.budget && <span style={{ color:'#475569', fontSize:'0.75rem' }}>💰 ${(p.budget/1e6).toFixed(1)}M</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Kanban view */}
      {view === 'kanban' && (
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {!selected ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#334155', fontSize:'0.9rem', flexDirection:'column', gap:'0.5rem' }}>
              <span style={{ fontSize:'2rem' }}>⊞</span>
              Select a project from the list to view its Kanban board
              <button onClick={() => setView('list')} style={{ marginTop:'0.5rem', padding:'0.5rem 1.25rem', background:'none', border:'1px solid rgba(255,255,255,0.1)', color:'#64748b', borderRadius:4, cursor:'pointer', fontSize:'0.82rem' }}>
                Switch to List
              </button>
            </div>
          ) : (
            <>
              <div style={{ padding:'0 1.5rem 1rem', display:'flex', alignItems:'center', gap:'1rem' }}>
                <button onClick={() => { setView('list'); setSelected(null); }} style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', fontSize:'1.2rem' }}>←</button>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#f0f9ff', fontSize:'1rem' }}>{selected.name}</div>
                  <div style={{ color:'#475569', fontSize:'0.78rem' }}>{selected.city}{selected.city && selected.country ? ', ' : ''}{selected.country}</div>
                </div>
              </div>
              <div style={{ flex:1, display:'flex', gap:'1rem', padding:'0 1.5rem 1.5rem', overflowX:'auto' }}>
                {STATUS_COLS.map(col => (
                  <div key={col} style={{ minWidth:260, flex:'0 0 260px', display:'flex', flexDirection:'column' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:STATUS_COLORS[col] }} />
                      <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#94a3b8', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.08em' }}>{STATUS_LABELS[col]}</span>
                      <span style={{ marginLeft:'auto', color:'#334155', fontSize:'0.75rem' }}>{(tasks[col] || []).length}</span>
                    </div>
                    <div style={{ flex:1, background:'rgba(255,255,255,0.02)', borderRadius:8, padding:'0.5rem', minHeight:200, overflowY:'auto' }}>
                      {(tasks[col] || []).map(t => (
                        <div key={t.id} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:6, padding:'0.85rem', marginBottom:'0.5rem' }}>
                          <div style={{ color:'#e2e8f0', fontSize:'0.82rem', fontWeight:500, marginBottom:'0.5rem', lineHeight:1.4 }}>{t.title}</div>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ padding:'0.15rem 0.5rem', background:`${PRIORITY_COLORS[t.priority]}18`, color:PRIORITY_COLORS[t.priority], fontSize:'0.65rem', fontWeight:600, borderRadius:3, textTransform:'capitalize' }}>{t.priority}</span>
                            {t.assignee_name && <span style={{ color:'#334155', fontSize:'0.7rem' }}>👤 {t.assignee_name.split(' ')[0]}</span>}
                          </div>
                          {t.due_date && <div style={{ color:'#334155', fontSize:'0.7rem', marginTop:'0.4rem' }}>📅 {new Date(t.due_date).toLocaleDateString()}</div>}
                          <div style={{ display:'flex', gap:'0.25rem', marginTop:'0.6rem', flexWrap:'wrap' }}>
                            {STATUS_COLS.filter(s => s !== col).map(s => (
                              <button key={s} onClick={() => moveTask(t.id, s)}
                                style={{ padding:'0.15rem 0.4rem', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'#475569', borderRadius:3, cursor:'pointer', fontSize:'0.65rem', transition:'all 0.15s' }}
                                onMouseOver={e => { e.target.style.color=STATUS_COLORS[s]; e.target.style.borderColor=STATUS_COLORS[s]; }}
                                onMouseOut={e => { e.target.style.color='#475569'; e.target.style.borderColor='rgba(255,255,255,0.08)'; }}>
                                → {STATUS_LABELS[s]}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      {(tasks[col] || []).length === 0 && (
                        <div style={{ color:'#1e293b', fontSize:'0.78rem', textAlign:'center', padding:'1.5rem 0' }}>No tasks</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}