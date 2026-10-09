import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  KeyRound,
  FolderKanban,
  Star,
  ShieldAlert,
  ShieldCheck,
  Plus,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useCredentials } from '../context/CredentialContext';
import StatCard from '../components/StatCard';
import PasswordTable from '../components/PasswordTable';
import PasswordCard from '../components/PasswordCard';

export default function Dashboard() {
  const { credentials, stats, loading, openAddModal } = useCredentials();
  const navigate = useNavigate();

  // Show up to 5 most recent credentials on dashboard
  const recentCredentials = credentials.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Banner / Welcome with Security Score */}
      <div
        className="vault-card"
        style={{
          padding: '1.5rem 1.75rem',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-subtle) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderLeft: '4px solid var(--accent)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent)' }}>
              Vault Status
            </span>
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Welcome to your Secure Vault
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            All credentials are encrypted with authenticated AES-256-GCM.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--bg-card)',
              padding: '0.625rem 1rem',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: stats.securityHealthScore >= 80 ? 'var(--success-light)' : 'var(--warning-light)',
                color: stats.securityHealthScore >= 80 ? 'var(--success)' : 'var(--warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {stats.securityHealthScore >= 80 ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Security Score
              </div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats.securityHealthScore}%
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/security')}
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem' }}
          >
            Security Audit
            <ArrowRight size={15} />
          </button>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        <StatCard
          title="Total Passwords"
          value={stats.totalCredentials}
          icon={KeyRound}
          color="var(--accent)"
          bgLight="var(--accent-light)"
          subtext="Saved credentials"
          onClick={() => navigate('/passwords')}
        />
        <StatCard
          title="Categories"
          value={stats.categoriesCount}
          icon={FolderKanban}
          color="#3B82F6"
          bgLight="var(--info-light)"
          subtext="Organized groups"
          onClick={() => navigate('/categories')}
        />
        <StatCard
          title="Favorites"
          value={stats.favoriteCount}
          icon={Star}
          color="#EAB308"
          bgLight="#FEF9C3"
          subtext="Quick access"
          onClick={() => navigate('/favorites')}
        />
        <StatCard
          title="Security Alerts"
          value={stats.weakPasswordsCount + stats.reusedPasswordsCount}
          icon={ShieldAlert}
          color={stats.weakPasswordsCount + stats.reusedPasswordsCount > 0 ? 'var(--danger)' : 'var(--success)'}
          bgLight={stats.weakPasswordsCount + stats.reusedPasswordsCount > 0 ? 'var(--danger-light)' : 'var(--success-light)'}
          subtext={stats.weakPasswordsCount + stats.reusedPasswordsCount > 0 ? 'Weak or reused' : 'All secure'}
          onClick={() => navigate('/security')}
        />
      </div>

      {/* Recent Credentials Section */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Credentials
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Recently accessed and created logins
            </p>
          </div>

          {credentials.length > 0 && (
            <button
              type="button"
              onClick={() => navigate('/passwords')}
              className="btn btn-ghost"
              style={{ fontSize: '0.85rem' }}
            >
              View All ({credentials.length})
              <ArrowRight size={15} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="vault-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading credentials from encrypted vault...
          </div>
        ) : credentials.length === 0 ? (
          <div className="vault-card empty-state">
            <div className="empty-state-icon">
              <Lock size={32} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              Your vault is empty
            </h3>
            <p style={{ maxWidth: '400px', fontSize: '0.875rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
              Save your first login credential with encrypted AES-256 protection.
            </p>
            <button type="button" onClick={openAddModal} className="btn btn-primary">
              <Plus size={18} />
              Add Your First Password
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hide-on-mobile">
              <PasswordTable credentials={recentCredentials} />
            </div>

            {/* Mobile Card View */}
            <div
              className="mobile-only"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                width: '100%',
              }}
            >
              {recentCredentials.map((cred) => (
                <PasswordCard key={cred._id} credential={cred} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
