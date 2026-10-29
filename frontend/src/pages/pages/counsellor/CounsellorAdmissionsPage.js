import React, { useState, useEffect, useCallback } from 'react';
import { admissionsAPI, usersAPI } from '../../api';
import {
    PageHeader, Modal, FormField,
    EmptyState, Spinner, ToastContainer
} from '../../components/common';
import { useToast } from '../../hooks';

// ── Helpers ────────────────────────────────────────────────────────────────
function PaymentBar({ paid, total }) {
    const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>
                    ₹{Number(paid).toLocaleString('en-IN')} / ₹{Number(total).toLocaleString('en-IN')}
                </span>
                <span style={{
                    fontWeight: 600,
                    color: pct === 100 ? 'var(--color-success)' : pct > 0 ? 'var(--color-warning)' : 'var(--color-danger)',
                }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                    height: '100%', borderRadius: 3, width: `${pct}%`,
                    background: pct === 100 ? 'var(--color-success)' : pct > 0 ? 'var(--color-warning)' : 'var(--color-danger)',
                    transition: 'width .4s ease',
                }} />
            </div>
        </div>
    );
}

function StatusPill({ status }) {
    const cfg = {
        PAID: { label: 'Fully Paid', cls: 'badge-green' },
        PARTIAL: { label: 'Partial', cls: 'badge-amber' },
        PENDING: { label: 'Payment Pending', cls: 'badge-red' },
    };
    const { label, cls } = cfg[status] || { label: status, cls: 'badge-gray' };
    return <span className={`badge ${cls}`}>{label}</span>;
}

function AdmissionStatusPill({ done }) {
    return done
        ? <span className="badge badge-green">✓ Admission Done</span>
        : <span className="badge badge-amber">⏳ Pending</span>;
}

const FILTER_TABS = [
    { value: 'all', label: 'All Converted' },
    { value: 'pending', label: 'Admission Pending' },
    { value: 'done', label: 'Admission Done' },
    { value: 'unpaid', label: 'Payment Due' },
];

// ── CounsellorAdmissionsPage ──────────────────────────────────────────────
export default function CounsellorAdmissionsPage() {
    const { toasts, addToast, removeToast } = useToast();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [trainers, setTrainers] = useState([]);

    // Admit modal
    const [admitModal, setAdmitModal] = useState(false);
    const [admitRow, setAdmitRow] = useState(null);
    const [admitForm, setAdmitForm] = useState({ trainerId: '', feePaid: '', admissionDate: '' });
    const [admitting, setAdmitting] = useState(false);

    // Payment modal
    const [payModal, setPayModal] = useState(false);
    const [payRow, setPayRow] = useState(null);
    const [newFeePaid, setNewFeePaid] = useState('');
    const [paying, setPaying] = useState(false);

    // Trainer modal
    const [trainerModal, setTrainerModal] = useState(false);
    const [trainerRow, setTrainerRow] = useState(null);
    const [selectedTrainer, setSelectedTrainer] = useState('');
    const [assigning, setAssigning] = useState(false);

    // ── Load converted leads (only this counsellor's) ─────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Backend auto-filters to this counsellor's own converted leads
            const res = await admissionsAPI.getConvertedLeads();
            const list = res.data?.data ?? res.data ?? [];
            setRows(Array.isArray(list) ? list : []);
        } catch (e) {
            addToast('Failed to load admission data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    useEffect(() => {
        usersAPI.getAll('TRAINER')
            .then(r => setTrainers(r.data?.data ?? []))
            .catch(() => addToast('Failed to load trainers list', 'error'));
    }, []);

    // ── Filter + search ───────────────────────────────────────────────────
    const filteredRows = rows.filter(row => {
        const q = search.toLowerCase();
        const matchSearch = !q
            || row.enquiry?.leadName?.toLowerCase().includes(q)
            || row.enquiry?.phone?.includes(q)
            || row.enquiry?.courseName?.toLowerCase().includes(q);

        const matchFilter =
            filter === 'all' ? true
                : filter === 'pending' ? (row.hasAdmission && !row.admission?.admissionDone)
                    : filter === 'done' ? row.admission?.admissionDone
                        : filter === 'unpaid' ? (row.hasAdmission && row.admission?.paymentStatus !== 'PAID')
                            : true;

        return matchSearch && matchFilter;
    });

    // ── Stats ─────────────────────────────────────────────────────────────
    const totalConverted = rows.length;
    const admissionDone = rows.filter(r => r.admission?.admissionDone).length;
    const admissionPending = rows.filter(r => r.hasAdmission && !r.admission?.admissionDone).length;
    const paymentDue = rows.filter(r => r.hasAdmission && r.admission?.paymentStatus !== 'PAID').length;
    // ── Admit modal ───────────────────────────────────────────────────────
    const openAdmitModal = (row) => {
        setAdmitRow(row);
        setAdmitForm({
            trainerId: '',
            feePaid: '',
            admissionDate: new Date().toISOString().split('T')[0],
        });
        setAdmitModal(true);
    };

    const handleAdmit = async (e) => {
        e.preventDefault();
        setAdmitting(true);
        try {
            await admissionsAPI.create({
                enquiryId: admitRow.enquiry.id,
                courseId: admitRow.enquiry.courseId,
                trainerId: admitForm.trainerId ? Number(admitForm.trainerId) : null,
                feePaid: admitForm.feePaid ? Number(admitForm.feePaid) : 0,
                admissionDate: admitForm.admissionDate || new Date().toISOString().split('T')[0],
            });
            addToast(`${admitRow.enquiry.leadName} admitted successfully! 🎓`, 'success');
            setAdmitModal(false);
            loadData();
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to create admission', 'error');
        } finally {
            setAdmitting(false);
        }
    };

    // ── Payment modal ─────────────────────────────────────────────────────
    const openPayModal = (row) => {
        setPayRow(row);
        setNewFeePaid(String(row.admission?.feePaid ?? '0'));
        setPayModal(true);
    };

    const handleUpdatePayment = async () => {
        if (!newFeePaid) { addToast('Enter fee amount', 'error'); return; }
        setPaying(true);
        try {
            await admissionsAPI.updatePayment(payRow.admission.id, Number(newFeePaid));
            addToast('Payment updated', 'success');
            setPayModal(false);
            loadData();
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to update payment', 'error');
        } finally {
            setPaying(false);
        }
    };

    // ── Trainer modal ─────────────────────────────────────────────────────
    const openTrainerModal = (row) => {
        setTrainerRow(row);
        setSelectedTrainer(row.admission?.trainerId ? String(row.admission.trainerId) : '');
        setTrainerModal(true);
    };

    const handleAssignTrainer = async () => {
        if (!selectedTrainer) { addToast('Select a trainer', 'error'); return; }
        setAssigning(true);
        try {
            await admissionsAPI.assignTrainer(trainerRow.admission.id, Number(selectedTrainer));
            addToast('Trainer assigned', 'success');
            setTrainerModal(false);
            loadData();
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to assign trainer', 'error');
        } finally {
            setAssigning(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <PageHeader
                title="Admissions"
                subtitle="Admit your converted leads and manage their payments"
            />

            {/* Stats */}
            <div className="grid-4">
                {[
                    { label: 'My Conversions', value: totalConverted, color: 'var(--color-accent)' },
                    { label: 'Admitted', value: admissionDone, color: 'var(--color-success)' },
                    { label: 'Pending Admit', value: admissionPending, color: 'var(--color-warning)' },
                    { label: 'Payment Due', value: paymentDue, color: 'var(--color-danger)' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* Filter + Table */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {FILTER_TABS.map(f => (
                            <button key={f.value} onClick={() => setFilter(f.value)}
                                style={{
                                    padding: '5px 12px', borderRadius: 20, fontSize: 12,
                                    fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                                    border: `1px solid ${filter === f.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                    background: filter === f.value ? 'var(--color-accent)' : 'var(--color-surface-2)',
                                    color: filter === f.value ? '#fff' : 'var(--color-text-muted)',
                                }}
                            >{f.label}</button>
                        ))}
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'var(--color-surface-2)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 8, padding: '6px 12px', minWidth: 200,
                    }}>
                        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
                            style={{ flexShrink: 0, color: 'var(--color-text-muted)' }}>
                            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <input
                            style={{
                                border: 'none', background: 'transparent', fontSize: 12,
                                fontFamily: 'inherit', color: 'var(--color-text)', outline: 'none', width: '100%',
                            }}
                            placeholder="Search name, phone, course…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                        <Spinner size={28} />
                    </div>
                ) : filteredRows.length === 0 ? (
                    <EmptyState
                        icon="🎓"
                        title={filter === 'pending' ? 'No leads pending admission' : 'No records found'}
                        text="Convert leads on the Leads page — they will appear here for admission"
                    />
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Lead</th>
                                    <th>Course</th>
                                    <th>Admission</th>
                                    <th>Student</th>
                                    <th>Trainer</th>
                                    <th>Payment</th>
                                    <th>Fee Progress</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRows.map((row, idx) => {
                                    const e = row.enquiry;
                                    const adm = row.admission;
                                    const has = row.hasAdmission;

                                    return (
                                        <tr key={e?.id ?? idx}>
                                            {/* Lead */}
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{
                                                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                                                        background: has ? 'var(--color-teal-bg)' : 'var(--color-surface-2)',
                                                        color: has ? 'var(--color-teal)' : 'var(--color-text-muted)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontWeight: 700, fontSize: 13,
                                                    }}>
                                                        {e?.leadName?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600, fontSize: 13 }}>{e?.leadName}</div>
                                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{e?.phone}</div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Course */}
                                            <td style={{ fontSize: 12 }}>{e?.courseName}</td>

                                            {/* Admission Status */}
                                            <td>
                                                <AdmissionStatusPill done={has && adm?.admissionDone} />
                                                {has && adm?.admissionDate && (
                                                    <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 3 }}>
                                                        {new Date(adm.admissionDate).toLocaleDateString('en-IN')}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Student */}
                                            <td style={{ fontSize: 12 }}>
                                                {has && adm?.studentName ? (
                                                    <div>
                                                        <div style={{ fontWeight: 500 }}>{adm.studentName}</div>
                                                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>{adm.studentEmail}</div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--color-text-light)', fontSize: 11, fontStyle: 'italic' }}>—</span>
                                                )}
                                            </td>

                                            {/* Trainer */}
                                            <td style={{ fontSize: 12 }}>
                                                {has && adm?.trainerName
                                                    ? <span style={{ color: 'var(--color-purple)' }}>{adm.trainerName}</span>
                                                    : <span style={{ fontSize: 11, color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                                                        {has ? 'Not assigned' : '—'}
                                                    </span>
                                                }
                                            </td>

                                            {/* Payment */}
                                            <td>
                                                {has
                                                    ? <StatusPill status={adm?.paymentStatus} />
                                                    : <span style={{ fontSize: 11, color: 'var(--color-text-light)', fontStyle: 'italic' }}>—</span>
                                                }
                                            </td>

                                            {/* Fee Progress */}
                                            <td style={{ minWidth: 140 }}>
                                                {has
                                                    ? <PaymentBar paid={adm?.feePaid ?? 0} total={adm?.courseFee ?? 0} />
                                                    : <span style={{ fontSize: 11, color: 'var(--color-text-light)' }}>—</span>
                                                }
                                            </td>

                                            {/* Actions — counsellor has full control */}
                                            <td>
                                                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                                                    {!has ? (
                                                        <button className="btn btn-primary btn-sm"
                                                            style={{ fontSize: 11 }}
                                                            onClick={() => openAdmitModal(row)}>
                                                            🎓 Admit
                                                        </button>
                                                    ) : (
                                                        <>
                                                            {adm?.paymentStatus !== 'PAID' && (
                                                                <button className="btn btn-secondary btn-sm"
                                                                    style={{ fontSize: 11, color: 'var(--color-warning)' }}
                                                                    onClick={() => openPayModal(row)}>
                                                                    💰 Payment
                                                                </button>
                                                            )}
                                                            <button className="btn btn-secondary btn-sm"
                                                                style={{ fontSize: 11, color: 'var(--color-purple)' }}
                                                                onClick={() => openTrainerModal(row)}>
                                                                👨‍🏫 Trainer
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>

            {/* ── Admit Modal ─────────────────────────────────────────────── */}
            <Modal
                open={admitModal}
                title={`Admit — ${admitRow?.enquiry?.leadName}`}
                onClose={() => setAdmitModal(false)}
                size="md"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setAdmitModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleAdmit} disabled={admitting}>
                            {admitting ? <><Spinner size={13} /> Admitting…</> : '🎓 Confirm Admission'}
                        </button>
                    </>
                }
            >
                {admitRow && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Lead summary */}
                        <div style={{
                            padding: '12px 14px', background: 'var(--color-accent-light)',
                            borderRadius: 8, border: '1px solid #bfdbfe',
                        }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-accent)', marginBottom: 6 }}>
                                Lead Details
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 12 }}>
                                <div><strong>Name:</strong> {admitRow.enquiry?.leadName}</div>
                                <div><strong>Phone:</strong> {admitRow.enquiry?.phone}</div>
                                <div><strong>Course:</strong> {admitRow.enquiry?.courseName}</div>
                                {admitRow.enquiry?.email && (
                                    <div style={{ gridColumn: '1 / -1' }}><strong>Email:</strong> {admitRow.enquiry.email}</div>
                                )}
                            </div>
                        </div>

                        {/* Auto-create info */}
                        {/* <div style={{
                            padding: '10px 12px', background: 'var(--color-success-bg)',
                            borderRadius: 7, fontSize: 12, color: 'var(--color-success)',
                            border: '1px solid #bbf7d0',
                        }}>
                            ✓ A <strong>student account</strong> will be automatically created for{' '}
                            <strong>{admitRow.enquiry?.leadName}</strong>.
                            Default login password: <code style={{ fontFamily: 'monospace', background: '#dcfce7', padding: '1px 4px', borderRadius: 3 }}>Student@123</code>
                        </div> */}

                        <div className="grid-2" style={{ gap: 12 }}>
                            <FormField label="Assign Trainer (optional)">
                                <select className="form-control form-select" value={admitForm.trainerId}
                                    onChange={e => setAdmitForm(f => ({ ...f, trainerId: e.target.value }))}>
                                    <option value="">Select trainer…</option>
                                    {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </FormField>
                            <FormField label="Admission Date">
                                <input className="form-control" type="date"
                                    value={admitForm.admissionDate}
                                    onChange={e => setAdmitForm(f => ({ ...f, admissionDate: e.target.value }))} />
                            </FormField>
                        </div>

                        <FormField label="Fee Paid (₹)" hint="Leave 0 if payment is pending">
                            <input className="form-control" type="number" min="0" placeholder="0"
                                value={admitForm.feePaid}
                                onChange={e => setAdmitForm(f => ({ ...f, feePaid: e.target.value }))} />
                        </FormField>
                    </div>
                )}
            </Modal>

            {/* ── Payment Modal ────────────────────────────────────────────── */}
            <Modal
                open={payModal}
                title={`Update Payment — ${payRow?.enquiry?.leadName}`}
                onClose={() => setPayModal(false)}
                size="sm"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setPayModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleUpdatePayment} disabled={paying}>
                            {paying ? <><Spinner size={13} /> Saving…</> : '💰 Update Payment'}
                        </button>
                    </>
                }
            >
                {payRow?.admission && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 8, fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Course Fee</span>
                                <strong>₹{Number(payRow.admission.courseFee || 0).toLocaleString('en-IN')}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ color: 'var(--color-text-muted)' }}>Previously Paid</span>
                                <strong style={{ color: 'var(--color-warning)' }}>
                                    ₹{Number(payRow.admission.feePaid || 0).toLocaleString('en-IN')}
                                </strong>
                            </div>
                            <PaymentBar paid={payRow.admission.feePaid ?? 0} total={payRow.admission.courseFee ?? 0} />
                        </div>
                        <FormField label="New Total Amount Paid (₹)" required>
                            <input className="form-control" type="number" min="0"
                                max={payRow.admission.courseFee}
                                placeholder="Enter total paid so far"
                                value={newFeePaid}
                                onChange={e => setNewFeePaid(e.target.value)} />
                        </FormField>
                        {newFeePaid && (
                            <div style={{
                                padding: '8px 12px', borderRadius: 7, fontSize: 12,
                                background: Number(newFeePaid) >= Number(payRow.admission.courseFee)
                                    ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                                color: Number(newFeePaid) >= Number(payRow.admission.courseFee)
                                    ? 'var(--color-success)' : 'var(--color-warning)',
                            }}>
                                {Number(newFeePaid) >= Number(payRow.admission.courseFee)
                                    ? '✓ Full payment — status becomes PAID'
                                    : `Balance: ₹${Math.max(0, Number(payRow.admission.courseFee) - Number(newFeePaid)).toLocaleString('en-IN')} — status becomes PARTIAL`
                                }
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* ── Trainer Modal ────────────────────────────────────────────── */}
            <Modal
                open={trainerModal}
                title={`Assign Trainer — ${trainerRow?.enquiry?.leadName}`}
                onClose={() => setTrainerModal(false)}
                size="sm"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setTrainerModal(false)}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleAssignTrainer} disabled={assigning}>
                            {assigning ? <><Spinner size={13} /> Assigning…</> : 'Assign Trainer'}
                        </button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {trainerRow?.admission && (
                        <div style={{ padding: '10px 14px', background: 'var(--color-surface-2)', borderRadius: 8, fontSize: 13 }}>
                            <div><strong>Student:</strong> {trainerRow.admission.studentName}</div>
                            <div><strong>Course:</strong>  {trainerRow.admission.courseName}</div>
                            {trainerRow.admission.trainerName && (
                                <div style={{ color: 'var(--color-text-muted)', marginTop: 4, fontSize: 12 }}>
                                    Current trainer: {trainerRow.admission.trainerName}
                                </div>
                            )}
                        </div>
                    )}
                    <FormField label="Select Trainer" required>
                        <select className="form-control form-select" value={selectedTrainer}
                            onChange={e => setSelectedTrainer(e.target.value)}>
                            <option value="">Choose a trainer…</option>
                            {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </FormField>
                </div>
            </Modal>
        </div>
    );
}