import React, { useState, useEffect } from 'react';
import { usersAPI } from '../../api';
import { PageHeader, Badge, Modal, FormField, EmptyState, Spinner, ToastContainer } from '../../components/common';
import { useToast } from '../../hooks';

const ROLES = ['ADMIN','COUNSELLOR','TRAINER','STUDENT'];

export default function UsersPage() {
  const [users,      setUsers]      = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState({ name:'', email:'', password:'', role:'COUNSELLOR', phone:'' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await usersAPI.getAll(roleFilter || undefined);
      setUsers(res.data?.data || []);
    } catch { addToast('Failed to load users', 'error'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, [roleFilter]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await usersAPI.create(form);
      addToast('User created successfully', 'success');
      setShowModal(false);
      setForm({ name:'', email:'', password:'', role:'COUNSELLOR', phone:'' });
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create user', 'error');
    } finally { setSubmitting(false); }
  };

  const handleToggle = async (user) => {
    try {
      await usersAPI.update(user.id, { name: user.name, phone: user.phone, active: !user.isActive });
      addToast(`User ${user.isActive ? 'deactivated' : 'activated'}`, 'success');
      load();
    } catch { addToast('Failed', 'error'); }
  };

  const grouped = ROLES.reduce((acc, r) => {
    acc[r] = users.filter(u => u.role === r);
    return acc;
  }, {});

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
      <PageHeader
        title="Users & Roles"
        subtitle={`${users.length} total users`}
        actions={<button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>}
      />

      {/* Role tabs */}
      <div style={{ display:'flex', gap: 4, flexWrap:'wrap' }}>
        <button
          onClick={() => setRoleFilter('')}
          className="btn btn-sm"
          style={{
            background: roleFilter === '' ? 'var(--color-accent)' : 'var(--color-surface)',
            color:      roleFilter === '' ? '#fff' : 'var(--color-text-muted)',
            border:     `1px solid ${roleFilter === '' ? 'var(--color-accent)' : 'var(--color-border)'}`,
          }}
        >All ({users.length})</button>
        {ROLES.map(r => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className="btn btn-sm"
            style={{
              background: roleFilter === r ? 'var(--color-accent)' : 'var(--color-surface)',
              color:      roleFilter === r ? '#fff' : 'var(--color-text-muted)',
              border:     `1px solid ${roleFilter === r ? 'var(--color-accent)' : 'var(--color-border)'}`,
            }}
          >
            {r.charAt(0) + r.slice(1).toLowerCase()} ({grouped[r]?.length || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:40 }}><Spinner size={24}/></div>
      ) : users.length === 0 ? (
        <div className="card"><EmptyState icon="👥" title="No users found"/></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th><th>Role</th><th>Phone</th>
                  <th>Status</th><th>Created</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius:'50%',
                          background: 'var(--color-accent-light)',
                          color: 'var(--color-accent)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}>{u.name?.[0]?.toUpperCase()}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{u.name}</div>
                          <div style={{ fontSize: 11, color:'var(--color-text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge value={u.role}/></td>
                    <td style={{ color:'var(--color-text-muted)', fontSize:12 }}>{u.phone || '—'}</td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ fontSize:11, color:'var(--color-text-muted)' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                        onClick={() => handleToggle(u)}
                        style={{ fontSize: 11 }}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        open={showModal}
        title="Add New User"
        onClose={() => setShowModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? <><Spinner size={13}/> Creating…</> : 'Create User'}
            </button>
          </>
        }
      >
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="grid-2" style={{ gap:12 }}>
            <FormField label="Full Name" required>
              <input className="form-control" placeholder="John Doe"
                value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
            </FormField>
            <FormField label="Phone">
              <input className="form-control" placeholder="10-digit number"
                value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/>
            </FormField>
          </div>
          <FormField label="Email" required>
            <input className="form-control" type="email" placeholder="user@example.com"
              value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/>
          </FormField>
          <FormField label="Password" required>
            <input className="form-control" type="password" placeholder="Min. 6 characters"
              value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required/>
          </FormField>
          <FormField label="Role" required>
            <select className="form-control form-select" value={form.role}
              onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              {ROLES.map(r => <option key={r} value={r}>{r.charAt(0)+r.slice(1).toLowerCase()}</option>)}
            </select>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}
