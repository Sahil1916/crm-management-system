import React, { useEffect, useState, useCallback } from 'react';
import { admissionsAPI, attendanceAPI } from '../../api';
import { PageHeader, EmptyState, Spinner, ToastContainer, Modal } from '../../components/common';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks';

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

function StatCard({ label, value, icon, color }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span className="stat-label">{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div className="stat-value" style={{ color: color || 'var(--color-text)' }}>{value}</div>
    </div>
  );
}

// ── Trainer Dashboard ─────────────────────────────────────────────────────────
export function TrainerDashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  // Student detail modal
  const [detailModal, setDetailModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await admissionsAPI.getAll({ page: 0, size: 100 });
        const body = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(body) ? body : (body.content ?? []);
        setStudents(list);
      } catch (e) {
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !q
      || s.studentName?.toLowerCase().includes(q)
      || s.studentEmail?.toLowerCase().includes(q)
      || s.courseName?.toLowerCase().includes(q);
  });

  const paidCount = students.filter(s => s.paymentStatus === 'PAID').length;
  const partialCount = students.filter(s => s.paymentStatus === 'PARTIAL').length;
  const courses = [...new Set(students.map(s => s.courseName))].filter(Boolean);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <Spinner size={32} />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={`Hello, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Your students and today's overview"
      />

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid-4">
        <StatCard label="Total Students" value={students.length} icon="🧑‍🎓" color="var(--color-accent)" />
        <StatCard label="Fully Paid" value={paidCount} icon="✅" color="var(--color-success)" />
        <StatCard label="Partial / Pending" value={students.length - paidCount} icon="⏳" color="var(--color-warning)" />
        <StatCard label="Courses" value={courses.length} icon="📚" color="var(--color-purple)" />
      </div>

      {/* ── Student Table ───────────────────────────────────────────────────── */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <span className="card-title">My Students</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 8, padding: '6px 12px', minWidth: 220,
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
              placeholder="Search student, course…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon="🧑‍🎓"
            title={students.length === 0 ? 'No students assigned yet' : 'No results found'}
            text={students.length === 0
              ? 'Students will appear here once admitted and assigned to you'
              : 'Try a different search term'}
          />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Admission Date</th>
                  <th>Fee Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id || i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: '#ede9fe', color: '#7c3aed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13,
                        }}>
                          {s.studentName?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13 }}>{s.studentName}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.studentEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{s.courseName}</td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {s.admissionDate
                        ? new Date(s.admissionDate).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                    <td>
                      <span className={`badge ${s.paymentStatus === 'PAID' ? 'badge-green' :
                          s.paymentStatus === 'PARTIAL' ? 'badge-amber' : 'badge-red'
                        }`}>{s.paymentStatus}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: 11 }}
                        onClick={() => { setSelected(s); setDetailModal(true); }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Courses Summary ─────────────────────────────────────────────────── */}
      {courses.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}>My Courses</div>
          <div className="grid-2" style={{ gap: 12 }}>
            {courses.map(course => {
              const courseStudents = students.filter(s => s.courseName === course);
              return (
                <div key={course} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 9, background: 'var(--color-surface)',
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 8, flexShrink: 0,
                    background: '#ede9fe', color: '#7c3aed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>📚</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{course}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {courseStudents.length} student{courseStudents.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Student Detail Modal ─────────────────────────────────────────────── */}
      <Modal
        open={detailModal}
        title={selected?.studentName || 'Student Details'}
        onClose={() => setDetailModal(false)}
        size="md"
        footer={<button className="btn btn-secondary" onClick={() => setDetailModal(false)}>Close</button>}
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Avatar row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 0 10px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: '#ede9fe', color: '#7c3aed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 22, flexShrink: 0,
              }}>
                {selected.studentName?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selected.studentName}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{selected.studentEmail}</div>
              </div>
            </div>

            {/* Personal Info */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Personal Information
              </div>
              <InfoRow label="Student ID" value={`#${selected.studentId}`} />
              <InfoRow label="Email" value={selected.studentEmail} />
            </div>

            {/* Course Info */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Course Information
              </div>
              <InfoRow label="Course" value={selected.courseName} />
              <InfoRow label="Course Fee" value={`₹${Number(selected.courseFee || 0).toLocaleString('en-IN')}`} />
            </div>

            {/* Admission Info */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Admission Information
              </div>
              <InfoRow label="Admission ID" value={`ADM-${String(selected.id).padStart(4, '0')}`} />
              <InfoRow label="Admission Date" value={selected.admissionDate
                ? new Date(selected.admissionDate).toLocaleDateString('en-IN') : '—'} />
            </div>

            {/* Fee Info */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Fee Information
              </div>
              <InfoRow label="Fee Paid" value={`₹${Number(selected.feePaid || 0).toLocaleString('en-IN')}`} accent="#16a34a" />
              <InfoRow label="Balance Due" value={`₹${Math.max(0, Number(selected.courseFee || 0) - Number(selected.feePaid || 0)).toLocaleString('en-IN')}`}
                accent={Number(selected.courseFee || 0) > Number(selected.feePaid || 0) ? '#dc2626' : '#16a34a'} />
              <InfoRow label="Payment Status" value={selected.paymentStatus} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Attendance Page ───────────────────────────────────────────────────────────
export function AttendancePage() {
  const { toasts, addToast, removeToast } = useToast();
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState('');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await admissionsAPI.getAll({ page: 0, size: 100 });
      const body = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(body) ? body : (body.content ?? []);
      setStudents(list);
      const init = {};
      list.forEach(s => { init[s.studentId || s.id] = 'PRESENT'; });
      setAttendance(init);
    } catch {
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleMark = (id, status) => setAttendance(p => ({ ...p, [id]: status }));
  const markAll = (status) => {
    const all = {};
    students.forEach(s => { all[s.studentId || s.id] = status; });
    setAttendance(all);
  };

  const handleSubmit = async () => {
    if (!students.length) { addToast('No students to mark', 'error'); return; }
    setSaving(true);
    try {
      const entries = students.map(s => ({
        studentId: s.studentId || s.id,
        status: attendance[s.studentId || s.id] || 'PRESENT',
      }));
      await attendanceAPI.markBulk({ date, entries });
      addToast(`Attendance saved for ${new Date(date).toLocaleDateString('en-IN')}`, 'success');
    } catch {
      addToast('Failed to save attendance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = students.filter(s => !searchQ || s.studentName?.toLowerCase().includes(searchQ.toLowerCase()));
  const presentCount = Object.values(attendance).filter(v => v === 'PRESENT').length;
  const absentCount = Object.values(attendance).filter(v => v === 'ABSENT').length;
  const lateCount = Object.values(attendance).filter(v => v === 'LATE').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <PageHeader
        title="Mark Attendance"
        subtitle={`${students.length} students · ${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        actions={
          <button className="btn btn-primary" onClick={handleSubmit}
            disabled={saving || !students.length}>
            {saving ? <><Spinner size={13} /> Saving…</> : '✓ Save Attendance'}
          </button>
        }
      />

      {/* Date + Summary + Quick mark */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 12, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>📅 Date:</label>
          <input className="form-control" type="date" value={date}
            onChange={e => setDate(e.target.value)} style={{ width: 160 }} />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <span className="badge badge-green">✓ Present: {presentCount}</span>
          <span className="badge badge-red">✕ Absent: {absentCount}</span>
          <span className="badge badge-amber">◑ Late: {lateCount}</span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
          {['PRESENT', 'ABSENT', 'LATE'].map(s => (
            <button key={s} className="btn btn-secondary btn-sm"
              style={{ fontSize: 11 }} onClick={() => markAll(s)}>
              Mark All {s[0] + s.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 8, padding: '7px 12px', maxWidth: 280,
      }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"
          style={{ flexShrink: 0, color: 'var(--color-text-muted)' }}>
          <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input style={{
          border: 'none', background: 'transparent', fontSize: 12,
          fontFamily: 'inherit', outline: 'none', width: '100%'
        }}
          placeholder="Search student…"
          value={searchQ} onChange={e => setSearchQ(e.target.value)} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Spinner size={24} />
        </div>
      ) : students.length === 0 ? (
        <div className="card">
          <EmptyState icon="🧑‍🎓" title="No students assigned" text="Students will appear once admitted and assigned to you" />
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Mark Attendance</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const sId = s.studentId || s.id;
                  const current = attendance[sId] || 'PRESENT';
                  return (
                    <tr key={sId || i}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: '#ede9fe', color: '#7c3aed',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: 13,
                          }}>{s.studentName?.[0]?.toUpperCase() || 'S'}</div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: 13 }}>{s.studentName}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{s.studentEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.courseName}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {[
                            { val: 'PRESENT', label: '✓ Present', color: '#16a34a', bg: '#dcfce7' },
                            { val: 'ABSENT', label: '✕ Absent', color: '#dc2626', bg: '#fee2e2' },
                            { val: 'LATE', label: '◑ Late', color: '#b45309', bg: '#fef9c3' },
                          ].map(opt => (
                            <button key={opt.val}
                              onClick={() => handleMark(sId, opt.val)}
                              style={{
                                fontSize: 11, padding: '4px 10px', borderRadius: 6,
                                border: '1px solid', cursor: 'pointer', fontFamily: 'inherit',
                                background: current === opt.val ? opt.bg : 'var(--color-surface-2)',
                                color: current === opt.val ? opt.color : 'var(--color-text-muted)',
                                borderColor: current === opt.val ? opt.color : 'var(--color-border)',
                                fontWeight: current === opt.val ? 600 : 400,
                                transition: 'all .12s',
                              }}
                            >{opt.label}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
