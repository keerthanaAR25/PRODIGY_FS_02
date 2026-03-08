import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Doughnut, Bar, Line, Pie } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DEPT_COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#06b6d4'];

const STEPS = [
  { num:'01', icon:'➕', title:'Add Employee', desc:'Register employees with full profile, auto-ID generation', color:'#6366f1', gradient:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.05))', glow:'rgba(99,102,241,0.25)', action:'/employees/new' },
  { num:'02', icon:'👥', title:'Manage Staff', desc:'Edit, update, search and filter your entire workforce', color:'#ec4899', gradient:'linear-gradient(135deg,rgba(236,72,153,0.15),rgba(236,72,153,0.05))', glow:'rgba(236,72,153,0.25)', action:'/employees' },
  { num:'03', icon:'🏢', title:'Track Departments', desc:'Organize teams, track department size and budgets', color:'#10b981', gradient:'linear-gradient(135deg,rgba(16,185,129,0.15),rgba(16,185,129,0.05))', glow:'rgba(16,185,129,0.25)', action:'/departments' },
  { num:'04', icon:'📊', title:'Monitor Performance', desc:'Analyze growth trends, salary distribution and KPIs', color:'#f59e0b', gradient:'linear-gradient(135deg,rgba(245,158,11,0.15),rgba(245,158,11,0.05))', glow:'rgba(245,158,11,0.25)', action:'/reports' },
  { num:'05', icon:'📋', title:'Generate Reports', desc:'Export CSV, Excel reports and view activity audit logs', color:'#8b5cf6', gradient:'linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05))', glow:'rgba(139,92,246,0.25)', action:'/reports' }
];

const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: 'rgba(240,238,255,0.65)', font: { family: "'DM Sans'" }, boxRadius: 4 } }, tooltip: { backgroundColor: 'rgba(13,12,29,0.95)', borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1, titleColor: '#f0eeff', bodyColor: 'rgba(240,238,255,0.7)', titleFont: { family: "'Syne',sans-serif", weight: '700' } } }, scales: { x: { ticks: { color: 'rgba(240,238,255,0.45)', font: { family: "'DM Sans'" } }, grid: { color: 'rgba(99,102,241,0.06)' } }, y: { ticks: { color: 'rgba(240,238,255,0.45)', font: { family: "'DM Sans'" } }, grid: { color: 'rgba(99,102,241,0.06)' } } } };
const pieOptions = { ...chartOptions, scales: undefined };

function StatCard({ value, label, icon, color, glow, gradient, badge, badgeUp }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0; const end = parseInt(value) || 0; if (end === 0) { setDisplayed(0); return; }
    const step = Math.ceil(end / 30);
    const t = setInterval(() => { start = Math.min(start + step, end); setDisplayed(start); if (start >= end) clearInterval(t); }, 30);
    return () => clearInterval(t);
  }, [value]);

  return (
    <motion.div className="card stat-card" style={{ '--stat-gradient': gradient, '--stat-icon-bg': `${color}22`, '--stat-color': color, '--stat-glow': glow, padding: 22 }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{displayed.toLocaleString()}</div>
      <div className="stat-label">{label}</div>
      {badge !== undefined && (
        <div className={`stat-badge ${badgeUp ? 'up' : 'down'}`}>
          {badgeUp ? '↑' : '↓'} {Math.abs(badge)}%
          <span style={{ fontWeight: 400, opacity: 0.7 }}> vs last month</span>
        </div>
      )}
    </motion.div>
  );
}

function ActionCard({ icon, label, sub, onClick, color }) {
  return (
    <motion.div onClick={onClick} whileHover={{ scale: 1.03, y: -3 }} whileTap={{ scale: 0.97 }}
      style={{ padding: 16, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{icon}</div>
      <div><div style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</div><div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{sub}</div></div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/stats').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const deptChart = data ? {
    labels: data.deptStats.map(d => d._id),
    datasets: [{ data: data.deptStats.map(d => d.count), backgroundColor: DEPT_COLORS, borderWidth: 0, hoverOffset: 8 }]
  } : null;

  const barChart = data && user?.role === 'admin' ? {
    labels: data.deptStats.map(d => d._id),
    datasets: [{ label: 'Avg Salary ($)', data: data.deptStats.map(d => Math.round(d.avgSalary || 0)), backgroundColor: DEPT_COLORS.map(c => `${c}99`), borderColor: DEPT_COLORS, borderWidth: 2, borderRadius: 6 }]
  } : null;

  const trendChart = data ? (() => {
    const map = {};
    data.monthlyTrend.forEach(m => { map[`${MONTHS[m._id.month-1]} '${String(m._id.year).slice(-2)}`] = m.count; });
    const labels = Object.keys(map).slice(-12);
    return { labels, datasets: [{ label: 'New Hires', data: labels.map(l => map[l] || 0), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#6366f1', pointRadius: 4 }] };
  })() : null;

  const statusChart = data ? {
    labels: ['Active', 'Inactive', 'On Leave', 'Terminated'],
    datasets: [{ data: [data.stats.active, data.stats.inactive, data.stats.onLeave, data.stats.terminated], backgroundColor: ['#10b98140','#6366f140','#f59e0b40','#ef444440'], borderColor: ['#10b981','#6366f1','#f59e0b','#ef4444'], borderWidth: 2 }]
  } : null;

  const activeStepData = activeStep !== null ? STEPS[activeStep] : null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name} 👋 — Here's your HR overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/employees/new')}>➕ Add Employee</button>
      </div>

      {/* ─── Step Toggle Cards ───────────────────────────────────────── */}
      <div className="step-cards-section">
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>System Workflow</div>
        <div className="step-cards-grid">
          {STEPS.map((s, i) => (
            <motion.div key={i} className={`step-card ${activeStep === i ? 'active' : ''}`}
              style={{ '--step-color': s.color, '--step-gradient': s.gradient, '--step-glow': s.glow }}
              onClick={() => setActiveStep(activeStep === i ? null : i)}
              whileHover={{ y: -6 }} whileTap={{ scale: 0.97 }}>
              <div className="step-num">STEP {s.num}</div>
              <div className="step-icon">{s.icon}</div>
              <div className="step-title">{s.title}</div>
              <div className="step-desc">{s.desc}</div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {activeStepData && (
            <motion.div className="step-panel" style={{ '--step-color': activeStepData.color }}
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                    {activeStepData.icon} {activeStepData.title}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13.5 }}>{activeStepData.desc}</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(activeStepData.action)}>
                  Go to {activeStepData.title} →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Stat Cards ──────────────────────────────────────────────── */}
      <div className="stats-grid">
        {loading ? [1,2,3,4].map(i => <div key={i} className="card skeleton" style={{ height: 160 }} />) : <>
          <StatCard value={data?.stats.total} label="Total Employees" icon="👥" color="#6366f1" glow="rgba(99,102,241,0.3)" gradient="linear-gradient(135deg,rgba(99,102,241,0.1),transparent)" badge={data?.stats.growthRate} badgeUp={(data?.stats.growthRate||0) >= 0} />
          <StatCard value={data?.stats.active} label="Active Employees" icon="✅" color="#10b981" glow="rgba(16,185,129,0.3)" gradient="linear-gradient(135deg,rgba(16,185,129,0.1),transparent)" />
          <StatCard value={data?.stats.onLeave} label="On Leave" icon="🌴" color="#f59e0b" glow="rgba(245,158,11,0.3)" gradient="linear-gradient(135deg,rgba(245,158,11,0.1),transparent)" />
          <StatCard value={data?.stats.newThisMonth} label="New This Month" icon="🆕" color="#ec4899" glow="rgba(236,72,153,0.3)" gradient="linear-gradient(135deg,rgba(236,72,153,0.1),transparent)" />
        </>}
      </div>

      {/* ─── Charts ──────────────────────────────────────────────────── */}
      <div className="charts-grid">
        <motion.div className="card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Department Distribution</h3>
          </div>
          {deptChart ? <Doughnut data={deptChart} options={{ ...pieOptions, cutout: '65%' }} /> : <div className="skeleton" style={{ height: '100%' }} />}
        </motion.div>

        <motion.div className="card chart-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Employee Status</h3>
          </div>
          {statusChart ? <Pie data={statusChart} options={pieOptions} /> : <div className="skeleton" style={{ height: '100%' }} />}
        </motion.div>

        <motion.div className="card chart-card" style={{ gridColumn: 'span 2' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div className="card-header" style={{ marginBottom: 16 }}>
            <h3 className="card-title">Monthly Joining Trend</h3>
          </div>
          {trendChart ? <Line data={trendChart} options={chartOptions} /> : <div className="skeleton" style={{ height: '100%' }} />}
        </motion.div>

        {user?.role === 'admin' && (
          <motion.div className="card chart-card" style={{ gridColumn: 'span 2' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h3 className="card-title">Average Salary by Department</h3>
              <span className="badge badge-admin">Admin Only</span>
            </div>
            {barChart ? <Bar data={barChart} options={chartOptions} /> : <div className="skeleton" style={{ height: '100%' }} />}
          </motion.div>
        )}
      </div>

      {/* ─── Quick Actions + Recent Activity ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 22 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <ActionCard icon="➕" label="Add Employee" sub="Create new record" color="#6366f1" onClick={() => navigate('/employees/new')} />
            <ActionCard icon="👥" label="All Employees" sub="View directory" color="#ec4899" onClick={() => navigate('/employees')} />
            <ActionCard icon="🏢" label="Departments" sub="Manage teams" color="#10b981" onClick={() => navigate('/departments')} />
            <ActionCard icon="📈" label="Reports" sub="Analytics & export" color="#f59e0b" onClick={() => navigate('/reports')} />
            {user?.role === 'admin' && <ActionCard icon="📋" label="Activity Logs" sub="Audit trail" color="#8b5cf6" onClick={() => navigate('/activities')} />}
          </div>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <h3 className="card-title" style={{ marginBottom: 16 }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 40 }} />) :
              data?.recentActivity?.slice(0, 8).map((act, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(99,102,241,0.06)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                    {act.action?.includes('LOGIN') ? '🔐' : act.action?.includes('CREATE') ? '➕' : act.action?.includes('DELETE') ? '🗑' : act.action?.includes('UPDATE') ? '✏️' : '📋'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ color: 'var(--accent-light)' }}>{act.userName}</span> · {act.action?.replace(/_/g, ' ')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {act.target && <span>{act.target} · </span>}
                      {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                </motion.div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

