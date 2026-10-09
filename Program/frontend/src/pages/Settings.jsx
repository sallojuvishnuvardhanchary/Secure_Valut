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

  // Password Change state
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [pwdSaving, setPwdSaving] = useState(false);

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmNewPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (pwdForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setPwdSaving(true);
    try {
      const res = await userApi.changePassword(pwdForm);
      if (res.data?.success) {
        toast.success('Master login password changed successfully.');
        setPwdForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change master password.');
    } finally {
      setPwdSaving(false);
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

      {/* 4. Change Master Password */}
      <div className="vault-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
          Change Master Password
        </h3>
        <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Your master password protects access to your entire vault. Make sure it is complex and memorable.
        </p>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Current Master Password</label>
            <input
              type="password"
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              className="form-input mono-font"
              placeholder="••••••••••••"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Master Password</label>
            <input
              type="password"
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              className="form-input mono-font"
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirm New Master Password</label>
            <input
              type="password"
              value={pwdForm.confirmNewPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmNewPassword: e.target.value })}
              className="form-input mono-font"
              placeholder="••••••••••••"
              required
            />
          </div>

          <div>
            <button type="submit" className="btn btn-primary" disabled={pwdSaving}>
              {pwdSaving ? 'Updating Master Password...' : 'Update Master Password'}
            </button>
          </div>
        </form>
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
