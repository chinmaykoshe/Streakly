import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getGreeting } from '../utils/helpers';

/**
 * Animated greeting header shown at the top of the Home Screen.
 * Shows greeting text, date, and a summary of pending reminders.
 */
export function HomeHeader({ total = 0, done = 0 }) {
  const greeting = getGreeting();
  const pending = total - done;
  const allDone = total > 0 && done === total;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Animated.View entering={FadeIn.duration(600)} style={styles.container}>
      <View style={styles.row}>
        <View style={styles.left}>
          <Text style={styles.greeting}>{greeting} 👋</Text>
          <Text style={styles.date}>{today}</Text>
        </View>
        {/* Flame badge */}
        <View style={[styles.badge, allDone && styles.badgeDone]}>
          <Text style={styles.badgeEmoji}>🔥</Text>
          <Text style={[styles.badgeCount, allDone && { color: '#4CAF50' }]}>
            {allDone ? 'All done!' : `${pending} left`}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      {total > 0 && (
        <View style={styles.progressBg}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${Math.round((done / total) * 100)}%`,
                backgroundColor: allDone ? '#4CAF50' : '#FFB000',
              },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  date: {
    color: '#9E9E9E',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '400',
  },
  badge: {
    backgroundColor: 'rgba(255,176,0,0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,176,0,0.25)',
  },
  badgeDone: {
    backgroundColor: 'rgba(76,175,80,0.12)',
    borderColor: 'rgba(76,175,80,0.25)',
  },
  badgeEmoji: {
    fontSize: 22,
  },
  badgeCount: {
    color: '#FFB000',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  progressBg: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
