
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function PwdStrength({ password }) {
  const checks = [
    { l: '8+ chars', ok: password.length >= 8 },
    { l: 'Uppercase', ok: /[A-Z]/.test(password) },
    { l: 'Number', ok: /[0-9]/.test(password) },
    { l: 'Special', ok: /[^A-Za-z0-9]/.test(password) }
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['#ef4444', '#f59e0b', '#6366f1', '#10b981'];
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 5, marginBottom: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.08)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {checks.map(c => (
          <span key={c.l} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 99, background: c.ok ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)', color: c.ok ? '#10b981' : 'rgba(255,255,255,0.3)', transition: 'all 0.2s' }}>
            {c.ok ? '✓' : '○'} {c.l}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser, logout } = useAuth();
  const [tab, setTab] = useState('profile');
  const [name, setName] = useState(user?.name || '');
  const [currPwd, setCurrPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const saveProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', { name });
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (newPwd !== confirmPwd) { setPwdError('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: currPwd, newPassword: newPwd });
      toast.success('Password changed successfully!');
      setCurrPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const generateOTP = async () => {
    try {
      const { data } = await api.post('/auth/generate-otp');
      setGeneratedOtp(data.otp);
      toast.success('OTP generated! Check below for demo.');
    } catch { toast.error('Failed to generate OTP'); }
  };

  const verifyOTP = async () => {
    try {
      await api.post('/auth/verify-otp', { otp });
      toast.success('OTP verified! 2FA confirmed.');
      setGeneratedOtp(''); setOtp('');
    } catch (err) { toast.error(err.response?.data?.error || 'Invalid OTP'); }
  };

  const loadSessions = async () => {
    try {
      const { data } = await api.get('/auth/sessions');
      setSessions(data.sessions || []);
    } catch { toast.error('Failed to load sessions'); }
  };

  const logoutAll = async () => {
    if (!window.confirm('Logout from all devices?')) return;
    try {
      await api.post('/auth/logout-all');
      toast.success('Logged out from all devices');
      logout();
    } catch { toast.error('Failed'); }
  };

  React.useEffect(() => { if (tab === 'sessions') loadSessions(); }, [tab]);

  const initials = (user?.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account settings and security</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* Left card */}
        <motion.div className="card" style={{ padding: 28, textAlign: 'center', height: 'fit-content' }}
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ width: 80, height: 80, borderRadius: 22, background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(99,102,241,0.45)' }}>
            {initials}
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, marginBottom: 4 }}>{user?.name}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 10 }}>{user?.email}</div>
          <span className={`badge badge-${user?.role === 'admin' ? 'admin' : user?.role === 'manager' ? 'manager' : 'active'}`} style={{ fontSize: 12 }}>
            {user?.role?.toUpperCase()}
          </span>
        </motion.div>

        {/* Right panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="tabs" style={{ marginBottom: 16 }}>
            {['profile', 'password', '2fa', 'sessions'].map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'profile' ? '👤 Profile' : t === 'password' ? '🔑 Password' : t === '2fa' ? '🛡 2FA' : '📱 Sessions'}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 20 }}>Edit Profile</h3>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 5 }}>Email cannot be changed</div>
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <input className="form-input" value={user?.role || ''} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
              </div>
              <button className="btn btn-primary" onClick={saveProfile} disabled={loading}>
                {loading ? '⏳ Saving...' : '✓ Save Profile'}
              </button>
            </div>
          )}

          {/* Password Tab */}
          {tab === 'password' && (
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 20 }}>Change Password</h3>
              <form onSubmit={changePassword}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input className="form-input" type="password" value={currPwd} onChange={e => setCurrPwd(e.target.value)} placeholder="Your current password" />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input className="form-input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="New password" />
                  {newPwd && <PwdStrength password={newPwd} />}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input className={`form-input ${pwdError ? 'error' : ''}`} type="password" value={confirmPwd} onChange={e => { setConfirmPwd(e.target.value); setPwdError(''); }} placeholder="Confirm new password" />
                  {pwdError && <div className="form-error">{pwdError}</div>}
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? '⏳ Changing...' : '🔑 Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* 2FA Tab */}
          {tab === '2fa' && (
            <div className="card" style={{ padding: 28 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 8 }}>Two-Factor Authentication</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginBottom: 24 }}>
                Add an extra layer of security to your account using OTP verification.
              </p>
              <button className="btn btn-primary" style={{ marginBottom: 20 }} onClick={generateOTP}>
                🛡 Generate OTP
              </button>
              {generatedOtp && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                  <div style={{ fontSize: 12, color: '#10b981', marginBottom: 6, fontWeight: 600 }}>🔒 Your OTP (Demo — expires in 10 min)</div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 28, fontWeight: 700, color: '#10b981', letterSpacing: '0.2em' }}>{generatedOtp}</div>
                </motion.div>
              )}
              <div className="form-group">
                <label className="form-label">Enter OTP Code</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input className="form-input" value={otp} onChange={e => setOtp(e.target.value)} placeholder="6-digit code" maxLength={6} style={{ fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.15em', fontSize: 18 }} />
                  <button className="btn btn-success" onClick={verifyOTP} disabled={otp.length !== 6}>Verify</button>
                </div>
              </div>
            </div>
          )}

          {/* Sessions Tab */}
          {tab === 'sessions' && (
            <div className="card" style={{ padding: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>Active Sessions</h3>
                <button className="btn btn-danger btn-sm" onClick={logoutAll}>⊗ Logout All Devices</button>
              </div>
              {sessions.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <div className="empty-icon">📱</div>
                  <div className="empty-title">No active sessions</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sessions.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border)', borderRadius: 12 }}>
                      <span style={{ fontSize: 24 }}>💻</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{s.device || 'Unknown Device'}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                          {s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                      <div style={{ marginLeft: 'auto' }}>
                        <span className="badge badge-active" style={{ fontSize: 11 }}>Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

