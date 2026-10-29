import React, { useEffect, useState } from 'react';
import { admissionsAPI, attendanceAPI } from '../../api';
import { EmptyState, Spinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value, accent }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '9px 0', borderBottom: '1px solid var(--color-border)', fontSize: 13,
    }}>
      <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>{label}</span>
      <span style={{ fontWeight: 500, color: accent || 'var(--color-text)' }}>{value || '—'}</span>
    </div>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, accentColor }) {
  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 18px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-2)',
      }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8,
          background: accentColor || 'var(--color-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{title}</span>
      </div>
      <div style={{ padding: '4px 18px 14px' }}>{children}</div>
    </div>
  );
}

// ── Payment Badge ─────────────────────────────────────────────────────────────
function PaymentBadge({ status }) {
  const cfg = {
    PAID: { label: 'Fully Paid', bg: '#dcfce7', color: '#16a34a', border: '#bbf7d0' },
    PARTIAL: { label: 'Partially Paid', bg: '#fef9c3', color: '#b45309', border: '#fde68a' },
    PENDING: { label: 'Payment Pending', bg: '#fee2e2', color: '#dc2626', border: '#fecaca' },
  };
  const c = cfg[status] || { label: status, bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' };
  return (
    <span style={{
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>{c.label}</span>
  );
}

// ── Student Dashboard (Main Export) ──────────────────────────────────────────
export function StudentDashboard() {
  const { user } = useAuth();
  const [admission, setAdmission] = useState(null);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const admRes = await admissionsAPI.getAll({ page: 0, size: 10 });
        const body = admRes.data?.data ?? admRes.data ?? [];
        const list = Array.isArray(body) ? body : (body.content ?? []);
        setAdmission(list[0] ?? null);

        if (user?.id) {
          try {
            const attRes = await attendanceAPI.getSummary(user.id);
            setAttendance(attRes.data?.data ?? attRes.data ?? null);
          } catch (_) { }
        }
      } catch (e) {
        setError('Failed to load your profile data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={32} />
    </div>
  );

  const total = Number(admission?.courseFee || 0);
  const paid = Number(admission?.feePaid || 0);
  const balance = Math.max(0, total - paid);
  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const attPct = attendance?.percentage || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>My Dashboard</h1>
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 3 }}>
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: 10, padding: '8px 14px',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#0d9488', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 16,
          }}>
            {user?.name?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{user?.email}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">{error}</div>
      )}

      {!admission ? (
        <div className="card">
          <EmptyState
            icon="🎓"
            title="No Admission Found"
            text="Your admission details will appear here once you are enrolled. Please contact the counsellor."
          />
        </div>
      ) : (
        <>
          {/* ── TOP: Profile Card ───────────────────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            borderRadius: 14, padding: '24px 28px', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
          }}>
            {/* Avatar */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(14,165,233,.25)',
              border: '3px solid rgba(14,165,233,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, flexShrink: 0,
              color: 'rgb(14,165,233)',
            }}>
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>

            {/* Personal info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.65)', marginTop: 2 }}>
                {user?.email}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'Student ID', value: `#${user?.id}` },
                  { label: 'Phone', value: user?.phone || '—' },
                  { label: 'Status', value: user?.isActive ? 'Active' : 'Inactive' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: '.5px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,.9)' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stat pills */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                background: 'rgba(14,165,233,.15)', border: '1px solid rgba(14,165,233,.3)',
                borderRadius: 10, padding: '10px 16px', textAlign: 'center',
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'rgb(14,165,233)' }}>
                  {attPct}%
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>Attendance</div>
              </div>
              <div style={{
                background: paid >= total && total > 0 ? 'rgba(22,163,74,.15)' : 'rgba(220,38,38,.15)',
                border: `1px solid ${paid >= total && total > 0 ? 'rgba(22,163,74,.3)' : 'rgba(220,38,38,.3)'}`,
                borderRadius: 10, padding: '10px 16px', textAlign: 'center',
              }}>
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: paid >= total && total > 0 ? '#4ade80' : '#f87171',
                }}>
                  {admission?.paymentStatus || '—'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 2 }}>Fee Status</div>
              </div>
            </div>
          </div>

          {/* ── MIDDLE + RIGHT layout ─────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, alignItems: 'start' }}>

            {/* ── LEFT: Course + Admission ─────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Course Information */}
              <SectionCard title="Course Information" icon="📚" accentColor="#2563eb">
                <InfoRow label="Course Name" value={admission.courseName} />
                <InfoRow label="Course Level" value={admission.courseLevel || '—'} />
                <InfoRow label="Duration" value={admission.courseDurationMonths ? `${admission.courseDurationMonths} Months` : '—'} />
                <InfoRow label="Total Fees" value={`₹${total.toLocaleString('en-IN')}`} />
                <InfoRow label="Batch Timing" value="Morning · 9:00 AM – 12:00 PM" />
                <InfoRow label="Learning Mode" value="Offline (Classroom)" />
              </SectionCard>

              {/* Admission Information */}
              <SectionCard title="Admission Information" icon="🎓" accentColor="#0d9488">
                <InfoRow label="Admission ID" value={`ADM-${String(admission.id).padStart(4, '0')}`} />
                <InfoRow label="Admission Date" value={admission.admissionDate
                  ? new Date(admission.admissionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'} />
                <InfoRow label="Course" value={admission.courseName} />
                <InfoRow label="Counsellor" value={admission.counsellorName || '—'} />
                <InfoRow
                  label="Admission Status"
                  value={admission.admissionDone ? 'Completed' : 'In Progress'}
                  accent={admission.admissionDone ? '#16a34a' : '#d97706'}
                />
              </SectionCard>
            </div>

            {/* ── RIGHT: Trainer + Fee ─────────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Trainer Information */}
              <SectionCard title="Trainer Information" icon="👨‍🏫" accentColor="#7c3aed">
                {admission.trainerName ? (
                  <>
                    {/* Trainer avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 10px', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: '50%',
                        background: '#ede9fe', color: '#7c3aed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: 18, flexShrink: 0,
                      }}>
                        {admission.trainerName?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{admission.trainerName}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>Assigned Trainer</div>
                      </div>
                    </div>
                    <InfoRow label="Trainer ID" value={`#${admission.trainerId}`} />
                    <InfoRow label="Contact" value="Contact via institute" />
                    <InfoRow label="Course" value={admission.courseName} />
                  </>
                ) : (
                  <div style={{ padding: '20px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>👨‍🏫</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                      Trainer not yet assigned.<br />
                      <span style={{ fontSize: 12 }}>You will be notified once assigned.</span>
                    </div>
                  </div>
                )}
              </SectionCard>

              {/* Fee Information */}
              <SectionCard title="Fee Information" icon="💰" accentColor="#16a34a">
                {/* Payment progress circle */}
                <div style={{ textAlign: 'center', padding: '14px 0 10px' }}>
                  <div style={{
                    width: 90, height: 90, borderRadius: '50%', margin: '0 auto',
                    background: `conic-gradient(
                      ${pct === 100 ? '#16a34a' : pct > 0 ? '#d97706' : '#dc2626'} ${pct * 3.6}deg,
                      var(--color-surface-2) 0
                    )`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: 68, height: 68, borderRadius: '50%',
                      background: 'var(--color-surface)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700,
                    }}>{pct}%</div>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <PaymentBadge status={admission.paymentStatus} />
                  </div>
                </div>

                <InfoRow
                  label="Total Fees"
                  value={`₹${total.toLocaleString('en-IN')}`}
                />
                <InfoRow
                  label="Paid Amount"
                  value={`₹${paid.toLocaleString('en-IN')}`}
                  accent="#16a34a"
                />
                <InfoRow
                  label="Pending Amount"
                  value={balance > 0 ? `₹${balance.toLocaleString('en-IN')}` : '✓ Cleared'}
                  accent={balance > 0 ? '#dc2626' : '#16a34a'}
                />
              </SectionCard>

              {/* Attendance Card */}
              <SectionCard title="Attendance" icon="📅" accentColor="#0284c7">
                {attendance ? (
                  <>
                    <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
                      <div style={{ fontSize: 36, fontWeight: 700, color: attPct >= 75 ? '#16a34a' : '#dc2626' }}>
                        {attPct}%
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        Overall Attendance
                      </div>
                      {attPct < 75 && (
                        <div style={{
                          marginTop: 8, padding: '5px 10px', borderRadius: 6,
                          background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 500,
                        }}>⚠ Below 75% — at risk</div>
                      )}
                    </div>
                    <div style={{ height: 6, background: 'var(--color-surface-2)', borderRadius: 3, overflow: 'hidden', margin: '0 0 10px' }}>
                      <div style={{
                        height: '100%', borderRadius: 3,
                        width: `${attPct}%`,
                        background: attPct >= 75 ? '#16a34a' : '#dc2626',
                        transition: 'width .5s',
                      }} />
                    </div>
                    <InfoRow label="Present" value={`${attendance.present} classes`} accent="#16a34a" />
                    <InfoRow label="Absent" value={`${attendance.total - attendance.present} classes`} accent="#dc2626" />
                    <InfoRow label="Total" value={`${attendance.total} classes`} />
                  </>
                ) : (
                  <div style={{ padding: '16px 0', textAlign: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
                    No attendance records yet
                  </div>
                )}
              </SectionCard>

            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Keep these as simple redirects to the dashboard since student is single-page
export function StudentCoursesPage() { return <StudentDashboard />; }
export function StudentFeesPage() { return <StudentDashboard />; }
