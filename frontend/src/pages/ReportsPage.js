
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#06b6d4'];

const chartOpts = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: 'rgba(240,238,255,0.65)', font: { family: "'DM Sans'" }, boxRadius: 4 } }, tooltip: { backgroundColor: 'rgba(13,12,29,0.95)', borderColor: 'rgba(99,102,241,0.3)', borderWidth: 1, titleColor: '#f0eeff', bodyColor: 'rgba(240,238,255,0.7)', titleFont: { family: "'Syne',sans-serif", weight: '700' } } },
  scales: { x: { ticks: { color: 'rgba(240,238,255,0.45)', font: { family: "'DM Sans'" } }, grid: { color: 'rgba(99,102,241,0.06)' } }, y: { ticks: { color: 'rgba(240,238,255,0.45)', font: { family: "'DM Sans'" } }, grid: { color: 'rgba(99,102,241,0.06)' } } }
};

export default function ReportsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.get('/dashboard/stats').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleExport = async (format) => {
    try {
      const res = await api.get(`/employees/export?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `employees_report_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
      a.click(); window.URL.revokeObjectURL(url);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  };

  const deptData = data ? {
    labels: data.deptStats.map(d => d._id),
    datasets: [{ label: 'Employees', data: data.deptStats.map(d => d.count), backgroundColor: COLORS.map(c => `${c}99`), borderColor: COLORS, borderWidth: 2, borderRadius: 8 }]
  } : null;

  const salaryData = data && user?.role === 'admin' ? {
    labels: data.deptStats.map(d => d._id),
    datasets: [{ label: 'Avg Salary ($)', data: data.deptStats.map(d => Math.round(d.avgSalary || 0)), backgroundColor: COLORS.map(c => `${c}66`), borderColor: COLORS, borderWidth: 2, borderRadius: 8 }]
  } : null;

  const trendData = data ? (() => {
    const map = {};
    (data.monthlyTrend || []).forEach(m => { map[`${MONTHS[m._id.month - 1]} '${String(m._id.year).slice(-2)}`] = m.count; });
    const labels = Object.keys(map).slice(-12);
    return {
      labels,
      datasets: [
        { label: 'New Hires', data: labels.map(l => map[l] || 0), borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.12)', fill: true, tension: 0.4, pointBackgroundColor: '#6366f1', pointRadius: 5 },
        { label: 'Cumulative', data: labels.map((_, i) => labels.slice(0, i + 1).reduce((s, l) => s + (map[l] || 0), 0)), borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.08)', fill: true, tension: 0.4, pointBackgroundColor: '#ec4899', pointRadius: 5 }
      ]
    };
  })() : null;

  const statusData = data ? {
    labels: ['Active', 'Inactive', 'On Leave', 'Terminated'],
    datasets: [{ data: [data.stats?.active, data.stats?.inactive, data.stats?.onLeave, data.stats?.terminated], backgroundColor: ['rgba(16,185,129,0.6)','rgba(99,102,241,0.6)','rgba(245,158,11,0.6)','rgba(239,68,68,0.6)'], borderColor: ['#10b981','#6366f1','#f59e0b','#ef4444'], borderWidth: 2 }]
  } : null;

  const SUMMARY = [
    { label: 'Total Employees', value: data?.stats?.total || 0, icon: '👥', color: '#6366f1' },
    { label: 'Active', value: data?.stats?.active || 0, icon: '✅', color: '#10b981' },
    { label: 'Departments', value: data?.deptStats?.length || 0, icon: '🏢', color: '#ec4899' },
    { label: 'Growth Rate', value: `${data?.stats?.growthRate || 0}%`, icon: '📈', color: '#f59e0b', isString: true }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p className="page-subtitle">Comprehensive workforce insights and data exports</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => handleExport('csv')}>↓ Export CSV</button>
          <button className="btn btn-secondary" onClick={() => handleExport('excel')}>↓ Export Excel</button>
          <button className="btn btn-secondary" onClick={() => handleExport('json')}>↓ Export JSON</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {SUMMARY.map((s, i) => (
          <motion.div key={i} className="card" style={{ padding: 22 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} whileHover={{ y: -4 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>{s.icon}</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color }} />
              </div>
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 30, fontWeight: 800, color: s.color }}>{s.isString ? s.value : s.value.toLocaleString()}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500, marginTop: 4 }}>{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="charts-grid" style={{ marginBottom: 24 }}>
        <motion.div className="card" style={{ padding: 24, height: 320 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>Employees by Department</div>
          {deptData ? <Bar data={deptData} options={chartOpts} /> : <div className="skeleton" style={{ height: '100%' }} />}
        </motion.div>

        <motion.div className="card" style={{ padding: 24, height: 320 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>Employment Status Breakdown</div>
          {statusData ? <Doughnut data={statusData} options={{ ...chartOpts, scales: undefined, cutout: '60%' }} /> : <div className="skeleton" style={{ height: '100%' }} />}
        </motion.div>

        <motion.div className="card" style={{ padding: 24, height: 320, gridColumn: 'span 2' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>Hiring Trend (Last 12 Months)</div>
          {trendData ? <Line data={trendData} options={chartOpts} /> : <div className="skeleton" style={{ height: '100%' }} />}
        </motion.div>

        {user?.role === 'admin' && salaryData && (
          <motion.div className="card" style={{ padding: 24, height: 320, gridColumn: 'span 2' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700 }}>Average Salary by Department</span>
              <span className="badge badge-admin">Admin Only</span>
            </div>
            <Bar data={salaryData} options={chartOpts} />
          </motion.div>
        )}
      </div>

      {/* Department Table Summary */}
      <motion.div className="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <div className="card-header" style={{ paddingBottom: 0 }}>
          <h3 className="card-title">Department Summary</h3>
        </div>
        <div className="table-container" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Employees</th>
                <th>Active</th>
                <th>Fill Rate</th>
                {user?.role === 'admin' && <th>Avg Salary</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? [1, 2, 3].map(i => <tr key={i}><td colSpan={5}><div className="skeleton" style={{ height: 18, margin: '6px 0' }} /></td></tr>) :
                (data?.deptStats || []).map((d, i) => (
                  <tr key={i}>
                    <td><span style={{ fontWeight: 600 }}>{d._id}</span></td>
                    <td>{d.count}</td>
                    <td><span className="badge badge-active">{d.active}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: 'rgba(99,102,241,0.1)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${d.count > 0 ? (d.active / d.count * 100) : 0}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #10b981)', transition: 'width 1s ease' }} />
                        </div>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 32 }}>{d.count > 0 ? Math.round(d.active / d.count * 100) : 0}%</span>
                      </div>
                    </td>
                    {user?.role === 'admin' && <td><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5 }}>${Math.round(d.avgSalary || 0).toLocaleString()}</span></td>}
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
