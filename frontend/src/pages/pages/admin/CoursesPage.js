import React, { useState, useEffect } from 'react';
import { coursesAPI } from '../../api';
import { PageHeader, Badge, Modal, FormField, EmptyState, Spinner, ToastContainer } from '../../components/common';
import { useToast } from '../../hooks';

// ── CoursesPage ───────────────────────────────────────────────────────────────
export function CoursesPage() {
  const [courses,    setCourses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, addToast, removeToast } = useToast();

  const [form, setForm] = useState({
    name:'', code:'', level:'UNDERGRADUATE', durationMonths:'', fee:'', description:''
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await coursesAPI.getAll();
      setCourses(res.data?.data || []);
    } catch { addToast('Failed to load courses', 'error'); }
    finally  { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name:'', code:'', level:'UNDERGRADUATE', durationMonths:'', fee:'', description:'' });
    setShowModal(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    setForm({
      name: course.name, code: course.code, level: course.level,
      durationMonths: course.durationMonths, fee: course.fee, description: course.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, durationMonths: Number(form.durationMonths), fee: parseFloat(form.fee) };
      if (editing) await coursesAPI.update(editing.id, payload);
      else         await coursesAPI.create(payload);
      addToast(editing ? 'Course updated' : 'Course created', 'success');
      setShowModal(false);
      load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Save failed', 'error');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this course?')) return;
    try {
      await coursesAPI.delete(id);
      addToast('Course deactivated', 'success');
      load();
    } catch { addToast('Failed', 'error'); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToastContainer toasts={toasts} onRemove={removeToast}/>
      <PageHeader
        title="Courses"
        subtitle={`${courses.length} active programs`}
        actions={<button className="btn btn-primary" onClick={openCreate}>+ Add Course</button>}
      />

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding: 40 }}><Spinner size={24}/></div>
      ) : courses.length === 0 ? (
        <div className="card"><EmptyState icon="📚" title="No courses yet" text="Add your first course to get started"/></div>
      ) : (
        <div className="grid-2" style={{ gap: 14 }}>
          {courses.map(c => (
            <div key={c.id} className="card" style={{ position: 'relative' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {c.code} · {c.durationMonths} months
                  </div>
                </div>
                <Badge value={c.level}/>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-accent)', margin: '12px 0 4px' }}>
                ₹{Number(c.fee).toLocaleString('en-IN')}
                <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--color-text-muted)' }}>/year</span>
              </div>
              {c.description && (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{c.description}</p>
              )}
              <div style={{ display:'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                <button className="btn btn-danger btn-sm"    onClick={() => handleDelete(c.id)}>Deactivate</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        title={editing ? 'Edit Course' : 'Add Course'}
        onClose={() => setShowModal(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <><Spinner size={13}/> Saving…</> : 'Save Course'}
            </button>
          </>
        }
      >
        <div style={{ display:'flex', flexDirection:'column', gap: 14 }}>
          <div className="grid-2" style={{ gap: 12 }}>
            <FormField label="Course Name" required>
              <input className="form-control" placeholder="e.g. M.Tech CSE"
                value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/>
            </FormField>
            <FormField label="Course Code" required>
              <input className="form-control" placeholder="e.g. MT-CSE"
                value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))}
                disabled={!!editing} required/>
            </FormField>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <FormField label="Level" required>
              <select className="form-control form-select" value={form.level}
                onChange={e=>setForm(f=>({...f,level:e.target.value}))}>
                <option value="UNDERGRADUATE">Undergraduate</option>
                <option value="POSTGRADUATE">Postgraduate</option>
                <option value="DIPLOMA">Diploma</option>
              </select>
            </FormField>
            <FormField label="Duration (months)" required>
              <input className="form-control" type="number" min="1" placeholder="24"
                value={form.durationMonths} onChange={e=>setForm(f=>({...f,durationMonths:e.target.value}))} required/>
            </FormField>
          </div>
          <FormField label="Annual Fee (₹)" required>
            <input className="form-control" type="number" min="1" placeholder="80000"
              value={form.fee} onChange={e=>setForm(f=>({...f,fee:e.target.value}))} required/>
          </FormField>
          <FormField label="Description">
            <textarea className="form-control" rows={3} placeholder="Course overview…"
              value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
          </FormField>
        </div>
      </Modal>
    </div>
  );
}

export default CoursesPage;
