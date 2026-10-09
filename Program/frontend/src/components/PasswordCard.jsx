import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Copy,
  Star,
  Pencil,
  Trash2,
  ExternalLink,
  Check,
  Loader2,
} from 'lucide-react';
import { useCredentials } from '../context/CredentialContext';
import { WebsiteIcon } from './PasswordTable';
import ConfirmDialog from './ConfirmDialog';

export default function PasswordCard({ credential }) {
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

  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const isRevealed = !!decryptedPasswords[credential._id];
  const isDecrypting = decryptingIds.has(credential._id);
  const passwordValue = decryptedPasswords[credential._id] || '••••••••••••';

  const handleCopyUser = () => {
    copyUsername(credential.username);
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 1800);
  };

  const handleCopyPass = async () => {
    await copyPassword(credential._id);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 1800);
  };

  return (
    <div
      className="vault-card"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '12px',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Top Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <WebsiteIcon name={credential.websiteName} url={credential.websiteUrl} size={40} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {credential.websiteName}
                </span>
                {credential.websiteUrl && (
                  <a
                    href={credential.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${credential.websiteName}`}
                    style={{ color: 'var(--text-muted)', display: 'inline-flex' }}
                  >
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
              <span className="badge badge-default" style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                {credential.category}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(credential._id)}
            className="btn-icon"
            style={{ padding: '6px' }}
            title={credential.isFavorite ? 'Remove favorite' : 'Add favorite'}
          >
            <Star
              size={18}
              color={credential.isFavorite ? 'var(--warning)' : 'var(--text-muted)'}
              fill={credential.isFavorite ? 'var(--warning)' : 'none'}
            />
          </button>
        </div>

        {/* Username Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card-subtle)',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            marginBottom: '0.5rem',
          }}
        >
          <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {credential.username}
          </span>
          <button
            type="button"
            onClick={handleCopyUser}
            className="btn-icon"
            style={{ padding: '4px' }}
            title="Copy username"
          >
            {copiedUser ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
          </button>
        </div>

        {/* Password Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card-subtle)',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            marginBottom: '0.75rem',
          }}
        >
          <span
            className="mono-font"
            style={{
              fontSize: '0.85rem',
              fontWeight: isRevealed ? 600 : 700,
              letterSpacing: isRevealed ? 'normal' : '2px',
              color: isRevealed ? 'var(--text-primary)' : 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '140px',
            }}
          >
            {passwordValue}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <button
              type="button"
              onClick={() => togglePasswordVisibility(credential._id)}
              disabled={isDecrypting}
              className="btn-icon"
              style={{ padding: '4px' }}
              title={isRevealed ? 'Hide password' : 'Show decrypted password'}
            >
              {isDecrypting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : isRevealed ? (
                <EyeOff size={14} color="var(--accent)" />
              ) : (
                <Eye size={14} />
              )}
            </button>
            <button
              type="button"
              onClick={handleCopyPass}
              className="btn-icon"
              style={{ padding: '4px' }}
              title="Copy password"
            >
              {copiedPass ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Notes preview if present */}
        {credential.notes && (
          <p
            style={{
              fontSize: '0.775rem',
              color: 'var(--text-muted)',
              marginBottom: '1rem',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {credential.notes}
          </p>
        )}
      </div>

      {/* Card Actions Bottom Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.5rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.75rem',
          marginTop: '0.5rem',
        }}
      >
        <button
          type="button"
          onClick={() => openEditModal(credential)}
          className="btn btn-ghost"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => setIsDeleting(true)}
          className="btn btn-ghost"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--danger)' }}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>

      <ConfirmDialog
        isOpen={isDeleting}
        title="Delete Credential"
        message={`Delete saved credentials for "${credential.websiteName}"?`}
        confirmLabel="Delete"
        onConfirm={async () => {
          await deleteCredential(credential._id);
          setIsDeleting(false);
        }}
        onCancel={() => setIsDeleting(false)}
      />
    </div>
  );
}
