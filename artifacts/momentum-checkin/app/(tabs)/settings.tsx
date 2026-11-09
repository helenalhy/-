import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/expo';
import { useHabits } from '@/context/HabitsContext';
import { useColors } from '@/hooks/useColors';
import { DEFAULT_REMINDER_SETTINGS, readReminderSettings, type ReminderSettings } from '@/lib/reminder-settings';
import {
  DEFAULT_ENCOURAGEMENT_STYLE,
  ENCOURAGEMENT_STYLES,
  readEncouragementStyle,
  saveEncouragementStyle,
  type EncouragementStyle,
} from '@/lib/daily-personalization';

function SettingsRow({
  icon,
  title,
  subtitle,
  colors,
  onPress,
  testID,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}，${subtitle}`}
      accessibilityHint="開啟相關設定"
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.rowIcon, { backgroundColor: colors.candyPink }]}>
        <Feather name={icon} size={19} color={colors.primary} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const { cloudSyncStatus } = useHabits();
  const [reminderSettings, setReminderSettings] = useState<ReminderSettings>(DEFAULT_REMINDER_SETTINGS);
  const [encouragementStyle, setEncouragementStyle] = useState<EncouragementStyle>(DEFAULT_ENCOURAGEMENT_STYLE);
  const [encouragementError, setEncouragementError] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void readReminderSettings().then((settings) => {
        if (active) setReminderSettings(settings);
      }).catch(() => {
        if (active) setReminderSettings(DEFAULT_REMINDER_SETTINGS);
      });
      void readEncouragementStyle().then((style) => {
        if (active) setEncouragementStyle(style);
      }).catch(() => {
        if (active) setEncouragementStyle(DEFAULT_ENCOURAGEMENT_STYLE);
      });
      return () => { active = false; };
    }, []),
  );

  const syncSummary = cloudSyncStatus === 'synced'
    ? '進度已同步至 Google 帳戶'
    : cloudSyncStatus === 'syncing'
      ? '正在同步進度'
      : cloudSyncStatus === 'error'
        ? '同步暫停，前往進度頁查看'
        : isSignedIn
          ? '正在準備雲端同步'
          : '訪客模式，進度保存在這台裝置';
  const habitReminderCount = Object.values(reminderSettings.habitReminders)
    .filter((times) => times.length > 0).length;
  const reminderSummary = reminderSettings.enabled
    ? `已開啟 · 每日 ${reminderSettings.reminderTimes.join('、')} · ${habitReminderCount} 項習慣提醒`
    : `設定每日時段與 ${habitReminderCount} 項習慣提醒`;

  async function chooseEncouragementStyle(style: EncouragementStyle) {
    const previous = encouragementStyle;
    setEncouragementStyle(style);
    setEncouragementError('');
    try {
      await saveEncouragementStyle(style);
    } catch {
      setEncouragementStyle(previous);
      setEncouragementError('偏好沒有保存成功，請再試一次。');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? 67 : 18,
            paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: colors.primary }]}>MOMENTUM</Text>
        <Text style={[styles.title, { color: colors.foreground }]} accessibilityRole="header">設定</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          管理提醒與進度保存方式。
        </Text>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>日常提醒</Text>
          {Platform.OS === 'web' ? (
            <SettingsRow
              icon="bell"
              title="打卡通知"
              subtitle={reminderSummary}
              colors={colors}
              onPress={() => router.push('/reminders')}
              testID="settings-reminder"
            />
          ) : (
            <View style={[styles.infoCard, { backgroundColor: colors.secondary }]}>
              <View style={[styles.rowIcon, { backgroundColor: colors.candyPink }]}>
                <Feather name="bell" size={19} color={colors.primary} />
              </View>
              <View style={styles.rowCopy}>
                <Text style={[styles.rowTitle, { color: colors.foreground }]}>手機網頁通知</Text>
                <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>
                  請在手機瀏覽器網頁版設定每日打卡提醒。
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>鼓勵方式</Text>
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
            選擇狗狗和今天頁面使用的鼓勵語氣。
          </Text>
          <View style={styles.encouragementOptions}>
            {ENCOURAGEMENT_STYLES.map((option) => {
              const selected = encouragementStyle === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => void chooseEncouragementStyle(option.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${option.label}：${option.description}`}
                  testID={`encouragement-style-${option.id}`}
                  style={({ pressed }) => [
                    styles.encouragementOption,
                    {
                      backgroundColor: selected ? colors.candyPink : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View style={styles.encouragementOptionTitle}>
                    <Text style={[styles.rowTitle, { color: selected ? colors.primary : colors.foreground }]}>{option.label}</Text>
                    {selected ? <Feather name="check-circle" size={16} color={colors.primary} /> : null}
                  </View>
                  <Text style={[styles.rowSubtitle, { color: colors.mutedForeground }]}>{option.description}</Text>
                </Pressable>
              );
            })}
          </View>
          {encouragementError ? (
            <Text style={[styles.sectionNote, { color: colors.destructive }]} accessibilityRole="alert">{encouragementError}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>帳戶與資料</Text>
          <SettingsRow
            icon={isSignedIn ? 'cloud' : 'user'}
            title={isSignedIn ? 'Google 帳戶' : '訪客模式'}
            subtitle={syncSummary}
            colors={colors}
            onPress={() => router.navigate('/progress')}
            testID="settings-account"
          />
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>
            登入與登出、雲端同步狀態及重試功能都在「進度」頁管理。
          </Text>
        </View>

        <View style={[styles.aboutCard, { backgroundColor: colors.primary }]}>
          <View style={[styles.aboutIcon, { backgroundColor: colors.candyLemon }]}>
            <Feather name="shopping-bag" size={18} color={colors.primary} />
          </View>
          <Text style={[styles.aboutTitle, { color: colors.primaryForeground }]}>Momentum 我的商場</Text>
          <Text style={[styles.aboutSubtitle, { color: colors.primaryForeground, opacity: 0.82 }]}>
            每天完成一小步，一起打造喜歡的商場。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 21 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2.1 },
  title: { fontSize: 28, fontWeight: '700', marginTop: 9 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 7 },
  section: { marginTop: 28, gap: 11 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 1 },
  row: { minHeight: 80, borderWidth: 1, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 14, fontWeight: '700' },
  rowSubtitle: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  pressed: { opacity: 0.78 },
  sectionNote: { fontSize: 11, lineHeight: 17, paddingHorizontal: 3 },
  infoCard: { borderRadius: 19, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  encouragementOptions: { gap: 9 },
  encouragementOption: { minHeight: 70, borderWidth: 1, borderRadius: 17, padding: 13, justifyContent: 'center' },
  encouragementOptionTitle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aboutCard: { marginTop: 30, borderRadius: 22, padding: 19, alignItems: 'center' },
  aboutIcon: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  aboutTitle: { fontSize: 15, fontWeight: '700' },
  aboutSubtitle: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
});
