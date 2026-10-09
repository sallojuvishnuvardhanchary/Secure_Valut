import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  KeyRound,
  Star,
  FolderKanban,
  ShieldAlert,
  Settings,
  LogOut,
  X,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCredentials } from '../context/CredentialContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { stats } = useCredentials();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'All Passwords', path: '/passwords', icon: KeyRound, badge: stats.totalCredentials },
    { name: 'Favorites', path: '/favorites', icon: Star, badge: stats.favoriteCount },
    { name: 'Categories', path: '/categories', icon: FolderKanban, badge: stats.categoriesCount },
    { name: 'Security Center', path: '/security', icon: ShieldAlert, alert: stats.weakPasswordsCount > 0 },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {isOpen && (
        <div
          className="mobile-backdrop"
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 90,
          }}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`vault-sidebar ${isOpen ? 'open' : ''}`}
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 95,
          transition: 'transform 0.3s ease, background-color 0.25s',
        }}
      >
        {/* Top Header & Brand */}
        <div>
          <div
            style={{
              height: '70px',
              padding: '0 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                }}
              >
                <Shield size={22} />
              </div>
              <div>
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  SecureVault
                </span>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.68rem',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  AES-256 Cloud
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              type="button"
              className="btn-icon mobile-only"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav style={{ padding: '1.25rem 0.875rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onClose}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  <Icon size={19} className="nav-icon" />
                  <span style={{ flex: 1 }}>{item.name}</span>

                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        padding: '1px 7px',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--badge-bg)',
                        color: 'var(--badge-text)',
                        fontWeight: 600,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.alert && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--warning)',
                      }}
                      title="Security attention required"
                    />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div
          style={{
            padding: '1.25rem 1rem',
            borderTop: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-card-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.9rem',
                border: '1px solid var(--border-color)',
                flexShrink: 0,
              }}
            >
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Authorized User'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'flex-start', color: 'var(--danger)', padding: '0.5rem 0.75rem', fontSize: '0.825rem' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
