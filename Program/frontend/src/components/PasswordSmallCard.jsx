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

export default function PasswordSmallCard({ credential }) {
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
  const passwordValue = decryptedPasswords[credential._id] || '••••••••';

  const handleCopyUser = () => {
    copyUsername(credential.username);
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 1600);
  };

  const handleCopyPass = async () => {
    await copyPassword(credential._id);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 1600);
  };

  return (
    <div
      className="vault-card"
      style={{
        padding: '0.875rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRadius: '10px',
        position: 'relative',
        transition: 'transform 0.15s, box-shadow 0.15s, border-color 0.15s',
        minHeight: '160px',
      }}
    >
      <div>
        {/* Header: Small Icon, Title, Favorite */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0, flex: 1 }}>
            <WebsiteIcon name={credential.websiteName} url={credential.websiteUrl} size={30} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {credential.websiteName}
                </span>
                {credential.websiteUrl && (
                  <a
                    href={credential.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Open ${credential.websiteName}`}
                    style={{ color: 'var(--text-muted)', display: 'inline-flex', flexShrink: 0 }}
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <span className="badge badge-default" style={{ fontSize: '0.65rem', padding: '1px 6px', marginTop: '2px' }}>
                {credential.category}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggleFavorite(credential._id)}
            className="btn-icon"
            style={{ padding: '4px' }}
            title={credential.isFavorite ? 'Remove favorite' : 'Add favorite'}
          >
            <Star
              size={16}
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
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            marginBottom: '0.375rem',
            fontSize: '0.775rem',
          }}
        >
          <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {credential.username}
          </span>
          <button
            type="button"
            onClick={handleCopyUser}
            className="btn-icon"
            style={{ padding: '2px' }}
            title="Copy username"
          >
            {copiedUser ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Password Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-card-subtle)',
            padding: '0.35rem 0.6rem',
            borderRadius: '6px',
            marginBottom: '0.5rem',
          }}
        >
          <span
            className="mono-font"
            style={{
              fontSize: '0.8rem',
              fontWeight: isRevealed ? 600 : 700,
              letterSpacing: isRevealed ? 'normal' : '1.5px',
              color: isRevealed ? 'var(--text-primary)' : 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '110px',
            }}
          >
            {passwordValue}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              type="button"
              onClick={() => togglePasswordVisibility(credential._id)}
              disabled={isDecrypting}
              className="btn-icon"
              style={{ padding: '3px' }}
              title={isRevealed ? 'Hide password' : 'Show decrypted password'}
            >
              {isDecrypting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : isRevealed ? (
                <EyeOff size={13} color="var(--accent)" />
              ) : (
                <Eye size={13} />
              )}
            </button>
            <button
              type="button"
              onClick={handleCopyPass}
              className="btn-icon"
              style={{ padding: '3px' }}
              title="Copy password"
            >
              {copiedPass ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>

      {/* Footer Actions: Edit and Delete */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '0.25rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '0.45rem',
          marginTop: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={() => openEditModal(credential)}
          className="btn-icon"
          style={{ padding: '4px', fontSize: '0.75rem' }}
          title="Edit credential"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={() => setIsDeleting(true)}
          className="btn-icon"
          style={{ padding: '4px', color: 'var(--danger)', fontSize: '0.75rem' }}
          title="Delete credential"
        >
          <Trash2 size={13} />
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
