// ── LoginScreen.js ────────────────────────────────────────────────────────────
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { login } from '../services/api';

export function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please enter email and password.'); return; }
    setLoading(true);
    try {
      const data = await login(email.toLowerCase(), password);
      if (data.success) navigation.replace('Main');
      else Alert.alert('Login Failed', data.message);
    } catch (e) { Alert.alert('Error', 'Could not connect to server.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={s.container}>
      <View style={s.logoBox}>
        <Text style={s.logoText}>SCDK</Text>
        <Text style={s.logoSub}>Smart City Platform</Text>
      </View>
      <View style={s.card}>
        <Text style={s.title}>Sign In</Text>
        <TextInput style={s.input} placeholder="Email" placeholderTextColor="#475569" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={s.input} placeholder="Password" placeholderTextColor="#475569" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>SIGN IN</Text>}
        </TouchableOpacity>
        <Text style={s.demo}>Demo: admin@scdk.io / Password123!</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06091a', alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoBox:   { alignItems: 'center', marginBottom: 32 },
  logoText:  { fontFamily: 'System', fontWeight: '800', fontSize: 36, color: '#f0f9ff', letterSpacing: 4 },
  logoSub:   { color: '#475569', fontSize: 13, marginTop: 4 },
  card:      { width: '100%', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  title:     { color: '#f0f9ff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  input:     { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 6, padding: 14, color: '#e2e8f0', marginBottom: 12, fontSize: 15 },
  btn:       { backgroundColor: '#10b981', borderRadius: 6, padding: 15, alignItems: 'center', marginTop: 8 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
  demo:      { color: '#334155', fontSize: 12, textAlign: 'center', marginTop: 16 },
});

export default LoginScreen;
