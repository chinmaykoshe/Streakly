import React from 'react';
import { getReminders } from '../storage/asyncStorage';
import { SmallStreakWidget, MediumStreakWidget, LargeStreakWidget } from './StreakWidget';

function formatTimeWidget(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatLastSentWidget(isoStr) {
  if (!isoStr) return null;
  const d = new Date(isoStr);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === now.toDateString()) return `Today • ${time}`;
  const yest = new Date(now - 86400000);
  if (d.toDateString() === yest.toDateString()) return `Yesterday • ${time}`;
  return `${d.toLocaleDateString()} • ${time}`;
}

function getCountdown(timeStr) {
  if (!timeStr) return '';
  const [hour, minute] = timeStr.split(':').map(Number);
  if (isNaN(hour) || isNaN(minute)) return '';
  const now = new Date();
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  const diffMs = target - now;
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export async function widgetTaskHandler(props) {
  const { widgetInfo, widgetAction, renderWidget } = props;

  // Load latest state from storage
  let reminders = [];
  try {
    reminders = await getReminders();
  } catch (_) {}

  const streak = reminders.find(r => r.id === 'streak_default') || reminders[0];
  const status = streak?.status || 'NOT_SENT';
  const time = streak?.reminderTime || '21:00';
  const lastSent = formatLastSentWidget(streak?.lastCompleted);
  
  let countdown = '';
  if (streak?.reminderType === 'activity' && streak?.lastCompleted && status === 'DONE') {
    const elapsedSec = (Date.now() - new Date(streak.lastCompleted).getTime()) / 1000;
    const maxSec = streak.maxDuration || 6 * 60 * 60;
    const diffSec = maxSec - elapsedSec;
    if (diffSec > 0) {
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      countdown = `${h}h ${m}m`;
    } else {
      countdown = 'Expired';
    }
  } else {
    countdown = getCountdown(time);
  }

  if (widgetAction === 'MARK_SENT' && streak) {
    // Mark as sent and update — handled via app intent in a real build
  }

  // Determine widget size from widgetInfo dimensions
  const w = widgetInfo?.width || 180;
  const h = widgetInfo?.height || 180;

  let Widget;
  if (w < 250 && h < 250) {
    Widget = <SmallStreakWidget status={status} time={time} />;
  } else if (h < 250) {
    Widget = <MediumStreakWidget status={status} time={time} />;
  } else {
    Widget = <LargeStreakWidget status={status} time={time} lastSent={lastSent} countdown={countdown} />;
  }

  switch (widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      renderWidget(Widget);
      break;
    default:
      break;
  }
}
