import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/common/AnimatedBackground';
import api from '../utils/api';
import toast from 'react-hot-toast';

function StrengthBar({ password }) {
  const checks = [
    { label: '8+ chars', ok: password.length >= 8 },
    { label: 'Uppercase', ok: /[A-Z]/.test(password) },
    { label: 'Number', ok: /[0-9]/.test(password) },
    { label: 'Special', ok: /[^A-Za-z0-9]/.test(password) }
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#ef4444','#f59e0b','#6366f1','#10b981'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 7 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < score ? colors[score - 1] : 'rgba(120,120,180,0.2)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {checks.map(c => (
          <span key={c.label} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: c.ok ? 'rgba(16,185,129,0.18)' : 'rgba(120,120,180,0.12)', color: c.ok ? '#34d399' : 'rgba(180,178,255,0.5)', transition: 'all 0.25s' }}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(150,140,255,0.3)',
  borderRadius: 10, color: '#ffffff', fontSize: 13.5,
  fontFamily: "'DM Sans',sans-serif", outline: 'none',
  transition: 'border 0.2s, background 0.2s', boxSizing: 'border-box'
};
const inputErrStyle = { ...inputStyle, border: '1px solid rgba(239,68,68,0.6)' };

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loginErrors, setLoginErrors] = useState({});
  const [rName, setRName] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPassword, setRPassword] = useState('');
  const [rConfirm, setRConfirm] = useState('');
  const [rRole, setRRole] = useState('employee');
  const [showRPwd, setShowRPwd] = useState(false);
  const [regErrors, setRegErrors] = useState({});
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const validateLogin = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email';
    if (!password) e.password = 'Password is required';
    setLoginErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (ev) => {
    ev.preventDefault();
    if (!validateLogin()) return;
    const result = await login(email, password, rememberMe);
    if (result.success) { toast.success('Welcome back!'); navigate('/dashboard'); }
    else { toast.error(result.error); setLoginErrors({ api: result.error }); }
  };

  const validateReg = () => {
    const e = {};
    if (!rName.trim()) e.name = 'Full name is required';
    if (!rEmail.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(rEmail)) e.email = 'Enter a valid email';
    if (!rPassword) e.password = 'Password is required';
    else if (rPassword.length < 6) e.password = 'At least 6 characters';
    if (rPassword !== rConfirm) e.confirm = 'Passwords do not match';
    setRegErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async (ev) => {
    ev.preventDefault();
    if (!validateReg()) return;
    try {
      const { data } = await api.post('/auth/register', { name: rName, email: rEmail, password: rPassword, role: rRole });
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Account created! Welcome 🎉');
      navigate('/dashboard');
      window.location.reload();
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed';
      toast.error(msg); setRegErrors({ api: msg });
    }
  };

  const label = (text) => (
    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(220,218,255,0.75)', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{text}</label>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20, position: 'relative',
      background: 'linear-gradient(135deg, #2e2b5f 0%, #3d3890 40%, #2c2870 70%, #221f50 100%)'
    }}>
      <AnimatedBackground particles={22} />

      <motion.div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 10 }}
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>

        {/* Logo */}
        <motion.div style={{ textAlign: 'center', marginBottom: 28 }}
          animate={{ y: [0, -7, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <div style={{ width: 64, height: 64, background: 'linear-gradient(135deg, #6366f1, #ec4899)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 28, fontWeight: 800, fontFamily: "'Syne',sans-serif", color: '#fff', boxShadow: '0 8px 32px rgba(99,102,241,0.6)' }}>E</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg, #a5b4fc, #f472b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EmpAxis Pro</div>
          <div style={{ color: 'rgba(220,218,255,0.65)', fontSize: 13, marginTop: 5 }}>Enterprise Employee Management</div>
        </motion.div>

        {/* Card */}
        <div style={{
          background: 'rgba(70, 65, 130, 0.70)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(160,150,255,0.35)',
          borderRadius: 24, padding: '32px 32px 28px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #818cf8, #ec4899, transparent)' }} />

          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.07)', borderRadius: 12, padding: 4, marginBottom: 26, border: '1px solid rgba(160,150,255,0.2)' }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setLoginErrors({}); setRegErrors({}); }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 13.5, transition: 'all 0.22s',
                  background: mode === m ? 'linear-gradient(135deg, #6366f1, #ec4899)' : 'transparent',
                  color: mode === m ? '#fff' : 'rgba(210,208,255,0.6)',
                  boxShadow: mode === m ? '0 4px 14px rgba(99,102,241,0.45)' : 'none'
                }}>
                {m === 'login' ? '🔐 Sign In' : '✨ Register'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {mode === 'login' && (
              <motion.form key="login" onSubmit={handleLogin}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.22 }}>
                <p style={{ color: 'rgba(210,208,255,0.65)', fontSize: 13, marginBottom: 22 }}>Sign in to your admin account</p>

                {loginErrors.api && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>{loginErrors.api}</div>}

                <div style={{ marginBottom: 16 }}>
                  {label('Email')}
                  <input style={loginErrors.email ? inputErrStyle : inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@company.com" />
                  {loginErrors.email && <div style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 4 }}>{loginErrors.email}</div>}
                </div>

                <div style={{ marginBottom: 18 }}>
                  {label('Password')}
                  <div style={{ position: 'relative' }}>
                    <input style={loginErrors.password ? { ...inputErrStyle, paddingRight: 42 } : { ...inputStyle, paddingRight: 42 }} type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
                    <button type="button" onClick={() => setShowPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(210,208,255,0.5)', fontSize: 15 }}>{showPwd ? '🙈' : '👁️'}</button>
                  </div>
                  {loginErrors.password && <div style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 4 }}>{loginErrors.password}</div>}
                </div>

                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(210,208,255,0.65)' }}>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} style={{ accentColor: '#6366f1', width: 15, height: 15 }} />
                    Remember me
                  </label>
                </div>

                <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 6px 20px rgba(99,102,241,0.5)', opacity: loading ? 0.7 : 1 }}>
                  {loading ? '⏳ Signing in...' : 'Sign In →'}
                </motion.button>

                <div style={{ marginTop: 20, padding: 14, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(130,120,255,0.28)', borderRadius: 12 }}>
                  <div style={{ fontSize: 11, color: 'rgba(210,208,255,0.55)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Demo Admin Account</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: '#a5b4fc' }}>admin@company.com</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: '#f9a8d4' }}>Admin@123</div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'rgba(200,198,255,0.55)' }}>
                  No account yet?{' '}
                  <span onClick={() => setMode('register')} style={{ color: '#a5b4fc', cursor: 'pointer', fontWeight: 600 }}>Create one →</span>
                </div>
              </motion.form>
            )}

            {mode === 'register' && (
              <motion.form key="register" onSubmit={handleRegister}
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
                <p style={{ color: 'rgba(210,208,255,0.65)', fontSize: 13, marginBottom: 22 }}>Create a new account to get started</p>

                {regErrors.api && <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5' }}>{regErrors.api}</div>}

                <div style={{ marginBottom: 14 }}>
                  {label('Full Name')}
                  <input style={regErrors.name ? inputErrStyle : inputStyle} value={rName} onChange={e => setRName(e.target.value)} placeholder="John Smith" />
                  {regErrors.name && <div style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 4 }}>{regErrors.name}</div>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  {label('Email Address')}
                  <input style={regErrors.email ? inputErrStyle : inputStyle} type="email" value={rEmail} onChange={e => setREmail(e.target.value)} placeholder="john@company.com" />
                  {regErrors.email && <div style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 4 }}>{regErrors.email}</div>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  {label('Role')}
                  <select value={rRole} onChange={e => setRRole(e.target.value)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                    <option value="employee" style={{ background: '#3d3890' }}>Employee</option>
                    <option value="hr" style={{ background: '#3d3890' }}>HR Staff</option>
                    <option value="manager" style={{ background: '#3d3890' }}>Manager</option>
                  </select>
                  <div style={{ fontSize: 11, color: 'rgba(200,180,255,0.45)', marginTop: 5 }}>⚠️ Admin accounts must be created by an existing admin</div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  {label('Password')}
                  <div style={{ position: 'relative' }}>
                    <input style={regErrors.password ? { ...inputErrStyle, paddingRight: 42 } : { ...inputStyle, paddingRight: 42 }} type={showRPwd ? 'text' : 'password'} value={rPassword} onChange={e => setRPassword(e.target.value)} placeholder="Min. 6 characters" />
                    <button type="button" onClick={() => setShowRPwd(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(210,208,255,0.5)', fontSize: 15 }}>{showRPwd ? '🙈' : '👁️'}</button>
                  </div>
                  {rPassword && <StrengthBar password={rPassword} />}
                  {regErrors.password && <div style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 4 }}>{regErrors.password}</div>}
                </div>

                <div style={{ marginBottom: 22 }}>
                  {label('Confirm Password')}
                  <input style={regErrors.confirm ? inputErrStyle : inputStyle} type="password" value={rConfirm} onChange={e => setRConfirm(e.target.value)} placeholder="Re-enter password" />
                  {regErrors.confirm && <div style={{ color: '#fca5a5', fontSize: 11.5, marginTop: 4 }}>{regErrors.confirm}</div>}
                </div>

                <motion.button type="submit" whileTap={{ scale: 0.97 }}
                  style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 6px 20px rgba(99,102,241,0.5)' }}>
                  Create Account →
                </motion.button>

                <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'rgba(200,198,255,0.55)' }}>
                  Already have an account?{' '}
                  <span onClick={() => setMode('login')} style={{ color: '#a5b4fc', cursor: 'pointer', fontWeight: 600 }}>Sign in →</span>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}