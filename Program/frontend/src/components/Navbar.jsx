import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Search,
  Plus,
  User,
  Settings,
  LogOut,
  ChevronDown,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCredentials } from '../context/CredentialContext';
import ThemeToggle from './ThemeToggle';

export default function Navbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery, openAddModal } = useCredentials();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute page title from path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/passwords':
        return 'All Passwords';
      case '/favorites':
        return 'Favorites';
      case '/categories':
        return 'Categories';
      case '/security':
        return 'Security Center';
      case '/settings':
        return 'Settings';
      default:
        return 'SecureVault';
    }
  };

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'var(--bg-navbar)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 80,
        transition: 'background-color 0.25s ease',
      }}
      className="vault-navbar"
    >
      {/* Left side: Hamburger (mobile) & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="btn-icon mobile-only"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {getPageTitle()}
        </h1>
      </div>

      {/* Center: Global Search Input */}
      <div
        style={{
          flex: 1,
          maxWidth: '480px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}
        className="nav-search-container"
      >
        <Search
          size={17}
          color="var(--text-muted)"
          style={{ position: 'absolute', left: '0.875rem', pointerEvents: 'none' }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search websites, URLs, usernames..."
          style={{
            width: '100%',
            padding: '0.55rem 2.25rem 0.55rem 2.5rem',
            backgroundColor: 'var(--bg-card-subtle)',
            border: '1px solid var(--border-color)',
            borderRadius: '9999px',
            fontSize: '0.875rem',
            color: 'var(--text-primary)',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.25s',
          }}
          className="search-input"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute',
              right: '0.75rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
            }}
            aria-label="Clear search"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Right side: Add Password, Theme Toggle, User Profile Menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={openAddModal}
          className="btn btn-primary"
          style={{ boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' }}
        >
          <Plus size={18} />
          <span className="hide-on-mobile">Add Password</span>
        </button>

        <ThemeToggle />

        {/* User Profile Dropdown */}
        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '8px',
            }}
            aria-expanded={profileOpen}
            aria-label="User account menu"
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-light)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.875rem',
                border: '1px solid var(--border-color)',
              }}
            >
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <ChevronDown size={14} color="var(--text-secondary)" className="hide-on-mobile" />
          </button>

          {profileOpen && (
            <div
              className="vault-card"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '240px',
                padding: '0.5rem',
                zIndex: 100,
                boxShadow: 'var(--shadow-lg)',
                borderRadius: '12px',
                animation: 'slideUp 0.15s ease',
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '0.35rem',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  {user?.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user?.email}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/settings');
                }}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              >
                <Settings size={16} />
                <span>Account Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/security');
                }}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              >
                <ShieldCheck size={16} />
                <span>Security Audit</span>
              </button>

              <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.35rem 0' }} />

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'flex-start', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: 'var(--danger)' }}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
