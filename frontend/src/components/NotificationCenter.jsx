import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const typeStyles = {
  info: { bg: 'rgba(0,180,216,.1)', border: 'var(--accent)', icon: 'ℹ️' },
  success: { bg: 'rgba(76,175,80,.1)', border: 'var(--green)', icon: '✓' },
  warning: { bg: 'rgba(255,152,0,.1)', border: 'var(--orange)', icon: '⚠' },
  error: { bg: 'rgba(244,67,54,.1)', border: 'var(--red)', icon: '✕' },
};

function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationCenter() {
  const { allNotifications, unreadCount, markAllRead, clearAll } = useSocket();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleOpen = () => {
    setOpen(!open);
    if (!open) markAllRead();
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        className="btn btn-ghost"
        onClick={handleOpen}
        style={{ position: 'relative', padding: '6px 12px', fontSize: 16 }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              background: 'var(--red)',
              color: 'white',
              borderRadius: '50%',
              width: 18,
              height: 18,
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            top: 60,
            width: 320,
            maxHeight: '70vh',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 14px' }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Notifications</div>
          </div>

          {/* Notification List */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {allNotifications.length === 0 ? (
              <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--dim)' }}>
                No notifications yet
              </div>
            ) : (
              allNotifications.map((n) => {
                const style = typeStyles[n.type] || typeStyles.info;
                return (
                  <div
                    key={n.id}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid var(--border)',
                      background: style.bg,
                      borderLeft: `3px solid ${style.border}`,
                    }}
                  >
                    <div style={{ fontSize: 13, marginBottom: 4 }}>
                      <span style={{ marginRight: 6 }}>{style.icon}</span>
                      {n.msg}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--dim)' }}>
                      {timeAgo(new Date(n.timestamp))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {allNotifications.length > 0 && (
            <div
              style={{
                borderTop: '1px solid var(--border)',
                padding: '10px 14px',
                display: 'flex',
                gap: 8,
              }}
            >
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  markAllRead();
                  setOpen(false);
                }}
                style={{ flex: 1 }}
              >
                Mark all read
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={clearAll}
                style={{ flex: 1 }}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
