import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { enquiriesAPI } from '../../api';
import { PageHeader, Badge, EmptyState, Spinner } from '../../components/common';
import { useAuth } from '../../context/AuthContext';

export default function CounsellorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [statsRes, leadsRes] = await Promise.all([
          // Use /my-stats → returns only this counsellor's lead counts
          enquiriesAPI.myStats(),
          // getAll → backend auto-filters to this counsellor's leads
          enquiriesAPI.getAll({ page: 0, size: 5, sort: 'enquiryDate' }),
        ]);

        // Unwrap stats: { success, data: { total, new, inContact, converted, dropped } }
        const statsData = statsRes.data?.data ?? statsRes.data ?? {};
        setStats(statsData);

        // Unwrap leads: { success, data: { content: [...], totalPages, ... } }
        const leadsBody = leadsRes.data?.data ?? leadsRes.data ?? {};
        const leadsList = leadsBody.content ?? (Array.isArray(leadsBody) ? leadsBody : []);
        setRecentLeads(leadsList);
      } catch (e) {
        console.error('Counsellor dashboard error:', e);
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

  const total = Number(stats?.total ?? 0);
  const newCount = Number(stats?.new ?? 0);
  const inContact = Number(stats?.inContact ?? 0);
  const converted = Number(stats?.converted ?? 0);
  const dropped = Number(stats?.dropped ?? 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0]} 👋`}
        subtitle="Here's your lead pipeline for today"
        actions={<Link to="/counsellor/leads" className="btn btn-primary">View All Leads</Link>}
      />

      {error && <div className="alert alert-error">{error}</div>}

      {/* Stat Cards */}
      <div className="grid-4">
        {[
          { label: 'TOTAL ASSIGNED', value: total, color: 'var(--color-accent)' },
          { label: 'IN CONTACT', value: inContact, color: 'var(--color-warning)' },
          { label: 'CONVERTED', value: converted, color: 'var(--color-success)', delta: 'This month' },
          { label: 'DROPPED', value: dropped, color: 'var(--color-danger)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span className="stat-label">{s.label}</span>
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            {s.delta && <div className="stat-delta up">{s.delta}</div>}
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Recent Leads */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Leads</span>
            <Link to="/counsellor/leads" className="btn btn-secondary btn-sm">View all →</Link>
          </div>
          {recentLeads.length === 0 ? (
            <EmptyState icon="📋" title="No leads yet" text="Leads assigned to you will appear here" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {recentLeads.map(lead => (
                <div key={lead.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8,
                  background: 'var(--color-surface-2)',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--color-accent-light)', color: 'var(--color-accent)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13,
                  }}>
                    {lead.leadName?.[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{lead.leadName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{lead.courseName}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                    <Badge value={lead.status} />
                    <Badge value={lead.priority} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pipeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Lead Pipeline</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'New', value: newCount, color: 'var(--color-accent)' },
              { label: 'In Contact', value: inContact, color: 'var(--color-warning)' },
              { label: 'Converted', value: converted, color: 'var(--color-success)' },
              { label: 'Dropped', value: dropped, color: 'var(--color-danger)' },
            ].map(item => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{item.value}</span>
                  </div>
                  <div style={{
                    height: 8, background: 'var(--color-surface-2)',
                    borderRadius: 4, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 4, width: `${pct}%`,
                      background: item.color, transition: 'width .5s ease',
                    }} />
                  </div>
                </div>
              );
            })}
            <div style={{
              marginTop: 4, padding: '10px 14px',
              background: 'var(--color-surface-2)', borderRadius: 8,
              fontSize: 13, color: 'var(--color-text-muted)',
            }}>
              Your conversion rate:{' '}
              <strong style={{ color: 'var(--color-success)' }}>
                {total > 0 ? `${Math.round((converted / total) * 100)}%` : '—'}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}