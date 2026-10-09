import React, { useMemo } from 'react';
import { Star, Search, Plus, KeyRound } from 'lucide-react';
import { useCredentials } from '../context/CredentialContext';
import PasswordTable from '../components/PasswordTable';
import PasswordCard from '../components/PasswordCard';
import PasswordSmallCard from '../components/PasswordSmallCard';
import PasswordListItem from '../components/PasswordListItem';
import ViewOptionsToolbar from '../components/ViewOptionsToolbar';

export default function Favorites() {
  const {
    credentials,
    loading,
    searchQuery,
    viewMode,
    openAddModal,
  } = useCredentials();

  const favoriteCredentials = useMemo(() => {
    return credentials.filter((cred) => {
      if (!cred.isFavorite) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          cred.websiteName?.toLowerCase().includes(q) ||
          cred.websiteUrl?.toLowerCase().includes(q) ||
          cred.username?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [credentials, searchQuery]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div
        className="vault-card"
        style={{
          padding: '1.25rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          borderLeft: '4px solid #EAB308',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <Star size={18} color="#EAB308" fill="#EAB308" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: '#EAB308' }}>
              Priority Access
            </span>
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Favorite Credentials
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Quickly access your starred logins and frequently used services.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {favoriteCredentials.length} {favoriteCredentials.length === 1 ? 'Favorite' : 'Favorites'}
          </div>
          <ViewOptionsToolbar />
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="vault-card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading favorites from vault...
        </div>
      ) : favoriteCredentials.length === 0 ? (
        <div className="vault-card empty-state">
          <div className="empty-state-icon" style={{ color: '#EAB308' }}>
            <Star size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No favorites yet
          </h3>
          <p style={{ maxWidth: '400px', fontSize: '0.875rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            Click the star icon on any credential to pin it to your favorites list for immediate access.
          </p>
          <button type="button" onClick={openAddModal} className="btn btn-primary">
            <Plus size={18} />
            Add New Credential
          </button>
        </div>
      ) : (
        <>
          {/* 1. Large Cards View */}
          {viewMode === 'large-cards' && (
            <div className="view-grid-large">
              {favoriteCredentials.map((cred) => (
                <PasswordCard key={cred._id} credential={cred} />
              ))}
            </div>
          )}

          {/* 2. Small Cards View */}
          {viewMode === 'small-cards' && (
            <div className="view-grid-small">
              {favoriteCredentials.map((cred) => (
                <PasswordSmallCard key={cred._id} credential={cred} />
              ))}
            </div>
          )}

          {/* 3. List View */}
          {viewMode === 'list' && (
            <div className="view-list-container">
              {favoriteCredentials.map((cred) => (
                <PasswordListItem key={cred._id} credential={cred} />
              ))}
            </div>
          )}

          {/* 4. Table View */}
          {viewMode === 'table' && (
            <>
              <div className="hide-on-mobile">
                <PasswordTable credentials={favoriteCredentials} />
              </div>
              <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', width: '100%' }}>
                {favoriteCredentials.map((cred) => (
                  <PasswordSmallCard key={cred._id} credential={cred} />
                ))}
              </div>
            </>
          )}

          {/* Fallback */}
          {!['large-cards', 'small-cards', 'list', 'table'].includes(viewMode) && (
            <div className="view-grid-large">
              {favoriteCredentials.map((cred) => (
                <PasswordCard key={cred._id} credential={cred} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
