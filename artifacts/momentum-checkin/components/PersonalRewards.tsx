import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import {
  getDailyPersonalReward,
  MAX_PERSONAL_REWARDS,
  readPersonalRewards,
  savePersonalRewards,
} from '@/lib/personal-rewards';

export function PersonalRewardsSettings() {
  const colors = useColors();
  const [rewards, setRewards] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void readPersonalRewards().then((saved) => {
      if (active) setRewards(saved);
    }).catch(() => {
      if (active) setError('獎勵清單暫時無法讀取。');
    }).finally(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, []);

  async function addReward() {
    const value = draft.trim().slice(0, 48);
    if (!value || !ready) return;
    if (rewards.includes(value)) {
      setError('這個獎勵已經在清單內。');
      return;
    }
    if (rewards.length >= MAX_PERSONAL_REWARDS) {
      setError(`最多可以保存 ${MAX_PERSONAL_REWARDS} 個小獎勵。`);
      return;
    }
    const next = [...rewards, value];
    setError('');
    try {
      await savePersonalRewards(next);
      setRewards(next);
      setDraft('');
    } catch {
      setError('獎勵沒有保存成功，請再試一次。');
    }
  }

  async function removeReward(value: string) {
    const next = rewards.filter((reward) => reward !== value);
    setError('');
    try {
      await savePersonalRewards(next);
      setRewards(next);
    } catch {
      setError('刪除沒有保存成功，請再試一次。');
    }
  }

  return (
    <View style={styles.wrap} testID="personal-rewards-settings">
      <View style={styles.entryRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={() => void addReward()}
          editable={ready && rewards.length < MAX_PERSONAL_REWARDS}
          maxLength={48}
          returnKeyType="done"
          placeholder="例如：看一集喜歡的節目"
          placeholderTextColor={colors.mutedForeground}
          accessibilityLabel="輸入完成目標後想給自己的小獎勵"
          testID="personal-reward-input"
          style={[styles.input, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
        />
        <Pressable
          onPress={() => void addReward()}
          disabled={!ready || !draft.trim() || rewards.length >= MAX_PERSONAL_REWARDS}
          accessibilityRole="button"
          accessibilityLabel="新增小獎勵"
          testID="add-personal-reward"
          style={({ pressed }) => [
            styles.addButton,
            { backgroundColor: colors.primary, opacity: !ready || !draft.trim() || rewards.length >= MAX_PERSONAL_REWARDS ? 0.45 : pressed ? 0.75 : 1 },
          ]}
        >
          <Feather name="plus" size={17} color={colors.primaryForeground} />
        </Pressable>
      </View>
      {rewards.length ? (
        <View style={styles.rewardList}>
          {rewards.map((reward) => (
            <View key={reward} style={[styles.rewardRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="gift" size={14} color={colors.primary} />
              <Text style={[styles.rewardText, { color: colors.foreground }]}>{reward}</Text>
              <Pressable
                onPress={() => void removeReward(reward)}
                accessibilityRole="button"
                accessibilityLabel={`刪除小獎勵：${reward}`}
                testID={`remove-personal-reward-${rewards.indexOf(reward)}`}
                style={({ pressed }) => [styles.removeButton, { opacity: pressed ? 0.55 : 1 }]}
              >
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : (
        <Text style={[styles.note, { color: colors.mutedForeground }]}>寫下想送給自己的小獎勵，完成目標時會在今天頁提醒你。</Text>
      )}
      <Text style={[styles.note, { color: colors.mutedForeground }]}>只保存在這台裝置，不會扣金幣或影響目標。</Text>
      {error ? <Text style={[styles.error, { color: colors.destructive }]} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

export function DailyPersonalRewardCard({
  today,
  completedGoalCount,
}: {
  today: string;
  completedGoalCount: number;
}) {
  const colors = useColors();
  const router = useRouter();
  const [rewards, setRewards] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    void readPersonalRewards().then((saved) => {
      if (active) setRewards(saved);
    }).catch(() => {
      if (active) setRewards([]);
    });
    return () => { active = false; };
  }, []);

  const reward = getDailyPersonalReward(rewards, today);
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="daily-personal-reward">
      <View style={[styles.icon, { backgroundColor: colors.candyLemon }]}>
        <Feather name="gift" size={17} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>給自己的小獎勵</Text>
        {reward ? (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>{reward}</Text>
            <Text style={[styles.note, { color: colors.mutedForeground }]}>
              {completedGoalCount > 0 ? '你今天已完成目標，記得留一點時間享受它。' : '完成今天一個目標後，就可以給自己這份小獎勵。'}
            </Text>
          </>
        ) : (
          <Text style={[styles.note, { color: colors.mutedForeground }]}>先寫下你喜歡的小獎勵，完成目標時就能看到它。</Text>
        )}
        <Pressable
          onPress={() => router.navigate('/settings')}
          accessibilityRole="button"
          accessibilityLabel="編輯我的小獎勵清單"
          testID="edit-personal-rewards"
          style={({ pressed }) => [styles.editButton, { opacity: pressed ? 0.65 : 1 }]}
        >
          <Text style={[styles.editText, { color: colors.primary }]}>編輯獎勵清單</Text>
          <Feather name="arrow-right" size={13} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  entryRow: { flexDirection: 'row', gap: 8 },
  input: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, fontSize: 13 },
  addButton: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rewardList: { gap: 7 },
  rewardRow: { minHeight: 42, borderWidth: 1, borderRadius: 13, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rewardText: { flex: 1, fontSize: 12, lineHeight: 17 },
  removeButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 11, lineHeight: 16 },
  error: { fontSize: 11, lineHeight: 16 },
  card: { borderWidth: 1, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginTop: 12 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 10, fontWeight: '700' },
  title: { fontSize: 14, lineHeight: 19, fontWeight: '700', marginTop: 4 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', marginTop: 8, minHeight: 28 },
  editText: { fontSize: 11, fontWeight: '700' },
});
