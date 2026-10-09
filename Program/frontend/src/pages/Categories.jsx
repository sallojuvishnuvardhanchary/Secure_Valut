import React, { useState } from 'react';
import {
  Share2,
  GraduationCap,
  Code2,
  ShoppingBag,
  Landmark,
  Briefcase,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useCredentials } from '../context/CredentialContext';
import PasswordTable from '../components/PasswordTable';
import PasswordCard from '../components/PasswordCard';
import PasswordSmallCard from '../components/PasswordSmallCard';
import PasswordListItem from '../components/PasswordListItem';
import ViewOptionsToolbar from '../components/ViewOptionsToolbar';

const CATEGORY_META = [
  { name: 'Social Media', icon: Share2, color: '#DB2777', bg: '#FDF2F8' },
  { name: 'Education', icon: GraduationCap, color: '#7C3AED', bg: '#F5F3FF' },
  { name: 'Development', icon: Code2, color: '#2563EB', bg: '#EFF6FF' },
  { name: 'Shopping', icon: ShoppingBag, color: '#D97706', bg: '#FFFBEB' },
  { name: 'Banking', icon: Landmark, color: '#059669', bg: '#ECFDF5' },
  { name: 'Work', icon: Briefcase, color: '#4F46E5', bg: '#EEF2FF' },
  { name: 'Other', icon: Layers, color: '#6B7280', bg: '#F3F4F6' },
];

export default function Categories() {
  const { credentials, viewMode } = useCredentials();
  const [activeCategory, setActiveCategory] = useState(null);

  // Calculate count per category
  const categoryCounts = credentials.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});

  const displayedCredentials = activeCategory
    ? credentials.filter((c) => c.category === activeCategory)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Overview Header */}
      <div>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Vault Categories
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Organize and quickly access credentials by security domain and work type.
        </p>
      </div>

      {/* Category Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {CATEGORY_META.map((cat) => {
          const Icon = cat.icon;
          const count = categoryCounts[cat.name] || 0;
          const isSelected = activeCategory === cat.name;

          return (
            <div
              key={cat.name}
              className="vault-card"
              onClick={() => setActiveCategory(isSelected ? null : cat.name)}
              style={{
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-color)',
                backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-card)',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: cat.bg,
                    color: cat.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} />
                </div>
                <span
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: count > 0 ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {count}
                </span>
              </div>

              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {cat.name}
              </div>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {count === 1 ? '1 credential' : `${count} credentials`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Category Details */}
      {activeCategory && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeCategory} Credentials ({displayedCredentials.length})
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <ViewOptionsToolbar />
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className="btn btn-ghost"
                style={{ fontSize: '0.8rem' }}
              >
                Close Filter
              </button>
            </div>
          </div>

          {displayedCredentials.length === 0 ? (
            <div className="vault-card empty-state" style={{ padding: '2.5rem' }}>
              <p>No credentials stored in the {activeCategory} category yet.</p>
            </div>
          ) : (
            <>
              {viewMode === 'large-cards' && (
                <div className="view-grid-large">
                  {displayedCredentials.map((c) => (
                    <PasswordCard key={c._id} credential={c} />
                  ))}
                </div>
              )}

              {viewMode === 'small-cards' && (
                <div className="view-grid-small">
                  {displayedCredentials.map((c) => (
                    <PasswordSmallCard key={c._id} credential={c} />
                  ))}
                </div>
              )}

              {viewMode === 'list' && (
                <div className="view-list-container">
                  {displayedCredentials.map((c) => (
                    <PasswordListItem key={c._id} credential={c} />
                  ))}
                </div>
              )}

              {viewMode === 'table' && (
                <>
                  <div className="hide-on-mobile">
                    <PasswordTable credentials={displayedCredentials} />
                  </div>
                  <div className="mobile-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {displayedCredentials.map((c) => (
                      <PasswordSmallCard key={c._id} credential={c} />
                    ))}
                  </div>
                </>
              )}

              {!['large-cards', 'small-cards', 'list', 'table'].includes(viewMode) && (
                <div className="view-grid-large">
                  {displayedCredentials.map((c) => (
                    <PasswordCard key={c._id} credential={c} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
