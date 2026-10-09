import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  X,
  KeyRound,
  Star,
} from 'lucide-react';
import { useCredentials } from '../context/CredentialContext';
import PasswordTable from '../components/PasswordTable';
import PasswordCard from '../components/PasswordCard';
import PasswordSmallCard from '../components/PasswordSmallCard';
import PasswordListItem from '../components/PasswordListItem';
import ViewOptionsToolbar from '../components/ViewOptionsToolbar';

const CATEGORIES = [
  'All',
  'Social Media',
  'Education',
  'Development',
  'Shopping',
  'Banking',
  'Work',
  'Other',
];

export default function AllPasswords() {
  const {
    credentials,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    viewMode,
    openAddModal,
  } = useCredentials();

  const [filterFavorite, setFilterFavorite] = useState(false);

  // Client-side filtering and sorting for instant responsiveness
  const filteredCredentials = useMemo(() => {
    return credentials
      .filter((cred) => {
        // Category filter
        if (selectedCategory !== 'All' && cred.category !== selectedCategory) {
          return false;
        }
        // Favorite filter
        if (filterFavorite && !cred.isFavorite) {
          return false;
        }
        // Search filter across name, url, username
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchName = cred.websiteName?.toLowerCase().includes(query);
          const matchUrl = cred.websiteUrl?.toLowerCase().includes(query);
          const matchUser = cred.username?.toLowerCase().includes(query);
          if (!matchName && !matchUrl && !matchUser) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') return a.websiteName.localeCompare(b.websiteName);
        if (sortBy === 'name_desc') return b.websiteName.localeCompare(a.websiteName);
        if (sortBy === 'date_asc') return new Date(a.createdAt) - new Date(b.createdAt);
        return new Date(b.createdAt) - new Date(a.createdAt); // date_desc default
      });
  }, [credentials, selectedCategory, filterFavorite, searchQuery, sortBy]);

  const hasActiveFilters =
    searchQuery || selectedCategory !== 'All' || filterFavorite || sortBy !== 'date_desc';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setFilterFavorite(false);
    setSortBy('date_desc');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Filter and Controls Bar */}
      <div
        className="vault-card"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
              style={{
                padding: '0.4rem 0.875rem',
                fontSize: '0.8rem',
                borderRadius: '9999px',
                flexShrink: 0,
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search, Sort & Favorites Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1rem',
          }}
        >
          {/* Left: Search input */}
          <div style={{ position: 'relative', minWidth: '240px', flex: 1, maxWidth: '420px' }}>
            <Search
              size={16}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search website, url, username..."
              className="form-input"
              style={{ paddingLeft: '2.4rem', paddingRight: '2rem', fontSize: '0.875rem' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-icon"
                style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)', padding: '2px' }}
                aria-label="Clear search query"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Right: Favorites & Sort Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            {/* Favorites toggle button */}
            <button
              type="button"
              onClick={() => setFilterFavorite(!filterFavorite)}
              className={`btn ${filterFavorite ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.825rem', padding: '0.45rem 0.8rem' }}
              aria-pressed={filterFavorite}
            >
              <Star size={15} fill={filterFavorite ? 'currentColor' : 'none'} />
              <span>Favorites Only</span>
            </button>

            {/* Sort Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.825rem', padding: '0.45rem 0.75rem', minWidth: '150px' }}
                aria-label="Sort credentials"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Website (A - Z)</option>
                <option value="name_desc">Website (Z - A)</option>
              </select>
            </div>

            {/* Clear filters button if active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="btn btn-ghost"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.65rem' }}
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Above Credentials Area: Results Count + View Options Toolbar + Add Password */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.875rem',
        }}
      >
        {/* Left: Count and Active Filter Tag */}
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <span>Showing {filteredCredentials.length} of {credentials.length} credentials</span>
          {hasActiveFilters && (
            <span className="badge badge-default" style={{ fontSize: '0.7rem' }}>
              Filtered
            </span>
          )}
        </div>

        {/* Right: View Options Toolbar & Add Password Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <ViewOptionsToolbar />

          <button
            type="button"
            onClick={openAddModal}
            className="btn btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Add Password</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: 4 Distinct View Modes */}
      {loading ? (
        <div className="vault-card" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Retrieving credentials from secure vault...
        </div>
      ) : filteredCredentials.length === 0 ? (
        <div className="vault-card empty-state">
          <div className="empty-state-icon">
            <KeyRound size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            No credentials found
          </h3>
          <p style={{ maxWidth: '400px', fontSize: '0.875rem', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            {hasActiveFilters
              ? 'No credentials matched your current search and category filters.'
              : 'You have not added any credentials to your vault yet.'}
          </p>
          {hasActiveFilters ? (
            <button type="button" onClick={clearFilters} className="btn btn-secondary">
              Clear All Filters
            </button>
          ) : (
            <button type="button" onClick={openAddModal} className="btn btn-primary">
              <Plus size={18} />
              Add First Password
            </button>
          )}
        </div>
      ) : (
        <>
          {/* 1. Large Cards View: 3-column responsive grid on desktop */}
          {viewMode === 'large-cards' && (
            <div className="view-grid-large">
              {filteredCredentials.map((cred) => (
                <PasswordCard key={cred._id} credential={cred} />
              ))}
            </div>
          )}

          {/* 2. Small Cards View: High density compact grid */}
          {viewMode === 'small-cards' && (
            <div className="view-grid-small">
              {filteredCredentials.map((cred) => (
                <PasswordSmallCard key={cred._id} credential={cred} />
              ))}
            </div>
          )}

          {/* 3. List View: Compact horizontal rows */}
          {viewMode === 'list' && (
            <div className="view-list-container">
              {filteredCredentials.map((cred) => (
                <PasswordListItem key={cred._id} credential={cred} />
              ))}
            </div>
          )}

          {/* 4. Table View: Structured columns */}
          {viewMode === 'table' && (
            <>
              <div className="hide-on-mobile">
                <PasswordTable credentials={filteredCredentials} />
              </div>
              <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', width: '100%' }}>
                {filteredCredentials.map((cred) => (
                  <PasswordSmallCard key={cred._id} credential={cred} />
                ))}
              </div>
            </>
          )}

          {/* Fallback if an unrecognized view mode is encountered */}
          {!['large-cards', 'small-cards', 'list', 'table'].includes(viewMode) && (
            <div className="view-grid-large">
              {filteredCredentials.map((cred) => (
                <PasswordCard key={cred._id} credential={cred} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
