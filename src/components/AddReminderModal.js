import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  ScrollView, StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { X, Plus, Check } from 'lucide-react-native';
import { EMOJI_OPTIONS, COLOR_OPTIONS } from '../constants/options';
import { COLORS } from '../constants/theme';

/**
 * Overhauled Modal to support typing: Activity, Alarm, and Repeating.
 * Displays conditional fields depending on type: maxDuration, reminderTime, or interval.
 */
export function AddReminderModal({ visible, onClose, onAdd, reminder }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [reminderType, setReminderType] = useState('alarm'); // activity | alarm | repeating
  const [reminderTime, setReminderTime] = useState('09:00'); // for alarms
  const [maxDurationHours, setMaxDurationHours] = useState('6'); // for activity (6h default)
  const [intervalMinutes, setIntervalMinutes] = useState('60'); // for repeating (60m default)
  const [emoji, setEmoji] = useState('🔔');
  const [color, setColor] = useState('#6C63FF');

  useEffect(() => {
    if (reminder) {
      setTitle(reminder.title || '');
      setMessage(reminder.message || '');
      setReminderType(reminder.reminderType || 'alarm');
      setReminderTime(reminder.reminderTime || '09:00');
      setMaxDurationHours(String(Math.floor((reminder.maxDuration || 6 * 60 * 60) / 3600)));
      setIntervalMinutes(String(reminder.interval || 60));
      setEmoji(reminder.emoji || '🔔');
      setColor(reminder.color || '#6C63FF');
    } else {
      setTitle('');
      setMessage('');
      setReminderType('alarm');
      setReminderTime('09:00');
      setMaxDurationHours('6');
      setIntervalMinutes('60');
      setEmoji('🔔');
      setColor('#6C63FF');
    }
  }, [reminder, visible]);

  const handleSave = () => {
    if (!title.trim()) return;
    
    // Parse duration/interval securely
    const durationSec = Math.max(1, Number(maxDurationHours) || 6) * 60 * 60;
    const intervalMin = Math.max(1, Number(intervalMinutes) || 60);

    onAdd?.({
      title: title.trim(),
      message: message.trim() || `Time for: ${title.trim()}`,
      reminderType,
      reminderTime,
      maxDuration: durationSec,
      interval: intervalMin,
      emoji,
      color
    });
    onClose?.();
  };

  const isEdit = !!reminder;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.root}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Reminder' : 'New Reminder'}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X color="#FFFFFF" size={22} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          
          {/* Reminder Type Selector */}
          <Text style={styles.label}>Reminder Type</Text>
          <View style={styles.typeSelectorRow}>
            {['activity', 'alarm', 'repeating'].map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setReminderType(type)}
                style={[
                  styles.typeChip,
                  reminderType === type && { backgroundColor: color, borderColor: color }
                ]}
              >
                <Text style={[styles.typeChipText, reminderType === type && { color: '#FFF' }]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Emoji Picker */}
          <Text style={styles.label}>Choose Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
            {EMOJI_OPTIONS.map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => setEmoji(e)}
                style={[styles.emojiOption, emoji === e && { borderColor: color, backgroundColor: color + '15' }]}
              >
                <Text style={{ fontSize: 24 }}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Title */}
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            style={styles.input}
            placeholder="e.g. Oats Break, Water, Streak"
            placeholderTextColor="#555"
            returnKeyType="next"
          />

          {/* Conditional Input Fields depending on selected Reminder Type */}
          {reminderType === 'activity' && (
            <>
              <Text style={styles.label}>Expiration Window (Hours)</Text>
              <TextInput
                value={maxDurationHours}
                onChangeText={setMaxDurationHours}
                style={styles.input}
                placeholder="6"
                placeholderTextColor="#555"
                keyboardType="numeric"
              />
            </>
          )}

          {reminderType === 'alarm' && (
            <>
              <Text style={styles.label}>Alarm Time (HH:MM, 24h)</Text>
              <TextInput
                value={reminderTime}
                onChangeText={setReminderTime}
                style={styles.input}
                placeholder="16:00"
                placeholderTextColor="#555"
                keyboardType="numbers-and-punctuation"
              />
            </>
          )}

          {reminderType === 'repeating' && (
            <>
              <Text style={styles.label}>Repeat Interval (Minutes)</Text>
              <TextInput
                value={intervalMinutes}
                onChangeText={setIntervalMinutes}
                style={styles.input}
                placeholder="60"
                placeholderTextColor="#555"
                keyboardType="numeric"
              />
            </>
          )}

          {/* Message (only for Alarms and Repeating reminders) */}
          {reminderType !== 'activity' && (
            <>
              <Text style={styles.label}>Notification Message</Text>
              <TextInput
                value={message}
                onChangeText={setMessage}
                style={[styles.input, { height: 72, textAlignVertical: 'top' }]}
                placeholder="What should the alert notification say?"
                placeholderTextColor="#555"
                multiline
              />
            </>
          )}

          {/* Color Picker */}
          <Text style={styles.label}>Card Accent Color</Text>
          <View style={styles.colorRow}>
            {COLOR_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  color === c && styles.colorDotSelected,
                ]}
              />
            ))}
          </View>

          {/* Save Button */}
          <TouchableOpacity onPress={handleSave} style={[styles.addBtn, { backgroundColor: color }]}>
            {isEdit ? <Check color="#FFF" size={20} /> : <Plus color="#FFF" size={20} />}
            <Text style={styles.addBtnText}>{isEdit ? 'Save Changes' : 'Create Reminder'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800' },
  closeBtn: {
    width: 38, height: 38,
    backgroundColor: COLORS.surface,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { padding: 20 },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.textPrimary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    backgroundColor: COLORS.card,
  },
  typeChipText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  emojiOption: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: COLORS.card,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10, borderWidth: 1.5, borderColor: 'transparent',
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#FFF', transform: [{ scale: 1.2 }] },
  addBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 16, borderRadius: 18, gap: 8,
  },
  addBtnText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
