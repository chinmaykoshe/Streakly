import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Clock, Trash2 } from 'lucide-react-native';
import { PrimaryButton } from './PrimaryButton';
import { formatTime, formatLastSent } from '../utils/helpers';
import { useCountdown } from '../hooks/useCountdown';

/**
 * Full reminder card shown on the Home Screen.
 * Shows emoji, title, countdown, last sent, done/not-sent status, action button.
 */
export function ReminderCard({ reminder, onMarkSent, onDelete, onToggle, index = 0 }) {
  const isDone = reminder.status === 'DONE';
  const countdown = useCountdown(isDone ? null : reminder.time);
  const lastSentLabel = formatLastSent(reminder.lastSent);
  const accentColor = reminder.color || '#FFB000';

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)} style={styles.cardWrapper}>
      <View
        style={[
          styles.card,
          isDone && { borderColor: 'rgba(76,175,80,0.25)', borderWidth: 1.5 },
          { shadowColor: accentColor },
        ]}
      >
        {/* ── Accent top strip ── */}
        <View style={[styles.topStrip, { backgroundColor: accentColor + '22' }]} />

        {/* ── Header row ── */}
        <View style={styles.headerRow}>
          {/* Emoji icon */}
          <View style={[styles.emojiBox, { backgroundColor: accentColor + '25' }]}>
            <Text style={styles.emojiText}>{reminder.emoji || '🔔'}</Text>
          </View>

          {/* Title + status */}
          <View style={styles.titleBlock}>
            <Text style={styles.titleText} numberOfLines={1}>{reminder.title}</Text>
            <Text style={[styles.statusText, { color: isDone ? '#4CAF50' : '#9E9E9E' }]}>
              {isDone ? '✅ Done for today' : '⭕ Not sent yet'}
            </Text>
          </View>

          {/* Toggle + delete */}
          <View style={styles.actions}>
            <Switch
              value={reminder.enabled}
              onValueChange={() => onToggle?.(reminder.id)}
              trackColor={{ false: '#333', true: accentColor + '60' }}
              thumbColor={reminder.enabled ? accentColor : '#666'}
              style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
            />
            <TouchableOpacity onPress={() => onDelete?.(reminder.id)} style={styles.deleteBtn}>
              <Trash2 color="#FF5252" size={18} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Meta row ── */}
        <View style={styles.metaRow}>
          {/* Time */}
          <View style={styles.metaItem}>
            <Clock color="#9E9E9E" size={13} />
            <Text style={styles.metaLabel}> Reminder</Text>
            <Text style={[styles.metaValue, { color: accentColor }]}>{formatTime(reminder.time)}</Text>
          </View>

          {/* Countdown */}
          {!isDone && countdown ? (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>⏱ {countdown}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Last sent ── */}
        {lastSentLabel ? (
          <Text style={styles.lastSent}>Last: {lastSentLabel}</Text>
        ) : null}

        {/* ── Action button ── */}
        <View style={{ marginTop: 14 }}>
          <PrimaryButton done={isDone} onPress={() => onMarkSent?.(reminder.id)} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    padding: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  topStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 14,
  },
  emojiBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  emojiText: {
    fontSize: 26,
  },
  titleBlock: {
    flex: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  statusText: {
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },
  actions: {
    alignItems: 'center',
  },
  deleteBtn: {
    marginTop: 8,
    padding: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaLabel: {
    color: '#9E9E9E',
    fontSize: 13,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  countdownBadge: {
    backgroundColor: 'rgba(255,176,0,0.12)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countdownText: {
    color: '#FFB000',
    fontSize: 13,
    fontWeight: '600',
  },
  lastSent: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
});
