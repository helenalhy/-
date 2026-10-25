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
import { useHabits, type RewardCategory } from '@/context/HabitsContext';
import { useColors } from '@/hooks/useColors';

const options = [
  { icon: 'activity', color: palette.light.candyMint, label: '身體' },
  { icon: 'book-open', color: palette.light.candyLavender, label: '學習' },
  { icon: 'heart', color: palette.light.candyPink, label: '心情' },
  { icon: 'coffee', color: palette.light.candyPeach, label: '生活' },
  { icon: 'target', color: palette.light.candySky, label: '目標' },
] as const;

export default function HabitEditorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { habits, addHabit, updateHabit, deleteHabit } = useHabits();
  const existing = useMemo(() => habits.find((habit) => habit.id === id), [habits, id]);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [reason, setReason] = useState(existing?.reason ?? '');
  const [selected, setSelected] = useState(() => {
    const found = options.find((option) => option.icon === existing?.icon);
    return found?.icon ?? options[0].icon;
  });
  const [rewardCategory, setRewardCategory] = useState<RewardCategory>(
    existing?.rewardCategory ?? (existing?.icon === 'activity' || existing?.icon === 'target' ? 'facility' : existing?.icon === 'book-open' || existing?.icon === 'coffee' ? 'shop' : existing ? 'decor' : 'facility'),
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
    setSaving(true);
    try {
      if (existing) {
        await updateHabit(existing.id, { title: cleanTitle, reason: reason.trim() || '一步一步，慢慢累積', icon: selectedOption.icon, color: selectedOption.color, rewardCategory });
      } else {
        await addHabit({ title: cleanTitle, reason: reason.trim() || '一步一步，慢慢累積', icon: selectedOption.icon, color: selectedOption.color, rewardCategory });
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

        <Text style={[styles.label, { color: colors.foreground, marginTop: 19 }]}>選一個適合的圖示</Text>
        <View style={styles.options}>
          {options.map((option) => {
            const active = option.icon === selected;
            return (
              <Pressable
                key={option.icon}
                onPress={() => {
                  setSelected(option.icon);
                  if (option.icon === 'activity' || option.icon === 'target') setRewardCategory('facility');
                  else if (option.icon === 'book-open' || option.icon === 'coffee') setRewardCategory('shop');
                  else setRewardCategory('decor');
                }}
                style={[
                  styles.option,
                  { backgroundColor: option.color, borderColor: active ? colors.primary : 'transparent' },
                  active && styles.optionActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: active }}
              >
                <Feather name={option.icon} size={20} color={colors.foreground} />
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, { color: colors.foreground, marginTop: 19 }]}>完成後獲得的獎勵</Text>
        <View style={styles.rewardOptions}>
          {([
            { id: 'facility' as const, label: '設施券', detail: '公園與設施', icon: 'map-pin', color: palette.light.candyMint },
            { id: 'shop' as const, label: '店鋪券', detail: '新店開張', icon: 'shopping-bag', color: palette.light.candyLemon },
            { id: 'decor' as const, label: '裝飾星', detail: '布置街區', icon: 'star', color: palette.light.candyPink },
          ]).map((reward) => {
            const active = rewardCategory === reward.id;
            return (
              <Pressable
                key={reward.id}
                onPress={() => setRewardCategory(reward.id)}
                style={[
                  styles.rewardOption,
                  { backgroundColor: active ? reward.color : colors.card, borderColor: active ? colors.primary : colors.border },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={reward.label}
              >
                <Feather name={reward.icon as keyof typeof Feather.glyphMap} size={16} color={colors.foreground} />
                <Text style={[styles.rewardLabel, { color: colors.foreground }]}>{reward.label}</Text>
                <Text style={[styles.rewardDetail, { color: colors.mutedForeground }]}>{reward.detail}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.tip, { backgroundColor: colors.secondary }]}>
          <Feather name="gift" size={17} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.foreground }]}>每個目標首次完成可得 20 金幣，並領取 1 個對應類型獎勵。</Text>
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
  options: { flexDirection: 'row', gap: 11 },
  option: { width: 48, height: 48, borderWidth: 2, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  optionActive: { transform: [{ scale: 1.04 }] },
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
