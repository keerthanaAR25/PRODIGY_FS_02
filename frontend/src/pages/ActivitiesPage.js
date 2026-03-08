import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../utils/api';

const ACTIONS = ['All','LOGIN','LOGOUT','CREATE_EMPLOYEE','UPDATE_EMPLOYEE','DELETE_EMPLOYEE','RESTORE_EMPLOYEE','HARD_DELETE','BULK_DELETE','BULK_UPDATE','EXPORT','IMPORT','CREATE_DEPARTMENT','UPDATE_DEPARTMENT','DELETE_DEPARTMENT','CHANGE_PASSWORD'];
const ACTION_ICON = { LOGIN:'🔐', LOGOUT:'🚪', CREATE_EMPLOYEE:'➕', UPDATE_EMPLOYEE:'✏️', DELETE_EMPLOYEE:'🗑', RESTORE_EMPLOYEE:'↩️', HARD_DELETE:'💥', BULK_DELETE:'🗑', BULK_UPDATE:'✏️', EXPORT:'📤', IMPORT:'📥', CREATE_DEPARTMENT:'🏢', UPDATE_DEPARTMENT:'🏢', DELETE_DEPARTMENT:'🏚', CHANGE_PASSWORD:'🔑' };
const ACTION_COLOR = { LOGIN:'#10b981', LOGOUT:'#f59e0b', CREATE_EMPLOYEE:'#6366f1', UPDATE_EMPLOYEE:'#3b82f6', DELETE_EMPLOYEE:'#ef4444', RESTORE_EMPLOYEE:'#10b981', HARD_DELETE:'#ef4444', EXPORT:'#8b5cf6', IMPORT:'#06b6d4', CREATE_DEPARTMENT:'#ec4899' };

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  const fetch = () => {
    setLoading(true);
    const q = new URLSearchParams({ page, limit: 25, ...(action !== 'All' ? { action } : {}) });
    api.get(`/activities?${q}`).then(r => { setActivities(r.data.activities); setPagination(r.data.pagination); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [action, page]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activity Logs</h1>
          <p className="page-subtitle">{pagination.total} total events · Audit trail of all system actions</p>
        </div>
        <select className="form-input form-select" value={action} onChange={e => { setAction(e.target.value); setPage(1); }} style={{ width: 200, margin: 0 }}>
          {ACTIONS.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th><th>Action</th><th>Target</th><th>Status</th><th>IP</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length: 8}).map((_, i) => (
                <tr key={i}><td colSpan={6}><div className="skeleton" style={{ height: 20, margin: '8px 0' }} /></td></tr>
              )) : activities.length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon">📋</div><div className="empty-title">No activities found</div></div></td></tr>
              ) : activities.map((act, i) => (
                <motion.tr key={act._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: `${ACTION_COLOR[act.action] || '#6366f1'}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                        {ACTION_ICON[act.action] || '📋'}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{act.userName || 'System'}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ background: `${ACTION_COLOR[act.action] || '#6366f1'}20`, color: ACTION_COLOR[act.action] || '#818cf8', padding: '3px 10px', borderRadius: 99, fontSize: 11.5, fontWeight: 600, fontFamily: "'JetBrains Mono',monospace" }}>
                      {act.action?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{act.target || '—'}</span></td>
                  <td>
                    <span className={`badge ${act.status === 'success' ? 'badge-active' : 'badge-terminated'}`}>{act.status}</span>
                  </td>
                  <td><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, color: 'var(--text-muted)' }}>{act.ip || '—'}</span></td>
                  <td>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{format(new Date(act.createdAt), 'MMM dd HH:mm')}</div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid var(--border)', justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
            <span style={{ padding: '6px 12px', fontSize: 13 }}>Page {page} of {pagination.pages}</span>
            <button className="btn btn-secondary btn-sm" disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}

