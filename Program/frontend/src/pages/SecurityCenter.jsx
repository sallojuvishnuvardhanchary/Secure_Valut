import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CopyCheck,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Wand2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { credentialApi } from '../services/api';
import { useCredentials } from '../context/CredentialContext';
import { WebsiteIcon } from '../components/PasswordTable';

export default function SecurityCenter() {
  const { openEditModal } = useCredentials();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSecurityAudit = async () => {
    setLoading(true);
    try {
      const res = await credentialApi.getSecurityAnalysis();
      if (res.data?.success) {
        setAnalysis(res.data.securityAnalysis);
      }
    } catch (err) {
      console.error('Failed to run security analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityAudit();
  }, []);

  if (loading) {
    return (
      <div className="vault-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Analyzing vault cryptographic health and password integrity...
      </div>
    );
  }

  const {
    totalCredentials = 0,
    healthScore = 100,
    weakCredentials = [],
    reusedGroups = [],
    recentlyUpdated = [],
    recommendations = [],
  } = analysis || {};

  const scoreColor =
    healthScore >= 80 ? 'var(--success)' : healthScore >= 50 ? 'var(--warning)' : 'var(--danger)';
  const scoreBg =
    healthScore >= 80
      ? 'var(--success-light)'
      : healthScore >= 50
      ? 'var(--warning-light)'
      : 'var(--danger-light)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Health Score Card */}
      <div
        className="vault-card"
        style={{
          padding: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          borderLeft: `5px solid ${scoreColor}`,
        }}
      >
        <div style={{ maxWidth: '580px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span
              className="badge"
              style={{ backgroundColor: scoreBg, color: scoreColor, fontWeight: 700 }}
            >
              {healthScore >= 80 ? 'Strong Security' : healthScore >= 50 ? 'Needs Attention' : 'Vulnerable'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Vault Security Audit
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.35rem', lineHeight: 1.5 }}>
            Our security engine checks password complexity, entropy lengths, and detects cross-account password reuse using blinded zero-knowledge HMAC fingerprints.
          </p>
        </div>

        {/* Gauge / Score Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              border: `6px solid ${scoreColor}`,
              backgroundColor: scoreBg,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <span style={{ fontSize: '1.85rem', fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
              {healthScore}%
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '3px' }}>
              Vault Score
            </span>
          </div>

          <button
            type="button"
            onClick={fetchSecurityAudit}
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem' }}
            title="Re-run security audit"
          >
            <RefreshCw size={15} />
            Re-scan
          </button>
        </div>
      </div>

      {/* Recommendations Banner */}
      {recommendations.length > 0 && (
        <div
          className="vault-card"
          style={{ padding: '1.25rem 1.5rem', backgroundColor: 'var(--bg-card-subtle)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Sparkles size={18} color="var(--accent)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Security Recommendations
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {recommendations.map((rec, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  fontSize: '0.85rem',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  {rec.type === 'critical' || rec.type === 'warning' ? (
                    <AlertTriangle size={16} color="var(--danger)" />
                  ) : (
                    <ShieldCheck size={16} color="var(--success)" />
                  )}
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.875rem' }}>{rec.title}</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{rec.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak Passwords Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="var(--danger)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Weak Passwords ({weakCredentials.length})
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Passwords with low entropy or under 8 characters
          </span>
        </div>

        {weakCredentials.length === 0 ? (
          <div
            className="vault-card"
            style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
            }}
          >
            <ShieldCheck size={20} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Great job! No weak passwords detected across your saved accounts.
            </span>
          </div>
        ) : (
          <div className="vault-card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <tbody>
                {weakCredentials.map((cred) => (
                  <tr
                    key={cred._id}
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: '0.875rem 1.25rem', width: '40px' }}>
                      <WebsiteIcon name={cred.websiteName} url={cred.websiteUrl} size={32} />
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cred.websiteName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {cred.username}
                      </div>
                    </td>
                    <td style={{ padding: '0.875rem 1rem' }}>
                      <span className="badge badge-danger">
                        {cred.passwordStrength?.label || 'Weak'}
                      </span>
                    </td>
                    <td style={{ padding: '0.875rem 1.25rem', textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(cred)}
                        className="btn btn-primary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Wand2 size={13} />
                        Strengthen
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reused Passwords Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CopyCheck size={18} color="var(--warning)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Reused Passwords ({reusedGroups.length} Groups)
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Detected without decrypting via keyed cryptographic HMAC fingerprints
          </span>
        </div>

        {reusedGroups.length === 0 ? (
          <div
            className="vault-card"
            style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--success-light)',
              color: 'var(--success)',
            }}
          >
            <ShieldCheck size={20} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Zero password reuse detected! Each account uses a distinct credential.
            </span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reusedGroups.map((group, idx) => (
              <div
                key={idx}
                className="vault-card"
                style={{
                  padding: '1.25rem',
                  border: '1px solid var(--warning)',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--warning)' }}>
                    Reused across {group.count} accounts
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    High Security Risk
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                  {group.credentials.map((c) => (
                    <div
                      key={c._id}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: 'var(--bg-card-subtle)',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {c.websiteName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.username}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="btn-icon"
                        title="Update password"
                      >
                        <Wand2 size={15} color="var(--accent)" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recently Updated Activity */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.875rem' }}>
          <Clock size={18} color="var(--accent)" />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Recent Activity & Credential Updates
          </h3>
        </div>

        <div className="vault-card" style={{ padding: '0.75rem 1.25rem' }}>
          {recentlyUpdated.length === 0 ? (
            <p style={{ padding: '1rem', color: 'var(--text-muted)' }}>No updates logged yet.</p>
          ) : (
            recentlyUpdated.map((item, idx) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 0',
                  borderBottom: idx < recentlyUpdated.length - 1 ? '1px solid var(--border-color)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <WebsiteIcon name={item.websiteName} url={item.websiteUrl} size={30} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                      {item.websiteName}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {item.username}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  {new Date(item.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
