import { useState, useEffect, useCallback } from 'react';
import { getReminders, saveReminders, addHistoryEntry, getHistory } from '../storage/asyncStorage';
import { scheduleReminderNotification, scheduleIntervalNotification, cancelNotification } from '../services/notificationService';

/**
 * Hook managing the three reminder types (Activity, Alarm, Repeating)
 * following the specific elapsed-time, daily resetting, and interval rules.
 */
export function useReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Central notification scheduler helper based on reminder type
  const triggerReminderNotification = useCallback(async (r) => {
    if (!r.enabled) {
      await cancelNotification(r.id);
      return;
    }

    if (r.reminderType === 'repeating') {
      // Repeat every X minutes (in seconds)
      const intervalSec = (r.interval || 60) * 60;
      await scheduleIntervalNotification(r.id, r.title, r.message || 'Time to stay hydrated!', intervalSec);
    } else if (r.reminderType === 'alarm') {
      // Fixed daily alarm time
      const timeStr = r.reminderTime || '09:00';
      const [hour, minute] = timeStr.split(':').map(Number);
      if (!isNaN(hour) && !isNaN(minute)) {
        await scheduleReminderNotification(r.id, r.title, r.message || `Time for: ${r.title}`, hour, minute);
      }
    } else {
      // Activity reminders do not trigger sound/alarm notifications
      await cancelNotification(r.id);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const stored = await getReminders();
    const history = await getHistory();

    const now = Date.now();
    let changed = false;
    const today = new Date().toDateString();

    const todayHistory = history.filter(h => new Date(h.timestamp).toDateString() === today);
    const countMap = {};
    todayHistory.forEach(h => {
      countMap[h.reminderId] = (countMap[h.reminderId] || 0) + 1;
    });

    const updated = stored.map((r) => {
      let nextR = { ...r };

      // ── TYPE 1: Activity (Rolling countdown since lastCompleted) ──
      if (r.reminderType === 'activity') {
        if (r.status === 'DONE' && r.lastCompleted) {
          const elapsedSec = (now - new Date(r.lastCompleted).getTime()) / 1000;
          const maxSec = r.maxDuration || 6 * 60 * 60; // 6 hrs
          if (elapsedSec >= maxSec) {
            nextR.status = 'NOT_SENT';
            changed = true;
          }
        }
      }
      
      // ── TYPE 2: Alarm (Daily reset at midnight) ──
      else if (r.reminderType === 'alarm') {
        if (r.completedToday && r.lastCompleted) {
          const lastDateStr = new Date(r.lastCompleted).toDateString();
          if (lastDateStr !== today) {
            nextR.completedToday = false;
            nextR.status = 'NOT_SENT';
            changed = true;
            triggerReminderNotification(nextR);
          }
        }
      }

      // ── TYPE 3: Repeating (Resets status to pending after interval) ──
      else if (r.reminderType === 'repeating') {
        if (r.status === 'DONE' && r.lastCompleted) {
          const elapsedMin = (now - new Date(r.lastCompleted).getTime()) / 60000;
          const intervalMin = r.interval || 60;
          if (elapsedMin >= intervalMin) {
            nextR.status = 'NOT_SENT';
            changed = true;
            triggerReminderNotification(nextR);
          }
        }
      }

      // Attach temporary count and verify status aliases
      nextR.todayCount = countMap[r.id] || 0;
      return nextR;
    });

    if (changed) {
      await saveReminders(updated.map(({ todayCount, ...rest }) => rest));
      setReminders(updated);
    } else {
      setReminders(updated);
    }
    setLoading(false);
  }, [triggerReminderNotification]);

  useEffect(() => {
    load();
  }, [load]);

  const markAsSent = useCallback(async (id) => {
    setReminders((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== id) return r;
        const isDone = r.status === 'DONE';
        const nextStatus = isDone ? 'NOT_SENT' : 'DONE';
        const timestamp = new Date().toISOString();

        if (r.reminderType === 'activity') {
          if (!isDone) {
            addHistoryEntry(r).catch((err) => console.log('Error adding history:', err));
          }
          return {
            ...r,
            status: nextStatus,
            lastCompleted: isDone ? null : timestamp,
            todayCount: isDone ? Math.max(0, (r.todayCount || 0) - 1) : (r.todayCount || 0) + 1
          };
        }
        
        else if (r.reminderType === 'alarm') {
          if (isDone) {
            triggerReminderNotification({ ...r, status: nextStatus, completedToday: false });
          } else {
            cancelNotification(r.id);
            addHistoryEntry(r).catch((err) => console.log('Error adding history:', err));
          }
          return {
            ...r,
            status: nextStatus,
            completedToday: !isDone,
            lastCompleted: isDone ? null : timestamp,
            todayCount: isDone ? Math.max(0, (r.todayCount || 0) - 1) : (r.todayCount || 0) + 1
          };
        }
        
        else { // repeating
          if (isDone) {
            triggerReminderNotification({ ...r, status: nextStatus, nextReminder: null });
          } else {
            // Set next alert to now + interval
            const intervalMin = r.interval || 60;
            const nextAlert = new Date(Date.now() + intervalMin * 60000).toISOString();
            triggerReminderNotification({ ...r, status: nextStatus, nextReminder: nextAlert });
            addHistoryEntry(r).catch((err) => console.log('Error adding history:', err));
          }
          return {
            ...r,
            status: nextStatus,
            lastCompleted: isDone ? null : timestamp,
            nextReminder: isDone ? null : new Date(Date.now() + (r.interval || 60) * 60000).toISOString(),
            todayCount: isDone ? Math.max(0, (r.todayCount || 0) - 1) : (r.todayCount || 0) + 1
          };
        }
      });
      saveReminders(updated.map(({ todayCount, ...rest }) => rest));
      return updated;
    });
  }, [triggerReminderNotification]);

  const addReminder = useCallback(async (data) => {
    const newReminder = {
      id: Date.now().toString(),
      title: data.title,
      emoji: data.emoji || '🔔',
      reminderType: data.reminderType || 'alarm',
      reminderTime: data.reminderTime || '09:00',
      maxDuration: data.maxDuration || 6 * 60 * 60,
      interval: data.interval || 60,
      message: data.message || `Time for: ${data.title}`,
      enabled: true,
      status: 'NOT_SENT',
      lastCompleted: null,
      nextReminder: null,
      completedToday: false,
      createdAt: new Date().toISOString(),
      color: data.color || '#6C63FF',
    };

    setReminders((prev) => {
      const updated = [...prev, newReminder];
      saveReminders(updated);
      triggerReminderNotification(newReminder);
      return updated;
    });

    return newReminder;
  }, [triggerReminderNotification]);

  const removeReminder = useCallback(async (id) => {
    await cancelNotification(id);
    setReminders((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveReminders(updated);
      return updated;
    });
  }, []);

  const toggleReminder = useCallback(async (id) => {
    setReminders((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== id) return r;
        const toggled = { ...r, enabled: !r.enabled };
        triggerReminderNotification(toggled);
        return toggled;
      });
      saveReminders(updated);
      return updated;
    });
  }, [triggerReminderNotification]);

  const updateReminder = useCallback(async (id, changes) => {
    setReminders((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...changes };
        if (
          changes.reminderTime !== undefined || 
          changes.interval !== undefined || 
          changes.enabled !== undefined
        ) {
          triggerReminderNotification(next);
        }
        return next;
      });
      saveReminders(updated);
      return updated;
    });
  }, [triggerReminderNotification]);

  return {
    reminders,
    loading,
    reload: load,
    markAsSent,
    addReminder,
    removeReminder,
    toggleReminder,
    updateReminder,
  };
}
