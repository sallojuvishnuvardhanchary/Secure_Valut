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

export default function PasswordListItem({ credential }) {
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
    setTimeout(() => setCopiedUser(false), 1600);
  };

  const handleCopyPass = async () => {
    await copyPassword(credential._id);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 1600);
  };

  return (
    <div
      className="vault-card password-list-item"
      style={{
        padding: '0.75rem 1.125rem',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.875rem',
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
    >
      {/* Left: Star, Icon, Website Name & Category */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '220px', flex: '1 1 220px' }}>
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

        <WebsiteIcon name={credential.websiteName} url={credential.websiteUrl} size={34} />

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.925rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
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
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <span className="badge badge-default" style={{ fontSize: '0.675rem', padding: '1px 6px', marginTop: '2px' }}>
            {credential.category}
          </span>
        </div>
      </div>

      {/* Middle: Username and Masked Password */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flex: '2 1 300px',
          flexWrap: 'wrap',
        }}
      >
        {/* Username */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'var(--bg-card-subtle)',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            minWidth: '150px',
            maxWidth: '220px',
            justifyContent: 'space-between',
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

        {/* Password */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'var(--bg-card-subtle)',
            padding: '0.35rem 0.65rem',
            borderRadius: '6px',
            minWidth: '160px',
            maxWidth: '220px',
            justifyContent: 'space-between',
          }}
        >
          <span
            className="mono-font"
            style={{
              fontSize: '0.825rem',
              fontWeight: isRevealed ? 600 : 700,
              letterSpacing: isRevealed ? 'normal' : '1.5px',
              color: isRevealed ? 'var(--text-primary)' : 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100px',
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

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={() => openEditModal(credential)}
          className="btn btn-ghost"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
          title="Edit credential"
        >
          <Pencil size={14} />
          <span className="hide-on-mobile">Edit</span>
        </button>
        <button
          type="button"
          onClick={() => setIsDeleting(true)}
          className="btn btn-ghost"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--danger)' }}
          title="Delete credential"
        >
          <Trash2 size={14} />
          <span className="hide-on-mobile">Delete</span>
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
