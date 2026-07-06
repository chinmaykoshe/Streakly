import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ImageBackground, StyleSheet, Dimensions, Modal
} from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn, useSharedValue, withSpring, useAnimatedStyle, withSequence } from 'react-native-reanimated';
import { Settings, Clock, Timer, Check, Bell, Calendar, RefreshCw } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useReminders } from '../../hooks/useReminders';
import { useAppSettings } from '../../hooks/useAppSettings';
import { useCountdown } from '../../hooks/useCountdown';
import { formatTime, formatLastSent, getGreeting } from '../../utils/helpers';
import { COLORS } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ── Custom Elapsed Hook (Counts UP from timestamp) ───────────────────────────
function useElapsed(timestamp) {
  const [label, setLabel] = useState('—');
  useEffect(() => {
    if (!timestamp) {
      setLabel('—');
      return;
    }
    const tick = () => {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      if (diffMs <= 0) {
        setLabel('0s');
        return;
      }
      const totalSec = Math.floor(diffMs / 1000);
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      if (h > 0) setLabel(`${h}h ${m}m`);
      else if (m > 0) setLabel(`${m}m`);
      else setLabel(`${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);
  return label;
}

// ── Custom Repeating Countdown Hook (Counts DOWN to nextReminder) ────────────
function useRepeatingCountdown(nextReminder) {
  const [label, setLabel] = useState('—');
  useEffect(() => {
    if (!nextReminder) {
      setLabel('—');
      return;
    }
    const tick = () => {
      const diffMs = new Date(nextReminder).getTime() - Date.now();
      if (diffMs <= 0) {
        setLabel('Expired');
        return;
      }
      const totalMin = Math.floor(diffMs / 60000);
      if (totalMin > 60) {
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        setLabel(`${h}h ${m}m`);
      } else {
        setLabel(`${totalMin}m`);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextReminder]);
  return label;
}

// ── Context-Aware Mark as Sent Button (Styled matching mockup guidelines) ──────
function MarkSentButton({ onPress, done }) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.93, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
    onPress?.();
  };

  const buttonStyle = [
    styles.markBtn,
    done && { backgroundColor: '#1A1A1A', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1.5, shadowColor: 'transparent' }
  ];

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={buttonStyle}
      >
        <View style={styles.markBtnContent}>
          <Text style={[styles.markBtnMainText, done && { color: COLORS.textPrimary }]}>
            {done ? '↺  Undo Completion' : '✓  Mark as Done'}
          </Text>
          {done && (
            <Text style={[styles.markBtnSubText, { color: COLORS.textSecondary }]}>(Reset today's status)</Text>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Notification Status & Tester Modal ───────────────────────────────────────
function NotificationStatusModal({ visible, onClose, reminders }) {
  const handleTestNotification = async () => {
    try {
      const N = require('../../services/notificationService');
      await N.scheduleSnoozeNotification('test_notif', 'Streakly Test Alert 🔔', 'Vibration, sound, and notification overlays are working!', 0.08); 
      alert('Test alert scheduled! Lock your device or exit the app; it will trigger in 5 seconds.');
    } catch (err) {
      alert('Error triggering test: ' + err.message);
    }
  };

  const scheduledAlarms = reminders.filter(r => r.enabled && (r.reminderType === 'alarm' || r.reminderType === 'repeating'));

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={[styles.modalContent, { maxHeight: '60%', borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notification Status</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={{ color: '#FFF', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSectionLabel}>Active Alarm Schedules</Text>
            {scheduledAlarms.length === 0 ? (
              <Text style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 20, lineHeight: 18 }}>
                No active notification alarms are scheduled. Enable reminders in Settings to configure alerts.
              </Text>
            ) : (
              <View style={[styles.guideCard, { marginBottom: 20 }]}>
                {scheduledAlarms.map((r) => (
                  <Text key={r.id} style={styles.guideStep}>
                    • <Text style={{ fontWeight: 'bold' }}>{r.title}</Text> is active {r.reminderType === 'alarm' ? `at ${formatTime(r.reminderTime)}` : `every ${r.interval}m`}.
                  </Text>
                ))}
              </View>
            )}

            <TouchableOpacity onPress={handleTestNotification} style={styles.markBtn}>
              <View style={styles.markBtnContent}>
                <Text style={styles.markBtnMainText}>🔔 Send Test Notification</Text>
                <Text style={styles.markBtnSubText}>(Triggers in 5 seconds)</Text>
              </View>
            </TouchableOpacity>
            
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Widget Guide Modal Component ──────────────────────────────────────────────
function WidgetGuideModal({ visible, onClose, remindersCount, doneCount }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>App Info & Widget Guide</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Text style={{ color: '#FFF', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView contentContainerStyle={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Stats */}
            <Text style={styles.modalSectionLabel}>Daily Summary</Text>
            <View style={styles.statsCard}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Active Tasks</Text>
                <Text style={styles.statValue}>{remindersCount}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statValue}>{doneCount} / {remindersCount}</Text>
              </View>
            </View>

            {/* Widget Steps */}
            <Text style={styles.modalSectionLabel}>How to Add Home Screen Widget</Text>
            <View style={styles.guideCard}>
              <Text style={styles.guideStep}>
                1. Go to your Android Home Screen.
              </Text>
              <Text style={styles.guideStep}>
                2. <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Long-press</Text> on any empty space.
              </Text>
              <Text style={styles.guideStep}>
                3. Tap <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Widgets</Text> in the pop-up menu.
              </Text>
              <Text style={styles.guideStep}>
                4. Find <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Streak Reminder</Text> in the list.
              </Text>
              <Text style={styles.guideStep}>
                5. Choose a size (Small, Medium, Large) and drag it to your screen.
              </Text>
            </View>
            
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Custom Card Sub-component for Dashboard sections ─────────────────────────
function ReminderItemRow({ reminder, onToggle }) {
  const isDone = reminder.status === 'DONE';
  const elapsed = useElapsed(reminder.lastCompleted);
  const remaining = useRepeatingCountdown(reminder.nextReminder);

  let detailText = '';
  if (reminder.reminderType === 'activity') {
    detailText = isDone ? `Last Sent: ${elapsed} ago` : 'Status: Pending';
  } else if (reminder.reminderType === 'alarm') {
    detailText = `Alarm: ${formatTime(reminder.reminderTime || '09:00')}`;
  } else if (reminder.reminderType === 'repeating') {
    detailText = isDone ? `Next in: ${remaining}` : 'Interval Alert pending';
  }

  return (
    <Animated.View entering={FadeInDown.duration(400)} style={styles.miniCard}>
      <Text style={{ fontSize: 26 }}>{reminder.emoji}</Text>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.miniCardTitle}>{reminder.title}</Text>
        <Text style={[styles.miniCardStatus, { color: isDone ? COLORS.done : COLORS.textSecondary }]}>
          {isDone ? '✅ Done' : '⭕ Pending'} · {detailText}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => onToggle(reminder.id)}
        style={[styles.miniMarkBtn, isDone && { backgroundColor: COLORS.done + '20' }]}
      >
        <Text style={{ fontSize: 16 }}>{isDone ? '✅' : '✓'}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { reminders, loading, reload, markAsSent } = useReminders();
  const { bgImage } = useAppSettings();
  const [showGuide, setShowGuide] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Default primary activity reminder (Snapchat Streak) for the main top card
  const primaryStreak = reminders.find(r => r.id === 'streak_default') || reminders[0];
  const isStreakDone = primaryStreak?.status === 'DONE';
  
  // Custom Elapsed Count-Up for Streak
  const streakElapsed = useElapsed(primaryStreak?.lastCompleted);
  const streakLastSentLabel = primaryStreak?.lastCompleted 
    ? new Date(primaryStreak.lastCompleted).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Never';

  // Dynamic 6-Hour Countdown for Streak
  const countdownTarget = isStreakDone && primaryStreak?.lastCompleted
    ? new Date(new Date(primaryStreak.lastCompleted).getTime() + (primaryStreak.maxDuration || 6 * 3600) * 1000)
    : null;
  const countdown = useCountdown(countdownTarget);

  // Heat Indicator calculations for the dynamic progress ring
  const getProgressColorAndPct = () => {
    if (!isStreakDone || !primaryStreak?.lastCompleted) return { color: COLORS.notSent, pct: 1 };
    const elapsed = Date.now() - new Date(primaryStreak.lastCompleted).getTime();
    const total = (primaryStreak.maxDuration || 6 * 3600) * 1000;
    const pct = Math.max(0, Math.min(1, elapsed / total));
    
    let color = COLORS.done; // Green
    if (pct >= 0.8) {
      color = COLORS.notSent; // Red
    } else if (pct >= 0.5) {
      color = '#FF8A00'; // Orange
    }
    return { color, pct };
  };
  const { color: progressColor, pct: progressPct } = getProgressColorAndPct();

  const greeting = getGreeting();
  const doneCount = reminders.filter((r) => r.status === 'DONE').length;

  // Grouping by Type
  const activities = reminders.filter(r => r.reminderType === 'activity');
  const alarms = reminders.filter(r => r.reminderType === 'alarm');
  const repeatings = reminders.filter(r => r.reminderType === 'repeating');

  // Dynamic Reset Card computations
  const getResetBoxDetails = () => {
    if (!primaryStreak) return { label: 'Streak Reset', val: 'Tomorrow', sub: '12:00 AM', color: '#00B0FF' };
    
    if (primaryStreak.reminderType === 'activity') {
      if (primaryStreak.status === 'DONE' && primaryStreak.lastCompleted) {
        const expiryTime = new Date(new Date(primaryStreak.lastCompleted).getTime() + (primaryStreak.maxDuration || 6 * 3600) * 1000);
        const timeString = expiryTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = expiryTime.toDateString() === new Date().toDateString() ? 'Today' : 'Tomorrow';
        return {
          label: 'Next Expiry',
          val: dateString,
          sub: timeString,
          color: '#FF8A00',
        };
      }
      return { label: 'Next Expiry', val: '—', sub: 'Expired', color: COLORS.notSent };
    }
    
    else if (primaryStreak.reminderType === 'repeating') {
      if (primaryStreak.status === 'DONE' && primaryStreak.nextReminder) {
        const nextTime = new Date(primaryStreak.nextReminder);
        const timeString = nextTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return {
          label: 'Next Alert',
          val: 'Repeating',
          sub: timeString,
          color: '#00E676',
        };
      }
      return { label: 'Next Alert', val: '—', sub: 'Pending', color: COLORS.notSent };
    }
    
    else { // alarm
      return {
        label: 'Streak Reset',
        val: 'Tomorrow',
        sub: '12:00 AM',
        color: '#00B0FF',
      };
    }
  };
  const resetBox = getResetBoxDetails();

  const content = (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowGuide(true)} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowNotifModal(true)} style={styles.bellBtn} activeOpacity={0.7}>
          <Bell color={COLORS.textSecondary} size={20} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      {/* Brand Header */}
      <View style={styles.brandHeader}>
        <View style={[styles.flameContainer, { borderColor: progressColor, shadowColor: progressColor }]}>
          <Text style={styles.largeFlame}>🔥</Text>
          <View style={[styles.flameGlow, { backgroundColor: progressColor + '1C' }]} />
        </View>
        <Text style={styles.brandTitle}>Streak Reminder</Text>
        <Text style={styles.brandSubtitle}>
          {greeting}, Chinmay! 👋
        </Text>
      </View>

      {/* Main Flagship Activity Status Card (Snapchat) */}
      {loading ? (
        <View style={[styles.statusCard, { height: 220, justifyContent: 'center' }]}>
          <Text style={{ color: COLORS.textMuted, textAlign: 'center' }}>Loading…</Text>
        </View>
      ) : primaryStreak ? (
        <>
          <Animated.View entering={FadeInDown.delay(80).duration(450)} style={styles.statusCard}>
            <View
              style={[
                styles.cardGlow,
                { backgroundColor: isStreakDone ? COLORS.done + '03' : COLORS.notSent + '03' },
              ]}
            />

            <Text style={styles.cardSectionLabel}>Snapchat Streak Status</Text>

            {/* Big status row */}
            <Animated.View entering={ZoomIn.delay(150).duration(400)} style={styles.statusMainRow}>
              <View
                style={[
                  styles.statusCircle,
                  { backgroundColor: isStreakDone ? COLORS.done : 'transparent', borderColor: isStreakDone ? COLORS.done : COLORS.notSent, borderWidth: isStreakDone ? 0 : 2.5 },
                ]}
              >
                {isStreakDone ? (
                  <Text style={styles.checkmarkIcon}>✓</Text>
                ) : (
                  <View style={styles.innerAlertDot} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusTextText, { color: isStreakDone ? COLORS.done : COLORS.notSent }]}>
                  {isStreakDone ? 'Done' : 'Not Sent'}
                </Text>
                {isStreakDone ? (
                  <Text style={styles.statusMutedText} numberOfLines={1}>
                    Expires in {countdown || '—'} ⏳
                  </Text>
                ) : (
                  <Text style={styles.statusMutedText} numberOfLines={1}>
                    Streak at risk! Send now! ⚠️
                  </Text>
                )}
              </View>
            </Animated.View>

            <View style={styles.cardDivider} />

            {/* Columns showing count-up stats */}
            <View style={styles.cardColumns}>
              <View style={styles.cardCol}>
                <Text style={styles.colLabel}>Last Sent</Text>
                <View style={styles.colValueRow}>
                  <Clock color={COLORS.primary} size={16} />
                  <Text style={styles.colValue}>{streakLastSentLabel}</Text>
                </View>
              </View>

              <View style={styles.colDivider} />

              <View style={styles.cardCol}>
                <Text style={styles.colLabel}>Time Since Sent</Text>
                <View style={styles.colValueRow}>
                  <Timer color={COLORS.purple} size={16} />
                  <Text style={styles.colValue}>{streakElapsed}</Text>
                </View>
                <Text style={styles.colSubLabel}>
                  {isStreakDone ? 'Active' : 'Expired'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Action button for flagship streak */}
          <View style={{ marginBottom: 28 }}>
            <MarkSentButton 
              done={isStreakDone} 
              onPress={() => markAsSent(primaryStreak.id)} 
            />
          </View>
        </>
      ) : null}

      {/* Group 1: Activity Reminders */}
      {activities.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Activity (Dynamic Countdown)</Text>
          {activities.map((r) => (
            <ReminderItemRow key={r.id} reminder={r} onToggle={markAsSent} />
          ))}
        </View>
      )}

      {/* Group 2: Alarm Reminders */}
      {alarms.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Alarms (Fixed Time)</Text>
          {alarms.map((r) => (
            <ReminderItemRow key={r.id} reminder={r} onToggle={markAsSent} />
          ))}
        </View>
      )}

      {/* Group 3: Repeating Reminders */}
      {repeatings.length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.sectionTitle}>Repeating (Intervals)</Text>
          {repeatings.map((r) => (
            <ReminderItemRow key={r.id} reminder={r} onToggle={markAsSent} />
          ))}
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );

  if (bgImage) {
    return (
      <ImageBackground source={{ uri: bgImage }} style={{ flex: 1 }} blurRadius={12}>
        <View style={styles.bgOverlay} />
        {content}
        <WidgetGuideModal
          visible={showGuide}
          onClose={() => setShowGuide(false)}
          remindersCount={reminders.length}
          doneCount={doneCount}
        />
        <NotificationStatusModal
          visible={showNotifModal}
          onClose={() => setShowNotifModal(false)}
          reminders={reminders}
        />
      </ImageBackground>
    );
  }

  return (
    <View style={styles.root}>
      {content}
      <WidgetGuideModal
        visible={showGuide}
        onClose={() => setShowGuide(false)}
        remindersCount={reminders.length}
        doneCount={doneCount}
      />
      <NotificationStatusModal
        visible={showNotifModal}
        onClose={() => setShowNotifModal(false)}
        reminders={reminders}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 24 },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  menuBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    color: COLORS.textSecondary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  bellBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#FF8A00',
  },

  // Centered Brand Header
  brandHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  flameContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 3.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  largeFlame: {
    fontSize: 36,
    zIndex: 2,
  },
  flameGlow: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    zIndex: 1,
  },
  brandTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    fontWeight: '600',
  },

  // Main status card
  statusCard: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardSectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 16,
    opacity: 0.8,
  },
  
  // Status layout inside card
  statusMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  statusCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  checkmarkIcon: {
    color: '#000000',
    fontSize: 22,
    fontWeight: '900',
  },
  innerAlertDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.notSent,
  },
  statusTextText: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statusMutedText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },

  // Card columns
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.cardBorder,
    marginVertical: 18,
    opacity: 0.8,
  },
  cardColumns: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  cardCol: {
    flex: 1,
    alignItems: 'center',
  },
  colDivider: {
    width: 1,
    height: 38,
    backgroundColor: COLORS.cardBorder,
    opacity: 0.8,
  },
  colLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    opacity: 0.7,
  },
  colValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colValue: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  colSubLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontWeight: '500',
    marginTop: 2,
  },

  // Mark as Sent Action Button
  markBtn: {
    backgroundColor: '#FFD700', // Yellow
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    width: '100%',
  },
  markBtnContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markBtnMainText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  markBtnSubText: {
    color: 'rgba(0,0,0,0.65)',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },

  // Section title
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginTop: 16,
  },

  // Mini card for extra reminders
  miniCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  miniCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  miniCardStatus: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  miniMarkBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryDim,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modal styling
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalSectionLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 12,
    marginTop: 10,
  },
  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginBottom: 4,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.cardBorder,
  },
  guideCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  guideStep: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
});
