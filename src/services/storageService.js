import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './authService';

const STUDY_SETS_KEY = '@study_buddy_sets';

/**
 * Load study sets from Supabase (if userId provided) or local storage
 * @param {string} userId - Optional user ID. If provided, loads from Supabase
 */
export const loadStudySets = async (userId) => {
  try {
    if (userId) {
      // Load from Supabase
      const { data, error } = await supabase
        .from('study_sets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[storageService] Failed to load from Supabase, falling back to local storage', error);
        // Fall back to local storage
        const json = await AsyncStorage.getItem(STUDY_SETS_KEY);
        return json != null ? JSON.parse(json) : [];
      }

      // Sync to local storage as backup
      await AsyncStorage.setItem(STUDY_SETS_KEY, JSON.stringify(data || []));
      return data || [];
    } else {
      // Not authenticated, load from local storage only
      const json = await AsyncStorage.getItem(STUDY_SETS_KEY);
      return json != null ? JSON.parse(json) : [];
    }
  } catch (e) {
    console.error('[storageService] Failed to load study sets', e);
    return [];
  }
};

/**
 * Save study sets to Supabase (if userId provided) and local storage
 * @param {array} sets - Array of study sets to save
 * @param {string} userId - Optional user ID. If provided, saves to Supabase
 */
export const saveStudySets = async (sets, userId) => {
  try {
    // Always save to local storage
    await AsyncStorage.setItem(STUDY_SETS_KEY, JSON.stringify(sets));

    if (userId) {
      // Also save to Supabase if authenticated
      const { error } = await supabase
        .from('study_sets')
        .upsert(sets.map((s) => ({ ...s, user_id: userId })));

      if (error) {
        console.warn('[storageService] Failed to save to Supabase', error);
      }
    }
  } catch (e) {
    console.error('[storageService] Failed to save study sets', e);
  }
};

/**
 * Add a new study set
 * @param {object} set - Study set data
 * @param {string} userId - Optional user ID. If provided, saves to Supabase
 */
export const addStudySet = async (set, userId) => {
  const newSet = {
    id: Date.now().toString(),
    title: set.title,
    description: set.description || '',
    terms: set.terms || [],
    questions: set.questions || [],
    created_at: new Date().toISOString(),
    ...(userId && { user_id: userId }),
  };

  try {
    if (userId) {
      // Save to Supabase
      const { data, error } = await supabase
        .from('study_sets')
        .insert([newSet])
        .select()
        .single();

      if (error) {
        console.warn('[storageService] Failed to add to Supabase, saving locally', error);
      }
    }

    // Also save locally
    const sets = await loadStudySets(userId);
    sets.unshift(newSet);
    await AsyncStorage.setItem(STUDY_SETS_KEY, JSON.stringify(sets));

    return newSet;
  } catch (e) {
    console.error('[storageService] Failed to add study set', e);
    throw e;
  }
};

/**
 * Update a study set
 * @param {string} id - Study set ID
 * @param {object} updates - Updates to apply
 * @param {string} userId - Optional user ID. If provided, updates in Supabase
 */
export const updateStudySet = async (id, updates, userId) => {
  try {
    // First load the current set to preserve all fields
    const sets = await loadStudySets(userId);
    const index = sets.findIndex((s) => s.id === id);
    
    if (index === -1) {
      console.error('[storageService] Set not found:', id);
      return null;
    }

    // Merge updates with existing set
    const updatedSet = {
      ...sets[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (userId) {
      // Update in Supabase
      const { data, error } = await supabase
        .from('study_sets')
        .update(updatedSet)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.warn('[storageService] Failed to update in Supabase, updating locally', error);
      }
    }

    // Update locally
    sets[index] = updatedSet;
    await AsyncStorage.setItem(STUDY_SETS_KEY, JSON.stringify(sets));
    console.log('[storageService] Updated set:', id, 'terms count:', updatedSet.terms?.length);
    return updatedSet;
  } catch (e) {
    console.error('[storageService] Failed to update study set', e);
    throw e;
  }
};

/**
 * Delete a study set
 * @param {string} id - Study set ID
 * @param {string} userId - Optional user ID. If provided, deletes from Supabase
 */
export const deleteStudySet = async (id, userId) => {
  console.log('[storageService] deleteStudySet called with', id);

  try {
    const strId = String(id);

    if (userId) {
      // Delete from Supabase
      const { error } = await supabase
        .from('study_sets')
        .delete()
        .eq('id', strId)
        .eq('user_id', userId);

      if (error) {
        console.warn('[storageService] Failed to delete from Supabase, deleting locally', error);
      }
    }

    // Also delete locally
    const sets = await loadStudySets(userId);
    const filtered = sets.filter((set) => String(set.id) !== strId);
    console.log('[storageService] before', sets.length, 'after', filtered.length);
    await AsyncStorage.setItem(STUDY_SETS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('[storageService] Failed to delete study set', e);
  }
};

/**
 * Generic storage helper - set item
 */
export const setItem = async (key, value) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.error('Failed to set item in storage', e);
    throw e;
  }
};

/**
 * Generic storage helper - get item
 */
export const getItem = async (key) => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (e) {
    console.error('Failed to get item from storage', e);
    return null;
  }
};

export const storageService = {
  setItem,
  getItem,
  loadStudySets,
  saveStudySets,
  addStudySet,
  updateStudySet,
  deleteStudySet,
};