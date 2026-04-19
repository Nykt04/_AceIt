import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadStudySets, saveStudySets, addStudySet as addSet, updateStudySet as updateSet, deleteStudySet as deleteSet } from '../services/storageService';

const StudyContext = createContext(null);

export function StudyProvider({ children }) {
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudySets().then(setStudySets).finally(() => setLoading(false));
  }, []);

  const save = (sets) => {
    setStudySets(sets);
    saveStudySets(sets);
  };

  const addStudySet = async (set) => {
    const newSet = await addSet(set);
    setStudySets((prev) => [newSet, ...prev]);
    return newSet;
  };

  const updateStudySet = async (id, updates) => {
    const updated = await updateSet(id, updates);
    if (updated) setStudySets((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  };

  const deleteStudySet = async (id) => {
    const strId = String(id);
    console.log('[StudyContext] deleteStudySet called with', id, 'normalized to', strId);
    try {
      await deleteSet(strId);
      setStudySets((prev) => {
        const filtered = prev.filter((s) => String(s.id) !== strId);
        console.log('[StudyContext] state filtered, new length', filtered.length);
        return filtered;
      });
      // reload to confirm storage state
      const stored = await loadStudySets();
      console.log('[StudyContext] after delete, storage length', stored.length);
      return true;
    } catch (e) {
      console.error('Failed to delete set:', e);
      return false;
    }
  };

  return (
    <StudyContext.Provider value={{ studySets, loading, addStudySet, updateStudySet, deleteStudySet, refresh: () => loadStudySets().then(setStudySets) }}>
      {children}
    </StudyContext.Provider>
  );
}

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
}
