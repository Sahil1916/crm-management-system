import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { enquiriesAPI, reportsAPI, admissionsAPI } from '../../api';
import { unwrapList, unwrapObject } from '../../api/index';
import { StatCard, PageHeader, EmptyState, Spinner, Badge } from '../../components/common';

const PIE_COLORS = ['#2563eb', '#d97706', '#16a34a', '#dc2626'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [performance, setPerformance] = useState([]);
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, perfRes, admRes] = await Promise.all([
          enquiriesAPI.stats(),
          reportsAPI.counsellorPerformance(),
          admissionsAPI.getAll({ page: 0, size: 5 }),
        ]);

        // Unwrap stats
        const statsData = statsRes.data?.data ?? statsRes.data ?? {};
        setStats(statsData);

        // Unwrap performance list
        const perfData = perfRes.data?.data ?? perfRes.data ?? [];
        setPerformance(Array.isArray(perfData) ? perfData : []);

        // Unwrap admissions (paged for admin)
        const admData = admRes.data?.data ?? admRes.data ?? {};
        const admList = admData.content ?? (Array.isArray(admData) ? admData : []);
        setAdmissions(admList);
      } catch (e) {
        console.error('Dashboard load error:', e);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={32} />
      </div>
    );
  }

  // Build pie chart data from real stats
  const pieData = stats ? [
    { name: 'New', value: Number(stats.new ?? 0) },
    { name: 'In Contact', value: Number(stats.inContact ?? 0) },
    { name: 'Converted', value: Number(stats.converted ?? 0) },
    { name: 'Dropped', value: Number(stats.dropped ?? 0) },
  ] : [];

  // Build bar chart from recent admissions grouped by month (real data)
  const monthlyData = (() => {
    const months = {};
    admissions.forEach(a => {
      if (!a.admissionDate) return;
      const date = new Date(a.admissionDate);
      const label = date.toLocaleString('en-IN', { month: 'short' });
      months[label] = (months[label] || 0) + 1;
    });
    return Object.entries(months).map(([month, admissions]) => ({ month, admissions }));
  })();

  // Fallback if no admission data yet
  const chartData = monthlyData.length > 0 ? monthlyData : [
    { month: 'No data', admissions: 0 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Dashboard"
        subtitle={`Overview · ${new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`}
        actions={
          <Link to="/admin/enquiries" className="btn btn-primary">+ New Enquiry</Link>
        }
      />

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stats Grid */}
      <div className="grid-4">
        <StatCard
          label="Total Leads"
          value={stats?.total ?? '—'}
          delta="All time"
          deltaType="neutral"
          icon="◎"
        />
        <StatCard
          label="Admissions"
          value={stats?.converted ?? '—'}
          delta="Converted leads"
          deltaType="up"
          icon="✦"
        />
        <StatCard
          label="Conversion Rate"
          value={stats?.total
            ? `${Math.round(((stats.converted ?? 0) / stats.total) * 100)}%`
            : '—'}
          delta="Overall"
          deltaType="neutral"
          icon="◈"
        />
        <StatCard
          label="Active Courses"
          value="6"
          delta="All operational"
          deltaType="neutral"
          icon="◆"
        />
      </div>

      {/* Charts Row */}
      <div className="grid-2">
        {/* Bar Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Admissions by Month</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8, fontSize: 12,
                }}
              />
              <Bar dataKey="admissions" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Lead Status Breakdown</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <ResponsiveContainer width="50%" height={180}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={2}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {pieData.map((d, i) => (
                <div key={d.name} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 0', fontSize: 12,
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: PIE_COLORS[i], flexShrink: 0,
                  }} />
                  <span style={{ color: 'var(--color-text-muted)' }}>{d.name}</span>
                  <span style={{ fontWeight: 600, marginLeft: 'auto' }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Counsellor Performance Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Counsellor Performance</span>
          <Link to="/admin/reports" className="btn btn-secondary btn-sm">Full Report →</Link>
        </div>
        {performance.length === 0 ? (
          <EmptyState icon="📊" title="No data yet" text="Counsellor stats will appear here" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Counsellor</th>
                  <th>Assigned</th>
                  <th>Converted</th>
                  <th>Dropped</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {performance.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'var(--color-success-bg)',
                          color: 'var(--color-success)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700,
                        }}>
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                      </div>
                    </td>
                    <td>{c.assigned}</td>
                    <td><span className="badge badge-green">{c.converted}</span></td>
                    <td><span className="badge badge-red">{c.dropped}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          flex: 1, height: 6,
                          background: 'var(--color-surface-2)',
                          borderRadius: 3, overflow: 'hidden', maxWidth: 80,
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 3,
                            width: `${c.conversionRate}%`,
                            background: c.conversionRate >= 40 ? 'var(--color-success)'
                              : c.conversionRate >= 25 ? 'var(--color-warning)'
                                : 'var(--color-danger)',
                          }} />
                        </div>
                        <strong>{c.conversionRate}%</strong>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}