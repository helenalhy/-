import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import palette from '@/constants/colors';
import { HABIT_ICON_OPTIONS } from '@/constants/habit-icons';
import { WEEKDAY_OPTIONS } from '@/lib/habit-schedule';
import {
  buildHabitProgressPath,
  HABIT_PROGRESS_PATH_ADVANCE_AFTER,
  HABIT_PROGRESS_PATH_MAX_STEP_LENGTH,
  HABIT_PROGRESS_PATH_MAX_STEPS,
  HABIT_PROGRESS_PATH_MIN_STEPS,
  sanitizeHabitProgressSteps,
} from '@/lib/habit-progression';
import { useHabits, type RewardCategory } from '@/context/HabitsContext';
import { useColors } from '@/hooks/useColors';

const options = HABIT_ICON_OPTIONS;

export default function HabitEditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const existing = useMemo(() => habits.find((habit) => habit.id === id), [habits, id]);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [reason, setReason] = useState(existing?.reason ?? '');
  const [stepsDraft, setStepsDraft] = useState(existing?.steps.join('\n') ?? '');
  const [minimumAction, setMinimumAction] = useState(existing?.minimumAction ?? '');
  const [progressPathDraft, setProgressPathDraft] = useState(existing?.progressPath?.steps.join('\n') ?? '');
  const [progressPathEnabled, setProgressPathEnabled] = useState(Boolean(
    existing?.progressPath && existing.progressPath.status !== 'paused',
  ));
  const [restartProgressPath, setRestartProgressPath] = useState(false);
  const [restDays, setRestDays] = useState<number[]>(existing?.restDays ?? []);
  const [selected, setSelected] = useState(() => {
    const found = options.find((option) => option.icon === existing?.icon);
    return found?.icon ?? options[0].icon;
  });
  const [rewardCategory, setRewardCategory] = useState<RewardCategory>(
    existing?.rewardCategory ?? options.find((option) => option.icon === existing?.icon)?.rewardCategory ?? options[0].rewardCategory,
  );
  const [saving, setSaving] = useState(false);
  const selectedOption = options.find((option) => option.icon === selected) ?? options[0];
  const isEditing = Boolean(existing);

  async function save() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      Alert.alert('還差一個小目標', '寫下你想為自己做到的事。');
      return;
    }
    const rawProgressSteps = progressPathDraft.split('\n').map((step) => step.trim()).filter(Boolean);
    if (rawProgressSteps.length > HABIT_PROGRESS_PATH_MAX_STEPS) {
      Alert.alert('升級路線最多五階', '請保留最多五個階段，再儲存。');
      return;
    }
    if (rawProgressSteps.some((step) => step.length > HABIT_PROGRESS_PATH_MAX_STEP_LENGTH)) {
      Alert.alert('階段文字太長', `每階最多 ${HABIT_PROGRESS_PATH_MAX_STEP_LENGTH} 個字，請縮短後再儲存。`);
      return;
    }
    const progressSteps = sanitizeHabitProgressSteps(rawProgressSteps);
    if ((progressPathEnabled || progressSteps.length > 0) && progressSteps.length < HABIT_PROGRESS_PATH_MIN_STEPS) {
      Alert.alert('升級路線至少需要兩階', '每行寫一個逐步增加的行動；不想使用時可以關閉路線或清空內容。');
      return;
    }
    const progressPath = progressSteps.length > 0
      ? buildHabitProgressPath(
        existing?.progressPath,
        progressSteps,
        progressPathEnabled || restartProgressPath,
        restartProgressPath,
      )
      : undefined;
    setSaving(true);
    try {
      if (existing) {
        await updateHabit(existing.id, {
          title: cleanTitle,
          reason: reason.trim() || '一步一步，慢慢累積',
          icon: selectedOption.icon,
          color: selectedOption.color,
          rewardCategory,
          steps: [...new Set(stepsDraft.split('\n').map((step) => step.trim()).filter(Boolean))].slice(0, 5),
          restDays,
          minimumAction: minimumAction.trim(),
          progressPath,
        });
      } else {
        await addHabit({
          title: cleanTitle,
          reason: reason.trim() || '一步一步，慢慢累積',
          icon: selectedOption.icon,
          color: selectedOption.color,
          rewardCategory,
          steps: [...new Set(stepsDraft.split('\n').map((step) => step.trim()).filter(Boolean))].slice(0, 5),
          restDays,
          minimumAction: minimumAction.trim(),
          progressPath,
        });
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert('沒有儲存成功', '請檢查裝置空間後再試一次。');
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete() {
    if (!existing) return;
    Alert.alert('刪除這個目標？', '過去的打卡紀錄也會一起刪除，這個動作無法復原。', [
      { text: '先不要', style: 'cancel' },
      {
        text: '刪除目標',
        style: 'destructive',
        onPress: () => {
          void deleteHabit(existing.id).then(() => router.back()).catch(() => Alert.alert('刪除失敗', '請再試一次。'));
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={{ padding: 22, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 20) + 24 }}
        bottomOffset={70}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={[styles.introIcon, { backgroundColor: selectedOption.color }]}>
            <Feather name={selectedOption.icon} size={24} color={colors.foreground} />
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{isEditing ? '調整你的目標' : '設定一個小目標'}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>從小小的一步開始，讓改變慢慢發生。</Text>
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>你想為自己做到什麼？</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="例如：每天散步 20 分鐘"
          placeholderTextColor={colors.mutedForeground}
          maxLength={48}
          returnKeyType="next"
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          accessibilityLabel="目標名稱"
          testID="habit-title-input"
        />
        <Text style={[styles.label, { color: colors.foreground, marginTop: 19 }]}>為什麼這件事對你重要？</Text>
        <TextInput
          value={reason}
          onChangeText={setReason}
          placeholder="提醒未來的自己，這件事的意義"
          placeholderTextColor={colors.mutedForeground}
          maxLength={90}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.reasonInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          accessibilityLabel="目標的原因"
        />

        <Text style={[styles.label, { color: colors.foreground, marginTop: 19 }]}>拆成今天容易開始的小步驟</Text>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
          每行一項，最多 5 項；完成其中一步即可完成今日目標。
        </Text>
        <TextInput
          value={stepsDraft}
          onChangeText={setStepsDraft}
          placeholder={'例如：\n穿上運動鞋\n走到公園\n散步 20 分鐘'}
          placeholderTextColor={colors.mutedForeground}
          maxLength={250}
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.stepsInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          accessibilityLabel="目標的小步驟，每行一項，最多五項"
          testID="habit-steps-input"
        />

        <Text style={[styles.label, { color: colors.foreground, marginTop: 19 }]}>最小行動（選填）</Text>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
          設定後，今天可以選擇做這個小步驟，或照常完成原目標。
        </Text>
        <TextInput
          value={minimumAction}
          onChangeText={setMinimumAction}
          placeholder="例如：讀 1 頁、先穿上運動鞋"
          placeholderTextColor={colors.mutedForeground}
          maxLength={120}
          style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          accessibilityLabel="可選的最小行動"
          testID="habit-minimum-action-input"
        />
        <Text style={[styles.sectionHint, { color: colors.mutedForeground, marginTop: 7 }]}>
          確認完成最小行動後會記錄為今日完成；同一目標每天仍只領一次金幣。
        </Text>

        <View style={[styles.progressPathCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.progressPathHeader}>
            <View style={[styles.progressPathIcon, { backgroundColor: colors.candyLavender }]}>
              <Feather name="trending-up" size={17} color={colors.primary} />
            </View>
            <View style={styles.progressPathCopy}>
              <Text style={[styles.progressPathTitle, { color: colors.foreground }]}>習慣升級路線（選填）</Text>
              <Text style={[styles.progressPathSubtitle, { color: colors.mutedForeground }]}>
                把大目標拆成 2–5 階，按自己的步調前進。
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => setProgressPathEnabled((enabled) => !enabled)}
            accessibilityRole="button"
            accessibilityLabel={progressPathEnabled ? '暫停習慣升級路線' : '啟用習慣升級路線'}
            accessibilityState={{ selected: progressPathEnabled }}
            testID="toggle-habit-progress-path"
            style={[styles.progressPathToggle, { backgroundColor: progressPathEnabled ? colors.secondary : colors.background, borderColor: colors.border }]}
          >
            <Feather name={progressPathEnabled ? 'check-circle' : 'circle'} size={17} color={colors.primary} />
            <Text style={[styles.progressPathToggleText, { color: colors.primary }]}>
              {progressPathEnabled ? '路線已開啟' : '開啟升級路線'}
            </Text>
          </Pressable>
          <TextInput
            value={progressPathDraft}
            onChangeText={setProgressPathDraft}
            placeholder={'每行一階，例如：\n閱讀 1 頁\n閱讀 5 頁\n閱讀 10 頁'}
            placeholderTextColor={colors.mutedForeground}
            maxLength={620}
            multiline
            textAlignVertical="top"
            style={[styles.input, styles.progressPathInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            accessibilityLabel="習慣升級路線階段，每行一階，最少兩階最多五階"
            testID="habit-progress-path-input"
          />
          <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
            每階完成 5 次後才會詢問是否升級。完成原目標或目前階段的小步都會累積；金幣按現有規則計算。
          </Text>
          <Text style={[styles.progressPathNote, { color: colors.mutedForeground }]}>
            {existing?.progressPath?.status === 'completed'
              ? '這條路線已完成。重新開始會從第一階計算。'
              : existing?.progressPath?.status === 'paused' && !progressPathEnabled
                ? '路線已暫停，現有階段進度會保留。'
                : '原本目標、最小行動和提醒時段都不會被改寫。'}
          </Text>
          {existing?.progressPath?.status === 'completed' ? (
            <Pressable
              onPress={() => {
                setRestartProgressPath(true);
                setProgressPathEnabled(true);
              }}
              accessibilityRole="button"
              testID="restart-habit-progress-path"
              style={[styles.progressPathToggle, { backgroundColor: colors.secondary, borderColor: colors.border }]}
            >
              <Feather name="rotate-ccw" size={15} color={colors.primary} />
              <Text style={[styles.progressPathToggleText, { color: colors.primary }]}>
                {restartProgressPath ? '已選擇重新開始' : '重新開始路線'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[styles.label, { color: colors.foreground, marginTop: 19 }]}>安排每週休息日</Text>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
          休息日不會中斷連續紀錄，也不會出現在今日待辦。
        </Text>
        <View style={styles.weekdayOptions}>
          {WEEKDAY_OPTIONS.map((day) => {
            const selectedDay = restDays.includes(day.value);
            return (
              <Pressable
                key={day.value}
                onPress={() => setRestDays((current) => selectedDay
                  ? current.filter((value) => value !== day.value)
                  : [...current, day.value].sort((a, b) => a - b))}
                style={[
                  styles.weekdayOption,
                  { backgroundColor: selectedDay ? colors.secondary : colors.card, borderColor: selectedDay ? colors.primary : colors.border },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`星期${day.label}${selectedDay ? '，休息日已選取' : '，設定為休息日'}`}
                accessibilityState={{ selected: selectedDay }}
                testID={`rest-day-${day.value}`}
              >
                <Text style={[styles.weekdayText, { color: selectedDay ? colors.primary : colors.mutedForeground }]}>{day.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.foreground, marginTop: 19 }]}>選一個適合的圖示</Text>
        <View style={styles.options}>
          {options.map((option) => {
            const active = option.icon === selected;
            return (
              <View key={option.icon} style={styles.optionCell}>
                <Pressable
                  onPress={() => {
                    setSelected(option.icon);
                    setRewardCategory(option.rewardCategory);
                  }}
                  style={[
                    styles.option,
                    { backgroundColor: option.color, borderColor: active ? colors.primary : 'transparent' },
                    active && styles.optionActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label}圖示`}
                  accessibilityState={{ selected: active }}
                >
                  <Feather name={option.icon as keyof typeof Feather.glyphMap} size={20} color={palette.light.foreground} />
                </Pressable>
                <Text style={[styles.optionLabel, { color: colors.mutedForeground }]}>{option.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.tip, { backgroundColor: colors.secondary }]}>
          <Feather name="gift" size={17} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.foreground }]}>每個目標每日首次完成可得 20 金幣，只用這些金幣兌換商場項目，完全免費。</Text>
        </View>

        <Pressable
          onPress={() => void save()}
          disabled={saving}
          style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          accessibilityRole="button"
          testID="save-habit"
        >
          <Text style={styles.saveText}>{saving ? '儲存中…' : isEditing ? '儲存變更' : '建立我的目標'}</Text>
          <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
        </Pressable>

        {isEditing && (
          <Pressable style={styles.deleteButton} onPress={confirmDelete} accessibilityRole="button" testID="delete-habit">
            <Feather name="trash-2" size={15} color={colors.destructive} />
            <Text style={[styles.deleteText, { color: colors.destructive }]}>刪除這個目標</Text>
          </Pressable>
        )}
      </KeyboardAwareScrollViewCompat>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flex: 1 },
  intro: { alignItems: 'center', paddingTop: 4, paddingBottom: 27 },
  introIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 8, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 9 },
  input: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14 },
  reasonInput: { minHeight: 84 },
  sectionHint: { fontSize: 11, lineHeight: 17, marginTop: -3, marginBottom: 8 },
  stepsInput: { minHeight: 112 },
  progressPathCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginTop: 23, gap: 10 },
  progressPathHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressPathIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  progressPathCopy: { flex: 1, gap: 3 },
  progressPathTitle: { fontSize: 13, fontWeight: '700' },
  progressPathSubtitle: { fontSize: 10, lineHeight: 15 },
  progressPathToggle: { minHeight: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressPathToggleText: { fontSize: 12, fontWeight: '700' },
  progressPathInput: { minHeight: 100 },
  progressPathNote: { fontSize: 10, lineHeight: 15 },
  weekdayOptions: { flexDirection: 'row', justifyContent: 'space-between', gap: 7 },
  weekdayOption: { flex: 1, minHeight: 42, borderWidth: 1.5, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  weekdayText: { fontSize: 13, fontWeight: '700' },
  options: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  optionCell: { width: 58, alignItems: 'center' },
  option: { width: 44, height: 44, borderWidth: 2, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  optionActive: { transform: [{ scale: 1.04 }] },
  optionLabel: { fontSize: 9, marginTop: 4, textAlign: 'center' },
  rewardOptions: { flexDirection: 'row', gap: 8 },
  rewardOption: { flex: 1, borderWidth: 1.5, borderRadius: 14, minHeight: 76, alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  rewardLabel: { fontSize: 11, fontWeight: '700' },
  rewardDetail: { fontSize: 9 },
  tip: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 13, borderRadius: 14, marginTop: 23 },
  tipText: { flex: 1, fontSize: 11, lineHeight: 17 },
  saveButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, minHeight: 51, borderRadius: 16, marginTop: 24 },
  saveText: { color: palette.light.primaryForeground, fontSize: 14, fontWeight: '700' },
  deleteButton: { flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', padding: 14, marginTop: 6 },
  deleteText: { fontSize: 12, fontWeight: '600' },
});
