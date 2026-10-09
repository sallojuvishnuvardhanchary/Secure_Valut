import React, { useState, useEffect } from 'react';
import {
  X,
  Eye,
  EyeOff,
  Wand2,
  Lock,
  Globe,
  User,
  Tag,
  FileText,
  Star,
  Check,
} from 'lucide-react';
import { useCredentials } from '../context/CredentialContext';
import PasswordGenerator from './PasswordGenerator';
import { calculatePasswordStrength } from '../utils/cryptoGenerator';

const CATEGORIES = [
  'Social Media',
  'Education',
  'Development',
  'Shopping',
  'Banking',
  'Work',
  'Other',
];

export default function PasswordForm() {
  const {
    isFormModalOpen,
    closeFormModal,
    editingCredential,
    createCredential,
    updateCredential,
  } = useCredentials();

  const [formData, setFormData] = useState({
    websiteName: '',
    websiteUrl: '',
    username: '',
    password: '',
    category: 'Work',
    notes: '',
    isFavorite: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingCredential) {
      setFormData({
        websiteName: editingCredential.websiteName || '',
        websiteUrl: editingCredential.websiteUrl || '',
        username: editingCredential.username || '',
        password: editingCredential.password || '',
        category: editingCredential.category || 'Work',
        notes: editingCredential.notes || '',
        isFavorite: Boolean(editingCredential.isFavorite),
      });
      setShowPassword(false);
      setShowGenerator(false);
    } else {
      setFormData({
        websiteName: '',
        websiteUrl: '',
        username: '',
        password: '',
        category: 'Work',
        notes: '',
        isFavorite: false,
      });
      setShowPassword(false);
      setShowGenerator(false);
    }
    setErrors({});
  }, [editingCredential, isFormModalOpen]);

  if (!isFormModalOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectGeneratedPassword = (pwd) => {
    setFormData((prev) => ({ ...prev, password: pwd }));
    setShowPassword(true);
    setShowGenerator(false);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.websiteName.trim()) {
      errs.websiteName = 'Website or Service name is required';
    }
    if (!formData.username.trim()) {
      errs.username = 'Username or email is required';
    }
    if (!formData.password) {
      errs.password = 'Password is required';
    }
    if (formData.websiteUrl && !formData.websiteUrl.startsWith('http://') && !formData.websiteUrl.startsWith('https://')) {
      // Auto prepend https if user typed a bare domain like github.com
      if (!formData.websiteUrl.includes('://')) {
        setFormData((prev) => ({ ...prev, websiteUrl: `https://${prev.websiteUrl}` }));
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (editingCredential) {
        await updateCredential(editingCredential._id, formData);
      } else {
        await createCredential(formData);
      }
    } catch {
      // Errors handled via toast in context
    } finally {
      setSubmitting(false);
    }
  };

  const strength = calculatePasswordStrength(formData.password);

  return (
    <div className="modal-overlay" onClick={closeFormModal}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-dialog-title"
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 id="form-dialog-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              {editingCredential ? 'Edit Credential' : 'Add New Credential'}
            </h2>
            <p style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
              AES-256-GCM encrypted & stored in your private vault
            </p>
          </div>
          <button
            type="button"
            className="btn-icon"
            onClick={closeFormModal}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {/* Website Name */}
          <div className="form-group">
            <label className="form-label">
              Website / Service Name *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="websiteName"
                value={formData.websiteName}
                onChange={handleChange}
                placeholder="e.g. GitHub, Netflix, Google"
                className={`form-input ${errors.websiteName ? 'error' : ''}`}
                autoFocus
              />
            </div>
            {errors.websiteName && <span className="field-error">{errors.websiteName}</span>}
          </div>

          {/* Website URL */}
          <div className="form-group">
            <label className="form-label">
              Website URL
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                name="websiteUrl"
                value={formData.websiteUrl}
                onChange={handleChange}
                placeholder="https://example.com"
                className="form-input"
              />
            </div>
          </div>

          {/* Username / Email */}
          <div className="form-group">
            <label className="form-label">
              Username or Email *
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. alex@example.com or user123"
              className={`form-input ${errors.username ? 'error' : ''}`}
            />
            {errors.username && <span className="field-error">{errors.username}</span>}
          </div>

          {/* Password with Show/Hide & Generator toggle */}
          <div className="form-group">
            <div className="form-label">
              <span>Password *</span>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowGenerator(!showGenerator)}
                style={{
                  padding: '2px 8px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Wand2 size={13} />
                {showGenerator ? 'Hide Generator' : 'Generate Strong Password'}
              </button>
            </div>

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter or generate password"
                className={`form-input mono-font ${errors.password ? 'error' : ''}`}
                style={{ paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.5rem', background: 'transparent', border: 'none' }}
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="field-error">{errors.password}</span>}

            {/* Password strength feedback */}
            {formData.password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Strength</span>
                  <span style={{ fontWeight: 600, color: strength.color }}>{strength.label}</span>
                </div>
                <div
                  style={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: strength.width,
                      backgroundColor: strength.color,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Embedded Generator Drawer */}
          {showGenerator && (
            <div style={{ marginBottom: '1.25rem' }}>
              <PasswordGenerator onSelectPassword={handleSelectGeneratedPassword} />
            </div>
          )}

          {/* Category & Favorite row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center', marginBottom: '1.125rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', paddingTop: '1.2rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  name="isFavorite"
                  checked={formData.isFavorite}
                  onChange={handleChange}
                  style={{ accentColor: 'var(--accent)', width: '16px', height: '16px' }}
                />
                <Star size={16} fill={formData.isFavorite ? 'var(--warning)' : 'none'} color={formData.isFavorite ? 'var(--warning)' : 'var(--text-muted)'} />
                Favorite
              </label>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Add security recovery keys, PINs, or hints..."
              className="form-textarea"
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={closeFormModal}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : editingCredential ? 'Update Credential' : 'Save Credential'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
