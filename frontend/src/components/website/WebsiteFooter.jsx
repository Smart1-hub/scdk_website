import { Link } from 'react-router-dom';
import { NAV_LINKS } from '../../data/siteData';

export default function WebsiteFooter({ onScrollTo }) {
  return (
    <footer style={{ padding:'3rem 5%', background:'#04060f', borderTop:'1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1.5rem' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', cursor:'pointer' }} onClick={() => window.scrollTo({ top:0, behavior:'smooth' })}>
          <div style={{ width:28, height:28, background:'linear-gradient(135deg,#0ea5e9,#10b981)', clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)' }} />
          <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:'#f0f9ff', fontSize:'1.1rem' }}>SCDK</span>
        </div>

        {/* Nav links */}
        <div style={{ display:'flex', gap:'2rem', flexWrap:'wrap' }}>
          {NAV_LINKS.map(l => (
            <span key={l} onClick={() => onScrollTo(l)} style={{ cursor:'pointer', fontSize:'0.78rem', fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color:'#475569', transition:'color 0.2s' }}
              onMouseOver={e => e.target.style.color='#10b981'} onMouseOut={e => e.target.style.color='#475569'}>
              {l}
            </span>
          ))}
        </div>

        {/* Platform link + copyright */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'0.5rem' }}>
          <Link to="/app/login" style={{ color:'#10b981', fontSize:'0.78rem', fontWeight:600, textDecoration:'none', letterSpacing:'0.06em' }}>
            ⚡ Platform Login →
          </Link>
          <p style={{ color:'#1e293b', fontSize:'0.78rem' }}>© {new Date().getFullYear()} SCDK. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
