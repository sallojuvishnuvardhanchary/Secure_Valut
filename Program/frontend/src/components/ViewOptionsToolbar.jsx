import React, { useState } from 'react';
import { LayoutGrid, Grid2x2, List, Table } from 'lucide-react';
import { useCredentials } from '../context/CredentialContext';

const VIEW_MODES = [
  {
    id: 'large-cards',
    label: 'Large Cards',
    icon: LayoutGrid,
    shortcut: '1',
    description: 'Three-column responsive grid with complete controls & notes',
  },
  {
    id: 'small-cards',
    label: 'Small Cards',
    icon: Grid2x2,
    shortcut: '2',
    description: 'Compact credential cards displaying more items per screen',
  },
  {
    id: 'list',
    label: 'List View',
    icon: List,
    shortcut: '3',
    description: 'Compact horizontal rows for fast scanning and quick copy',
  },
  {
    id: 'table',
    label: 'Table View',
    icon: Table,
    shortcut: '4',
    description: 'Structured columns with website, username, password and category',
  },
];

export default function ViewOptionsToolbar({ className = '' }) {
  const { viewMode, setViewMode } = useCredentials();
  const [hoveredMode, setHoveredMode] = useState(null);

  const handleKeyDown = (e, currentIndex) => {
    let nextIndex = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % VIEW_MODES.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + VIEW_MODES.length) % VIEW_MODES.length;
    }

    if (nextIndex !== null) {
      e.preventDefault();
      setViewMode(VIEW_MODES[nextIndex].id);
      // Focus target element
      const buttons = document.querySelectorAll('[data-view-mode-button]');
      if (buttons[nextIndex]) buttons[nextIndex].focus();
    }
  };

  return (
    <div
      className={`view-options-toolbar-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        position: 'relative',
      }}
    >
      {/* Optional Explorer-style text indicator */}
      <span
        style={{
          fontSize: '0.775rem',
          fontWeight: 600,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          userSelect: 'none',
        }}
        className="hide-on-mobile"
      >
        View:
      </span>

      {/* Segmented Control Pill */}
      <div
        role="radiogroup"
        aria-label="Credential layout options"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card-subtle)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '2px',
          gap: '2px',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
      >
        {VIEW_MODES.map((mode, index) => {
          const Icon = mode.icon;
          const isActive = viewMode === mode.id;

          return (
            <div
              key={mode.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredMode(mode.id)}
              onMouseLeave={() => setHoveredMode(null)}
            >
              <button
                type="button"
                data-view-mode-button
                role="radio"
                aria-checked={isActive}
                aria-label={`${mode.label}: ${mode.description}`}
                title={`${mode.label} — ${mode.description}`}
                onClick={() => setViewMode(mode.id)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                tabIndex={isActive ? 0 : -1}
                className="view-mode-button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '5px 8px',
                  borderRadius: '6px',
                  border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                  backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                }}
              >
                <Icon size={16} strokeWidth={isActive ? 2.3 : 1.9} />
                <span
                  style={{
                    fontSize: '0.775rem',
                    fontWeight: isActive ? 700 : 500,
                    display: 'none', // Shown on desktop if space allows or via tooltip
                  }}
                >
                  {mode.label}
                </span>
              </button>

              {/* Floating Tooltip */}
              {hoveredMode === mode.id && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 200,
                    backgroundColor: 'var(--text-primary)',
                    color: 'var(--bg-page)',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    pointerEvents: 'none',
                    boxShadow: 'var(--shadow-md)',
                    animation: 'fadeIn 0.15s ease',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.775rem' }}>{mode.label}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.85, maxWidth: '180px', whiteSpace: 'normal', lineHeight: 1.25 }}>
                    {mode.description}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
