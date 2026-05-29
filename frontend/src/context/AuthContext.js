import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const TOKEN_KEY   = 'scdk_access_token';
const REFRESH_KEY = 'scdk_refresh_token';
const USER_KEY    = 'scdk_user';

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(() => { try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } });
  const [token,   setToken]   = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res  = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email, password }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      localStorage.setItem(TOKEN_KEY,   data.accessToken);
      localStorage.setItem(REFRESH_KEY, data.refreshToken);
      localStorage.setItem(USER_KEY,    JSON.stringify(data.user));
      setToken(data.accessToken);
      setUser(data.user);
      return { success: true };
    } catch (err) { return { success: false, message: err.message }; }
    finally { setLoading(false); }
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    await fetch('/api/auth/logout', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ refreshToken }) }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token) return;
    try {
      const payload   = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = payload.exp * 1000 - Date.now() - 60000;
      if (expiresIn <= 0) return;
      const timer = setTimeout(async () => {
        const rt = localStorage.getItem(REFRESH_KEY);
        if (!rt) return logout();
        try {
          const res  = await fetch('/api/auth/refresh', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ refreshToken: rt }) });
          const data = await res.json();
          if (data.success) {
            localStorage.setItem(TOKEN_KEY,   data.accessToken);
            localStorage.setItem(REFRESH_KEY, data.refreshToken);
            setToken(data.accessToken);
          } else logout();
        } catch { logout(); }
      }, expiresIn);
      return () => clearTimeout(timer);
    } catch { /* invalid token */ }
  }, [token, logout]);

  const authFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}`, ...options.headers },
    });
    if (res.status === 401) { logout(); throw new Error('Session expired'); }
    return res.json();
  }, [token, logout]);

  const canAccess = useCallback((roles) => roles.includes(user?.role), [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch, canAccess, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
