import React, { useState } from 'react';
import {
  Sun,
  Moon,
  User,
  Lock,
  Shield,
  KeyRound,
  LayoutGrid,
  Grid2x2,
  List,
  Table as TableIcon,
  CheckCircle2,
  AlertCircle,
  LogOut,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { useCredentials } from '../context/CredentialContext';
import { userApi } from '../services/api';

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { viewMode, setViewMode } = useCredentials();
  const toast = useToast();

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [profileSaving, setProfileSaving] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    setProfileSaving(true);
    try {
      const res = await userApi.updateProfile({ name });
      if (res.data?.success) {
        updateUser({ name: res.data.user.name });
        toast.success('Profile name successfully updated.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };



  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '860px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Vault Preferences & Security Settings
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Manage your account profile, visual themes, and cryptographic security settings.
        </p>
      </div>

      {/* 1. Theme Preferences */}
      <div className="vault-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
          Appearance & Theme
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Select your preferred interface display mode. Saved automatically across sessions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => setTheme('light')}
            className="vault-card"
            style={{
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              border: theme === 'light' ? '2px solid var(--accent)' : '1px solid var(--border-color)',
              backgroundColor: theme === 'light' ? 'var(--accent-light)' : 'var(--bg-card)',
            }}
          >
            <Sun size={20} color={theme === 'light' ? 'var(--accent)' : 'var(--text-secondary)'} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Light Mode</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Clean neutral background</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className="vault-card"
            style={{
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              border: theme === 'dark' ? '2px solid var(--accent)' : '1px solid var(--border-color)',
              backgroundColor: theme === 'dark' ? 'var(--accent-light)' : 'var(--bg-card)',
            }}
          >
            <Moon size={20} color={theme === 'dark' ? 'var(--accent)' : 'var(--text-secondary)'} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Dark Mode</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Low-light contrast palette</div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Default Dashboard View Mode */}
      <div className="vault-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
          Default Credential Display
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Choose your default view format for password records.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => setViewMode('large-cards')}
            className={`btn ${viewMode === 'large-cards' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <LayoutGrid size={16} />
            Large Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('small-cards')}
            className={`btn ${viewMode === 'small-cards' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <Grid2x2 size={16} />
            Small Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <List size={16} />
            List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.85rem', justifyContent: 'flex-start' }}
          >
            <TableIcon size={16} />
            Table View
          </button>
        </div>
      </div>

      {/* 3. Profile Information */}
      <div className="vault-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
          Profile Information
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Update your vault account name.
        </p>

        <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address (Read-only)</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="form-input"
              style={{ opacity: 0.7, cursor: 'not-allowed' }}
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary" disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* 4. Authentication Security: Passwordless Email OTP */}
      <div className="vault-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Authentication & Access Protection
          </h3>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.3rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
              border: '1px solid var(--success)',
            }}
          >
            <CheckCircle2 size={13} />
            Passwordless Email OTP Active
          </span>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Your vault is protected by cryptographically secure one-time password (OTP) verification dispatched directly to your registered email address.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>AUTHENTICATION METHOD</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              6-Digit CSPRNG Email OTP
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Zero login passwords stored or required.
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OTP EXPIRY & LIMITS</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              5 Minutes / Max 5 Attempts
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Includes 60s cooldown against brute-force.
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: 'var(--bg-card-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>STORAGE INTEGRITY</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
              HMAC-SHA256 Hashing
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Codes are never stored in plaintext in MongoDB.
            </div>
          </div>
        </div>
      </div>

      {/* 5. Cryptographic Architecture Information */}
      <div
        className="vault-card"
        style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-card-subtle)',
          borderLeft: '4px solid var(--accent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <Shield size={20} color="var(--accent)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Cryptographic Architecture & Key Management
          </h3>
        </div>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          <strong>Encryption Standard:</strong> All stored website passwords are encrypted on the backend using authenticated <strong>AES-256-GCM</strong> (Galois/Counter Mode) with unique 12-byte initialization vectors (IVs) and 128-bit authentication tags to prevent bit-flipping and tampering.
          <br /><br />
          <strong>Tenant Isolation:</strong> Keys are derived per-user using <strong>HKDF-SHA256</strong>, combining the server secret key with the user's specific identifier as salt and context. User A's ciphertext cannot be decrypted using User B's key.
          <br /><br />
          <strong>Key Management Policy:</strong> The master key is maintained in secure environment variables outside of MongoDB. In cloud deployments, this integrates with hardware security modules (AWS KMS / HashiCorp Vault).
        </p>
      </div>

      {/* 6. Session & Logout Controls */}
      <div className="vault-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Session Termination
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            End your current authenticated browser session and clear stored session tokens.
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="btn btn-secondary"
          style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
        >
          <LogOut size={16} />
          Sign Out of Vault
        </button>
      </div>
    </div>
  );
}
