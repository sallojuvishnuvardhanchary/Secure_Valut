import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check, ShieldCheck, Sliders } from 'lucide-react';
import { generateSecurePassword, calculatePasswordStrength } from '../utils/cryptoGenerator';
import { useToast } from '../context/ToastContext';

export default function PasswordGenerator({ onSelectPassword, className = '' }) {
  const toast = useToast();
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const regenerate = () => {
    const pwd = generateSecurePassword({ length, uppercase, lowercase, numbers, symbols });
    setGeneratedPassword(pwd);
    setCopied(false);
  };

  useEffect(() => {
    regenerate();
  }, [length, uppercase, lowercase, numbers, symbols]);

  const handleCopy = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    toast.success('Generated password copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const strength = calculatePasswordStrength(generatedPassword);

  return (
    <div
      className={`vault-card ${className}`}
      style={{
        padding: '1.25rem',
        borderRadius: '12px',
        backgroundColor: 'var(--bg-card-subtle)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={18} color="var(--accent)" />
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Strong Password Generator
          </span>
        </div>
        <span
          className="badge"
          style={{ backgroundColor: `${strength.color}20`, color: strength.color, fontSize: '0.75rem' }}
        >
          {strength.label}
        </span>
      </div>

      {/* Generated output box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--input-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0.625rem 0.875rem',
          marginBottom: '0.875rem',
          gap: '0.5rem',
        }}
      >
        <span
          className="mono-font"
          style={{
            fontSize: '0.95rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            letterSpacing: '1px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {generatedPassword}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <button
            type="button"
            className="btn-icon"
            onClick={regenerate}
            title="Generate new password"
            aria-label="Generate new password"
          >
            <RefreshCw size={16} />
          </button>
          <button
            type="button"
            className="btn-icon"
            onClick={handleCopy}
            title="Copy password"
            aria-label="Copy password"
          >
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {/* Strength visual bar */}
      <div
        style={{
          height: '4px',
          width: '100%',
          backgroundColor: 'var(--border-color)',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            height: '100%',
            width: strength.width,
            backgroundColor: strength.color,
            transition: 'width 0.3s ease, background-color 0.3s ease',
          }}
        />
      </div>

      {/* Length slider */}
      <div style={{ marginBottom: '0.875rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
          <span>Length</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{length} characters</span>
        </div>
        <input
          type="range"
          min="8"
          max="48"
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          style={{
            width: '100%',
            accentColor: 'var(--accent)',
            cursor: 'pointer',
          }}
        />
      </div>

      {/* Option checkboxes */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          marginBottom: onSelectPassword ? '1rem' : '0',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => setUppercase(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          Uppercase (A-Z)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={lowercase}
            onChange={(e) => setLowercase(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          Lowercase (a-z)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={numbers}
            onChange={(e) => setNumbers(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          Numbers (0-9)
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={symbols}
            onChange={(e) => setSymbols(e.target.checked)}
            style={{ accentColor: 'var(--accent)' }}
          />
          Symbols (!@#$)
        </label>
      </div>

      {onSelectPassword && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => onSelectPassword(generatedPassword)}
          style={{ width: '100%', fontSize: '0.825rem', padding: '0.5rem' }}
        >
          Use This Password
        </button>
      )}
    </div>
  );
}
