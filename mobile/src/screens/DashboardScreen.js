import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { getProjects, getSensors, getConversations, createConversation, getMessages, sendMessage } from '../services/api';

const C = { bg: '#06091a', bg2: '#080d22', blue: '#0ea5e9', green: '#10b981', amber: '#f59e0b', text: '#e2e8f0', muted: '#475569', border: 'rgba(255,255,255,0.06)' };

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export function DashboardScreen() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  useEffect(() => { getProjects().then(d => { if (d.success) setProjects(d.data); setLoading(false); }); }, []);
  const active = projects.filter(p => p.status === 'active').length;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={ds.heading}>SCDK Platform</Text>
      <Text style={ds.sub}>Smart City Dashboard</Text>
      <View style={ds.row}>
        {[{l:'Projects', v:projects.length, c:C.blue}, {l:'Active', v:active, c:C.green}, {l:'Countries', v:[...new Set(projects.map(p=>p.country))].length, c:C.amber}].map(s=>(
          <View key={s.l} style={[ds.stat, {borderTopColor: s.c}]}>
            <Text style={[ds.statNum, {color:s.c}]}>{s.v}</Text>
            <Text style={ds.statLabel}>{s.l}</Text>
          </View>
        ))}
      </View>
      <Text style={ds.sectionTitle}>Recent Projects</Text>
      {loading ? <ActivityIndicator color={C.green} /> : projects.slice(0,3).map(p=>(
        <View key={p.id} style={ds.card}>
          <View style={ds.cardRow}><Text style={ds.cardTitle}>{p.name}</Text><Text style={[ds.badge,{color:C.green,borderColor:C.green+'40',backgroundColor:C.green+'15'}]}>{p.status}</Text></View>
          <Text style={ds.cardSub}>📍 {p.city}, {p.country}</Text>
          <View style={ds.progressBg}><View style={[ds.progressFill,{width:`${p.progress}%`}]} /></View>
          <Text style={ds.progressLabel}>{p.progress}% complete</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const ds = StyleSheet.create({
  heading: { color:'#f0f9ff', fontSize:24, fontWeight:'800', marginBottom:4 },
  sub: { color:C.muted, fontSize:13, marginBottom:24 },
  row: { flexDirection:'row', gap:10, marginBottom:24 },
  stat: { flex:1, backgroundColor:'rgba(255,255,255,0.04)', borderRadius:8, padding:14, borderTopWidth:2, borderWidth:1, borderColor:C.border },
  statNum: { fontSize:26, fontWeight:'800', lineHeight:28 },
  statLabel: { color:C.muted, fontSize:11, marginTop:4, textTransform:'uppercase', letterSpacing:0.5 },
  sectionTitle: { color:'#94a3b8', fontSize:13, fontWeight:'700', textTransform:'uppercase', letterSpacing:1, marginBottom:12 },
  card: { backgroundColor:'rgba(255,255,255,0.03)', borderRadius:8, padding:14, marginBottom:10, borderWidth:1, borderColor:C.border },
  cardRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  cardTitle: { color:'#e2e8f0', fontWeight:'600', fontSize:14, flex:1, marginRight:8 },
  cardSub: { color:C.muted, fontSize:12, marginBottom:10 },
  badge: { fontSize:11, fontWeight:'600', paddingHorizontal:8, paddingVertical:2, borderRadius:4, borderWidth:1 },
  progressBg: { height:4, backgroundColor:'#1e293b', borderRadius:2, marginBottom:4 },
  progressFill: { height:4, backgroundColor:C.green, borderRadius:2 },
  progressLabel: { color:C.green, fontSize:11, fontWeight:'700', textAlign:'right' },
});
export { DashboardScreen as default };

// ── PROJECTS ──────────────────────────────────────────────────────────────────
export function ProjectsScreen() {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  useEffect(() => { getProjects().then(d => { if (d.success) setProjects(d.data); setLoading(false); }); }, []);
  const STATUS_C = { active:C.green, planning:C.blue, completed:'#6366f1', on_hold:C.amber, cancelled:'#ef4444' };
  return (
    <View style={{flex:1, backgroundColor:C.bg}}>
      <Text style={[ds.heading,{padding:20, paddingTop:56, paddingBottom:0}]}>🗂️ Projects</Text>
      {loading ? <ActivityIndicator color={C.green} style={{marginTop:40}} /> : (
        <FlatList data={projects} keyExtractor={i=>i.id} contentContainerStyle={{padding:20}}
          renderItem={({item:p}) => (
            <View style={[ds.card, {borderLeftWidth:3, borderLeftColor:STATUS_C[p.status]||C.muted}]}>
              <View style={ds.cardRow}>
                <Text style={[ds.cardTitle]}>{p.name}</Text>
                <Text style={{color:C.muted, fontSize:11}}>{p.code}</Text>
              </View>
              <Text style={ds.cardSub}>📍 {p.city}, {p.country} · {p.phase}</Text>
              {p.description ? <Text style={{color:'#64748b', fontSize:12, lineHeight:18, marginBottom:10}} numberOfLines={2}>{p.description}</Text> : null}
              <View style={ds.progressBg}><View style={[ds.progressFill,{width:`${p.progress}%`}]} /></View>
              <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:4}}>
                <Text style={{color:C.muted, fontSize:11}}>{p.task_count||0} tasks · {p.member_count||0} members</Text>
                <Text style={ds.progressLabel}>{p.progress}%</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ── SENSORS ───────────────────────────────────────────────────────────────────
const TYPE_ICONS = {temperature:'🌡️',humidity:'💧',air_quality:'💨',traffic:'🚗',energy:'⚡',water:'🌊',noise:'🔊',waste:'🗑️'};
const STATUS_C2  = {online:C.green, offline:'#ef4444', maintenance:C.amber, error:'#f97316'};
export function SensorsScreen() {
  const [sensors, setSensors] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getSensors().then(d => { if (d.success) setSensors(d.data); setLoading(false); }); }, []);
  const online = sensors.filter(s=>s.status==='online').length;
  return (
    <View style={{flex:1, backgroundColor:C.bg}}>
      <Text style={[ds.heading,{padding:20, paddingTop:56, paddingBottom:4}]}>📡 IoT Sensors</Text>
      <Text style={{color:C.muted, fontSize:13, paddingHorizontal:20, marginBottom:16}}>{online}/{sensors.length} online</Text>
      {loading ? <ActivityIndicator color={C.green} style={{marginTop:40}} /> : (
        <FlatList data={sensors} keyExtractor={i=>i.id} contentContainerStyle={{paddingHorizontal:20, paddingBottom:20}}
          renderItem={({item:s}) => (
            <View style={[ds.card,{flexDirection:'row', alignItems:'center', gap:12}]}>
              <Text style={{fontSize:24}}>{TYPE_ICONS[s.sensor_type]||'📟'}</Text>
              <View style={{flex:1}}>
                <Text style={{color:'#e2e8f0', fontWeight:'600', fontSize:13}} numberOfLines={1}>{s.name}</Text>
                <Text style={{color:C.muted, fontSize:11}}>{s.device_id}</Text>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={{color:STATUS_C2[s.status], fontSize:13, fontWeight:'700'}}>{s.latest_value??'—'} <Text style={{color:C.muted, fontWeight:'400', fontSize:11}}>{s.unit}</Text></Text>
                <View style={{flexDirection:'row', alignItems:'center', gap:4, marginTop:2}}>
                  <View style={{width:6, height:6, borderRadius:3, backgroundColor:STATUS_C2[s.status]}} />
                  <Text style={{color:STATUS_C2[s.status], fontSize:11}}>{s.status}</Text>
                </View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

// ── AI ────────────────────────────────────────────────────────────────────────
export function AIScreen() {
  const [convs,    setConvs]   = useState([]);
  const [active,   setActive]  = useState(null);
  const [msgs,     setMsgs]    = useState([]);
  const [input,    setInput]   = useState('');
  const [sending,  setSending] = useState(false);
  useEffect(() => { getConversations().then(d => { if (d.success) setConvs(d.data); }); }, []);
  useEffect(() => { if (active) getMessages(active.id).then(d => { if (d.success) setMsgs(d.data); }); }, [active]);
  const newConv = async () => { const d = await createConversation({title:'New Chat'}); if (d.success) { setConvs(c=>[d.data,...c]); setActive(d.data); setMsgs([]); } };
  const send = async () => {
    if (!input.trim()||!active||sending) return;
    const text=input.trim(); setInput(''); setSending(true);
    setMsgs(m=>[...m,{id:'t',role:'user',content:text}]);
    try { const d = await sendMessage(active.id, text); if (d.success) setMsgs(m=>[...m.filter(x=>x.id!=='t'),{role:'user',content:text},d.data]); }
    catch {}
    finally { setSending(false); }
  };
  if (!active) return (
    <View style={{flex:1, backgroundColor:C.bg, padding:20, paddingTop:56}}>
      <Text style={ds.heading}>🤖 AI Assistant</Text>
      <Text style={{color:C.muted, marginBottom:20, fontSize:13}}>Intelligent urban insights powered by Claude</Text>
      <TouchableOpacity onPress={newConv} style={{backgroundColor:C.green, borderRadius:8, padding:15, alignItems:'center', marginBottom:16}}>
        <Text style={{color:'#fff', fontWeight:'700', fontSize:14, letterSpacing:0.5}}>+ New Conversation</Text>
      </TouchableOpacity>
      {convs.map(c=>(
        <TouchableOpacity key={c.id} onPress={()=>setActive(c)} style={ds.card}>
          <Text style={{color:'#e2e8f0', fontWeight:'600', fontSize:13}} numberOfLines={1}>{c.title}</Text>
          <Text style={{color:C.muted, fontSize:11, marginTop:2}}>{c.message_count} messages</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  return (
    <View style={{flex:1, backgroundColor:C.bg}}>
      <View style={{padding:16, paddingTop:56, borderBottomWidth:1, borderBottomColor:C.border, flexDirection:'row', alignItems:'center', gap:10}}>
        <TouchableOpacity onPress={()=>setActive(null)}><Text style={{color:C.muted, fontSize:18}}>←</Text></TouchableOpacity>
        <Text style={{color:'#f0f9ff', fontWeight:'700', fontSize:15}} numberOfLines={1}>{active.title}</Text>
      </View>
      <FlatList data={msgs} keyExtractor={(i,x)=>i.id||`${x}`} contentContainerStyle={{padding:16, gap:12}}
        renderItem={({item:m})=>(
          <View style={{flexDirection:m.role==='user'?'row-reverse':'row', gap:8, alignItems:'flex-start'}}>
            <Text style={{fontSize:16}}>{m.role==='user'?'👤':'🤖'}</Text>
            <View style={{maxWidth:'80%', padding:12, borderRadius:10, backgroundColor:m.role==='user'?'rgba(14,165,233,0.15)':'rgba(255,255,255,0.04)', borderWidth:1, borderColor:m.role==='user'?'rgba(14,165,233,0.25)':C.border}}>
              <Text style={{color:'#e2e8f0', fontSize:13, lineHeight:20}}>{m.content}</Text>
            </View>
          </View>
        )}
      />
      {sending && <Text style={{color:C.muted, fontSize:12, padding:8, textAlign:'center'}}>AI is thinking…</Text>}
      <View style={{flexDirection:'row', padding:12, gap:8, borderTopWidth:1, borderTopColor:C.border}}>
        <TextInput value={input} onChangeText={setInput} placeholder="Ask about your projects…" placeholderTextColor={C.muted} style={{flex:1, backgroundColor:'rgba(255,255,255,0.05)', borderWidth:1, borderColor:C.border, borderRadius:8, padding:10, color:'#e2e8f0', fontSize:13}} multiline onSubmitEditing={send} />
        <TouchableOpacity onPress={send} disabled={sending||!input.trim()} style={{backgroundColor:!input.trim()||sending?'#1e293b':C.green, borderRadius:8, padding:10, justifyContent:'center', alignItems:'center', width:48}}>
          <Text style={{color:'#fff', fontSize:18}}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
