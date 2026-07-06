import React from 'react';
import { FlexWidget, TextWidget, ImageWidget } from 'react-native-android-widget';

const COLORS = {
  bg: '#1A1A1A',
  bgDone: '#1A2A1A',
  textPrimary: '#FFFFFF',
  primary: '#FFC107',
  done: '#32D74B',
  notSent: '#FF3B30',
  muted: '#9E9E9E',
};

function formatTimeWidget(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Small Widget (2x2) — just flame + status + time */
export function SmallStreakWidget({ status, time }) {
  const isDone = status === 'DONE';
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: isDone ? '#1A2A1A' : COLORS.bg,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
      }}
      clickAction="OPEN_APP"
    >
      <TextWidget style={{ fontSize: 32 }}>🔥</TextWidget>
      <TextWidget
        style={{
          fontSize: 11,
          color: isDone ? COLORS.done : COLORS.notSent,
          fontWeight: 'bold',
          marginTop: 6,
          letterSpacing: 1,
        }}
      >
        {isDone ? 'DONE ✅' : 'NOT SENT'}
      </TextWidget>
      <TextWidget style={{ fontSize: 11, color: COLORS.primary, marginTop: 3, fontWeight: '600' }}>
        {isDone ? `Tomorrow\n${formatTimeWidget(time)}` : formatTimeWidget(time)}
      </TextWidget>
    </FlexWidget>
  );
}

/** Medium Widget (4x2) */
export function MediumStreakWidget({ status, time }) {
  const isDone = status === 'DONE';
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: COLORS.bg,
        borderRadius: 20,
        padding: 16,
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextWidget style={{ fontSize: 24 }}>🔥</TextWidget>
        <TextWidget style={{ fontSize: 15, color: COLORS.textPrimary, fontWeight: 'bold', marginLeft: 8 }}>
          Streak Reminder
        </TextWidget>
      </FlexWidget>

      {/* Status */}
      <FlexWidget>
        <TextWidget style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1 }}>
          TODAY'S STATUS
        </TextWidget>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <TextWidget style={{ fontSize: 12, color: isDone ? COLORS.done : COLORS.notSent }}>
            {isDone ? '● ' : '○ '}
          </TextWidget>
          <TextWidget style={{ fontSize: 16, color: isDone ? COLORS.done : COLORS.notSent, fontWeight: 'bold' }}>
            {isDone ? 'Done' : 'Not Sent'}
          </TextWidget>
        </FlexWidget>
      </FlexWidget>

      {/* Footer */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <FlexWidget>
          <TextWidget style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 0.8 }}>REMINDER</TextWidget>
          <TextWidget style={{ fontSize: 14, color: COLORS.primary, fontWeight: 'bold', marginTop: 2 }}>
            {formatTimeWidget(time)}
          </TextWidget>
        </FlexWidget>
        <TextWidget style={{ fontSize: 10, color: COLORS.muted }}>Tap to open</TextWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

/** Large Widget (4x4) */
export function LargeStreakWidget({ status, time, lastSent, countdown }) {
  const isDone = status === 'DONE';
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: COLORS.bg,
        borderRadius: 20,
        padding: 18,
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* Header */}
      <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextWidget style={{ fontSize: 24 }}>🔥</TextWidget>
        <TextWidget style={{ fontSize: 16, color: COLORS.textPrimary, fontWeight: 'bold', marginLeft: 8 }}>
          Streak Reminder
        </TextWidget>
      </FlexWidget>

      {/* Status section */}
      <FlexWidget>
        <TextWidget style={{ fontSize: 10, color: COLORS.muted, letterSpacing: 1 }}>TODAY'S STATUS</TextWidget>
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
          <TextWidget style={{ fontSize: 14, color: isDone ? COLORS.done : COLORS.notSent }}>
            {isDone ? '● ' : '○ '}
          </TextWidget>
          <TextWidget style={{ fontSize: 22, color: isDone ? COLORS.done : COLORS.notSent, fontWeight: 'bold' }}>
            {isDone ? 'Done' : 'Not Sent'}
          </TextWidget>
          <TextWidget style={{ fontSize: 18, color: COLORS.primary, fontWeight: 'bold', marginLeft: 12 }}>
            {formatTimeWidget(time)}
          </TextWidget>
        </FlexWidget>
      </FlexWidget>

      {/* Info row */}
      <FlexWidget style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <FlexWidget>
          <TextWidget style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 0.8 }}>LAST COMPLETED</TextWidget>
          <TextWidget style={{ fontSize: 12, color: COLORS.textPrimary, marginTop: 4 }}>
            {lastSent || 'Never'}
          </TextWidget>
        </FlexWidget>
        <FlexWidget>
          <TextWidget style={{ fontSize: 9, color: COLORS.muted, letterSpacing: 0.8 }}>COUNTDOWN</TextWidget>
          <TextWidget style={{ fontSize: 12, color: COLORS.primary, marginTop: 4 }}>
            {isDone ? 'Tomorrow' : (countdown ? `${countdown} Left` : '—')}
          </TextWidget>
        </FlexWidget>
      </FlexWidget>

      {/* Mark as Sent button */}
      <FlexWidget
        style={{
          backgroundColor: isDone ? '#32D74B20' : COLORS.primary,
          borderRadius: 14,
          paddingVertical: 12,
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        clickAction={isDone ? 'OPEN_APP' : 'MARK_SENT'}
      >
        <TextWidget style={{ fontSize: 14, color: isDone ? COLORS.done : '#121212', fontWeight: 'bold' }}>
          {isDone ? '✅ Marked as Sent' : '✓ Mark as Sent'}
        </TextWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
