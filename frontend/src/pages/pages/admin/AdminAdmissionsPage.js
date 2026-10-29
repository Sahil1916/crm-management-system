import React, { useState, useEffect, useCallback } from 'react';
import { admissionsAPI } from '../../api';
import {
    PageHeader, EmptyState, Spinner, ToastContainer
} from '../../components/common';
import { useToast } from '../../hooks';

// ── Helper components ──────────────────────────────────────────────────────
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
            <div style={{
                height: 6, background: 'var(--color-surface-2)',
                borderRadius: 3, overflow: 'hidden',
            }}>
                <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${pct}%`,
                    background: pct === 100 ? 'var(--color-success)'
                        : pct > 0 ? 'var(--color-warning)'
                            : 'var(--color-danger)',
                    transition: 'width .4s ease',
                }} />
            </div>
        </div>
    );
}

function PaymentBadge({ status }) {
    const cfg = {
        PAID: { label: 'Fully Paid', cls: 'badge-green' },
        PARTIAL: { label: 'Partially Paid', cls: 'badge-amber' },
        PENDING: { label: 'Payment Pending', cls: 'badge-red' },
    };
    const { label, cls } = cfg[status] || { label: status, cls: 'badge-gray' };
    return <span className={`badge ${cls}`}>{label}</span>;
}

function AdmissionBadge({ done }) {
    return done
        ? <span className="badge badge-green">✓ Admitted</span>
        : <span className="badge badge-amber">⏳ Pending Admission</span>;
}

// ── Filter tabs ────────────────────────────────────────────────────────────
const FILTER_TABS = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Admission Pending' },
    { value: 'done', label: 'Admitted' },
    { value: 'unpaid', label: 'Payment Due' },
];

export default function CounsellorAdmissionsPage() {
    const { toasts, addToast, removeToast } = useToast();

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');

    // ── Load converted leads for this counsellor ──────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await admissionsAPI.getConvertedLeads();
            const list = res.data?.data ?? res.data ?? [];
            setRows(Array.isArray(list) ? list : []);
        } catch (e) {
            console.error('Load admissions error:', e);
            addToast('Failed to load admission data', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Filter + search ───────────────────────────────────────────────────────
    const filtered = rows.filter(row => {
        const q = search.toLowerCase();
        const matchSearch = !q
            || row.enquiry?.leadName?.toLowerCase().includes(q)
            || row.enquiry?.phone?.includes(q)
            || row.enquiry?.courseName?.toLowerCase().includes(q);

        const matchFilter =
            filter === 'all' ? true
                : filter === 'pending' ? !row.hasAdmission
                    : filter === 'done' ? row.hasAdmission
                        : filter === 'unpaid' ? (row.hasAdmission && row.admission?.paymentStatus !== 'PAID')
                            : true;

        return matchSearch && matchFilter;
    });

    // ── Stats ─────────────────────────────────────────────────────────────────
    const totalConverted = rows.length;
    const admissionDone = rows.filter(r => r.hasAdmission).length;
    const admissionPending = rows.filter(r => !r.hasAdmission).length;
    const paymentDue = rows.filter(r => r.hasAdmission && r.admission?.paymentStatus !== 'PAID').length;
    const totalCollected = rows
        .filter(r => r.hasAdmission)
        .reduce((sum, r) => sum + Number(r.admission?.feePaid ?? 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <ToastContainer toasts={toasts} onRemove={removeToast} />

            <PageHeader
                title="Admissions"
                subtitle="Converted leads and their admission status"
            />

            {/* ── Stats ─────────────────────────────────────────────────────── */}
            <div className="grid-4">
                {[
                    { label: 'My Conversions', value: totalConverted, color: 'var(--color-accent)' },
                    { label: 'Admitted', value: admissionDone, color: 'var(--color-success)' },
                    { label: 'Pending Admit', value: admissionPending, color: 'var(--color-warning)' },
                    { label: 'Fee Collected', value: `₹${totalCollected.toLocaleString('en-IN')}`, color: 'var(--color-teal)' },
                ].map(s => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-label">{s.label}</div>
                        <div className="stat-value" style={{ color: s.color, fontSize: s.label === 'Fee Collected' ? 20 : 28 }}>
                            {s.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filter + Search ───────────────────────────────────────────── */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {FILTER_TABS.map(f => (
                            <button key={f.value}
                                onClick={() => setFilter(f.value)}
                                style={{
                                    padding: '5px 12px', borderRadius: 20, fontSize: 12,
                                    fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                                    border: `1px solid ${filter === f.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                                    background: filter === f.value ? 'var(--color-accent)' : 'var(--color-surface-2)',
                                    color: filter === f.value ? '#fff' : 'var(--color-text-muted)',
                                    transition: 'all .12s',
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
                            placeholder="Search name or phone…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* ── Table ─────────────────────────────────────────────────── */}
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                        <Spinner size={28} />
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        icon="🎓"
                        title="No records found"
                        text={rows.length === 0
                            ? 'Leads you convert will appear here'
                            : 'Try a different filter'}
                    />
                ) : (
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Lead</th>
                                    <th>Course</th>
                                    <th>Admission Status</th>
                                    <th>Trainer</th>
                                    <th>Payment</th>
                                    <th>Fee Progress</th>
                                    <th>Dates</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row, idx) => {
                                    const e = row.enquiry;
                                    const adm = row.admission;
                                    const has = row.hasAdmission;

                                    return (
                                        <tr key={e?.id ?? idx}>
                                            {/* Lead info */}
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
                                                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                            {e?.phone}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Course */}
                                            <td style={{ fontSize: 12 }}>
                                                <div style={{ fontWeight: 500 }}>{e?.courseName}</div>
                                            </td>

                                            {/* Admission Status */}
                                            <td>
                                                <AdmissionBadge done={has && adm?.admissionDone} />
                                                {!has && (
                                                    <div style={{
                                                        fontSize: 10, color: 'var(--color-text-muted)',
                                                        marginTop: 3, fontStyle: 'italic',
                                                    }}>
                                                        Waiting for admin to process
                                                    </div>
                                                )}
                                            </td>

                                            {/* Trainer */}
                                            <td style={{ fontSize: 12 }}>
                                                {has && adm?.trainerName
                                                    ? <span style={{ color: 'var(--color-purple)', fontWeight: 500 }}>
                                                        {adm.trainerName}
                                                    </span>
                                                    : <span style={{ color: 'var(--color-text-light)', fontSize: 11, fontStyle: 'italic' }}>
                                                        {has ? 'Not yet assigned' : '—'}
                                                    </span>
                                                }
                                            </td>

                                            {/* Payment badge */}
                                            <td>
                                                {has
                                                    ? <PaymentBadge status={adm?.paymentStatus} />
                                                    : <span style={{ color: 'var(--color-text-light)', fontSize: 11, fontStyle: 'italic' }}>
                                                        —
                                                    </span>
                                                }
                                            </td>

                                            {/* Fee Progress */}
                                            <td style={{ minWidth: 140 }}>
                                                {has
                                                    ? <PaymentBar
                                                        paid={adm?.feePaid ?? 0}
                                                        total={adm?.courseFee ?? 0}
                                                    />
                                                    : <div style={{
                                                        fontSize: 11, color: 'var(--color-text-light)',
                                                        fontStyle: 'italic',
                                                    }}>No payment yet</div>
                                                }
                                            </td>

                                            {/* Dates */}
                                            <td>
                                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                                                    <div>
                                                        <strong>Converted:</strong>{' '}
                                                        {e?.enquiryDate
                                                            ? new Date(e.enquiryDate).toLocaleDateString('en-IN')
                                                            : '—'}
                                                    </div>
                                                    {has && adm?.admissionDate && (
                                                        <div style={{ marginTop: 2 }}>
                                                            <strong>Admitted:</strong>{' '}
                                                            {new Date(adm.admissionDate).toLocaleDateString('en-IN')}
                                                        </div>
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

                {/* ── Balance summary footer ─────────────────────────────────── */}
                {filtered.length > 0 && (
                    <div style={{
                        marginTop: 16, padding: '12px 16px',
                        background: 'var(--color-surface-2)',
                        borderRadius: 8, borderTop: '1px solid var(--color-border)',
                        display: 'flex', gap: 24, flexWrap: 'wrap',
                    }}>
                        {[
                            {
                                label: 'Total Course Fees',
                                value: `₹${filtered
                                    .filter(r => r.hasAdmission)
                                    .reduce((s, r) => s + Number(r.admission?.courseFee ?? 0), 0)
                                    .toLocaleString('en-IN')}`,
                                color: 'var(--color-text)',
                            },
                            {
                                label: 'Total Collected',
                                value: `₹${filtered
                                    .filter(r => r.hasAdmission)
                                    .reduce((s, r) => s + Number(r.admission?.feePaid ?? 0), 0)
                                    .toLocaleString('en-IN')}`,
                                color: 'var(--color-success)',
                            },
                            {
                                label: 'Total Balance Due',
                                value: `₹${filtered
                                    .filter(r => r.hasAdmission)
                                    .reduce((s, r) => s + Number(r.admission?.balanceDue ?? 0), 0)
                                    .toLocaleString('en-IN')}`,
                                color: 'var(--color-danger)',
                            },
                        ].map(item => (
                            <div key={item.label}>
                                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{item.label}</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: item.color }}>{item.value}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}   