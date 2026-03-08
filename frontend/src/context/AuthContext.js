import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const SESSION_TIMEOUT = 30 * 60 * 1000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || null; } catch { return null; }
  });
  const [loading, setLoading] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const timerRef = useRef(null);
  const warningRef = useRef(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setSessionWarning(false);
    if (!localStorage.getItem('accessToken')) return;
    warningRef.current = setTimeout(() => setSessionWarning(true), SESSION_TIMEOUT - 2 * 60 * 1000);
    timerRef.current = setTimeout(() => { logout(); toast.error('Session expired due to inactivity.'); }, SESSION_TIMEOUT);
  }, []);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    const handler = () => { if (user) resetTimer(); };
    events.forEach(e => window.addEventListener(e, handler));
    if (user) resetTimer();
    return () => { events.forEach(e => window.removeEventListener(e, handler)); clearTimeout(timerRef.current); clearTimeout(warningRef.current); };
  }, [user, resetTimer]);

  const login = async (email, password, rememberMe) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password, rememberMe });
      localStorage.setItem('accessToken', data.accessToken);
      if (rememberMe && data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      resetTimer();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed.' };
    } finally { setLoading(false); }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken });
    } catch {}
    localStorage.clear();
    setUser(null);
    setSessionWarning(false);
    clearTimeout(timerRef.current);
  };

  const updateUser = (updates) => {
    const newUser = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, sessionWarning, login, logout, updateUser, setSessionWarning }}>
      {children}
    </AuthContext.Provider>
  );
}

