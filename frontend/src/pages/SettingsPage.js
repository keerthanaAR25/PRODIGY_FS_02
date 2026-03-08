import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [dateFormat, setDateFormat] = useState('MMM dd, yyyy');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState('UTC');
  const [pageSize, setPageSize] = useState('10');

  const applyTheme = (t) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  };

  const save = () => {
    localStorage.setItem('ems_settings', JSON.stringify({ theme, notifications, dateFormat, currency, timezone, pageSize }));
    toast.success('Settings saved!');
  };

  const reset = () => {
    applyTheme('dark'); setNotifications(true); setDateFormat('MMM dd, yyyy'); setCurrency('USD'); setTimezone('UTC'); setPageSize('10');
    toast.success('Settings reset to defaults');
  };

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('ems_settings') || '{}');
      if (s.notifications !== undefined) setNotifications(s.notifications);
      if (s.dateFormat) setDateFormat(s.dateFormat);
      if (s.currency) setCurrency(s.currency);
      if (s.timezone) setTimezone(s.timezone);
      if (s.pageSize) setPageSize(s.pageSize);
    } catch {}
  }, []);

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 99, background: value ? 'var(--accent)' : 'rgba(255,255,255,0.12)', cursor: 'pointer', transition: 'background 0.25s', position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.25s', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }} />
    </div>
  );

  const Section = ({ title, children }) => (
    <motion.div className="card" style={{ padding: 28, marginBottom: 16 }} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, marginBottom: 20, color: 'var(--accent-light)' }}>{title}</h3>
      {children}
    </motion.div>
  );

  const Row = ({ label, sub, children }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Customize your EmpAxis experience</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={reset}>↺ Reset Defaults</button>
          <button className="btn btn-primary" onClick={save}>✓ Save Settings</button>
        </div>
      </div>

      <Section title="🎨 Appearance">
        <Row label="Theme" sub="Choose between dark and light mode">
          <div style={{ display: 'flex', gap: 8 }}>
            {['dark', 'light'].map(t => (
              <button key={t} onClick={() => applyTheme(t)} className={`btn btn-sm ${theme === t ? 'btn-primary' : 'btn-secondary'}`}>
                {t === 'dark' ? '🌙 Dark' : '☀️ Light'}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Notifications" sub="Show toast notifications for actions">
          <Toggle value={notifications} onChange={setNotifications} />
        </Row>
      </Section>

      <Section title="📊 Data Display">
        <Row label="Default Page Size" sub="Number of items shown per page">
          <select className="form-input form-select" value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ width: 100, margin: 0 }}>
            {['10','25','50','100'].map(s => <option key={s} value={s}>{s} rows</option>)}
          </select>
        </Row>
        <Row label="Currency" sub="Currency format for salary display">
          <select className="form-input form-select" value={currency} onChange={e => setCurrency(e.target.value)} style={{ width: 130, margin: 0 }}>
            {['USD','EUR','GBP','INR','JPY','AUD'].map(c => <option key={c}>{c}</option>)}
          </select>
        </Row>
        <Row label="Date Format" sub="How dates are displayed across the app">
          <select className="form-input form-select" value={dateFormat} onChange={e => setDateFormat(e.target.value)} style={{ width: 160, margin: 0 }}>
            {['MMM dd, yyyy','dd/MM/yyyy','MM/dd/yyyy','yyyy-MM-dd'].map(f => <option key={f}>{f}</option>)}
          </select>
        </Row>
        <Row label="Timezone" sub="Timezone for timestamps">
          <select className="form-input form-select" value={timezone} onChange={e => setTimezone(e.target.value)} style={{ width: 170, margin: 0 }}>
            {['UTC','America/New_York','America/Los_Angeles','Europe/London','Asia/Kolkata','Asia/Tokyo'].map(z => <option key={z}>{z}</option>)}
          </select>
        </Row>
      </Section>

      <Section title="ℹ️ System Information">
        <Row label="Application Version" sub="Current EmpAxis Pro version">
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, color: 'var(--accent-light)' }}>v2.0.0</span>
        </Row>
        <Row label="Backend Status" sub="API connection status">
          <span className="badge badge-active">● Connected</span>
        </Row>
        <Row label="Tech Stack" sub="Frontend + Backend framework">
          <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>React 18 · Node.js · MongoDB</span>
        </Row>
        <Row label="Default Login" sub="Admin credentials for demo">
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: 'var(--text-muted)' }}>admin@company.com · Admin@123</span>
        </Row>
      </Section>
    </div>
  );
}

