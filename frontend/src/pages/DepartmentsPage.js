import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const DEPT_COLORS = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];

const INIT = { name:'', code:'', description:'', location:'', budget:'', color:'#6366f1' };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(INIT);
  const [editId, setEditId] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const { user } = useAuth();

  const fetch = () => {
    setLoading(true);
    api.get('/departments').then(r => { setDepartments(r.data.departments); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const openCreate = () => { setForm(INIT); setEditId(null); setModal('create'); };
  const openEdit = (d) => { setForm({ name: d.name, code: d.code, description: d.description, location: d.location, budget: d.budget, color: d.color || '#6366f1' }); setEditId(d._id); setModal('edit'); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) { await api.put(`/departments/${editId}`, form); toast.success('Department updated!'); }
      else { await api.post('/departments', form); toast.success('Department created!'); }
      setModal(null); fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
  };

  const handleDelete = async (dep) => {
    try {
      await api.delete(`/departments/${dep._id}`);
      toast.success('Department deleted');
      setDeleteModal(null); fetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete'); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">{departments.length} departments · Manage your organizational structure</p>
        </div>
        {user?.role === 'admin' && <button className="btn btn-primary" onClick={openCreate}>➕ New Department</button>}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => <div key={i} className="card skeleton" style={{ height: 180 }} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {departments.map((dep, i) => (
            <motion.div key={dep._id} className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: dep.color || '#6366f1' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 13, background: `${dep.color || '#6366f1'}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: `2px solid ${dep.color || '#6366f1'}40` }}>
                  🏢
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {user?.role === 'admin' && <>
                    <button className="btn btn-secondary btn-icon btn-sm" onClick={() => openEdit(dep)}>✏️</button>
                    <button className="btn btn-danger btn-icon btn-sm" onClick={() => setDeleteModal(dep)}>🗑</button>
                  </>}
                </div>
              </div>

              <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{dep.name}</h3>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: dep.color || '#6366f1', background: `${dep.color || '#6366f1'}15`, padding: '2px 8px', borderRadius: 6, display: 'inline-block', marginBottom: 10 }}>{dep.code}</div>
              {dep.description && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.5 }}>{dep.description}</p>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 'auto' }}>
                <div style={{ background: 'rgba(99,102,241,0.06)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: dep.color || '#6366f1' }}>{dep.employeeCount}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employees</div>
                </div>
                {dep.avgSalary > 0 && (
                  <div style={{ background: 'rgba(16,185,129,0.06)', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: '#10b981' }}>${Math.round(dep.avgSalary / 1000)}k</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg Salary</div>
                  </div>
                )}
              </div>
              {dep.location && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>📍 {dep.location}</div>}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="modal-close" onClick={() => setModal(null)}>✕</div>
              <div className="modal-header">
                <div className="modal-title">{modal === 'edit' ? '✏️ Edit Department' : '➕ New Department'}</div>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Department Name *</label>
                    <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Engineering" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Code *</label>
                    <input className="form-input" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="ENG" required maxLength={6} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input" value={form.description} onChange={e => set('description', e.target.value)} placeholder="What does this department do?" rows={2} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={form.location} onChange={e => set('location', e.target.value)} placeholder="Floor 3" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Budget ($)</label>
                    <input className="form-input" type="number" value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="500000" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Color Theme</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {DEPT_COLORS.map(c => (
                      <div key={c} onClick={() => set('color', c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: form.color === c ? '3px solid white' : '3px solid transparent', boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none', transition: 'all 0.2s' }} />
                    ))}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{modal === 'edit' ? '✓ Update' : '+ Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className="modal-close" onClick={() => setDeleteModal(null)}>✕</div>
              <div className="modal-header">
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                <div className="modal-title">Delete Department?</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 8 }}>
                  Delete <strong>{deleteModal.name}</strong>? This can't be undone. Departments with active employees cannot be deleted.
                </p>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteModal)}>Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

