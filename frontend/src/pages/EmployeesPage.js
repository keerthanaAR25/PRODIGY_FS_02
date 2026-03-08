import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const DEPTS = ['All','Engineering','Design','HR','Marketing','Finance','Sales','Product','Operations'];
const STATUSES = ['All','Active','Inactive','On Leave','Terminated'];
const SORTS = [
  { value:'newest', label:'Newest First' },{ value:'oldest', label:'Oldest First' },
  { value:'name_asc', label:'Name A-Z' },{ value:'name_desc', label:'Name Z-A' },
  { value:'salary_high', label:'Highest Salary' },{ value:'salary_low', label:'Lowest Salary' }
];
const STATUS_BADGE = { Active:'badge-active', Inactive:'badge-inactive', 'On Leave':'badge-leave', Terminated:'badge-terminated' };

function Avatar({ name, size = 36 }) {
  const initials = (name || '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6','#8b5cf6','#06b6d4','#ef4444'];
  const bg = colors[name?.charCodeAt(0) % colors.length] || '#6366f1';
  return <div style={{ width: size, height: size, borderRadius: 10, background: `${bg}30`, border: `2px solid ${bg}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.35, fontWeight: 700, color: bg, flexShrink: 0 }}>{initials}</div>;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState([]);
  const [importModal, setImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [deleteModal, setDeleteModal] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const searchTimer = useRef(null);

  const fetchEmployees = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ search, department: dept === 'All' ? '' : dept, status: status === 'All' ? '' : status, sort, page, limit, ...params });
      const { data } = await api.get(`/employees?${q}`);
      setEmployees(data.employees);
      setPagination(data.pagination);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  }, [search, dept, status, sort, page, limit]);

  useEffect(() => { fetchEmployees(); }, [dept, status, sort, page, limit]);
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); fetchEmployees({ search, page: 1 }); }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const handleDelete = async (emp) => {
    try {
      await api.delete(`/employees/${emp._id}`);
      toast.success(`${emp.name} moved to trash`);
      setDeleteModal(null);
      fetchEmployees();
    } catch (err) { toast.error(err.response?.data?.error || 'Delete failed'); }
  };

  const handleBulkDelete = async () => {
    if (!selected.length) return;
    try {
      await api.post('/employees/bulk-delete', { ids: selected });
      toast.success(`${selected.length} employees moved to trash`);
      setSelected([]);
      fetchEmployees();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleBulkExport = async (format) => {
    try {
      const res = await api.get(`/employees/export?format=${format}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `employees_${Date.now()}.${format === 'excel' ? 'xlsx' : format}`;
      a.click(); window.URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
  };

  const handleImport = async () => {
    try {
      const lines = importText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const employees = lines.slice(1).filter(l => l.trim()).map(line => {
        const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g,''));
        const obj = {};
        headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
        if (obj.salary) obj.salary = Number(obj.salary);
        return obj;
      });
      const { data } = await api.post('/employees/bulk-import', { employees });
      toast.success(data.message);
      setImportModal(false); setImportText('');
      fetchEmployees();
    } catch (err) { toast.error(err.response?.data?.error || 'Import failed'); }
  };

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === employees.length ? [] : employees.map(e => e._id));
  const clearFilters = () => { setSearch(''); setDept('All'); setStatus('All'); setSort('newest'); setPage(1); };
  const hasFilters = search || dept !== 'All' || status !== 'All' || sort !== 'newest';

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">{pagination.total} total employees across all departments</p>
        </div>
        <div className="page-actions">
          {user?.role === 'admin' && <>
            <button className="btn btn-secondary btn-sm" onClick={() => setImportModal(true)}>⊕ Import CSV</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkExport('csv')}>↓ CSV</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkExport('excel')}>↓ Excel</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleBulkExport('json')}>↓ JSON</button>
            <button className="btn btn-primary" onClick={() => navigate('/employees/new')}>➕ Add Employee</button>
          </>}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 18 }}>
        <div className="filter-bar">
          <div className="search-bar-wrap" style={{ flex: 1, minWidth: 200 }}>
            <span className="search-icon">🔍</span>
            <input className="form-input search-input" placeholder="Search by name, email, ID, role…" value={search} onChange={e => setSearch(e.target.value)} style={{ margin: 0 }} />
          </div>
          <select className="form-input form-select" value={dept} onChange={e => { setDept(e.target.value); setPage(1); }} style={{ width: 150, margin: 0 }}>
            {DEPTS.map(d => <option key={d}>{d}</option>)}
          </select>
          <select className="form-input form-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ width: 140, margin: 0 }}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select className="form-input form-select" value={sort} onChange={e => setSort(e.target.value)} style={{ width: 160, margin: 0 }}>
            {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {hasFilters && <button className="btn btn-secondary btn-sm" onClick={clearFilters}>✕ Clear</button>}
        </div>
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div className="bulk-bar" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <span style={{ fontWeight: 600, fontSize: 13.5 }}>{selected.length} selected</span>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>🗑 Delete Selected</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected([])}>Cancel</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                {user?.role === 'admin' && <th><input type="checkbox" className="table-checkbox" checked={selected.length === employees.length && employees.length > 0} onChange={toggleAll} /></th>}
                <th>Employee</th>
                <th>Department</th>
                <th>Status</th>
                <th>Type</th>
                {user?.role === 'admin' && <th>Salary</th>}
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length: 6}).map((_, i) => (
                <tr key={i}><td colSpan={8}><div className="skeleton" style={{ height: 20, margin: '8px 0' }} /></td></tr>
              )) : employees.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon">👥</div><div className="empty-title">No employees found</div><div className="empty-desc">Try adjusting your search or filters</div></div></td></tr>
              ) : employees.map((emp, i) => (
                <motion.tr key={emp._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                  {user?.role === 'admin' && <td><input type="checkbox" className="table-checkbox" checked={selected.includes(emp._id)} onChange={() => toggleSelect(emp._id)} /></td>}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={emp.name} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{emp.name}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{emp.employeeId} · {emp.role}</div>
                      </div>
                    </div>
                  </td>
                  <td><span style={{ fontSize: 13 }}>{emp.department}</span></td>
                  <td><span className={`badge ${STATUS_BADGE[emp.status] || 'badge-inactive'}`}>● {emp.status}</span></td>
                  <td><span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{emp.employmentType}</span></td>
                  {user?.role === 'admin' && <td><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5 }}>${(emp.salary || 0).toLocaleString()}</span></td>}
                  <td><span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>{emp.joiningDate ? format(new Date(emp.joiningDate), 'MMM dd, yyyy') : '—'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-secondary btn-icon btn-sm" title="View" onClick={() => navigate(`/employees/${emp._id}`)}>👁</button>
                      {(user?.role === 'admin' || user?.role === 'manager') && <button className="btn btn-secondary btn-icon btn-sm" title="Edit" onClick={() => navigate(`/employees/${emp._id}/edit`)}>✏️</button>}
                      {user?.role === 'admin' && <button className="btn btn-danger btn-icon btn-sm" title="Delete" onClick={() => setDeleteModal(emp)}>🗑</button>}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border)', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Page {pagination.page} of {pagination.pages} · {pagination.total} total
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
              {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="btn btn-secondary btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next ›</button>
              <select className="form-input form-select btn-sm" value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} style={{ width: 80, margin: 0, padding: '6px 10px', fontSize: 12 }}>
                {[10,25,50,100].map(l => <option key={l} value={l}>{l}/page</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="modal-close" onClick={() => setDeleteModal(null)}>✕</div>
              <div className="modal-header">
                <div style={{ fontSize: 36, marginBottom: 12 }}>🗑</div>
                <div className="modal-title">Move to Trash?</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 8 }}>
                  Move <strong>{deleteModal.name}</strong> to trash? They can be restored later from the Trash page.
                </p>
              </div>
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setDeleteModal(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteModal)}>Move to Trash</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Modal */}
      <AnimatePresence>
        {importModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal modal-lg" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="modal-close" onClick={() => setImportModal(false)}>✕</div>
              <div className="modal-header">
                <div className="modal-title">Import Employees via CSV</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, marginTop: 8 }}>
                  Required headers: <code style={{ color: 'var(--accent-light)', background: 'rgba(99,102,241,0.1)', padding: '2px 6px', borderRadius: 4 }}>name,email,phone,role,department,salary,employmentType,status,joiningDate</code>
                </p>
              </div>
              <textarea className="form-input" value={importText} onChange={e => setImportText(e.target.value)} rows={10} placeholder={`name,email,phone,role,department,salary,employmentType,status,joiningDate\nJohn Doe,john@company.com,+1-555-0001,Developer,Engineering,70000,Full-time,Active,2024-01-01`} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, resize: 'vertical' }} />
              <div className="modal-actions">
                <button className="btn btn-secondary" onClick={() => setImportModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={!importText.trim()}>⊕ Import Employees</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

