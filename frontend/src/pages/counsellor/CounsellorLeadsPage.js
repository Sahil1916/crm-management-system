import React, { useState, useEffect, useCallback } from 'react';
import { enquiriesAPI, callsAPI, followUpsAPI, coursesAPI } from '../../api';
import {
  PageHeader, Badge, Modal, FormField,
  EmptyState, Spinner, ToastContainer, Pagination
} from '../../components/common';
import { useDebounce, usePagination, useToast } from '../../hooks';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'IN_CONTACT', label: 'In Contact' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'DROPPED', label: 'Dropped' },
];

export default function CounsellorLeadsPage() {
  const { page, size, goTo, resetPage } = usePagination(15);
  const { toasts, addToast, removeToast } = useToast();

  // List state
  const [leads, setLeads] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  // Courses for create modal
  const [courses, setCourses] = useState([]);

  // ── FIX: Create enquiry modal (counsellor creates their own leads) ─────────
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    leadName: '', phone: '', email: '',
    courseId: '', source: '', remarks: '', priority: 'COLD',
  });
  const [createErrors, setCreateErrors] = useState({});

  // Detail panel state
  const [selected, setSelected] = useState(null);
  const [calls, setCalls] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [detailTab, setDetailTab] = useState('calls');
  const [detailLoading, setDetailLoading] = useState(false);

  // Call modal
  const [callModal, setCallModal] = useState(false);
  const [callForm, setCallForm] = useState({ notes: '', outcome: 'INTERESTED' });
  const [callSaving, setCallSaving] = useState(false);

  // Follow-up modal
  const [followModal, setFollowModal] = useState(false);
  const [followForm, setFollowForm] = useState({ remarks: '', followUpDate: '' });
  const [followSaving, setFollowSaving] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  // ── Load leads ────────────────────────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    setListLoading(true);
    try {
      const params = {
        page, size, sort: 'enquiryDate',
        ...(status && { status }),
        ...(debouncedSearch && { search: debouncedSearch }),
      };
      const res = await enquiriesAPI.getAll(params);
      const body = res.data?.data ?? res.data ?? {};
      setLeads(body.content ?? []);
      setTotalPages(body.totalPages ?? 0);
      setTotalItems(body.totalElements ?? body.content?.length ?? 0);
    } catch (e) {
      console.error('Load leads error:', e);
      addToast('Failed to load leads', 'error');
    } finally {
      setListLoading(false);
    }
  }, [page, size, status, debouncedSearch]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  // Load courses for create modal
  useEffect(() => {
    coursesAPI.getAll()
      .then(r => {
        const d = r.data?.data ?? r.data ?? [];
        setCourses(Array.isArray(d) ? d : []);
      })
      .catch(() => { });
  }, []);

  // ── FIX: Create enquiry — counsellor creates lead (auto-assigned to self) ──
  const validateCreate = () => {
    const errors = {};
    if (!createForm.leadName.trim()) errors.leadName = 'Name is required';
    if (!createForm.phone.trim()) errors.phone = 'Phone is required';
    if (!/^[6-9]\d{9}$/.test(createForm.phone.trim()))
      errors.phone = 'Enter valid 10-digit mobile number';
    if (!createForm.courseId) errors.courseId = 'Please select a course';
    return errors;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const errors = validateCreate();
    if (Object.keys(errors).length > 0) { setCreateErrors(errors); return; }

    setCreating(true);
    try {
      await enquiriesAPI.create({
        leadName: createForm.leadName.trim(),
        phone: createForm.phone.trim(),
        email: createForm.email.trim() || null,
        courseId: Number(createForm.courseId),
        counsellorId: null,   // backend auto-assigns to logged-in counsellor
        source: createForm.source || null,
        remarks: createForm.remarks || null,
        priority: createForm.priority,
      });
      addToast('Enquiry created successfully!', 'success');
      setCreateModal(false);
      resetCreateForm();
      loadLeads();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create enquiry', 'error');
    } finally {
      setCreating(false);
    }
  };

  const resetCreateForm = () => {
    setCreateForm({
      leadName: '', phone: '', email: '',
      courseId: '', source: '', remarks: '', priority: 'COLD',
    });
    setCreateErrors({});
  };

  // ── Open detail panel ─────────────────────────────────────────────────────
  const openDetail = async (lead) => {
    setSelected(lead);
    setDetailTab('calls');
    setDetailLoading(true);
    try {
      const [callsRes, followRes] = await Promise.all([
        callsAPI.getByEnquiry(lead.id),
        followUpsAPI.getByEnquiry(lead.id),
      ]);
      setCalls(callsRes.data?.data ?? callsRes.data ?? []);
      setFollowUps(followRes.data?.data ?? followRes.data ?? []);
    } catch (e) {
      addToast('Failed to load lead details', 'error');
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (id, newStatus) => {
    try {
      await enquiriesAPI.updateStatus(id, newStatus);
      addToast('Status updated', 'success');
      setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l));
      if (selected?.id === id) setSelected(s => ({ ...s, status: newStatus }));
    } catch (e) {
      addToast(e.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  // ── Log call ──────────────────────────────────────────────────────────────
  const handleLogCall = async (e) => {
    e.preventDefault();
    if (!callForm.notes.trim()) { addToast('Please enter notes', 'error'); return; }
    setCallSaving(true);
    try {
      await callsAPI.create(selected.id, callForm);
      addToast('Call logged', 'success');
      setCallModal(false);
      setCallForm({ notes: '', outcome: 'INTERESTED' });
      const res = await callsAPI.getByEnquiry(selected.id);
      setCalls(res.data?.data ?? res.data ?? []);
      if (selected.status === 'NEW') await handleStatusChange(selected.id, 'IN_CONTACT');
    } catch (e) {
      addToast('Failed to log call', 'error');
    } finally {
      setCallSaving(false);
    }
  };

  // ── Schedule follow-up ────────────────────────────────────────────────────
  const handleAddFollowUp = async (e) => {
    e.preventDefault();
    if (!followForm.followUpDate) { addToast('Please select a date', 'error'); return; }
    setFollowSaving(true);
    try {
      await followUpsAPI.create(selected.id, followForm);
      addToast('Follow-up scheduled', 'success');
      setFollowModal(false);
      setFollowForm({ remarks: '', followUpDate: '' });
      const res = await followUpsAPI.getByEnquiry(selected.id);
      setFollowUps(res.data?.data ?? res.data ?? []);
    } catch (e) {
      addToast('Failed to schedule follow-up', 'error');
    } finally {
      setFollowSaving(false);
    }
  };

  // ── Complete follow-up ────────────────────────────────────────────────────
  const handleCompleteFollowUp = async (enquiryId, followUpId) => {
    try {
      await followUpsAPI.complete(enquiryId, followUpId);
      addToast('Marked as done', 'success');
      const res = await followUpsAPI.getByEnquiry(enquiryId);
      setFollowUps(res.data?.data ?? res.data ?? []);
    } catch (e) {
      addToast('Failed', 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <PageHeader
        title="My Leads"
        subtitle={`${totalItems} assigned leads`}
        actions={
          // FIX: Counsellor can now create their own enquiry
          <button className="btn btn-primary" onClick={() => { resetCreateForm(); setCreateModal(true); }}>
            + New Enquiry
          </button>
        }
      />

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* ── Lead list ────────────────────────────────────────────────── */}
        <div style={{ flex: selected ? '0 0 52%' : '1' }}>
          <div className="card">
            {/* Filters */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              <input
                className="form-control"
                style={{ maxWidth: 220, padding: '6px 10px', fontSize: 12 }}
                placeholder="Search name / phone…"
                value={search}
                onChange={e => { setSearch(e.target.value); resetPage(); }}
              />
              <div style={{ display: 'flex', gap: 4 }}>
                {STATUS_FILTERS.map(f => (
                  <button key={f.value}
                    onClick={() => { setStatus(f.value); resetPage(); }}
                    style={{
                      padding: '4px 10px', borderRadius: 20, fontSize: 11,
                      fontWeight: 500, cursor: 'pointer', border: '1px solid',
                      fontFamily: 'inherit',
                      borderColor: status === f.value ? 'var(--color-accent)' : 'var(--color-border)',
                      background: status === f.value ? 'var(--color-accent)' : 'var(--color-surface-2)',
                      color: status === f.value ? '#fff' : 'var(--color-text-muted)',
                    }}
                  >{f.label}</button>
                ))}
              </div>
            </div>

            {listLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                <Spinner size={24} />
              </div>
            ) : leads.length === 0 ? (
              <EmptyState
                icon="📋"
                title="No leads found"
                text="Create a new enquiry or wait for admin to assign you leads"
                action={
                  <button className="btn btn-primary btn-sm"
                    onClick={() => { resetCreateForm(); setCreateModal(true); }}>
                    + Add New Lead
                  </button>
                }
              />
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {leads.map(lead => (
                    <div key={lead.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                      background: selected?.id === lead.id ? 'var(--color-accent-light)' : 'transparent',
                      border: `1px solid ${selected?.id === lead.id ? 'var(--color-accent)' : 'transparent'}`,
                      transition: 'all .12s',
                    }}
                      onClick={ev => { ev.stopPropagation(); openDetail(lead); }}
                      onMouseEnter={e => { if (selected?.id !== lead.id) e.currentTarget.style.background = 'var(--color-surface-2)'; }}
                      onMouseLeave={e => { if (selected?.id !== lead.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--color-surface-2)', color: 'var(--color-text-muted)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 14,
                      }}>
                        {lead.leadName?.[0]?.toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{lead.leadName}</span>
                          <Badge value={lead.priority} />
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 1 }}>
                          {lead.phone} · {lead.courseName}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        <div style={{ textAlign: 'right' }}>
                          <Badge value={lead.status} />
                          <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3 }}>
                            {lead.enquiryDate
                              ? new Date(lead.enquiryDate).toLocaleDateString('en-IN') : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={goTo} />
              </>
            )}
          </div>
        </div>

        {/* ── Detail panel ──────────────────────────────────────────────── */}
        {selected && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{selected.leadName}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {selected.phone} · {selected.email || 'No email'}
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setSelected(null)}>✕</button>
              </div>

              {/* Meta grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Course', value: selected.courseName },
                  { label: 'Source', value: selected.source || '—' },
                  { label: 'Priority', value: <Badge value={selected.priority} /> },
                  { label: 'Status', value: <Badge value={selected.status} /> },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'var(--color-surface-2)', borderRadius: 6, padding: '8px 10px',
                  }}>
                    <div style={{
                      fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3,
                    }}>{item.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Status change */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600 }}>
                  CHANGE STATUS
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { val: 'NEW', label: 'New', color: 'var(--color-accent)' },
                    { val: 'IN_CONTACT', label: 'In Contact', color: 'var(--color-warning)' },
                    { val: 'CONVERTED', label: 'Converted', color: 'var(--color-success)' },
                    { val: 'DROPPED', label: 'Dropped', color: 'var(--color-danger)' },
                  ].map(s => (
                    <button key={s.val}
                      onClick={() => handleStatusChange(selected.id, s.val)}
                      style={{
                        fontSize: 11, padding: '4px 10px', borderRadius: 6,
                        cursor: 'pointer', border: '1px solid', fontFamily: 'inherit',
                        borderColor: selected.status === s.val ? s.color : 'var(--color-border)',
                        background: selected.status === s.val ? s.color : 'var(--color-surface-2)',
                        color: selected.status === s.val ? '#fff' : 'var(--color-text-muted)',
                        fontWeight: selected.status === s.val ? 600 : 400,
                      }}
                    >{s.label}</button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <button className="btn btn-indego btn-sm" onClick={() => setCallModal(true)}>
                  📞 Log Call
                </button>
                <button className="btn btn-indego btn-sm" onClick={() => setFollowModal(true)}>
                  📅 Follow-up
                </button>
              </div>

              {/* Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', marginBottom: 12 }}>
                {['calls', 'followups'].map(tab => (
                  <button key={tab} onClick={() => setDetailTab(tab)} style={{
                    padding: '7px 14px', fontSize: 12, fontWeight: 500,
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    borderBottom: `2px solid ${detailTab === tab ? 'var(--color-accent)' : 'transparent'}`,
                    color: detailTab === tab ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  }}>
                    {tab === 'calls' ? `Calls (${calls.length})` : `Follow-ups (${followUps.length})`}
                  </button>
                ))}
              </div>

              {/* Timeline */}
              {detailLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                  <Spinner size={20} />
                </div>
              ) : detailTab === 'calls' ? (
                calls.length === 0
                  ? <EmptyState icon="📞" title="No calls yet" text="Log your first call" />
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                      {calls.map((c, i) => (
                        <div key={c.id || i} style={{ borderLeft: '2px solid var(--color-accent)', paddingLeft: 10, paddingBottom: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: 11, fontWeight: 600, padding: '2px 8px',
                              borderRadius: 12, background: 'var(--color-accent-light)',
                              color: 'var(--color-accent)',
                            }}>{c.outcome?.replace('_', ' ')}</span>
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                              {c.calledAt ? new Date(c.calledAt).toLocaleString('en-IN') : ''}
                            </span>
                          </div>
                          {c.notes && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{c.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )
              ) : (
                followUps.length === 0
                  ? <EmptyState icon="📅" title="No follow-ups" text="Schedule one above" />
                  : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
                      {followUps.map((f, i) => (
                        <div key={f.id || i} style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10,
                          padding: '8px 10px', borderRadius: 7,
                          background: f.isDone ? 'var(--color-success-bg)' : 'var(--color-surface-2)',
                          border: `1px solid ${f.isDone ? '#bbf7d0' : 'var(--color-border)'}`,
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 500 }}>{f.followUpDate}</div>
                            {f.remarks && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{f.remarks}</div>}
                          </div>
                          {!f.isDone
                            ? <button className="btn btn-secondary btn-sm"
                              style={{ fontSize: 10, padding: '2px 7px', flexShrink: 0 }}
                              onClick={() => handleCompleteFollowUp(selected.id, f.id)}>Done</button>
                            : <span style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 600 }}>✓ Done</span>
                          }
                        </div>
                      ))}
                    </div>
                  )
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FIX: Create Enquiry Modal (for Counsellor) ───────────────────── */}
      <Modal
        open={createModal}
        title="New Enquiry"
        onClose={() => setCreateModal(false)}
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? <><Spinner size={13} /> Creating…</> : 'Create Enquiry'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Info banner — explain auto-assign */}
          <div style={{
            padding: '10px 12px', background: 'var(--color-accent-light)',
            borderRadius: 7, fontSize: 12, color: 'var(--color-accent)',
            border: '1px solid #bfdbfe',
          }}>
            ℹ️ This enquiry will be automatically assigned to you.
          </div>

          <div className="grid-2" style={{ gap: 12 }}>
            <FormField label="Lead Name" required error={createErrors.leadName}>
              <input
                className={`form-control ${createErrors.leadName ? 'error' : ''}`}
                placeholder="Full name"
                value={createForm.leadName}
                onChange={e => {
                  setCreateForm(f => ({ ...f, leadName: e.target.value }));
                  setCreateErrors(er => ({ ...er, leadName: '' }));
                }}
              />
            </FormField>
            <FormField label="Phone" required error={createErrors.phone}>
              <input
                className={`form-control ${createErrors.phone ? 'error' : ''}`}
                placeholder="10-digit mobile"
                value={createForm.phone}
                maxLength={10}
                onChange={e => {
                  setCreateForm(f => ({ ...f, phone: e.target.value }));
                  setCreateErrors(er => ({ ...er, phone: '' }));
                }}
              />
            </FormField>
          </div>

          <FormField label="Email">
            <input
              className="form-control"
              type="email"
              placeholder="optional@email.com"
              value={createForm.email}
              onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))}
            />
          </FormField>

          <FormField label="Course" required error={createErrors.courseId}>
            <select
              className={`form-control form-select ${createErrors.courseId ? 'error' : ''}`}
              value={createForm.courseId}
              onChange={e => {
                setCreateForm(f => ({ ...f, courseId: e.target.value }));
                setCreateErrors(er => ({ ...er, courseId: '' }));
              }}
            >
              <option value="">Select course…</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>

          <div className="grid-2" style={{ gap: 12 }}>
            <FormField label="Source">
              <select className="form-control form-select" value={createForm.source}
                onChange={e => setCreateForm(f => ({ ...f, source: e.target.value }))}>
                <option value="">Select source…</option>
                {['Website', 'Walk-in', 'Referral', 'Social Media', 'Event', 'Other']
                  .map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <FormField label="Priority">
              <select className="form-control form-select" value={createForm.priority}
                onChange={e => setCreateForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="HOT">🔴 Hot</option>
                <option value="WARM">🟡 Warm</option>
                <option value="COLD">🔵 Cold</option>
              </select>
            </FormField>
          </div>

          <FormField label="Remarks">
            <textarea className="form-control" rows={3} placeholder="Notes about this lead…"
              value={createForm.remarks}
              onChange={e => setCreateForm(f => ({ ...f, remarks: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Log Call Modal */}
      <Modal open={callModal} title="Log a Call" onClose={() => setCallModal(false)} size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCallModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleLogCall} disabled={callSaving}>
              {callSaving ? <><Spinner size={13} /> Saving…</> : 'Log Call'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Outcome" required>
            <select className="form-control form-select" value={callForm.outcome}
              onChange={e => setCallForm(f => ({ ...f, outcome: e.target.value }))}>
              <option value="INTERESTED">Interested</option>
              <option value="NOT_INTERESTED">Not Interested</option>
              <option value="CALLBACK">Requested Callback</option>
              <option value="NO_RESPONSE">No Response</option>
            </select>
          </FormField>
          <FormField label="Notes" required>
            <textarea className="form-control" rows={4} placeholder="What was discussed…"
              value={callForm.notes}
              onChange={e => setCallForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
        </div>
      </Modal>

      {/* Follow-up Modal */}
      <Modal open={followModal} title="Schedule Follow-up" onClose={() => setFollowModal(false)} size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setFollowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddFollowUp} disabled={followSaving}>
              {followSaving ? <><Spinner size={13} /> Saving…</> : 'Schedule'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <FormField label="Follow-up Date" required>
            <input className="form-control" type="date"
              min={new Date().toISOString().split('T')[0]}
              value={followForm.followUpDate}
              onChange={e => setFollowForm(f => ({ ...f, followUpDate: e.target.value }))} />
          </FormField>
          <FormField label="Remarks">
            <textarea className="form-control" rows={3} placeholder="What to follow up about…"
              value={followForm.remarks}
              onChange={e => setFollowForm(f => ({ ...f, remarks: e.target.value }))} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}