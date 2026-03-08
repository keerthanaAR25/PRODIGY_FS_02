import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import toast from 'react-hot-toast';

const DEPTS = ['Engineering','Design','HR','Marketing','Finance','Sales','Product','Operations'];
const TYPES = ['Full-time','Part-time','Contract','Intern','Remote'];
const STATUSES = ['Active','Inactive','On Leave','Terminated'];
const ROLE_SUGGESTIONS = {
  Engineering: ['Senior Developer','Backend Developer','Frontend Developer','Full Stack Engineer','DevOps Engineer','QA Engineer'],
  Design: ['UI/UX Designer','Product Designer','Graphic Designer','Motion Designer','Design Lead','Creative Director'],
  HR: ['HR Manager','Recruiter','HR Generalist','Talent Acquisition','People Operations','HR Business Partner'],
  Marketing: ['Marketing Manager','SEO Specialist','Content Strategist','Brand Manager','Growth Hacker','Social Media Manager'],
  Finance: ['Financial Analyst','Accountant','CFO','Finance Manager','Budget Analyst','Controller'],
  Sales: ['Sales Executive','Account Manager','Sales Manager','Business Development','Inside Sales','VP Sales'],
  Product: ['Product Manager','Product Owner','Senior PM','VP Product','Product Analyst','Scrum Master'],
  Operations: ['Operations Manager','COO','Process Analyst','Supply Chain Manager','Office Manager','Business Analyst']
};

const INIT = { firstName:'', lastName:'', email:'', phone:'', department:'Engineering', role:'', salary:'', joiningDate:'', status:'Active', employmentType:'Full-time', address:'', skills:[] };

export default function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [roleSuggestions, setRoleSuggestions] = useState([]);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const navigate = useNavigate();
  const autoSaveTimer = useRef(null);
  const DRAFT_KEY = 'empaxis_employee_draft';

  useEffect(() => {
    if (isEdit) {
      api.get(`/employees/${id}`).then(r => {
        const e = r.data.employee;
        setForm({ firstName: e.firstName || '', lastName: e.lastName || '', email: e.email || '', phone: e.phone || '', department: e.department || 'Engineering', role: e.role || '', salary: e.salary || '', joiningDate: e.joiningDate ? e.joiningDate.slice(0,10) : '', status: e.status || 'Active', employmentType: e.employmentType || 'Full-time', address: e.address || '', skills: e.skills || [] });
        if (e.avatar) setAvatarPreview(e.avatar.startsWith('http') ? e.avatar : `http://localhost:5000${e.avatar}`);
      }).catch(() => toast.error('Failed to load employee'));
    } else {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        if (Object.values(parsed).some(v => v)) {
          if (window.confirm('📋 Auto-saved draft found. Load it?')) {
            setForm(f => ({ ...f, ...parsed }));
            toast.success('Draft loaded');
          } else { localStorage.removeItem(DRAFT_KEY); }
        }
      }
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (!isEdit) {
      clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => {
        if (form.firstName || form.email) localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
      }, 3000);
    }
    return () => clearTimeout(autoSaveTimer.current);
  }, [form, isEdit]);

  useEffect(() => {
    setRoleSuggestions(ROLE_SUGGESTIONS[form.department] || []);
  }, [form.department]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name required';
    if (!form.lastName.trim()) e.lastName = 'Last name required';
    if (!form.email.trim()) e.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.role.trim()) e.role = 'Role required';
    if (!form.department) e.department = 'Department required';
    if (!form.joiningDate) e.joiningDate = 'Joining date required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) { toast.error('Please fix validation errors'); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k === 'skills') fd.append(k, JSON.stringify(v)); else fd.append(k, v); });
      if (avatarFile) fd.append('avatar', avatarFile);
      if (isEdit) await api.put(`/employees/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      else await api.post('/employees', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      localStorage.removeItem(DRAFT_KEY);
      toast.success(isEdit ? 'Employee updated!' : 'Employee created! 🎉');
      navigate('/employees');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to save'); }
    finally { setLoading(false); }
  };

  const addSkill = (s) => { if (s && !form.skills.includes(s)) { set('skills', [...form.skills, s]); setSkillInput(''); } };
  const removeSkill = (s) => set('skills', form.skills.filter(x => x !== s));

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdit ? '✏️ Edit Employee' : '➕ New Employee'}</h1>
          <p className="page-subtitle">{isEdit ? 'Update employee information' : 'Create a new employee record'}</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/employees')}>← Back</button>
      </div>

      <motion.div className="card" style={{ padding: 32 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <form onSubmit={handleSubmit}>
          {/* Avatar */}
          <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 20 }}>
            <div className="avatar-upload">
              <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff', overflow: 'hidden', border: '3px solid rgba(99,102,241,0.3)' }}>
                {avatarPreview ? <img src={avatarPreview} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (form.firstName?.[0] || '?')}
              </div>
              <label className="avatar-upload-btn" htmlFor="avatarInput" title="Upload photo">📷</label>
              <input id="avatarInput" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{form.firstName} {form.lastName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12.5, marginTop: 4 }}>Click camera to upload profile photo</div>
            </div>
          </div>

          {/* Personal Info */}
          <div style={{ marginBottom: 8, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Personal Information</div>
          <div className="form-grid" style={{ marginBottom: 18 }}>
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input className={`form-input ${errors.firstName?'error':''}`} value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Alice" />
              {errors.firstName && <div className="form-error">{errors.firstName}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input className={`form-input ${errors.lastName?'error':''}`} value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Johnson" />
              {errors.lastName && <div className="form-error">{errors.lastName}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input className={`form-input ${errors.email?'error':''}`} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="alice@company.com" />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1-555-0101" />
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main St, City, State" />
            </div>
          </div>

          {/* Job Info */}
          <div style={{ marginBottom: 8, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Job Information</div>
          <div className="form-grid" style={{ marginBottom: 18 }}>
            <div className="form-group">
              <label className="form-label">Department *</label>
              <select className={`form-input form-select ${errors.department?'error':''}`} value={form.department} onChange={e => set('department', e.target.value)}>
                {DEPTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Role / Title *</label>
              <input className={`form-input ${errors.role?'error':''}`} value={form.role} onChange={e => set('role', e.target.value)} placeholder="Senior Developer" />
              {errors.role && <div className="form-error">{errors.role}</div>}
              {roleSuggestions.length > 0 && (
                <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {roleSuggestions.map(s => <span key={s} className="skill-pill" onClick={() => set('role', s)}>{s}</span>)}
                </div>
              )}
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>⚡ AI suggestions for {form.department}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select className="form-input form-select" value={form.employmentType} onChange={e => set('employmentType', e.target.value)}>
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-input form-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Annual Salary ($)</label>
              <input className="form-input" type="number" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="75000" />
            </div>
            <div className="form-group">
              <label className="form-label">Joining Date *</label>
              <input className={`form-input ${errors.joiningDate?'error':''}`} type="date" value={form.joiningDate} onChange={e => set('joiningDate', e.target.value)} />
              {errors.joiningDate && <div className="form-error">{errors.joiningDate}</div>}
            </div>
          </div>

          {/* Skills */}
          <div style={{ marginBottom: 8, fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: 'var(--accent-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skills</div>
          <div className="form-group">
            <div style={{ display: 'flex', gap: 10 }}>
              <input className="form-input" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput.trim()); } }} placeholder="Type skill and press Enter…" style={{ flex: 1 }} />
              <button type="button" className="btn btn-secondary" onClick={() => addSkill(skillInput.trim())}>+ Add</button>
            </div>
            {form.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                {form.skills.map(s => (
                  <span key={s} className="skill-pill" onClick={() => removeSkill(s)}>{s} ✕</span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/employees')}>Cancel</button>
            <motion.button type="submit" className="btn btn-primary" disabled={loading} whileTap={{ scale: 0.97 }}>
              {loading ? '⏳ Saving…' : isEdit ? '✓ Update Employee' : '+ Create Employee'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

