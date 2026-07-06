import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Switch, TextInput, Image, Alert, Platform
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import { Bell, Image as ImageIcon, Clock, Vibrate, Volume2, X, Plus } from 'lucide-react-native';
import { useReminders } from '../../hooks/useReminders';
import { useAppSettings } from '../../hooks/useAppSettings';
import { formatTime } from '../../utils/helpers';
import { COLORS } from '../../constants/theme';
import { AddReminderModal } from '../../components/AddReminderModal';

// ── Setting Row Sub-component ────────────────────────────────────────────────
function SettingRow({ label, subtitle, leftIcon, right, onPress, noBorder }) {
  const inner = (
    <View style={[styles.settingRow, noBorder && { borderBottomWidth: 0 }]}>
      {leftIcon && <View style={styles.iconBox}>{leftIcon}</View>}
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={{ marginLeft: 8 }}>{right}</View>
    </View>
  );
  return onPress
    ? <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>
    : inner;
}

const SNOOZE_OPTS = [5, 10, 30];

export default function SettingsScreen() {
  const { reminders, removeReminder, toggleReminder, updateReminder, addReminder } = useReminders();
  const { bgImage, settings, updateBgImage, removeBgImage, updateSetting } = useAppSettings();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);

  // Default flagship reminder (Streak)
  const streak = reminders.find(r => r.id === 'streak_default') || reminders[0];
  const [notifTitle, setNotifTitle] = useState(streak?.title || 'Snapchat Streak');
  const [notifMessage, setNotifMessage] = useState(streak?.message || "Time to send streaks!");

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) await updateBgImage(result.assets[0].uri);
  };

  const confirmDelete = (id, title) => {
    Alert.alert(`Delete "${title}"?`, 'This will cancel its configuration and schedules.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeReminder(id) },
    ]);
  };

  const saveNotifSettings = () => {
    if (streak) {
      updateReminder(streak.id, { title: notifTitle, message: notifMessage });
    }
  };

  const openAddModal = () => {
    setEditingReminder(null);
    setShowAddModal(true);
  };

  const openEditModal = (r) => {
    setEditingReminder(r);
    setShowAddModal(true);
  };

  const handleSaveReminder = (data) => {
    if (editingReminder) {
      updateReminder(editingReminder.id, data);
    } else {
      addReminder(data);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

        {/* ── FLAGSHIP REMINDER SETTINGS ── */}
        <Animated.View entering={FadeInDown.delay(0).duration(350)}>
          <Text style={styles.sectionLabel}>Streak Reminder Config</Text>
          <View style={styles.card}>
            <SettingRow
              leftIcon={<Bell color={COLORS.primary} size={17} />}
              label="Enable Streak Tracking"
              right={
                <Switch
                  value={streak?.enabled ?? true}
                  onValueChange={() => streak && toggleReminder(streak.id)}
                  trackColor={{ false: '#333', true: COLORS.primary + '80' }}
                  thumbColor={streak?.enabled ? COLORS.primary : '#666'}
                />
              }
            />
            {streak && streak.reminderType === 'activity' ? (
              <SettingRow
                leftIcon={<Clock color={COLORS.purple} size={17} />}
                label="Expiration Window"
                subtitle={`${Math.floor((streak.maxDuration || 6 * 3600) / 3600)} Hours`}
                onPress={() => openEditModal(streak)}
                right={<Text style={styles.chevron}>›</Text>}
                noBorder
              />
            ) : (
              <SettingRow
                leftIcon={<Clock color={COLORS.purple} size={17} />}
                label="Reminder Time"
                subtitle={streak ? formatTime(streak.reminderTime || '09:00') : '9:00 PM'}
                onPress={() => streak && openEditModal(streak)}
                right={<Text style={styles.chevron}>›</Text>}
                noBorder
              />
            )}
          </View>
        </Animated.View>

        {/* ── NOTIFICATIONS & TEXTS (For non-activities or alarm types) ── */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)}>
          <Text style={styles.sectionLabel}>Notification Details</Text>
          <View style={styles.card}>
            <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.settingLabel}>Title</Text>
              <TextInput
                value={notifTitle}
                onChangeText={setNotifTitle}
                onBlur={saveNotifSettings}
                style={styles.inlineInput}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={[styles.settingRow, { flexDirection: 'column', alignItems: 'flex-start' }]}>
              <Text style={styles.settingLabel}>Message / Alert</Text>
              <TextInput
                value={notifMessage}
                onChangeText={setNotifMessage}
                onBlur={saveNotifSettings}
                style={styles.inlineInput}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <SettingRow
              leftIcon={<Vibrate color={COLORS.primary} size={17} />}
              label="Vibration Alert"
              right={
                <Switch
                  value={settings.vibration}
                  onValueChange={(v) => updateSetting('vibration', v)}
                  trackColor={{ false: '#333', true: COLORS.primary + '80' }}
                  thumbColor={settings.vibration ? COLORS.primary : '#666'}
                />
              }
            />
            <SettingRow
              leftIcon={<Volume2 color={COLORS.orange} size={17} />}
              label="Notification Sound"
              subtitle="Default"
              right={<Text style={styles.chevron}>›</Text>}
              noBorder
            />
          </View>
        </Animated.View>

        {/* ── SNOOZE OPTIONS ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(350)}>
          <Text style={styles.sectionLabel}>Snooze Options</Text>
          <View style={styles.card}>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <Text style={[styles.settingLabel, { flex: 1 }]}>Snooze Duration</Text>
              <View style={styles.snoozeRow}>
                {SNOOZE_OPTS.map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => updateSetting('snoozeMinutes', m)}
                    style={[
                      styles.snoozeChip,
                      settings.snoozeMinutes === m && styles.snoozeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.snoozeText,
                        settings.snoozeMinutes === m && styles.snoozeTextActive,
                      ]}
                    >
                      {m} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── CUSTOM BACKGROUND ── */}
        <Animated.View entering={FadeInDown.delay(140).duration(350)}>
          <Text style={styles.sectionLabel}>Custom Background</Text>
          <View style={styles.card}>
            {bgImage && (
              <View style={styles.bgPreviewWrap}>
                <Image source={{ uri: bgImage }} style={styles.bgPreview} />
                <TouchableOpacity onPress={removeBgImage} style={styles.bgRemove}>
                  <X color="#FFF" size={16} />
                </TouchableOpacity>
              </View>
            )}
            <SettingRow
              leftIcon={<ImageIcon color="#00BCD4" size={17} />}
              label={bgImage ? 'Change Background' : 'Set Background Image'}
              subtitle="Pick from your gallery"
              onPress={pickImage}
              right={<Text style={{ color: '#00BCD4', fontSize: 14 }}>Pick →</Text>}
              noBorder={!bgImage}
            />
          </View>
        </Animated.View>

        {/* ── CUSTOM REMINDERS LIST ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(350)}>
          <Text style={styles.sectionLabel}>Manage Reminders</Text>
          <View style={styles.card}>
            {reminders.slice(1).map((r, i) => {
              const formatSubtitle = () => {
                if (r.reminderType === 'activity') {
                  return `${Math.floor((r.maxDuration || 6 * 3600) / 3600)}h expiration`;
                } else if (r.reminderType === 'alarm') {
                  return formatTime(r.reminderTime || '09:00');
                } else {
                  return `Every ${r.interval || 60}m`;
                }
              };

              return (
                <React.Fragment key={r.id}>
                  <View style={styles.reminderManageRow}>
                    <TouchableOpacity onPress={() => openEditModal(r)} style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.settingLabel}>{r.title}</Text>
                        <Text style={styles.settingSubtitle}>{formatSubtitle()}</Text>
                      </View>
                    </TouchableOpacity>
                    <Switch
                      value={r.enabled}
                      onValueChange={() => toggleReminder(r.id)}
                      trackColor={{ false: '#333', true: (r.color || COLORS.primary) + '80' }}
                      thumbColor={r.enabled ? (r.color || COLORS.primary) : '#666'}
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                    <TouchableOpacity onPress={() => confirmDelete(r.id, r.title)} style={{ padding: 6, marginLeft: 4 }}>
                      <X color={COLORS.notSent} size={18} />
                    </TouchableOpacity>
                  </View>
                  {i < reminders.length - 2 && <View style={styles.divider} />}
                </React.Fragment>
              );
            })}
            
            <TouchableOpacity onPress={openAddModal} style={styles.addReminderBtn}>
              <Plus color={COLORS.primary} size={18} />
              <Text style={styles.addReminderText}>Add Custom Reminder</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>

      <AddReminderModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleSaveReminder}
        reminder={editingReminder}
      />
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
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.1,
    marginBottom: 8,
    marginLeft: 4,
    marginTop: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },
  divider: { height: 1, backgroundColor: COLORS.cardBorder, marginHorizontal: 16 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingLabel: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  settingSubtitle: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  chevron: { color: COLORS.textMuted, fontSize: 20 },
  inlineInput: {
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.cardBorder,
    width: '100%',
    marginTop: 4,
  },
  snoozeRow: { flexDirection: 'row', gap: 8 },
  snoozeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  snoozeChipActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  snoozeText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  snoozeTextActive: { color: '#000000', fontWeight: '800' },
  bgPreviewWrap: { position: 'relative', height: 130 },
  bgPreview: { width: '100%', height: '100%' },
  bgRemove: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 14,
    padding: 6,
  },
  reminderManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  addReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.cardBorder,
  },
  addReminderText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
