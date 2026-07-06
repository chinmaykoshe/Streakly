import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ─── Lazy-loaded Notifications module ─────────────────────────────────────────
// expo-notifications crashes on import in SDK 57 web mode and Expo Go (SDK 53+),
// so we lazily require it only on native platforms outside Expo Go.
let Notifications = null;

function getNotifications() {
  if (Platform.OS === 'web') return null;
  
  // expo-notifications was removed from Expo Go in SDK 53.
  // We must not import/require it inside Expo Go to avoid immediate crashes.
  if (Constants.appOwnership === 'expo') {
    console.log('[NotificationService] Notifications are disabled in Expo Go. Use a development build.');
    return null;
  }

  if (!Notifications) {
    try {
      Notifications = require('expo-notifications');
    } catch (e) {
      console.log('[NotificationService] expo-notifications not available:', e.message);
      return null;
    }
  }
  return Notifications;
}

// ─── Setup notification handler (runs only on native) ─────────────────────────
if (Platform.OS !== 'web') {
  const N = getNotifications();
  if (N) {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
}

// ─── Permissions ──────────────────────────────────────────────────────────────
export const requestNotificationPermissions = async () => {
  const N = getNotifications();
  if (!N) return false;
  const { status: existing } = await N.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await N.requestPermissionsAsync();
  return status === 'granted';
};

export const hasNotificationPermission = async () => {
  const N = getNotifications();
  if (!N) return false;
  const { status } = await N.getPermissionsAsync();
  return status === 'granted';
};

// ─── Schedule a daily repeating notification ─────────────────────────────────
export const scheduleReminderNotification = async (id, title, body, hour, minute) => {
  const N = getNotifications();
  if (!N) return null;
  await cancelNotification(id).catch(() => {});
  return N.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true, data: { reminderId: id } },
    trigger: {
      type: N.SchedulableTriggerInputTypes?.DAILY || 'daily',
      hour,
      minute,
    },
  });
};

export const scheduleIntervalNotification = async (id, title, body, intervalSeconds) => {
  const N = getNotifications();
  if (!N) return null;
  await cancelNotification(id).catch(() => {});
  return N.scheduleNotificationAsync({
    identifier: id,
    content: { title, body, sound: true, data: { reminderId: id } },
    trigger: {
      seconds: intervalSeconds,
      repeats: true,
    },
  });
};

// ─── Snooze notification ──────────────────────────────────────────────────────
export const scheduleSnoozeNotification = async (id, title, body, delayMinutes) => {
  const N = getNotifications();
  if (!N) return null;
  return N.scheduleNotificationAsync({
    identifier: `${id}_snooze`,
    content: { title: `⏰ Snoozed: ${title}`, body, sound: true },
    trigger: { seconds: delayMinutes * 60 },
  });
};

// ─── Cancel helpers ───────────────────────────────────────────────────────────
export const cancelNotification = async (id) => {
  const N = getNotifications();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(id).catch(() => {});
};

export const cancelAllNotifications = async () => {
  const N = getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
};

// ─── Get all scheduled ───────────────────────────────────────────────────────
export const getAllScheduledNotifications = async () => {
  const N = getNotifications();
  if (!N) return [];
  return N.getAllScheduledNotificationsAsync();
};

// ─── Reschedule all enabled reminders ────────────────────────────────────────
export const rescheduleAllReminders = async (reminders) => {
  const N = getNotifications();
  if (!N) return;
  for (const r of reminders) {
    if (!r.enabled) {
      await cancelNotification(r.id).catch(() => {});
      continue;
    }
    
    if (r.reminderType === 'repeating') {
      const intervalSec = (r.interval || 60) * 60;
      await scheduleIntervalNotification(r.id, r.title, r.message || 'Time to stay hydrated!', intervalSec);
    } else if (r.reminderType === 'alarm') {
      const timeStr = r.reminderTime || '09:00';
      const [hour, minute] = timeStr.split(':').map(Number);
      if (!isNaN(hour) && !isNaN(minute)) {
        await scheduleReminderNotification(r.id, r.title, r.message || `Time for: ${r.title}`, hour, minute);
      }
    } else {
      await cancelNotification(r.id).catch(() => {});
    }
  }
};
