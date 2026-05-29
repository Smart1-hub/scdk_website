import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form,  setForm]  = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) navigate('/app');
    else setError(result.message);
  };

  return (
    <div style={{ minHeight:'100vh', background:'#06091a', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Sans',sans-serif", padding:'1.5rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        input{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:#e2e8f0;padding:0.85rem 1.1rem;font-family:'DM Sans',sans-serif;font-size:0.95rem;outline:none;width:100%;transition:border-color 0.2s;border-radius:4px;}
        input:focus{border-color:#10b981;}
        input::placeholder{color:#475569;}
      `}</style>

      {/* Grid bg */}
      <div style={{ position:'fixed', inset:0, backgroundImage:'radial-gradient(rgba(14,165,233,0.06) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />
      <div style={{ position:'fixed', top:'30%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:600, background:'radial-gradient(circle,rgba(14,165,233,0.08) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

      <div style={{ position:'relative', width:'100%', maxWidth:420 }}>

        {/* Back to website */}
        <Link to="/" style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', color:'#475569', fontSize:'0.82rem', textDecoration:'none', marginBottom:'2rem', transition:'color 0.2s' }}
          onMouseOver={e => e.currentTarget.style.color='#10b981'}
          onMouseOut={e => e.currentTarget.style.color='#475569'}>
          ← Back to website
        </Link>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <Link to="/" style={{ textDecoration:'none' }}>
            <div style={{ width:52, height:52, background:'linear-gradient(135deg,#0ea5e9,#10b981)', clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', margin:'0 auto 1rem' }} />
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.8rem', color:'#f0f9ff', letterSpacing:'0.05em' }}>SCDK</h1>
          </Link>
          <p style={{ color:'#475569', fontSize:'0.85rem', marginTop:'0.3rem' }}>Smart City Platform</p>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', backdropFilter:'blur(16px)', borderRadius:8, padding:'2.5rem' }}>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#f0f9ff', fontSize:'1.25rem', marginBottom:'0.4rem' }}>Welcome back</h2>
          <p style={{ color:'#475569', fontSize:'0.85rem', marginBottom:'2rem' }}>Sign in to access your platform</p>

          {error && (
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5', padding:'0.75rem 1rem', borderRadius:4, fontSize:'0.85rem', marginBottom:'1.25rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={{ display:'block', color:'#94a3b8', fontSize:'0.78rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'0.4rem' }}>Email</label>
              <input type="email" placeholder="you@scdk.io" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label style={{ display:'block', color:'#94a3b8', fontSize:'0.78rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'0.4rem' }}>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <button type="submit" disabled={loading} style={{ marginTop:'0.5rem', padding:'0.9rem', background: loading ? '#1e293b' : 'linear-gradient(135deg,#0ea5e9,#10b981)', color:'#fff', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:'0.88rem', letterSpacing:'0.08em', textTransform:'uppercase', border:'none', borderRadius:4, cursor: loading ? 'not-allowed' : 'pointer', transition:'opacity 0.2s' }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop:'1.5rem', fontSize:'0.8rem', color:'#334155', textAlign:'center' }}>
            Demo: <span style={{ color:'#10b981' }}>admin@scdk.io</span> / <span style={{ color:'#10b981' }}>Password123!</span>
          </p>
        </div>

        <p style={{ marginTop:'1.5rem', textAlign:'center', color:'#334155', fontSize:'0.8rem' }}>
          Don't have access?{' '}
          <Link to="/#contact" style={{ color:'#10b981', textDecoration:'none' }}
            onMouseOver={e => e.target.style.textDecoration='underline'}
            onMouseOut={e => e.target.style.textDecoration='none'}>
            Contact us →
          </Link>
        </p>
      </div>
    </div>
  );
}
