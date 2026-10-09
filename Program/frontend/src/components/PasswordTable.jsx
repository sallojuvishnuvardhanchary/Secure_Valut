import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Star,
  Pencil,
  Trash2,
  ExternalLink,
  Shield,
  Check,
  Loader2,
} from 'lucide-react';
import { useCredentials } from '../context/CredentialContext';
import ConfirmDialog from './ConfirmDialog';

// Generates a consistent pastel background color based on text
function getAvatarColor(name = '') {
  const colors = [
    '#4F46E5', '#2563EB', '#0D9488', '#059669',
    '#D97706', '#DC2626', '#7C3AED', '#DB2777'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function WebsiteIcon({ name, url, size = 36 }) {
  const [imgError, setImgError] = useState(false);
  const initials = (name || 'W').substring(0, 2).toUpperCase();
  const bgColor = getAvatarColor(name);

  // Try extracting domain for Google favicon service
  let domain = '';
  if (url) {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      domain = parsed.hostname;
    } catch {
      domain = '';
    }
  }

  if (domain && !imgError) {
    return (
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '8px',
          backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt=""
          width={size - 12}
          height={size - 12}
          onError={() => setImgError(true)}
          style={{ objectFit: 'contain' }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '8px',
        backgroundColor: bgColor,
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.85rem',
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function PasswordTable({ credentials = [] }) {
  const {
    openEditModal,
    deleteCredential,
    toggleFavorite,
    togglePasswordVisibility,
    decryptedPasswords,
    decryptingIds,
    copyPassword,
    copyUsername,
  } = useCredentials();

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  const handleCopyUser = (id, username) => {
    copyUsername(username);
    setCopiedField(`${id}-user`);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const handleCopyPass = async (id) => {
    await copyPassword(id);
    setCopiedField(`${id}-pass`);
    setTimeout(() => setCopiedField(null), 1800);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteCredential(deleteTarget._id);
      setDeleteTarget(null);
    }
  };

  if (credentials.length === 0) {
    return null;
  }

  return (
    <div
      className="vault-card"
      style={{
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr
              style={{
                backgroundColor: 'var(--bg-card-subtle)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '0.875rem 1rem', width: '40px' }}>Fav</th>
              <th style={{ padding: '0.875rem 1rem' }}>Website</th>
              <th style={{ padding: '0.875rem 1rem' }}>Username / Email</th>
              <th style={{ padding: '0.875rem 1rem' }}>Password</th>
              <th style={{ padding: '0.875rem 1rem' }}>Category</th>
              <th style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((cred) => {
              const isRevealed = !!decryptedPasswords[cred._id];
              const isDecrypting = decryptingIds.has(cred._id);
              const passwordValue = decryptedPasswords[cred._id] || '••••••••••••';

              return (
                <tr
                  key={cred._id}
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background-color 0.15s ease',
                  }}
                  className="table-row-hover"
                >
                  {/* Favorite Toggle */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(cred._id)}
                      className="btn-icon"
                      style={{ padding: '4px' }}
                      title={cred.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star
                        size={17}
                        color={cred.isFavorite ? 'var(--warning)' : 'var(--text-muted)'}
                        fill={cred.isFavorite ? 'var(--warning)' : 'none'}
                      />
                    </button>
                  </td>

                  {/* Website Name & URL */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                      <WebsiteIcon name={cred.websiteName} url={cred.websiteUrl} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span>{cred.websiteName}</span>
                          {cred.websiteUrl && (
                            <a
                              href={cred.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Visit ${cred.websiteName}`}
                              style={{ color: 'var(--text-muted)', display: 'inline-flex' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                        {cred.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                            {cred.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Username & Copy Button */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {cred.username}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyUser(cred._id, cred.username)}
                        className="btn-icon"
                        style={{ padding: '4px' }}
                        title="Copy username"
                      >
                        {copiedField === `${cred._id}-user` ? (
                          <Check size={14} color="var(--success)" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Password, Show/Hide & Copy Button */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        className="mono-font"
                        style={{
                          color: isRevealed ? 'var(--text-primary)' : 'var(--text-muted)',
                          fontWeight: isRevealed ? 600 : 700,
                          letterSpacing: isRevealed ? 'normal' : '2px',
                          maxWidth: '180px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.875rem',
                        }}
                      >
                        {passwordValue}
                      </span>

                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(cred._id)}
                        disabled={isDecrypting}
                        className="btn-icon"
                        style={{ padding: '4px' }}
                        title={isRevealed ? 'Hide password' : 'Show decrypted password'}
                      >
                        {isDecrypting ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : isRevealed ? (
                          <EyeOff size={15} color="var(--accent)" />
                        ) : (
                          <Eye size={15} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyPass(cred._id)}
                        className="btn-icon"
                        style={{ padding: '4px' }}
                        title="Copy password"
                      >
                        {copiedField === `${cred._id}-pass` ? (
                          <Check size={14} color="var(--success)" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Category Badge */}
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className="badge badge-default">
                      {cred.category}
                    </span>
                  </td>

                  {/* Action Buttons: Edit & Delete */}
                  <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => openEditModal(cred)}
                        className="btn-icon"
                        style={{ padding: '6px' }}
                        title="Edit credential"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cred)}
                        className="btn-icon"
                        style={{ padding: '6px', color: 'var(--danger)' }}
                        title="Delete credential"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Credential"
        message={`Are you sure you want to permanently delete the login credentials for "${deleteTarget?.websiteName}"? This action cannot be undone.`}
        confirmLabel="Delete Credential"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
