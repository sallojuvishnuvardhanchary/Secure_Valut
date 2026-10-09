import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { credentialApi } from '../services/api';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CredentialContext = createContext();

export const VALID_VIEW_MODES = ['large-cards', 'small-cards', 'list', 'table'];

function getInitialViewMode() {
  try {
    const saved = localStorage.getItem('securevault_view_mode');
    if (saved && VALID_VIEW_MODES.includes(saved)) {
      return saved;
    }
  } catch (e) {}
  return 'large-cards';
}

export function CredentialProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();

  const [credentials, setCredentials] = useState([]);
  const [stats, setStats] = useState({
    totalCredentials: 0,
    favoriteCount: 0,
    categoriesCount: 0,
    weakPasswordsCount: 0,
    reusedPasswordsCount: 0,
    securityHealthScore: 100,
  });
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewModeState] = useState(getInitialViewMode);

  const setViewMode = (mode) => {
    const targetMode = VALID_VIEW_MODES.includes(mode) ? mode : 'large-cards';
    setViewModeState(targetMode);
    try {
      localStorage.setItem('securevault_view_mode', targetMode);
    } catch (e) {}
  };

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);

  // Independent decrypted passwords map: { [credentialId]: plaintext }
  const [decryptedPasswords, setDecryptedPasswords] = useState({});
  const [decryptingIds, setDecryptingIds] = useState(new Set());

  // Fetch list of credentials
  const fetchCredentials = useCallback(
    async (overrideParams = {}) => {
      if (!isAuthenticated) return;
      setLoading(true);
      try {
        const params = {
          search: searchQuery,
          category: selectedCategory,
          sort: sortBy,
          ...overrideParams,
        };
        const res = await credentialApi.getAll(params);
        if (res.data?.success) {
          setCredentials(res.data.credentials);
        }
      } catch (err) {
        console.error('Failed to fetch credentials:', err);
        toast.error('Unable to retrieve passwords from vault.');
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, searchQuery, selectedCategory, sortBy, toast]
  );

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    if (!isAuthenticated) return;
    setStatsLoading(true);
    try {
      const res = await credentialApi.getStats();
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [isAuthenticated]);

  // Load data when authentication becomes active
  useEffect(() => {
    if (isAuthenticated) {
      fetchCredentials();
      fetchStats();
    } else {
      setCredentials([]);
      setDecryptedPasswords({});
    }
  }, [isAuthenticated, fetchCredentials, fetchStats]);

  // Save viewMode preference
  useEffect(() => {
    localStorage.setItem('securevault_view_mode', viewMode);
  }, [viewMode]);

  // Create Credential
  const createCredential = async (formData) => {
    try {
      const res = await credentialApi.create(formData);
      if (res.data?.success) {
        toast.success(`Password for ${formData.websiteName} securely saved!`);
        // Refresh without full page reload
        await Promise.all([fetchCredentials(), fetchStats()]);
        setIsFormModalOpen(false);
        return res.data.credential;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save credential';
      toast.error(msg);
      throw err;
    }
  };

  // Update Credential
  const updateCredential = async (id, formData) => {
    try {
      const res = await credentialApi.update(id, formData);
      if (res.data?.success) {
        toast.success(`Updated ${formData.websiteName || 'credential'}`);
        // Clear cached decrypted password if it was updated
        if (formData.password) {
          setDecryptedPasswords((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        }
        await Promise.all([fetchCredentials(), fetchStats()]);
        setIsFormModalOpen(false);
        setEditingCredential(null);
        return res.data.credential;
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update credential';
      toast.error(msg);
      throw err;
    }
  };

  // Toggle Favorite
  const toggleFavorite = async (id) => {
    try {
      // Optimistic update
      setCredentials((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isFavorite: !c.isFavorite } : c))
      );
      const res = await credentialApi.toggleFavorite(id);
      if (res.data?.success) {
        fetchStats(); // Update stats count
      }
    } catch (err) {
      // Rollback on failure
      fetchCredentials();
      toast.error('Failed to update favorite status');
    }
  };

  // Delete Credential
  const deleteCredential = async (id) => {
    try {
      const res = await credentialApi.delete(id);
      if (res.data?.success) {
        toast.success('Credential deleted.');
        setCredentials((prev) => prev.filter((c) => c._id !== id));
        setDecryptedPasswords((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        fetchStats();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete credential');
    }
  };

  // On-demand authorized password decryption
  const togglePasswordVisibility = async (id) => {
    if (decryptedPasswords[id]) {
      // If already visible, hide it
      setDecryptedPasswords((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    // Otherwise, fetch and decrypt on demand
    setDecryptingIds((prev) => new Set(prev).add(id));
    try {
      const res = await credentialApi.getById(id);
      if (res.data?.success && res.data.credential) {
        setDecryptedPasswords((prev) => ({
          ...prev,
          [id]: res.data.credential.password,
        }));
      }
    } catch (err) {
      toast.error('Failed to decrypt password. Check connection.');
    } finally {
      setDecryptingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Copy password to clipboard with automatic on-demand fetch if not already in state
  const copyPassword = async (id) => {
    let passwordVal = decryptedPasswords[id];
    if (!passwordVal) {
      try {
        const res = await credentialApi.getById(id);
        if (res.data?.success) {
          passwordVal = res.data.credential.password;
        }
      } catch (err) {
        toast.error('Unable to fetch password for copy.');
        return;
      }
    }

    if (passwordVal) {
      navigator.clipboard.writeText(passwordVal);
      toast.success('Password copied to clipboard!');
    }
  };

  const copyUsername = (username) => {
    navigator.clipboard.writeText(username);
    toast.success('Username copied to clipboard!');
  };

  // Modal open helpers
  const openAddModal = () => {
    setEditingCredential(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = async (cred) => {
    try {
      // Fetch full details including decrypted password for editing
      const res = await credentialApi.getById(cred._id);
      if (res.data?.success) {
        setEditingCredential(res.data.credential);
      } else {
        setEditingCredential(cred);
      }
    } catch {
      setEditingCredential(cred);
    }
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCredential(null);
  };

  return (
    <CredentialContext.Provider
      value={{
        credentials,
        stats,
        loading,
        statsLoading,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        sortBy,
        setSortBy,
        viewMode,
        setViewMode,
        isFormModalOpen,
        openAddModal,
        openEditModal,
        closeFormModal,
        editingCredential,
        createCredential,
        updateCredential,
        deleteCredential,
        toggleFavorite,
        togglePasswordVisibility,
        decryptedPasswords,
        decryptingIds,
        copyPassword,
        copyUsername,
        fetchCredentials,
        fetchStats,
      }}
    >
      {children}
    </CredentialContext.Provider>
  );
}

export function useCredentials() {
  const context = useContext(CredentialContext);
  if (!context) {
    throw new Error('useCredentials must be used within a CredentialProvider');
  }
  return context;
}
