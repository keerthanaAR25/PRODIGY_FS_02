import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function TrashPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hardDeleteModal, setHardDeleteModal] = useState(null);

  const fetch = () => { setLoading(true); api.get('/employees?deleted=true&limit=100').then(r => { setEmployees(r.data.employees); setLoading(false); }).catch(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const restore = async (emp) => {
    try { await api.patch(`/employees/${emp._id}/restore`); toast.success(`${emp.name} restored!`); fetch(); }
    catch { toast.error('Restore failed'); }
  };

  const hardDelete = async (emp) => {
    try { await api.delete(`/employees/${emp._id}/hard`); toast.success(`${emp.name} permanently deleted`); setHardDeleteModal(null); fetch(); }
    catch { toast.error('Delete failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🗑 Trash</h1>
          <p className="page-subtitle">{employees.length} deleted employees · Restore or permanently delete</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="card skeleton" style={{ height: 160 }} />)}
        </div>
      ) : employees.length === 0 ? (
        <div className="empty-state card" style={{ padding: 80 }}>
          <div className="empty-icon">⊘</div>
          <div className="empty-title">Trash is empty</div>
          <div className="empty-desc">Deleted employees will appear here and can be restored</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
          {employees.map((emp, i) => {
            const initials = (emp.name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
            return (
              <motion.div key={emp._id} className="card" style={{ padding: 20, border: '1px solid rgba(239,68,68,0.2)' }}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700, color: '#ef4444', border: '2px solid rgba(239,68,68,0.25)' }}>{initials}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{emp.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.employeeId}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginBottom: 6 }}>🏢 {emp.department}</div>
                <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '6px 10px', marginBottom: 14 }}>
                  ⊗ Deleted {emp.deletedAt ? format(new Date(emp.deletedAt), 'MMM dd, yyyy') : '—'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-success btn-sm" style={{ flex: 1 }} onClick={() => restore(emp)}>↻ Restore</button>
                  <button className="btn btn-danger btn-icon btn-sm" title="Permanently delete" onClick={() => setHardDeleteModal(emp)}>⊗</button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {hardDeleteModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className="modal-close" onClick={() => setHardDeleteModal(null)}>✕</div>
              <div className="modal-header">
                <div style={{ fontSize: 36, marginBottom: 12 }}>💥</div>
                <div className="modal-title">Permanent Deletion</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 8 }}>
                  Permanently delete <strong>{hardDeleteModal.name}</strong>? This action <strong>cannot be undone</strong>.
                </p>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setHardDeleteModal(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => hardDelete(hardDeleteModal)}>⊗ Delete Forever</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

