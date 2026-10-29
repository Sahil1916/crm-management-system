import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_CONFIG = {
  ADMIN: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '◈' },
    { label: 'Enquiries', path: '/admin/enquiries', icon: '◎' },
    { label: 'Admissions', path: '/admin/admissions', icon: '✦' },
    { label: 'Courses', path: '/admin/courses', icon: '◆' },
    { label: 'Users & Roles', path: '/admin/users', icon: '◉' },
    { label: 'Reports', path: '/admin/reports', icon: '◧' },
    { label: 'Audit Logs', path: '/admin/audit', icon: '◷' },
  ],
  COUNSELLOR: [
    { label: 'Dashboard', path: '/counsellor/dashboard', icon: '◈' },
    { label: 'My Leads', path: '/counsellor/leads', icon: '◎' },
    { label: 'Admissions', path: '/counsellor/admissions', icon: '✦' },
  ],
  TRAINER: [
    { label: 'My Students', path: '/trainer/students', icon: '◈' },
    { label: 'Attendance', path: '/trainer/attendance', icon: '◎' },
  ],
  STUDENT: [
    { label: 'My Dashboard', path: '/student/dashboard', icon: '◈' },
  ],
};

const ROLE_STYLES = {
  ADMIN: { bg: '#2563eb', light: '#eff3ff', label: 'Administrator' },
  COUNSELLOR: { bg: '#16a34a', light: '#f0fdf4', label: 'Counsellor' },
  TRAINER: { bg: '#7c3aed', light: '#f5f3ff', label: 'Trainer' },
  STUDENT: { bg: '#0d9488', light: '#f0fdfa', label: 'Student' },
};

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = NAV_CONFIG[user?.role] || [];
  const roleStyle = ROLE_STYLES[user?.role] || ROLE_STYLES.STUDENT;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside style={{
      position: 'fixed', top: 0, left: 0, bottom: 0,
      width: 'var(--sidebar-width)',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex', flexDirection: 'column',
      zIndex: 100, overflowY: 'auto',
    }}>
      {/* Brand */}
      <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: '#0f172a',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className="bi bi-mortarboard-fill" style={{ color: 'rgb(14,165,233)', fontSize: 20 }} />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-.3px' }}>AdmitPro</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>CRM System</div>
          </div>
        </div>
      </div>

      {/* Role Pill */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '7px 12px', background: roleStyle.light, borderRadius: 8,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: roleStyle.bg, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: roleStyle.bg }}>{roleStyle.label}</span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px' }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '1px',
          textTransform: 'uppercase', color: 'var(--color-text-light)',
          padding: '6px 12px 6px', marginBottom: 2,
        }}>Menu</div>

        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onMobileClose}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8, marginBottom: 2,
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              background: isActive ? 'var(--color-accent-light)' : 'transparent',
              borderLeft: `3px solid ${isActive ? 'var(--color-accent)' : 'transparent'}`,
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
            })}
          >
            <span style={{ fontSize: 14 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%',
            background: roleStyle.bg, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: 12, fontWeight: 600,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{user?.name}</div>
            <div style={{
              fontSize: 11, color: 'var(--color-text-muted)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{user?.email}</div>
          </div>
        </div>
        <button className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
          onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </aside>
  );
}