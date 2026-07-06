import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { getHistory } from '../../storage/asyncStorage';
import { COLORS } from '../../constants/theme';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES = ['M','T','W','T','F','S','S'];

function buildCalendar(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // Shift so Monday=0
  const offset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];
  for (let i = 0; i < offset; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) grid.push(d);
  return grid;
}

export default function HistoryScreen() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [historyMap, setHistoryMap] = useState({}); // { 'YYYY-MM-DD': [ { time, title, emoji } ] }

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const list = await getHistory();
    const map = {};
    list.forEach((entry) => {
      if (!entry.timestamp) return;
      const d = new Date(entry.timestamp);
      const key = d.toISOString().split('T')[0];
      if (!map[key]) map[key] = [];
      map[key].push({
        time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        title: entry.title,
        emoji: entry.emoji,
      });
    });
    setHistoryMap(map);
  };

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const grid = buildCalendar(year, month);
  const todayKey = now.toISOString().split('T')[0];

  // Sort dates descending for the list
  const historyList = Object.entries(historyMap)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 30);

  function dayKey(d) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  function formatDateLabel(key) {
    const d = new Date(key + 'T12:00:00');
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
    if (key === today) return 'Today';
    if (key === yesterday) return 'Yesterday';
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return d.toLocaleDateString('en-US', options);
  }

  return (
    <View style={styles.root}>
      {/* Header matching index.tsx */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>History</Text>
        <Calendar color={COLORS.primary} size={22} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── Calendar ── */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.calCard}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <ChevronLeft color={COLORS.textSecondary} size={20} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{MONTH_NAMES[month]} {year}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <ChevronRight color={COLORS.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {DAY_NAMES.map((d, i) => (
              <Text key={i} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {grid.map((day, i) => {
              if (!day) return <View key={`empty-${i}`} style={styles.gridCell} />;
              const key = dayKey(day);
              const dayEntries = historyMap[key] || [];
              const hasDone = dayEntries.length > 0;
              const isToday = key === todayKey;
              return (
                <View key={key} style={styles.gridCell}>
                  <View
                    style={[
                      styles.dayCircle,
                      isToday && styles.todayCircle,
                      hasDone && !isToday && styles.doneDayCircle,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNum,
                        isToday && { color: '#000000', fontWeight: '800' },
                        hasDone && !isToday && { color: COLORS.done, fontWeight: '700' },
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                  {hasDone && <View style={styles.dotIndicator} />}
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── Completion Log list ── */}
        <Text style={styles.sectionTitle}>Completion Log</Text>

        {historyList.length === 0 ? (
          <Animated.View entering={FadeInDown.delay(100)} style={styles.emptyCard}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📭</Text>
            <Text style={{ color: COLORS.textSecondary, fontSize: 16, fontWeight: '600' }}>No history recorded</Text>
            <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              Mark your streaks or other reminders as sent to see logs here.
            </Text>
          </Animated.View>
        ) : (
          historyList.map(([key, entries], i) => {
            const isToday = key === todayKey;
            const label = formatDateLabel(key);
            return (
              <Animated.View
                key={key}
                entering={FadeInDown.delay(i * 50).duration(300)}
                style={styles.historyCard}
              >
                <Text style={[styles.historyDateLabel, isToday && { color: COLORS.primary }]}>
                  {label}
                </Text>
                
                <View style={styles.entriesList}>
                  {entries.map((e, j) => (
                    <View key={j} style={styles.entryRow}>
                      <View style={styles.entryLeft}>
                        <Text style={{ fontSize: 18 }}>{e.emoji}</Text>
                        <Text style={styles.entryTitle}>{e.title}</Text>
                      </View>
                      <View style={styles.entryRight}>
                        <Text style={styles.entryTime}>{e.time}</Text>
                        <View style={styles.badgeDone}>
                          <Text style={styles.badgeText}>✓</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' },
  body: { padding: 18 },

  // Calendar container card
  calCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  monthLabel: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  dayHeaders: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  dayHeader: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    width: 32,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  gridCell: {
    width: '14.2%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    backgroundColor: COLORS.primary, // Yellow focus
  },
  doneDayCircle: {
    backgroundColor: COLORS.done + '15',
    borderWidth: 1,
    borderColor: COLORS.done,
  },
  dayNum: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  dotIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.done,
    position: 'absolute',
    bottom: 2,
  },

  // Completion Log title
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Empty placeholder
  emptyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  // Log Cards
  historyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  historyDateLabel: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    paddingBottom: 8,
  },
  entriesList: {
    gap: 12,
  },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  entryTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  entryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryTime: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  badgeDone: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.done + '20',
    borderWidth: 1,
    borderColor: COLORS.done,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.done,
    fontSize: 11,
    fontWeight: '900',
  },
});
