import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DefaultPreference from 'react-native-default-preference';

export const STORE_KEYS = {
  REMINDERS: '@sr_reminders_v4',
  BACKGROUND_IMAGE: '@sr_bg_image',
  APP_SETTINGS: '@sr_app_settings',
  HISTORY: '@sr_history_v3',
};

// In-memory fallback database for when AsyncStorage native module is null/missing
const memoryStore = {};
const isWeb = Platform.OS === 'web';

// ─── Generic helpers ─────────────────────────────────────────────────────────
export const storeData = async (key, value) => {
  try {
    const stringValue = JSON.stringify(value);
    if (isWeb) {
      localStorage.setItem(key, stringValue);
      return;
    }
    
    await AsyncStorage.setItem(key, stringValue);
  } catch (e) {
    console.log('[Storage] storeData failed, falling back to memory. Error:', e.message);
    memoryStore[key] = JSON.stringify(value);
  }
};

export const getData = async (key) => {
  try {
    if (isWeb) {
      const raw = localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : null;
    }
    
    const raw = await AsyncStorage.getItem(key);
    return raw != null ? JSON.parse(raw) : null;
  } catch (e) {
    console.log('[Storage] getData failed, falling back to memory. Error:', e.message);
    const raw = memoryStore[key];
    return raw != null ? JSON.parse(raw) : null;
  }
};

// ─── Reminders ────────────────────────────────────────────────────────────────
export const DEFAULT_REMINDERS = [
  {
    id: 'streak_default',
    title: 'Snapchat Streak',
    emoji: '🔥',
    reminderType: 'activity',
    maxDuration: 6 * 60 * 60, // 6 hours in seconds
    lastCompleted: null,
    status: 'NOT_SENT',
    createdAt: new Date().toISOString(),
    color: '#FFB000',
    enabled: true,
  },
  {
    id: 'water_default',
    title: 'Water Break',
    emoji: '💧',
    reminderType: 'repeating',
    interval: 60, // 60 minutes
    lastCompleted: null,
    nextReminder: null,
    status: 'NOT_SENT',
    createdAt: new Date().toISOString(),
    color: '#03A9F4',
    enabled: true,
    message: 'Time to drink water and stay hydrated!',
  },
  {
    id: 'oats_default',
    title: 'Oats Meal Break',
    emoji: '🥣',
    reminderType: 'alarm',
    reminderTime: '16:00', // 4:00 PM
    completedToday: false,
    status: 'NOT_SENT',
    createdAt: new Date().toISOString(),
    color: '#FF8C42',
    enabled: true,
    message: 'Time for your healthy oats snack!',
  },
  {
    id: 'meditation_default',
    title: 'Morning Meditation',
    emoji: '🧘',
    reminderType: 'alarm',
    reminderTime: '08:00', // 8:00 AM
    completedToday: false,
    status: 'NOT_SENT',
    createdAt: new Date().toISOString(),
    color: '#BB86FC',
    enabled: true,
    message: 'Start your day with 10 minutes of mindfulness.',
  },
];

export const getReminders = async () => {
  if (Platform.OS === 'android') {
    try {
      await DefaultPreference.setName('react-native-default-preference');
      const raw = await DefaultPreference.get(STORE_KEYS.REMINDERS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.log('[Storage] Failed to read from DefaultPreference', e);
    }
  }
  const data = await getData(STORE_KEYS.REMINDERS);
  return Array.isArray(data) ? data : DEFAULT_REMINDERS;
};

export const saveReminders = async (reminders) => {
  await storeData(STORE_KEYS.REMINDERS, reminders);
  if (Platform.OS === 'android') {
    try {
      await DefaultPreference.setName('react-native-default-preference');
      await DefaultPreference.set(STORE_KEYS.REMINDERS, JSON.stringify(reminders));
    } catch (e) {
      console.log('[Storage] Failed to save to DefaultPreference', e);
    }
  }
};

/**
 * Reset the 'NOT_SENT' status on all reminders (called at midnight).
 */
export const resetDailyStatuses = async () => {
  const reminders = await getReminders();
  const reset = reminders.map((r) => ({ ...r, status: 'NOT_SENT' }));
  await saveReminders(reset);
  return reset;
};

// ─── Background image ─────────────────────────────────────────────────────────
export const getBackgroundImage = async () => {
  const data = await getData(STORE_KEYS.BACKGROUND_IMAGE);
  return data?.uri || null;
};

export const saveBackgroundImage = async (uri) => {
  await storeData(STORE_KEYS.BACKGROUND_IMAGE, { uri });
};

// ─── App-level settings ───────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  vibration: true,
  darkMode: true,
  snoozeMinutes: 10,
};

export const getAppSettings = async () => {
  const data = await getData(STORE_KEYS.APP_SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(data || {}) };
};

export const saveAppSettings = async (settings) => {
  await storeData(STORE_KEYS.APP_SETTINGS, settings);
};

// ─── History Log ─────────────────────────────────────────────────────────────
export const getHistory = async () => {
  const data = await getData(STORE_KEYS.HISTORY);
  return Array.isArray(data) ? data : [];
};

export const saveHistory = async (history) => {
  await storeData(STORE_KEYS.HISTORY, history);
};

export const addHistoryEntry = async (reminder) => {
  const history = await getHistory();
  const newEntry = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    reminderId: reminder.id,
    title: reminder.title,
    emoji: reminder.emoji,
    timestamp: new Date().toISOString(),
  };
  const updated = [newEntry, ...history];
  await saveHistory(updated);
  return updated;
};
