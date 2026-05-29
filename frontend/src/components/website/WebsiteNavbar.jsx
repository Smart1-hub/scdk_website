import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useScrolled } from '../../hooks';
import { NAV_LINKS } from '../../data/siteData';

export default function WebsiteNavbar({ onScrollTo }) {
  const scrolled = useScrolled(60);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNav = (section) => { onScrollTo(section); setOpen(false); };

  return (
    <>
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled ? 'rgba(6,9,26,0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition:'all 0.3s',
        padding:'1.1rem 5%',
        display:'flex', alignItems:'center', justifyContent:'space-between',
      }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer' }} onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}>
          <div style={{ width:36, height:36, background:'linear-gradient(135deg,#0ea5e9,#10b981)', clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }} />
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.35rem', color:'#f0f9ff', letterSpacing:'0.06em' }}>SCDK</span>
        </div>

        {/* Desktop nav */}
        <div style={{ display:'flex', alignItems:'center', gap:'2.5rem' }} className="desktop-nav">
          {NAV_LINKS.map(l => (
            <span key={l} onClick={() => handleNav(l)} style={{ cursor:'pointer', fontSize:'0.82rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'#94a3b8', transition:'color 0.2s' }}
              onMouseOver={e => e.target.style.color='#10b981'} onMouseOut={e => e.target.style.color='#94a3b8'}>
              {l}
            </span>
          ))}

          {/* Divider */}
          <div style={{ width:1, height:18, background:'rgba(255,255,255,0.1)' }} />

          {/* Platform login CTA */}
          <Link to="/app/login" style={{
            display:'flex', alignItems:'center', gap:'0.5rem',
            padding:'0.5rem 1.25rem',
            background:'rgba(16,185,129,0.1)',
            border:'1px solid rgba(16,185,129,0.35)',
            color:'#10b981',
            fontFamily:"'Syne',sans-serif",
            fontWeight:700, fontSize:'0.78rem',
            letterSpacing:'0.08em', textTransform:'uppercase',
            borderRadius:4, textDecoration:'none',
            transition:'all 0.2s',
          }}
            onMouseOver={e => { e.currentTarget.style.background='rgba(16,185,129,0.2)'; e.currentTarget.style.borderColor='rgba(16,185,129,0.6)'; }}
            onMouseOut={e => { e.currentTarget.style.background='rgba(16,185,129,0.1)'; e.currentTarget.style.borderColor='rgba(16,185,129,0.35)'; }}>
            <span>⚡</span> Platform Login
          </Link>
        </div>

        {/* Hamburger */}
        <button onClick={() => setOpen(o => !o)} style={{ display:'none', background:'none', border:'none', color:'#e2e8f0', fontSize:'1.5rem', cursor:'pointer' }} id="hamburger">
          {open ? '✕' : '☰'}
        </button>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div style={{ position:'fixed', inset:0, background:'rgba(6,9,26,0.97)', zIndex:99, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2rem' }}>
          <button onClick={() => setOpen(false)} style={{ position:'absolute', top:'1.5rem', right:'5%', background:'none', border:'none', color:'#e2e8f0', fontSize:'1.8rem', cursor:'pointer' }}>✕</button>
          {NAV_LINKS.map(l => (
            <span key={l} onClick={() => handleNav(l)} style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.5rem', fontWeight:700, cursor:'pointer', color:'#e2e8f0' }}>{l}</span>
          ))}
          <Link to="/app/login" onClick={() => setOpen(false)} style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.2rem', fontWeight:700, color:'#10b981', textDecoration:'none', border:'1px solid rgba(16,185,129,0.4)', padding:'0.75rem 2rem', borderRadius:4, marginTop:'0.5rem' }}>
            ⚡ Platform Login
          </Link>
        </div>
      )}

      <style>{`
        @media (max-width:900px) {
          .desktop-nav { display: none !important; }
          #hamburger   { display: block !important; }
        }
      `}</style>
    </>
  );
}
