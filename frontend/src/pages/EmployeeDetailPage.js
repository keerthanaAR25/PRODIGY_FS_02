import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_BADGE = { Active:'badge-active', Inactive:'badge-inactive', 'On Leave':'badge-leave', Terminated:'badge-terminated' };
const STATUS_COLOR = { Active:'#10b981', Inactive:'#6366f1', 'On Leave':'#f59e0b', Terminated:'#ef4444' };

function Field({ label, value }) {
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid rgba(99,102,241,0.07)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emp, setEmp] = useState(null);
  const [tab, setTab] = useState('info');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/employees/${id}`).then(r => { setEmp(r.data.employee); setLoading(false); }).catch(() => { toast.error('Employee not found'); navigate('/employees'); });
  }, [id]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      const { data } = await api.post(`/employees/${id}/notes`, { text: note });
      setEmp(data.employee); setNote('');
      toast.success('Note added');
    } catch { toast.error('Failed to add note'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading…</div>;
  if (!emp) return null;

  const initials = (emp.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employee Profile</h1>
          <p className="page-subtitle">{emp.employeeId}</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/employees')}>← Back</button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button className="btn btn-primary" onClick={() => navigate(`/employees/${id}/edit`)}>✏️ Edit</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
        {/* Left Profile Card */}
        <motion.div className="card" style={{ padding: 28, textAlign: 'center' }} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div style={{ width: 90, height: 90, borderRadius: 24, background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 auto 16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(99,102,241,0.4)' }}>
            {emp.avatar ? <img src={emp.avatar.startsWith('http') ? emp.avatar : `http://localhost:5000${emp.avatar}`} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, marginBottom: 4 }}>{emp.name}</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 12 }}>{emp.role}</div>
          <span className={`badge ${STATUS_BADGE[emp.status]||'badge-inactive'}`} style={{ fontSize: 13 }}>● {emp.status}</span>

          <div style={{ marginTop: 20, padding: '16px 0', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontSize: 16 }}>📧</span><span style={{ fontSize: 12.5, wordBreak: 'break-all' }}>{emp.email}</span></div>
            {emp.phone && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontSize: 16 }}>📞</span><span style={{ fontSize: 12.5 }}>{emp.phone}</span></div>}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontSize: 16 }}>🏢</span><span style={{ fontSize: 12.5 }}>{emp.department}</span></div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ fontSize: 16 }}>📅</span><span style={{ fontSize: 12.5 }}>{emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM dd, yyyy') : '—'}</span></div>
          </div>

          {emp.skills?.length > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10, textAlign: 'left' }}>Skills</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {emp.skills.map(s => <span key={s} className="skill-pill">{s}</span>)}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Detail Panel */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="tabs" style={{ marginBottom: 16 }}>
            {['info','timeline', ...(user?.role === 'admin' ? ['notes'] : [])].map(t => (
              <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                {t === 'info' ? '📄 Info' : t === 'timeline' ? '📅 Timeline' : '📝 Notes'}
              </button>
            ))}
          </div>

          {tab === 'info' && (
            <div className="card" style={{ padding: '4px 24px' }}>
              <div className="form-grid">
                <div><Field label="Employee ID" value={emp.employeeId} /><Field label="Department" value={emp.department} /><Field label="Employment Type" value={emp.employmentType} />{user?.role === 'admin' && <Field label="Annual Salary" value={emp.salary ? `$${emp.salary.toLocaleString()}` : undefined} />}</div>
                <div><Field label="Role / Title" value={emp.role} /><Field label="Status" value={emp.status} /><Field label="Joining Date" value={emp.joiningDate ? format(new Date(emp.joiningDate), 'MMMM dd, yyyy') : undefined} /><Field label="Manager" value={emp.managerName} /></div>
              </div>
              {emp.address && <Field label="Address" value={emp.address} />}
            </div>
          )}

          {tab === 'timeline' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 20 }}>Status History</h3>
              {(!emp.statusHistory || emp.statusHistory.length === 0) ? (
                <div className="empty-state" style={{ padding: 40 }}><div className="empty-icon">📅</div><div className="empty-title">No status changes yet</div></div>
              ) : (
                <div className="timeline">
                  {[...emp.statusHistory].reverse().map((s, i) => (
                    <div key={i} className="timeline-item">
                      <div className="timeline-dot" style={{ color: STATUS_COLOR[s.status] || '#6366f1' }} />
                      <div className="timeline-content">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <span className={`badge ${STATUS_BADGE[s.status]||'badge-inactive'}`}>{s.status}</span>
                          <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>by {s.changedBy}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.changedAt ? format(new Date(s.changedAt), 'MMM dd, yyyy HH:mm') : '—'}</div>
                        {s.reason && <div style={{ fontSize: 12.5, marginTop: 6, color: 'var(--text-secondary)' }}>{s.reason}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'notes' && user?.role === 'admin' && (
            <div className="card" style={{ padding: 24 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, marginBottom: 16 }}>Admin Notes</h3>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <textarea className="form-input" value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note about this employee…" rows={3} style={{ flex: 1, resize: 'vertical' }} />
                <button className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }} onClick={handleAddNote}>+ Add</button>
              </div>
              {(!emp.notes || emp.notes.length === 0) ? (
                <div className="empty-state" style={{ padding: 30 }}><div className="empty-icon">📝</div><div className="empty-title">No notes yet</div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[...emp.notes].reverse().map((n, i) => (
                    <div key={i} style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontSize: 13.5, marginBottom: 8, lineHeight: 1.6 }}>{n.text}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>by {n.addedBy} · {n.addedAt ? format(new Date(n.addedAt), 'MMM dd, yyyy HH:mm') : '—'}</div>
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

