import React, { useState, useEffect, useCallback } from 'react';
import { enquiriesAPI, coursesAPI, usersAPI, callsAPI, followUpsAPI } from '../../api';
import {
  PageHeader, Badge, Pagination, SearchInput, Modal,
  FormField, EmptyState, Spinner, ToastContainer
} from '../../components/common';
import { useDebounce, usePagination, useToast } from '../../hooks';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'IN_CONTACT', label: 'In Contact' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'DROPPED', label: 'Dropped' },
];

const PRIORITY_FILTERS = [
  { value: '', label: 'All Priority' },
  { value: 'HOT', label: '🔴 Hot' },
  { value: 'WARM', label: '🟡 Warm' },
  { value: 'COLD', label: '🔵 Cold' },
];

export default function EnquiriesPage() {
  const { page, size, goTo, resetPage } = usePagination(20);
  const { toasts, addToast, removeToast } = useToast();

  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [sortField, setSortField] = useState('enquiryDate');
  const [courses, setCourses] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    leadName: '', phone: '', email: '', courseId: '', counsellorId: '', source: '', remarks: '', priority: 'COLD'
  });

  // ── FIX: View detail modal state ───────────────────────────────────────────
  const [viewModal, setViewModal] = useState(false);
  const [viewLead, setViewLead] = useState(null);
  const [viewCalls, setViewCalls] = useState([]);
  const [viewFollowUps, setViewFollowUps] = useState([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewTab, setViewTab] = useState('calls');

  const debouncedSearch = useDebounce(search, 400);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page, size, sort: sortField,
        ...(status && { status }),
        ...(priority && { priority }),
        ...(debouncedSearch && { search: debouncedSearch }),
      };
      const res = await enquiriesAPI.getAll(params);
      setData(res.data?.data || { content: [], totalPages: 0 });
    } catch { addToast('Failed to load enquiries', 'error'); }
    finally { setLoading(false); }
  }, [page, size, sortField, status, priority, debouncedSearch]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    coursesAPI.getAll().then(r => setCourses(r.data?.data || [])).catch(() => { });
    usersAPI.getAll('COUNSELLOR').then(r => setCounsellors(r.data?.data || [])).catch(() => { });
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await enquiriesAPI.create({
        ...form,
        courseId: Number(form.courseId),
        counsellorId: form.counsellorId ? Number(form.counsellorId) : null,
      });
      addToast('Enquiry created successfully', 'success');
      setShowModal(false);
      setForm({ leadName: '', phone: '', email: '', courseId: '', counsellorId: '', source: '', remarks: '', priority: 'COLD' });
      loadData();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to create enquiry', 'error');
    } finally { setSubmitting(false); }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await enquiriesAPI.updateStatus(id, newStatus);
      addToast('Status updated', 'success');
      // Optimistic update — avoid full reload flicker
      setData(prev => ({
        ...prev,
        content: prev.content.map(e => e.id === id ? { ...e, status: newStatus } : e),
      }));
      if (viewLead?.id === id) setViewLead(v => ({ ...v, status: newStatus }));
    } catch {
      addToast('Failed to update status', 'error');
      loadData();
    }
  };

  const handleFilter = (key, val) => {
    if (key === 'status') setStatus(val);
    if (key === 'priority') setPriority(val);
    resetPage();
  };

  // ── FIX: Open detail modal — fetch calls + follow-ups for this lead ────────
  const openView = async (lead) => {
    setViewLead(lead);
    setViewModal(true);
    setViewTab('calls');
    setViewLoading(true);
    try {
      const [callsRes, followRes] = await Promise.all([
        callsAPI.getByEnquiry(lead.id),
        followUpsAPI.getByEnquiry(lead.id),
      ]);
      setViewCalls(callsRes.data?.data ?? callsRes.data ?? []);
      setViewFollowUps(followRes.data?.data ?? followRes.data ?? []);
    } catch (err) {
      addToast('Failed to load lead details', 'error');
      setViewCalls([]);
      setViewFollowUps([]);
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <PageHeader
        title="Enquiries"
        subtitle={`${data.totalElements || 0} total leads`}
        actions={
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Enquiry</button>
        }
      />

      <div className="card">
        {/* Filters Row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <SearchInput value={search} onChange={v => { setSearch(v); resetPage(); }} placeholder="Search leads…" />

          {/* Status chips */}
          <div style={{ display: 'flex', gap: 4 }}>
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => handleFilter('status', f.value)}
                style={{
                  padding: '4px 10px', borderRadius: 20,
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${status === f.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: status === f.value ? 'var(--color-accent)' : 'var(--color-surface-2)',
                  color: status === f.value ? '#fff' : 'var(--color-text-muted)',
                  transition: 'all .12s',
                }}
              >{f.label}</button>
            ))}
          </div>

          <select
            className="form-control form-select"
            style={{ width: 130, padding: '5px 10px', fontSize: 12 }}
            value={priority}
            onChange={e => handleFilter('priority', e.target.value)}
          >
            {PRIORITY_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>

          <select
            className="form-control form-select"
            style={{ width: 160, padding: '5px 10px', fontSize: 12, marginLeft: 'auto' }}
            value={sortField}
            onChange={e => { setSortField(e.target.value); resetPage(); }}
          >
            <option value="enquiryDate">Sort: Date</option>
            <option value="leadName">Sort: Name</option>
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Spinner size={24} />
          </div>
        ) : data.content.length === 0 ? (
          <EmptyState icon="📋" title="No enquiries found" text="Try adjusting your filters or create a new lead" />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th onClick={() => setSortField('leadName')} style={{ cursor: 'pointer' }}>
                      Name {sortField === 'leadName' ? '↑' : ''}
                    </th>
                    <th>Phone</th>
                    <th>Course</th>
                    <th>Counsellor</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th onClick={() => setSortField('enquiryDate')} style={{ cursor: 'pointer' }}>
                      Date {sortField === 'enquiryDate' ? '↓' : ''}
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map(e => (
                    <tr key={e.id} onClick={() => openView(e)}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{e.leadName}</div>
                        {e.email && <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{e.email}</div>}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{e.phone}</td>
                      <td style={{ fontSize: 12 }}>{e.courseName}</td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                        {e.counsellorName || <span style={{ color: 'var(--color-text-light)' }}>Unassigned</span>}
                      </td>
                      <td>
                        <select
                          value={e.status}
                          onChange={ev => handleStatusChange(e.id, ev.target.value)}
                          className="form-control form-select"
                          style={{
                            padding: '3px 8px', fontSize: 11, width: 'auto',
                            border: 'none', background: 'transparent',
                            fontWeight: 500,
                          }}
                        >
                          {['NEW', 'IN_CONTACT', 'CONVERTED', 'DROPPED'].map(s => (
                            <option key={s} value={s}>{s.replace('_', ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td><Badge value={e.priority} /></td>
                      <td style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {e.enquiryDate ? new Date(e.enquiryDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td>
                        {/* FIX: View button now opens detail modal */}
                        <button className="btn btn-secondary btn-sm" onClick={() => openView(e)}>View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={data.totalPages} onPageChange={goTo} />
          </>
        )}
      </div>

      {/* ── FIX: Lead Detail Modal ────────────────────────────────────────── */}
      <Modal
        open={viewModal}
        title={viewLead?.leadName || 'Lead Details'}
        onClose={() => setViewModal(false)}
        size="md"
        footer={
          <button className="btn btn-secondary" onClick={() => setViewModal(false)}>Close</button>
        }
      >
        {viewLead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Contact info */}
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {viewLead.phone} · {viewLead.email || 'No email'}
            </div>

            {/* Meta grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Course', value: viewLead.courseName },
                { label: 'Counsellor', value: viewLead.counsellorName || 'Unassigned' },
                { label: 'Source', value: viewLead.source || '—' },
                { label: 'Priority', value: <Badge value={viewLead.priority} /> },
                { label: 'Status', value: <Badge value={viewLead.status} /> },
                {
                  label: 'Enquiry Date', value: viewLead.enquiryDate
                    ? new Date(viewLead.enquiryDate).toLocaleDateString('en-IN') : '—'
                },
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

            {/* Remarks */}
            {viewLead.remarks && (
              <div style={{
                background: 'var(--color-surface-2)', borderRadius: 6, padding: '8px 10px',
              }}>
                <div style={{
                  fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 3,
                }}>Remarks</div>
                <div style={{ fontSize: 12 }}>{viewLead.remarks}</div>
              </div>
            )}

            {/* Status change buttons — admin can also update from here */}
            {/* <div>
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
                    onClick={() => handleStatusChange(viewLead.id, s.val)}
                    style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 6,
                      cursor: 'pointer', border: '1px solid', fontFamily: 'inherit',
                      borderColor: viewLead.status === s.val ? s.color : 'var(--color-border)',
                      background: viewLead.status === s.val ? s.color : 'var(--color-surface-2)',
                      color: viewLead.status === s.val ? '#fff' : 'var(--color-text-muted)',
                      fontWeight: viewLead.status === s.val ? 600 : 400,
                    }}
                  >{s.label}</button>
                ))}
              </div>
            </div> */}

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
              {['calls', 'followups'].map(tab => (
                <button key={tab} onClick={() => setViewTab(tab)} style={{
                  padding: '7px 14px', fontSize: 12, fontWeight: 500,
                  background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  borderBottom: `2px solid ${viewTab === tab ? 'var(--color-accent)' : 'transparent'}`,
                  color: viewTab === tab ? 'var(--color-accent)' : 'var(--color-text-muted)',
                }}>
                  {tab === 'calls' ? `Calls (${viewCalls.length})` : `Follow-ups (${viewFollowUps.length})`}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {viewLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
                <Spinner size={20} />
              </div>
            ) : viewTab === 'calls' ? (
              viewCalls.length === 0 ? (
                <EmptyState icon="📞" title="No calls logged" text="The counsellor hasn't logged any calls yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                  {viewCalls.map((c, i) => (
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
                      {c.counsellorName && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 3 }}>
                          by {c.counsellorName}
                        </div>
                      )}
                      {c.notes && <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>{c.notes}</p>}
                    </div>
                  ))}
                </div>
              )
            ) : (
              viewFollowUps.length === 0 ? (
                <EmptyState icon="📅" title="No follow-ups scheduled" text="The counsellor hasn't scheduled any follow-ups yet" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                  {viewFollowUps.map((f, i) => (
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
                      {f.isDone && <span style={{ fontSize: 10, color: 'var(--color-success)', fontWeight: 600 }}>✓ Done</span>}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        )}
      </Modal>

      {/* Create Enquiry Modal */}
      <Modal
        open={showModal}
        title="New Enquiry"
        onClose={() => setShowModal(false)}
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>
              {submitting ? <><Spinner size={13} /> Saving…</> : 'Create Enquiry'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="grid-2" style={{ gap: 12 }}>
            <FormField label="Lead Name" required>
              <input className="form-control" placeholder="Full name"
                value={form.leadName} onChange={e => setForm(f => ({ ...f, leadName: e.target.value }))} required />
            </FormField>
            <FormField label="Phone" required>
              <input className="form-control" placeholder="10-digit mobile"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} required />
            </FormField>
          </div>
          <FormField label="Email">
            <input className="form-control" type="email" placeholder="optional@email.com"
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </FormField>
          <div className="grid-2" style={{ gap: 12 }}>
            <FormField label="Course" required>
              <select className="form-control form-select" value={form.courseId}
                onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} required>
                <option value="">Select course…</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
            <FormField label="Assign Counsellor">
              <select className="form-control form-select" value={form.counsellorId}
                onChange={e => setForm(f => ({ ...f, counsellorId: e.target.value }))}>
                <option value="">Unassigned</option>
                {counsellors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>
          </div>
          <div className="grid-2" style={{ gap: 12 }}>
            <FormField label="Source">
              <select className="form-control form-select" value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                <option value="">Select source…</option>
                {['Website', 'Walk-in', 'Referral', 'Social Media', 'Event', 'Other'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Priority">
              <select className="form-control form-select" value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="HOT">🔴 Hot</option>
                <option value="WARM">🟡 Warm</option>
                <option value="COLD">🔵 Cold</option>
              </select>
            </FormField>
          </div>
          <FormField label="Remarks">
            <textarea className="form-control" rows={3} placeholder="Additional notes…"
              value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
          </FormField>
        </div>
      </Modal>
    </div>
  );
}