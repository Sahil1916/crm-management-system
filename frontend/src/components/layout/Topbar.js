import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

export default function Topbar({ onMobileMenuToggle }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search,        setSearch]        = useState('');
  const [notifCount,    setNotifCount]    = useState(0);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notifRef = useRef(null);

  // Poll unread count every 30s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await notificationsAPI.countUnread();
        setNotifCount(res.data?.data || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const openNotifications = async () => {
    if (!notifOpen) {
      try {
        const res = await notificationsAPI.getUnread();
        setNotifications(res.data?.data || []);
        setNotifOpen(true);
      } catch {}
    } else {
      setNotifOpen(false);
    }
  };

  const markAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifCount(0);
    setNotifications([]);
    setNotifOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/search?q=${encodeURIComponent(search.trim())}`);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 90,
      height: 'var(--topbar-height)',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex', alignItems: 'center',
      padding: '0 20px', gap: 12,
    }}>
      {/* Mobile menu button */}
      <button
        className="btn btn-secondary btn-sm btn-icon hide-desktop"
        onClick={onMobileMenuToggle}
        style={{ display: 'none' }}
      >☰</button>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 360 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--border-radius)',
          padding: '6px 12px',
        }}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
            <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads, students, courses…"
            style={{
              border: 'none', background: 'transparent',
              fontSize: 13, fontFamily: 'var(--font-sans)',
              color: 'var(--color-text)', outline: 'none', width: '100%',
            }}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 12 }}>
              ✕
            </button>
          )}
        </div>
      </form>

      {/* Right actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>

        {/* Notification Bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="btn btn-secondary btn-sm btn-icon"
            onClick={openNotifications}
            style={{ position: 'relative' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1a5 5 0 015 5v3l1 2H2l1-2V6a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M6 13a2 2 0 004 0" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
            {notifCount > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -4,
                background: 'var(--color-danger)', color: '#fff',
                borderRadius: '50%', width: 16, height: 16,
                fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--color-surface)',
              }}>{notifCount > 9 ? '9+' : notifCount}</span>
            )}
          </button>

          {/* Dropdown */}
          {notifOpen && (
            <div style={{
              position: 'absolute', top: '110%', right: 0,
              width: 320, background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--border-radius-lg)',
              boxShadow: 'var(--shadow-lg)', zIndex: 200,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', borderBottom: '1px solid var(--color-border)',
              }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Notifications</span>
                {notifications.length > 0 && (
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: 11 }}
                    onClick={markAllRead}
                  >Mark all read</button>
                )}
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
                    🎉 You're all caught up!
                  </div>
                ) : notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--color-border)',
                    background: n.isRead ? 'transparent' : 'var(--color-accent-light)',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>{n.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User avatar */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'var(--color-accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: 'pointer',
        }}
          title={user?.email}
        >
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
      </div>
    </header>
  );
}
