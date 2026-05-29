import { useState } from 'react';
import { Link } from 'react-router-dom';
import WebsiteNavbar from '../components/website/WebsiteNavbar';
import WebsiteFooter from '../components/website/WebsiteFooter';
import AnimSection   from '../components/website/AnimSection';
import { useInView, useCounter } from '../hooks';
import {
  SERVICES, PILLARS, MILESTONES, FRAMEWORK_LAYERS,
  TEAM, PROJECTS, TECHNOLOGIES, HERO_STATS, CONTACT_INFO,
} from '../data/siteData';

/* ── helpers ─────────────────────────────────────────────────────────────── */
function scrollTo(id) {
  const el = document.getElementById(id.toLowerCase()) || document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function StatCounter({ target, suffix, label }) {
  const [ref, inView] = useInView();
  const count = useCounter(target, inView);
  return (
    <div ref={ref} style={{ display:'flex', flexDirection:'column' }}>
      <span style={{ fontFamily:"'Syne',sans-serif", fontSize:'2.8rem', fontWeight:800, background:'linear-gradient(135deg,#0ea5e9,#10b981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 }}>{count}{suffix}</span>
      <span style={{ color:'#64748b', fontSize:'0.78rem', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:'0.3rem' }}>{label}</span>
    </div>
  );
}

/* ── Contact form ────────────────────────────────────────────────────────── */
const INIT = { firstName:'', lastName:'', email:'', organization:'', message:'' };
function ContactForm() {
  const [form,   setForm]   = useState(INIT);
  const [status, setStatus] = useState('idle');
  const change = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const submit = async () => {
    if (!form.email || !form.firstName || !form.message) { alert('Please fill Name, Email and Message.'); return; }
    setStatus('loading');
    try {
      const r = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      setStatus((await r.json()).success ? 'success' : 'error');
      if ((await r.clone().json()).success) setForm(INIT);
    } catch { setStatus('error'); }
  };
  const inputStyle = { background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'#e2e8f0', padding:'0.85rem 1.1rem', borderRadius:4, width:'100%', fontSize:'0.92rem', outline:'none', transition:'border-color 0.2s', fontFamily:'inherit' };
  if (status === 'success') return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem', padding:'3rem 0', textAlign:'center' }}>
      <span style={{ fontSize:'2.5rem' }}>✅</span>
      <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:'#f0f9ff', fontSize:'1.3rem' }}>Message Sent!</h3>
      <p style={{ color:'#64748b' }}>We'll be in touch shortly.</p>
      <button className="btn-outline" onClick={() => setStatus('idle')}>Send Another</button>
    </div>
  );
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <input name="firstName" placeholder="First Name" value={form.firstName} onChange={change} style={inputStyle} onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
        <input name="lastName"  placeholder="Last Name"  value={form.lastName}  onChange={change} style={inputStyle} onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
      </div>
      <input name="email"        type="email" placeholder="Email Address"  value={form.email}        onChange={change} style={inputStyle} onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
      <input name="organization" placeholder="Organization"                value={form.organization} onChange={change} style={inputStyle} onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
      <textarea name="message" placeholder="Tell us about your project…" rows={4} value={form.message} onChange={change} style={{ ...inputStyle, resize:'vertical' }} onFocus={e => e.target.style.borderColor='#10b981'} onBlur={e => e.target.style.borderColor='rgba(255,255,255,0.1)'} />
      {status === 'error' && <p style={{ color:'#ef4444', fontSize:'0.85rem' }}>Something went wrong — please try again.</p>}
      <button className="btn-primary" onClick={submit} disabled={status==='loading'} style={{ alignSelf:'flex-start', marginTop:'0.5rem', opacity: status==='loading' ? 0.6 : 1 }}>
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </button>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────── */
export default function WebsitePage() {
  const G = { maxWidth:1200, margin:'0 auto' };

  return (
    <div style={{ fontFamily:"'DM Sans','Segoe UI',sans-serif", background:'#06091a', color:'#e2e8f0', overflowX:'hidden' }}>
      <WebsiteNavbar onScrollTo={scrollTo} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section id="hero" style={{ minHeight:'100vh', display:'flex', alignItems:'center', position:'relative', overflow:'hidden', padding:'8rem 5% 5rem' }}>
        {[...Array(8)].map((_,i) => <div key={i} style={{ position:'absolute', top:0, height:'100%', width:1, left:`${(i+1)*12.5}%`, background:'rgba(14,165,233,0.06)', pointerEvents:'none' }} />)}
        <div style={{ position:'absolute', top:'20%', right:'8%', width:420, height:420, background:'radial-gradient(circle,rgba(14,165,233,0.1) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:'10%', left:'4%', width:300, height:300, background:'radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />

        <div style={{ ...G, width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'center', position:'relative' }}>
          <AnimSection>
            <span className="section-tag">Smart City Development &amp; Knowledge</span>
            <h1 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2.5rem,6vw,4.5rem)', fontWeight:800, lineHeight:1.05, color:'#f0f9ff', marginBottom:'1.25rem' }}>
              Innovating<br /><span className="gradient-text">Urban</span> Futures
            </h1>
            <p className="section-sub" style={{ marginBottom:'2.5rem' }}>
              We combine GIS intelligence, sustainable architecture, and smart city technology to transform how cities think, move, and live.
            </p>
            <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', marginBottom:'3.5rem' }}>
              <button className="btn-primary" onClick={() => scrollTo('Services')}>Explore Services</button>
              <button className="btn-outline" onClick={() => scrollTo('Projects')}>View Projects</button>
            </div>
            {/* Platform CTA banner */}
            <div style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.25rem', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:6 }}>
              <span style={{ fontSize:'1.5rem' }}>⚡</span>
              <div>
                <div style={{ color:'#f0f9ff', fontWeight:600, fontSize:'0.88rem' }}>Access the Smart City Platform</div>
                <div style={{ color:'#475569', fontSize:'0.78rem' }}>GIS dashboard, IoT monitoring, AI assistant &amp; more</div>
              </div>
              <Link to="/app/login" className="btn-primary" style={{ marginLeft:'auto', padding:'0.5rem 1.25rem', fontSize:'0.75rem', flexShrink:0 }}>Login →</Link>
            </div>
            <div style={{ display:'flex', gap:'3rem', marginTop:'2.5rem', paddingTop:'2.5rem', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              {HERO_STATS.map(s => <StatCounter key={s.label} {...s} />)}
            </div>
          </AnimSection>

          {/* Orbital visual */}
          <AnimSection delay={0.2} style={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
            <div style={{ position:'relative', width:320, height:320 }}>
              {[320,250,180].map((sz,i) => (
                <div key={sz} style={{ position:'absolute', top:'50%', left:'50%', width:sz, height:sz, transform:'translate(-50%,-50%)', borderRadius:'50%', border:`1.5px solid rgba(${['14,165,233','16,185,129','245,158,11'][i]},${0.22+i*0.08})`, animation:`pulseRing ${3+i}s ease-in-out infinite` }} />
              ))}
              <div style={{ position:'absolute', top:'50%', left:'50%', width:120, height:120, transform:'translate(-50%,-50%)', background:'linear-gradient(135deg,#0ea5e9,#10b981)', clipPath:'polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.2rem', animation:'float 4s ease-in-out infinite', boxShadow:'0 0 60px rgba(16,185,129,0.4)' }}>🏙️</div>
              {['🗺️','⚙️','🌿','💻'].map((e,i) => (
                <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:0, height:0, animation:`orbitSpin ${6+i*1.5}s linear infinite`, animationDelay:`${i*-2}s` }}>
                  <div style={{ width:42, height:42, transform:`translateX(${128+i*5}px)`, background:'rgba(6,9,26,0.9)', border:'1.5px solid rgba(14,165,233,0.45)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem' }}>{e}</div>
                </div>
              ))}
            </div>
          </AnimSection>
        </div>
        <style>{`
          @keyframes pulseRing { 0%,100%{transform:translate(-50%,-50%) scale(1);opacity:0.5} 50%{transform:translate(-50%,-50%) scale(1.09);opacity:1} }
          @keyframes float     { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-16px)} }
          @keyframes orbitSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        `}</style>
      </section>

      {/* ── VISION ───────────────────────────────────────────────────────── */}
      <section id="vision" style={{ padding:'6rem 5%', background:'linear-gradient(180deg,#06091a,#080d22)' }}>
        <div style={{ ...G, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem', alignItems:'center' }}>
          <AnimSection>
            <span className="section-tag">Who We Are</span>
            <h2 className="section-title">Vision &amp;<br />Mission</h2>
            <p className="section-sub">Our vision is a world where every city is intelligent, inclusive, and resilient. Our mission: deliver precision-engineered urban solutions through data, design, and deep human understanding.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.25rem', marginTop:'2.5rem' }}>
              {[{icon:'💡',label:'Vision',desc:'Cities that think and adapt in real-time.'},{icon:'🧭',label:'Mission',desc:'Human-centred urban transformation.'}].map(({icon,label,desc}) => (
                <div key={label} className="card-glass" style={{ padding:'1.5rem', borderRadius:4 }}>
                  <div style={{ fontSize:'1.8rem', marginBottom:'0.6rem' }}>{icon}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#f0f9ff', marginBottom:'0.4rem' }}>{label}</div>
                  <div style={{ color:'#64748b', fontSize:'0.88rem', lineHeight:1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </AnimSection>
          <AnimSection delay={0.15}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              {['Smart Infrastructure','Data Analytics','Green Cities','Digital Twins'].map((t,i) => (
                <div key={t} className="card-glass" style={{ padding:'2rem 1.5rem', borderRadius:4, textAlign:'center', borderTop:`2px solid ${['#0ea5e9','#10b981','#f59e0b','#6366f1'][i]}` }}>
                  <div style={{ fontSize:'1.6rem', marginBottom:'0.5rem' }}>{['🏗️','📊','🌱','🔮'][i]}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontSize:'0.85rem', fontWeight:700, color:'#cbd5e1' }}>{t}</div>
                </div>
              ))}
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ── STORY ────────────────────────────────────────────────────────── */}
      <section id="story" style={{ padding:'6rem 5%', background:'#080d22' }}>
        <div style={G}>
          <AnimSection style={{ marginBottom:'4rem' }}><span className="section-tag">Our Story</span><h2 className="section-title">From Vision to<br />Global Impact</h2></AnimSection>
          <div style={{ position:'relative', paddingLeft:'2.5rem' }}>
            <div style={{ position:'absolute', left:6, top:0, bottom:0, width:2, background:'linear-gradient(to bottom,#0ea5e9,#10b981,#f59e0b)' }} />
            {MILESTONES.map((m,i) => (
              <AnimSection key={m.year} delay={i*0.1} style={{ display:'flex', gap:'2rem', alignItems:'flex-start', marginBottom:'2.5rem' }}>
                <div style={{ width:14, height:14, borderRadius:'50%', background:'#10b981', border:'3px solid #080d22', boxShadow:'0 0 12px #10b981', flexShrink:0, marginTop:'0.4rem', position:'relative', zIndex:1 }} />
                <div className="card-glass" style={{ padding:'1.5rem 2rem', borderRadius:4, flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'0.5rem' }}>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', background:'linear-gradient(135deg,#0ea5e9,#10b981)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{m.year}</span>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#f0f9ff', fontSize:'1.05rem' }}>{m.label}</span>
                  </div>
                  <p style={{ color:'#64748b', fontSize:'0.92rem', lineHeight:1.7 }}>{m.desc}</p>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section id="services" style={{ padding:'6rem 5%', background:'linear-gradient(180deg,#080d22,#06091a)' }}>
        <div style={G}>
          <AnimSection style={{ marginBottom:'3.5rem' }}><span className="section-tag">What We Do</span><h2 className="section-title">Core Services</h2><p className="section-sub">End-to-end expertise across every dimension of the modern city.</p></AnimSection>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'1.25rem' }}>
            {SERVICES.map((s,i) => (
              <AnimSection key={s.label} delay={i*0.07}>
                <div className="card-glass" style={{ padding:'2.5rem 1.5rem', borderRadius:4, textAlign:'center', borderTop:`2px solid ${s.color}`, transition:'transform 0.3s', cursor:'default' }}
                  onMouseOver={e => e.currentTarget.style.transform='translateY(-6px) scale(1.03)'}
                  onMouseOut={e => e.currentTarget.style.transform='none'}>
                  <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>{s.icon}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#f0f9ff', fontSize:'0.95rem', marginBottom:'0.5rem' }}>{s.label}</div>
                  <p style={{ color:'#64748b', fontSize:'0.8rem', lineHeight:1.6, marginBottom:'0.75rem' }}>{s.desc}</p>
                  <div style={{ width:28, height:2, background:s.color, margin:'0 auto', borderRadius:1 }} />
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── APPROACH ─────────────────────────────────────────────────────── */}
      <section id="approach" style={{ padding:'6rem 5%', background:'#06091a', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, right:0, width:'60%', height:'100%', background:'radial-gradient(ellipse at right,rgba(16,185,129,0.05) 0%,transparent 60%)', pointerEvents:'none' }} />
        <div style={G}>
          <AnimSection style={{ marginBottom:'3.5rem' }}><span className="section-tag">How We Work</span><h2 className="section-title">Our Approach</h2></AnimSection>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:'2rem', marginBottom:'5rem' }}>
            {PILLARS.map((p,i) => (
              <AnimSection key={p.title} delay={i*0.1}>
                <div className="card-glass" style={{ padding:'2.5rem', borderRadius:4, borderLeft:`3px solid ${p.color}` }}>
                  <span style={{ fontSize:'2.5rem', display:'block', marginBottom:'1.25rem' }}>{p.icon}</span>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.2rem', color:'#f0f9ff', marginBottom:'0.75rem' }}>{p.title}</h3>
                  <p style={{ color:'#64748b', fontSize:'0.9rem', lineHeight:1.7 }}>{p.desc}</p>
                </div>
              </AnimSection>
            ))}
          </div>
          {/* Framework SVG */}
          <AnimSection style={{ textAlign:'center' }}>
            <span className="section-tag" style={{ display:'inline-block' }}>Smart City Framework</span>
            <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:'1.5rem', fontWeight:800, color:'#f0f9ff', marginBottom:'2.5rem' }}>Three Integrated Layers</h3>
            <div style={{ display:'flex', justifyContent:'center' }}>
              <svg width="300" height="300" viewBox="0 0 300 300">
                <defs><radialGradient id="cg" cx="50%" cy="50%"><stop offset="0%" stopColor="#0ea5e9"/><stop offset="100%" stopColor="#10b981"/></radialGradient></defs>
                {FRAMEWORK_LAYERS.map(l => (
                  <g key={l.label}>
                    <circle cx="150" cy="150" r={l.r} fill={`${l.color}15`} stroke={l.color} strokeWidth="1.5" />
                    <text x="150" y={150-l.r+20} textAnchor="middle" fill={l.color} fontSize="13" fontWeight="700" fontFamily="Syne,sans-serif">{l.label}</text>
                  </g>
                ))}
                <circle cx="150" cy="150" r="18" fill="url(#cg)" />
              </svg>
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ── PROJECTS ─────────────────────────────────────────────────────── */}
      <section id="projects" style={{ padding:'6rem 5%', background:'#080d22' }}>
        <div style={G}>
          <AnimSection style={{ marginBottom:'3.5rem' }}><span className="section-tag">Portfolio</span><h2 className="section-title">Key Projects</h2><p className="section-sub">Transformative urban developments that set global benchmarks.</p></AnimSection>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'1.5rem' }}>
            {PROJECTS.map((p,i) => (
              <AnimSection key={p.title} delay={i*0.1}>
                <div className="card-glass" style={{ borderRadius:4, overflow:'hidden', transition:'transform 0.3s' }}
                  onMouseOver={e => e.currentTarget.style.transform='translateY(-6px)'}
                  onMouseOut={e => e.currentTarget.style.transform='none'}>
                  <div style={{ background:`linear-gradient(135deg,${p.color}22,rgba(6,9,26,0.8))`, padding:'3rem 2rem', textAlign:'center', fontSize:'4rem', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>{p.emoji}</div>
                  <div style={{ padding:'1.75rem' }}>
                    <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1rem', flexWrap:'wrap' }}>
                      {p.tags.map(t => <span key={t} style={{ padding:'0.2rem 0.6rem', background:`${p.color}18`, border:`1px solid ${p.color}40`, color:p.color, fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.08em', borderRadius:2 }}>{t}</span>)}
                    </div>
                    <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, color:'#f0f9ff', fontSize:'1.1rem', marginBottom:'0.3rem' }}>{p.title}</h3>
                    <div style={{ color:'#64748b', fontSize:'0.85rem', marginBottom:'1rem' }}>📍 {p.location}</div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:p.color, fontSize:'0.9rem' }}>{p.metric}</div>
                  </div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECHNOLOGY ───────────────────────────────────────────────────── */}
      <section style={{ padding:'5rem 5%', background:'linear-gradient(135deg,#06091a,#0d1835,#06091a)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(rgba(14,165,233,0.07) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />
        <div style={{ ...G, textAlign:'center', position:'relative' }}>
          <AnimSection>
            <span className="section-tag" style={{ display:'inline-block' }}>Technology</span>
            <h2 className="section-title" style={{ textAlign:'center' }}>Powered by Innovation</h2>
            <p className="section-sub" style={{ margin:'1rem auto 3rem', textAlign:'center' }}>Deploying cutting-edge tools to model, predict, and shape the cities of tomorrow.</p>
          </AnimSection>
          <div style={{ display:'flex', justifyContent:'center', gap:'2rem', flexWrap:'wrap' }}>
            {TECHNOLOGIES.map((t,i) => (
              <AnimSection key={t.label} delay={i*0.07}>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem', padding:'1.5rem', minWidth:130 }}>
                  <div style={{ width:64, height:64, background:'rgba(14,165,233,0.1)', border:'1.5px solid rgba(14,165,233,0.3)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.8rem', boxShadow:'0 0 20px rgba(14,165,233,0.12)' }}>{t.icon}</div>
                  <span style={{ color:'#94a3b8', fontSize:'0.82rem', fontWeight:600, textAlign:'center' }}>{t.label}</span>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────────────────────── */}
      <section id="team" style={{ padding:'6rem 5%', background:'#06091a' }}>
        <div style={G}>
          <AnimSection style={{ marginBottom:'3.5rem' }}><span className="section-tag">Our People</span><h2 className="section-title">Team &amp;<br />Expertise</h2></AnimSection>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))', gap:'1.5rem' }}>
            {TEAM.map((member,i) => (
              <AnimSection key={member.name} delay={i*0.07}>
                <div className="card-glass" style={{ padding:'2rem 1.25rem', borderRadius:4, textAlign:'center', transition:'transform 0.3s', cursor:'default' }}
                  onMouseOver={e => e.currentTarget.style.transform='translateY(-5px)'}
                  onMouseOut={e => e.currentTarget.style.transform='none'}>
                  <div style={{ width:72, height:72, borderRadius:'50%', background:`linear-gradient(135deg,${member.color},#06091a)`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.1rem', color:'#f0f9ff', margin:'0 auto 1rem', border:'2px solid rgba(255,255,255,0.08)', transition:'transform 0.3s' }}>{member.initial}</div>
                  <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, color:'#f0f9ff', fontSize:'0.9rem', marginBottom:'0.3rem' }}>{member.name}</div>
                  <div style={{ color:'#64748b', fontSize:'0.78rem' }}>{member.role}</div>
                </div>
              </AnimSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM CTA BAND ────────────────────────────────────────────── */}
      <section style={{ padding:'4rem 5%', background:'linear-gradient(135deg,#0a1428,#0d1f40)', borderTop:'1px solid rgba(14,165,233,0.12)', borderBottom:'1px solid rgba(14,165,233,0.12)' }}>
        <div style={{ ...G, display:'flex', alignItems:'center', justifyContent:'space-between', gap:'2rem', flexWrap:'wrap' }}>
          <div>
            <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:'1.5rem', color:'#f0f9ff', marginBottom:'0.5rem' }}>
              Ready to manage your smart city projects?
            </div>
            <p style={{ color:'#475569', fontSize:'0.92rem' }}>Access the full platform — GIS maps, IoT monitoring, AI assistant, digital twin and more.</p>
          </div>
          <div style={{ display:'flex', gap:'1rem', flexShrink:0, flexWrap:'wrap' }}>
            <Link to="/app/login" className="btn-primary" style={{ fontSize:'0.88rem', padding:'0.9rem 2rem' }}>⚡ Login to Platform</Link>
            <button className="btn-outline" onClick={() => scrollTo('Contact')} style={{ fontSize:'0.88rem', padding:'0.9rem 2rem' }}>Request a Demo</button>
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────────── */}
      <section id="contact" style={{ padding:'6rem 5%', background:'#080d22' }}>
        <div style={{ ...G, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4rem' }}>
          <AnimSection>
            <span className="section-tag">Get In Touch</span>
            <h2 className="section-title">Let's Build<br />Together</h2>
            <p className="section-sub">Whether you're a city planner, investor, or strategic partner — we'd love to hear from you.</p>
            <ul style={{ listStyle:'none', marginTop:'2.5rem', display:'flex', flexDirection:'column', gap:'1.25rem' }}>
              {CONTACT_INFO.map(({ icon, label, val }) => (
                <li key={label} style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                  <div style={{ width:44, height:44, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', flexShrink:0 }}>{icon}</div>
                  <div>
                    <span style={{ display:'block', color:'#475569', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.1em' }}>{label}</span>
                    <span style={{ display:'block', color:'#cbd5e1', fontSize:'0.95rem' }}>{val}</span>
                  </div>
                </li>
              ))}
            </ul>
          </AnimSection>
          <AnimSection delay={0.15}>
            <div className="card-glass" style={{ padding:'2.5rem', borderRadius:4 }}>
              <ContactForm />
            </div>
          </AnimSection>
        </div>
      </section>

      {/* ── FUTURE TAGLINE ───────────────────────────────────────────────── */}
      <section style={{ padding:'8rem 5%', background:'#06091a', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:600, background:'radial-gradient(circle,rgba(14,165,233,0.07) 0%,transparent 65%)', borderRadius:'50%', pointerEvents:'none' }} />
        <AnimSection>
          <span className="section-tag" style={{ display:'inline-block' }}>The Road Ahead</span>
          <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:'clamp(2.2rem,5vw,4rem)', fontWeight:800, color:'#f0f9ff', lineHeight:1.1, marginBottom:'1.25rem' }}>
            Smart Cities.<br /><span className="gradient-text">Smarter Living.</span>
          </h2>
          <p style={{ color:'#64748b', maxWidth:480, margin:'0 auto 3rem', lineHeight:1.7 }}>Join us in building the infrastructure of tomorrow. Every project is a step toward cities that work for everyone.</p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn-primary" style={{ fontSize:'0.95rem', padding:'1rem 3rem' }} onClick={() => scrollTo('Contact')}>Start a Conversation</button>
            <Link to="/app/login" className="btn-outline" style={{ fontSize:'0.95rem', padding:'1rem 3rem' }}>Access Platform</Link>
          </div>
        </AnimSection>
      </section>

      <WebsiteFooter onScrollTo={scrollTo} />
    </div>
  );
}
