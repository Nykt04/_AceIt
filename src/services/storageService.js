import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './authService';

const STUDY_SETS_KEY = '@study_buddy_sets';

/**
 * Get current authenticated user
 */
const getCurrentUserId = async () => {
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id || null;
  } catch (e) {
    console.error('Failed to get current user', e);
    return null;
  }
};

/**
 * Load study sets from Supabase (if user is authenticated) or local storage
 */
export const loadStudySets = async () => {
  try {
    const userId = await getCurrentUserId();

    if (userId) {
      // Load from Supabase
      const { data, error } = await supabase
        .from('study_sets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Failed to load from Supabase, falling back to local storage', error);
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
    console.error('Failed to load study sets', e);
    return [];
  }
};

/**
 * Save study sets to Supabase (if authenticated) and local storage
 */
export const saveStudySets = async (sets) => {
  try {
    // Always save to local storage
    await AsyncStorage.setItem(STUDY_SETS_KEY, JSON.stringify(sets));

    const userId = await getCurrentUserId();
    if (userId) {
      // Also save to Supabase if authenticated
      const { error } = await supabase
        .from('study_sets')
        .upsert(sets.map((s) => ({ ...s, user_id: userId })));

      if (error) {
        console.warn('Failed to save to Supabase', error);
      }
    }
  } catch (e) {
    console.error('Failed to save study sets', e);
  }
};

/**
 * Add a new study set
 */
export const addStudySet = async (set) => {
  const userId = await getCurrentUserId();

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
        console.warn('Failed to add to Supabase, saving locally', error);
      }
    }

    // Also save locally
    const sets = await loadStudySets();
    sets.unshift(newSet);
    await AsyncStorage.setItem(STUDY_SETS_KEY, JSON.stringify(sets));

    return newSet;
  } catch (e) {
    console.error('Failed to add study set', e);
    throw e;
  }
};

/**
 * Update a study set
 */
export const updateStudySet = async (id, updates) => {
  try {
    const userId = await getCurrentUserId();

    const updatedSet = {
      id,
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
        console.warn('Failed to update in Supabase, updating locally', error);
      }
    }

    // Also update locally
    const sets = await loadStudySets();
    const index = sets.findIndex((s) => s.id === id);
    if (index !== -1) {
      sets[index] = { ...sets[index], ...updates };
      await AsyncStorage.setItem(STUDY_SETS_KEY, JSON.stringify(sets));
      return sets[index];
    }

    return null;
  } catch (e) {
    console.error('Failed to update study set', e);
    throw e;
  }
};

/**
 * Delete a study set
 */
export const deleteStudySet = async (id) => {
  console.log('[storageService] deleteStudySet called with', id);

  try {
    const userId = await getCurrentUserId();
    const strId = String(id);

    if (userId) {
      // Delete from Supabase
      const { error } = await supabase
        .from('study_sets')
        .delete()
        .eq('id', strId)
        .eq('user_id', userId);

      if (error) {
        console.warn('Failed to delete from Supabase, deleting locally', error);
      }
    }

    // Also delete locally
    const sets = await loadStudySets();
    const filtered = sets.filter((set) => String(set.id) !== strId);
    console.log('[storageService] before', sets.length, 'after', filtered.length);
    await AsyncStorage.setItem(STUDY_SETS_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete study set', e);
  }
};