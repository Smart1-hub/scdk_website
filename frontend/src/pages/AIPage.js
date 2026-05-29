import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AIPage() {
  const { authFetch } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv,    setActiveConv]    = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [input,         setInput]         = useState('');
  const [sending,       setSending]       = useState(false);
  const [projects,      setProjects]      = useState([]);
  const [selectedProj,  setSelectedProj]  = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    authFetch('/api/ai/conversations').then(d => { if (d.success) setConversations(d.data); });
    authFetch('/api/projects?limit=20').then(d => { if (d.success) setProjects(d.data); });
  }, [authFetch]);

  useEffect(() => {
    if (!activeConv) return;
    authFetch(`/api/ai/conversations/${activeConv.id}/messages`).then(d => { if (d.success) setMessages(d.data); });
  }, [activeConv, authFetch]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const newConversation = async () => {
    const d = await authFetch('/api/ai/conversations', {
      method: 'POST',
      body: JSON.stringify({ title: 'New Conversation', projectId: selectedProj || null }),
    });
    if (d.success) {
      setConversations(c => [d.data, ...c]);
      setActiveConv(d.data);
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return;
    const text = input.trim();
    setInput('');
    setSending(true);

    // Optimistic UI
    const tempMsg = { id: 'temp', role: 'user', content: text, created_at: new Date() };
    setMessages(m => [...m, tempMsg]);

    try {
      const d = await authFetch(`/api/ai/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: text, includeProjectContext: !!selectedProj }),
      });
      if (d.success) {
        setMessages(m => [...m.filter(x => x.id !== 'temp'), { role: 'user', content: text, created_at: new Date() }, d.data]);
        setConversations(c => c.map(cv => cv.id === activeConv.id ? { ...cv, updated_at: new Date() } : cv));
      }
    } catch { setMessages(m => m.filter(x => x.id !== 'temp')); }
    finally { setSending(false); }
  };

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const SUGGESTIONS = [
    'Summarize the current status of all active projects',
    'Which sensors have exceeded their thresholds recently?',
    'What are the key risks in the construction phase?',
    'Recommend best practices for smart corridor IoT deployment',
  ];

  return (
    <div style={{ display: 'flex', height: '100%', fontFamily: "'DM Sans',sans-serif", color: '#e2e8f0' }}>
      {/* Sidebar - conversation list */}
      <div style={{ width: 260, background: '#080d22', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#f0f9ff', fontSize: '1rem', marginBottom: '1rem' }}>🤖 AI Assistant</h2>
          <select
            value={selectedProj}
            onChange={e => setSelectedProj(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '0.5rem', borderRadius: 4, fontSize: '0.78rem', marginBottom: '0.75rem', outline: 'none' }}
          >
            <option value="">No project context</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={newConversation}
            style={{ width: '100%', padding: '0.65rem', background: 'linear-gradient(135deg, #0ea5e9, #10b981)', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.08em', border: 'none', borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase' }}>
            + New Chat
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
          {conversations.length === 0 ? (
            <p style={{ color: '#334155', fontSize: '0.8rem', padding: '1rem', textAlign: 'center' }}>No conversations yet</p>
          ) : conversations.map(c => (
            <div key={c.id} onClick={() => setActiveConv(c)}
              style={{ padding: '0.75rem', borderRadius: 6, cursor: 'pointer', background: activeConv?.id === c.id ? 'rgba(16,185,129,0.08)' : 'transparent', border: activeConv?.id === c.id ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent', marginBottom: '0.2rem', transition: 'all 0.2s' }}>
              <div style={{ color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
              <div style={{ color: '#334155', fontSize: '0.72rem', marginTop: '0.2rem' }}>{c.message_count} messages · {new Date(c.updated_at).toLocaleDateString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!activeConv ? (
          // Empty state
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2rem', padding: '2rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🤖</div>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, color: '#f0f9ff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>SCDK AI Assistant</h3>
              <p style={{ color: '#475569', maxWidth: 400, lineHeight: 1.6 }}>Your intelligent platform companion. Ask about projects, sensor data, urban planning best practices, or GIS insights.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', maxWidth: 600, width: '100%' }}>
              {SUGGESTIONS.map((s, i) => (
                <div key={i} onClick={async () => { await newConversation(); setInput(s); }}
                  style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, cursor: 'pointer', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5, transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.color = '#94a3b8'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#64748b'; }}>
                  "{s}"
                </div>
              ))}
            </div>
            <button onClick={newConversation}
              style={{ padding: '0.85rem 2.5rem', background: 'linear-gradient(135deg, #0ea5e9, #10b981)', color: '#fff', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.08em', border: 'none', borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase' }}>
              Start Conversation
            </button>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: '#f0f9ff', fontSize: '0.95rem' }}>{activeConv.title}</div>
                {selectedProj && <div style={{ color: '#10b981', fontSize: '0.75rem' }}>📎 Project context active</div>}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#334155', fontSize: '0.85rem', marginTop: '2rem' }}>Send a message to start the conversation.</div>
              )}
              {messages.map((m, i) => (
                <div key={m.id || i} style={{ display: 'flex', gap: '0.75rem', flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                  {/* Avatar */}
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: m.role === 'user' ? 'linear-gradient(135deg,#0ea5e9,#10b981)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', flexShrink: 0 }}>
                    {m.role === 'user' ? '👤' : '🤖'}
                  </div>
                  {/* Bubble */}
                  <div style={{
                    maxWidth: '70%', padding: '0.85rem 1.1rem', borderRadius: m.role === 'user' ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                    background: m.role === 'user' ? 'rgba(14,165,233,0.15)' : 'rgba(255,255,255,0.04)',
                    border: m.role === 'user' ? '1px solid rgba(14,165,233,0.25)' : '1px solid rgba(255,255,255,0.06)',
                    fontSize: '0.88rem', lineHeight: 1.65, color: '#e2e8f0', whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                    {m.tokens_used && <div style={{ color: '#334155', fontSize: '0.7rem', marginTop: '0.5rem', textAlign: 'right' }}>{m.tokens_used} tokens</div>}
                  </div>
                </div>
              ))}
              {sending && (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>🤖</div>
                  <div style={{ padding: '0.85rem 1.1rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px 12px 12px 12px', color: '#475569', fontSize: '0.85rem' }}>
                    <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '0.75rem' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about your projects, sensors, or urban planning… (Enter to send)"
                rows={2}
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', padding: '0.75rem 1rem', fontFamily: "'DM Sans',sans-serif", fontSize: '0.88rem', borderRadius: 6, outline: 'none', resize: 'none', lineHeight: 1.5 }}
              />
              <button onClick={sendMessage} disabled={sending || !input.trim()}
                style={{ padding: '0 1.25rem', background: sending || !input.trim() ? '#1e293b' : 'linear-gradient(135deg,#0ea5e9,#10b981)', color: '#fff', border: 'none', borderRadius: 6, cursor: sending || !input.trim() ? 'not-allowed' : 'pointer', fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.06em', transition: 'all 0.2s', minWidth: 72 }}>
                {sending ? '…' : '↑ Send'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
