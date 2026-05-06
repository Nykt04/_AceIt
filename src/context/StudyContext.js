import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStudySets, saveStudySets, addStudySet as addSet, updateStudySet as updateSet, deleteStudySet as deleteSet } from '../services/storageService';
import { useAuth } from './AuthContext';

const StudyContext = createContext(null);

export function StudyProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load sets when user changes
  useEffect(() => {
    console.log('[StudyContext] Loading study sets for user:', userId);
    loadStudySets(userId).then(setStudySets).finally(() => setLoading(false));
  }, [userId]);

  const save = (sets) => {
    setStudySets(sets);
    saveStudySets(sets, userId);
  };

  const addStudySet = async (set) => {
    const newSet = await addSet(set, userId);
    setStudySets((prev) => [newSet, ...prev]);
    return newSet;
  };

  const updateStudySet = async (id, updates) => {
    console.log('[StudyContext] updateStudySet called with id:', id, 'updates:', updates);
    const updated = await updateSet(id, updates, userId);
    console.log('[StudyContext] updateSet result:', updated);
    if (updated) {
      setStudySets((prev) => {
        const newSets = prev.map((s) => (s.id === id ? updated : s));
        console.log('[StudyContext] Updated studySets, new length:', newSets.length, 'updated set terms:', updated.terms?.length);
        return newSets;
      });
    }
    return updated;
  };

  const deleteStudySet = async (id) => {
    const strId = String(id);
    console.log('[StudyContext] deleteStudySet called with', id, 'normalized to', strId);
    try {
      await deleteSet(strId, userId);
      setStudySets((prev) => {
        const filtered = prev.filter((s) => String(s.id) !== strId);
        console.log('[StudyContext] state filtered, new length', filtered.length);
        return filtered;
      });
      // reload to confirm storage state
      const stored = await loadStudySets(userId);
      console.log('[StudyContext] after delete, storage length', stored.length);
      return true;
    } catch (e) {
      console.error('[StudyContext] Failed to delete set:', e);
      return false;
    }
  };

  return (
    <StudyContext.Provider value={{ studySets, loading, addStudySet, updateStudySet, deleteStudySet, refresh: () => loadStudySets(userId).then(setStudySets) }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
}
