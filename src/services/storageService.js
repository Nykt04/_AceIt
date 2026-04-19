import AsyncStorage from '@react-native-async-storage/async-storage';

const STUDY_SETS_KEY = '@study_buddy_sets';

export const loadStudySets = async() => {
    try {
        const json = await AsyncStorage.getItem(STUDY_SETS_KEY);
        return json != null ? JSON.parse(json) : [];
    } catch (e) {
        console.error('Failed to load study sets', e);
        return [];
    }
};

export const saveStudySets = async(sets) => {
    try {
        await AsyncStorage.setItem(STUDY_SETS_KEY, JSON.stringify(sets));
    } catch (e) {
        console.error('Failed to save study sets', e);
    }
};

export const addStudySet = async(set) => {
    const sets = await loadStudySets();
    const newSet = {
        id: Date.now().toString(),
        title: set.title,
        description: set.description || '',
        terms: set.terms || [],
        questions: set.questions || [],
        createdAt: new Date().toISOString(),
    };
    sets.unshift(newSet);
    await saveStudySets(sets);
    return newSet;
};

export const updateStudySet = async(id, updates) => {
    const sets = await loadStudySets();
    const index = sets.findIndex((s) => s.id === id);
    if (index === -1) return null;
    sets[index] = {...sets[index], ...updates };
    await saveStudySets(sets);
    return sets[index];
};

export const deleteStudySet = async(id) => {
    console.log('[storageService] deleteStudySet called with', id);
    const sets = await loadStudySets();
    const strId = String(id);
    const filtered = sets.filter((set) => String(set.id) !== strId);
    console.log('[storageService] before', sets.length, 'after', filtered.length);
    await saveStudySets(filtered);
};