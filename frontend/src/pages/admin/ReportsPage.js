import React, { useEffect, useState } from 'react';
import { reportsAPI } from '../../api';
import { PageHeader, StatCard, EmptyState, Spinner } from '../../components/common';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

function exportCSV(data, filename) {
  if (!data || data.length === 0) return;
  const keys    = Object.keys(data[0]);
  const csvRows = [
    keys.join(','),
    ...data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(',')),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [performance,  setPerformance]  = useState([]);
  const [conversion,   setConversion]   = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [dateRange,    setDateRange]    = useState({
    from: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    to:   new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [perfRes, convRes] = await Promise.all([
          reportsAPI.counsellorPerformance(),
          reportsAPI.leadConversion(),
        ]);
        setPerformance(perfRes.data?.data || []);
        setConversion(convRes.data?.data  || null);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding: 60 }}><Spinner size={32} /></div>
  );

  const MOCK_MONTHLY = [
    { month:'Jan', leads:68,  admissions:24 },
    { month:'Feb', leads:72,  admissions:28 },
    { month:'Mar', leads:90,  admissions:35 },
    { month:'Apr', leads:84,  admissions:30 },
    { month:'May', leads:110, admissions:42 },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 20 }}>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Performance overview and lead conversion analysis"
        actions={
          <div style={{ display:'flex', gap: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={() => exportCSV(performance, 'counsellor-performance.csv')}
            >⬇ Export CSV</button>
          </div>
        }
      />

      {/* Summary stats */}
      <div className="grid-4">
        <StatCard
          label="Total Leads"
          value={conversion?.total ?? '—'}
          delta="All time" deltaType="neutral" icon="◎"
        />
        <StatCard
          label="Converted"
          value={conversion?.converted ?? '—'}
          delta="Admissions" deltaType="up" icon="✦"
        />
        <StatCard
          label="Dropped"
          value={conversion?.dropped ?? '—'}
          deltaType="down" icon="◷"
        />
        <StatCard
          label="Conversion Rate"
          value={conversion?.conversionRate ? `${conversion.conversionRate}%` : '—'}
          delta="Overall" deltaType="neutral" icon="◈"
          accentColor={
            conversion?.conversionRate >= 40 ? 'var(--color-success)' :
            conversion?.conversionRate >= 25 ? 'var(--color-warning)' : 'var(--color-danger)'
          }
        />
      </div>

      {/* Date range picker */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Filter Date Range</span>
        </div>
        <div style={{ display:'flex', gap: 12, alignItems:'center', flexWrap:'wrap' }}>
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <label style={{ fontSize: 12, color:'var(--color-text-muted)', whiteSpace:'nowrap' }}>From:</label>
            <input
              className="form-control" type="date" style={{ width: 160 }}
              value={dateRange.from}
              onChange={e => setDateRange(r => ({ ...r, from: e.target.value }))}
            />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
            <label style={{ fontSize: 12, color:'var(--color-text-muted)', whiteSpace:'nowrap' }}>To:</label>
            <input
              className="form-control" type="date" style={{ width: 160 }}
              value={dateRange.to}
              onChange={e => setDateRange(r => ({ ...r, to: e.target.value }))}
            />
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => reportsAPI.admissions({ ...dateRange, format:'csv' }).then(() => {})}
          >Apply & Export</button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Monthly Leads vs Admissions</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MOCK_MONTHLY} barSize={18} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="leads"      fill="var(--color-accent)"  radius={[4,4,0,0]} name="Leads" />
              <Bar dataKey="admissions" fill="var(--color-success)" radius={[4,4,0,0]} name="Admissions" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:'flex', gap: 16, justifyContent:'center', marginTop: 8 }}>
            <div style={{ display:'flex', alignItems:'center', gap: 5, fontSize: 11, color:'var(--color-text-muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background:'var(--color-accent)' }}/>Leads
            </div>
            <div style={{ display:'flex', alignItems:'center', gap: 5, fontSize: 11, color:'var(--color-text-muted)' }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background:'var(--color-success)' }}/>Admissions
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Conversion Trend</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={MOCK_MONTHLY}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line
                type="monotone" dataKey="admissions"
                stroke="var(--color-accent)" strokeWidth={2}
                dot={{ r: 4, fill:'var(--color-accent)' }}
                name="Admissions"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Counsellor Performance Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Counsellor Performance</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => exportCSV(performance, 'counsellor-performance.csv')}
          >⬇ CSV</button>
        </div>
        {performance.length === 0 ? (
          <EmptyState icon="📊" title="No performance data" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Counsellor</th>
                  <th>Assigned</th>
                  <th>Converted</th>
                  <th>Dropped</th>
                  <th>Rate</th>
                  <th>Performance</th>
                </tr>
              </thead>
              <tbody>
                {[...performance].sort((a, b) => b.conversionRate - a.conversionRate).map((c, i) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius:'50%',
                          background:'var(--color-success-bg)', color:'var(--color-success)',
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize: 11, fontWeight: 700,
                        }}>{c.name?.[0]?.toUpperCase()}</div>
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                      </div>
                    </td>
                    <td>{c.assigned}</td>
                    <td><span className="badge badge-green">{c.converted}</span></td>
                    <td><span className="badge badge-red">{c.dropped}</span></td>
                    <td><strong>{c.conversionRate}%</strong></td>
                    <td style={{ minWidth: 130 }}>
                      <div style={{ display:'flex', alignItems:'center', gap: 8 }}>
                        <div style={{
                          flex: 1, height: 6, background:'var(--color-surface-2)',
                          borderRadius: 3, overflow:'hidden',
                        }}>
                          <div style={{
                            height:'100%', borderRadius: 3,
                            width:`${c.conversionRate}%`,
                            background:
                              c.conversionRate >= 40 ? 'var(--color-success)' :
                              c.conversionRate >= 25 ? 'var(--color-warning)' : 'var(--color-danger)',
                            transition:'width .5s',
                          }}/>
                        </div>
                        <span style={{ fontSize: 11, color:'var(--color-text-muted)', width: 28, textAlign:'right' }}>
                          #{i + 1}
                        </span>
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
