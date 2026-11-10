import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MALL_ITEM_BY_ID } from '@/constants/mall';
import { useHabits, type Habit } from '@/context/HabitsContext';
import { useReducedMotion } from '@/context/ReducedMotionContext';
import { useColors } from '@/hooks/useColors';
import { getLocalWeekStart, getWeeklyChallengeLimit, getWeeklyCheckInCount } from '@/lib/habit-schedule';
import { getWeeklyChallengeRewardItemId } from '@/lib/weekly-challenge-rewards';

const TARGET_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const;

export function WeeklyChallengeCard() {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const {
    habits,
    today,
    isLoading,
    purchasedItems,
    weeklyChallengeRewardPlans,
    weeklyChallengeRewardedWeeks,
    setWeeklyChallenge,
    ensureWeeklyChallengeRewardPlan,
    claimWeeklyChallengeReward,
  } = useHabits();
  const challenge = habits.find((habit) => habit.weeklyChallengeTarget !== undefined);
  const challengeHasTooManyRestDays = Boolean(
    challenge && challenge.weeklyChallengeTarget! > getWeeklyChallengeLimit(challenge.restDays),
  );
  const completed = challenge ? getWeeklyCheckInCount(challenge.checkIns, today) : 0;
  const target = challenge?.weeklyChallengeTarget ?? 0;
  const progress = target > 0 ? Math.min(100, Math.round((completed / target) * 100)) : 0;
  const isComplete = Boolean(challenge && completed >= target);
  const [isOpen, setIsOpen] = useState(false);
  const [draftHabitId, setDraftHabitId] = useState<string | null>(null);
  const [draftTarget, setDraftTarget] = useState<number>(3);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewardError, setRewardError] = useState<string | null>(null);
  const [rewardNotice, setRewardNotice] = useState<string | null>(null);
  const planAttemptRef = useRef<string | null>(null);
  const claimAttemptRef = useRef<string | null>(null);
  const weekStart = getLocalWeekStart(today);
  const rewardItemId = weeklyChallengeRewardPlans[weekStart]
    ?? getWeeklyChallengeRewardItemId(today, purchasedItems);
  const rewardItem = rewardItemId ? MALL_ITEM_BY_ID[rewardItemId] : undefined;
  const rewardClaimed = weeklyChallengeRewardedWeeks.includes(weekStart);

  useEffect(() => {
    if (isLoading || !challenge || weeklyChallengeRewardPlans[weekStart] || planAttemptRef.current === weekStart) return;
    planAttemptRef.current = weekStart;
    void ensureWeeklyChallengeRewardPlan().catch((planError) => {
      setRewardError(planError instanceof Error ? planError.message : '本週裝飾獎勵暫時無法保存。');
    });
  }, [isLoading, challenge?.id, weekStart, weeklyChallengeRewardPlans, ensureWeeklyChallengeRewardPlan]);

  useEffect(() => {
    if (isLoading || !challenge || !isComplete || rewardClaimed || claimAttemptRef.current === weekStart) return;
    claimAttemptRef.current = weekStart;
    setRewardError(null);
    void claimWeeklyChallengeReward().then((itemId) => {
      if (itemId) {
        const item = MALL_ITEM_BY_ID[itemId];
        setRewardNotice(`已獲得 30 金幣與「${item?.name ?? '本週商場裝飾'}」！`);
      }
    }).catch((claimError) => {
      claimAttemptRef.current = null;
      setRewardError(claimError instanceof Error ? claimError.message : '本週獎勵沒有領取成功，請再試一次。');
    });
  }, [isLoading, challenge?.id, isComplete, rewardClaimed, weekStart, claimWeeklyChallengeReward]);
  const selectedDraftHabit = habits.find((habit) => habit.id === draftHabitId);
  const targetOptions = TARGET_OPTIONS.filter((option) => (
    option <= (selectedDraftHabit ? getWeeklyChallengeLimit(selectedDraftHabit.restDays) : 7)
  ));

  function openEditor() {
    const initialHabit = challenge ?? habits[0];
    const availableDays = initialHabit ? getWeeklyChallengeLimit(initialHabit.restDays) : 7;
    setDraftHabitId(initialHabit?.id ?? null);
    setDraftTarget(Math.min(challenge?.weeklyChallengeTarget ?? 3, Math.max(1, availableDays)));
    setError(null);
    setIsOpen(true);
  }

  async function saveChallenge() {
    if (!draftHabitId) {
      setError('先新增一個目標，就可以設定每週挑戰。');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await setWeeklyChallenge(draftHabitId, draftTarget);
      setIsOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '挑戰沒有儲存成功，請再試一次。');
    } finally {
      setIsSaving(false);
    }
  }

  async function clearChallenge() {
    setIsSaving(true);
    setError(null);
    try {
      await setWeeklyChallenge(null, null);
      setIsOpen(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '挑戰沒有更新成功，請再試一次。');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="weekly-challenge-card">
        <View style={styles.heading}>
          <View style={[styles.icon, { backgroundColor: isComplete ? colors.candyMint : colors.candyPink }]}>
            <Feather name={isComplete ? 'award' : 'target'} size={17} color={colors.primary} />
          </View>
          <View style={styles.copy}>
            <Text style={[styles.title, { color: colors.foreground }]}>本週小挑戰</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {challengeHasTooManyRestDays
                ? '休息日調整後，請降低挑戰次數或暫停挑戰。'
                : challenge
                ? `每週完成「${challenge.title}」${target} 次`
                : '挑一個目標，設定適合自己的次數。'}
            </Text>
          </View>
          <Pressable
            onPress={openEditor}
            accessibilityRole="button"
            accessibilityLabel={challenge ? '調整本週小挑戰' : '設定本週小挑戰'}
            testID="edit-weekly-challenge"
            style={({ pressed }) => [styles.editButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.72 : 1 }]}
          >
            <Feather name={challenge ? 'edit-2' : 'plus'} size={16} color={colors.primary} />
          </Pressable>
        </View>
        {challenge ? (
          <>
            <View style={styles.progressText}>
              <Text style={[styles.progressLabel, { color: isComplete ? colors.primary : colors.mutedForeground }]}>
                {challengeHasTooManyRestDays
                  ? '目前休息日多於可完成日，調整後就能繼續挑戰。'
                  : isComplete ? '完成挑戰！商場客人會替你慶祝。' : '不比較，只跟自己約定一小步。'}
              </Text>
              <Text style={[styles.count, { color: colors.primary }]}>{Math.min(completed, target)}/{target}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.secondary }]}>
              <View style={[styles.fill, { backgroundColor: isComplete ? colors.candyMintDark : colors.primary, width: `${progress}%` }]} />
            </View>
            <View style={[styles.rewardPreview, { backgroundColor: colors.secondary }]}>
              <Feather name={rewardClaimed ? 'check-circle' : 'gift'} size={15} color={colors.primary} />
              <Text style={[styles.rewardText, { color: colors.foreground }]}>
                {rewardClaimed
                  ? `本週獎勵已領取 · +30 金幣${rewardItem ? ` · ${rewardItem.name}` : ''}`
                  : `達標獎勵：+30 金幣 · 每週限定裝飾「${rewardItem?.name ?? '商場裝飾'}」`}
              </Text>
            </View>
            {rewardNotice ? <Text style={[styles.rewardFeedback, { color: colors.primary }]} accessibilityLiveRegion="polite">{rewardNotice}</Text> : null}
            {rewardError ? <Text style={[styles.rewardFeedback, { color: colors.destructive }]} accessibilityRole="alert">{rewardError}</Text> : null}
          </>
        ) : (
          <>
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              完成後獲得 +30 金幣和每週限定裝飾，不增加樓層，也不用花金幣。
            </Text>
            <View style={[styles.rewardPreview, { backgroundColor: colors.secondary }]}>
              <Feather name="gift" size={15} color={colors.primary} />
              <Text style={[styles.rewardText, { color: colors.foreground }]}>
                本週裝飾獎勵：{rewardItem?.name ?? '商場裝飾'} · 從現有目錄中挑選
              </Text>
            </View>
          </>
        )}
      </View>

      <Modal
        visible={isOpen}
        transparent
        statusBarTranslucent
        animationType={reduceMotion === false ? 'fade' : 'none'}
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={styles.dismissLayer}
            onPress={() => setIsOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="關閉挑戰設定"
            testID="dismiss-weekly-challenge"
          />
          <View
            style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessibilityViewIsModal
            testID="weekly-challenge-modal"
          >
            <View style={styles.panelHeader}>
              <View style={[styles.panelIcon, { backgroundColor: colors.candyPink }]}>
                <Feather name="target" size={18} color={colors.primary} />
              </View>
              <View style={styles.copy}>
                <Text style={[styles.panelTitle, { color: colors.foreground }]} accessibilityRole="header">設定本週小挑戰</Text>
                <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>選一個目標和你想完成的次數。</Text>
              </View>
              <Pressable
                onPress={() => setIsOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="關閉挑戰設定"
                testID="close-weekly-challenge"
                style={styles.closeButton}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {habits.length === 0 ? (
              <Text style={[styles.empty, { color: colors.mutedForeground }]}>先新增一個目標，就能為自己設定每週挑戰。</Text>
            ) : (
              <>
                <Text style={[styles.sectionLabel, { color: colors.foreground }]}>選擇目標</Text>
                <ScrollView style={styles.goalList} showsVerticalScrollIndicator={false}>
                  {habits.map((habit: Habit) => {
                    const selected = draftHabitId === habit.id;
                    return (
                      <Pressable
                        key={habit.id}
                        onPress={() => {
                          setDraftHabitId(habit.id);
                          setDraftTarget((current) => Math.min(current, Math.max(1, getWeeklyChallengeLimit(habit.restDays))));
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${selected ? '已選擇' : '選擇'}目標：${habit.title}`}
                        testID={`challenge-goal-${habit.id}`}
                        style={[
                          styles.goalOption,
                          { backgroundColor: selected ? colors.secondary : colors.background, borderColor: selected ? colors.primary : colors.border },
                        ]}
                      >
                        <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
                          {selected && <View style={[styles.radioDot, { backgroundColor: colors.primary }]} />}
                        </View>
                        <Text style={[styles.goalTitle, { color: colors.foreground }]} numberOfLines={2}>{habit.title}</Text>
                        {selected && <Feather name="check" size={16} color={colors.primary} />}
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.sectionLabel, { color: colors.foreground, marginTop: 15 }]}>本週想完成幾次？</Text>
                <View style={styles.targetRow}>
                  {targetOptions.map((option) => {
                    const selected = draftTarget === option;
                    return (
                      <Pressable
                        key={option}
                        onPress={() => setDraftTarget(option)}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`每週 ${option} 次${selected ? '，已選擇' : ''}`}
                        testID={`challenge-target-${option}`}
                        style={[
                          styles.targetOption,
                          { backgroundColor: selected ? colors.primary : colors.secondary, borderColor: selected ? colors.primary : colors.border },
                        ]}
                      >
                        <Text style={[styles.targetNumber, { color: selected ? colors.primaryForeground : colors.primary }]}>{option}</Text>
                        <Text style={[styles.targetLabel, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>次</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {targetOptions.length === 0 ? (
                  <Text style={[styles.helper, { color: colors.destructive }]}>
                    這個目標每週沒有安排練習日，請先調整休息日或選擇其他目標。
                  </Text>
                ) : null}
                <Text style={[styles.helper, { color: colors.mutedForeground }]}>按自己的步調挑戰，完成後商場客人會為你慶祝。</Text>
              </>
            )}

            {error ? <Text style={[styles.error, { color: colors.destructive }]} accessibilityRole="alert">{error}</Text> : null}
            <Pressable
              onPress={() => void saveChallenge()}
              disabled={isSaving || habits.length === 0 || targetOptions.length === 0}
              accessibilityRole="button"
              accessibilityState={{ disabled: isSaving || habits.length === 0 || targetOptions.length === 0, busy: isSaving }}
              testID="save-weekly-challenge"
              style={[styles.primaryButton, { backgroundColor: colors.primary, opacity: isSaving || habits.length === 0 || targetOptions.length === 0 ? 0.55 : 1 }]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{isSaving ? '儲存中…' : '儲存挑戰'}</Text>
            </Pressable>
            {challenge ? (
              <Pressable
                onPress={() => void clearChallenge()}
                disabled={isSaving}
                accessibilityRole="button"
                accessibilityLabel="暫停本週挑戰"
                testID="clear-weekly-challenge"
                style={styles.clearButton}
              >
                <Text style={[styles.clearButtonText, { color: colors.mutedForeground }]}>暫停本週挑戰</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 21, padding: 16, marginTop: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  editButton: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  progressText: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 14 },
  progressLabel: { flex: 1, fontSize: 10, fontWeight: '600' },
  count: { fontSize: 11, fontWeight: '700' },
  track: { height: 7, overflow: 'hidden', borderRadius: 99, marginTop: 8 },
  fill: { height: '100%', borderRadius: 99 },
  hint: { fontSize: 11, lineHeight: 17, marginTop: 12 },
  rewardPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 10, marginTop: 11 },
  rewardText: { flex: 1, fontSize: 10, lineHeight: 15, fontWeight: '600' },
  rewardFeedback: { fontSize: 10, lineHeight: 15, marginTop: 7 },
  backdrop: { flex: 1, justifyContent: 'center', padding: 17, backgroundColor: 'rgba(38, 25, 42, 0.42)' },
  dismissLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  panel: { width: '100%', maxWidth: 440, maxHeight: '90%', alignSelf: 'center', borderWidth: 1, borderRadius: 24, padding: 18 },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  panelIcon: { width: 39, height: 39, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  panelTitle: { fontSize: 17, fontWeight: '700' },
  closeButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { fontSize: 12, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  goalList: { maxHeight: 230 },
  goalOption: { minHeight: 44, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, paddingVertical: 8, marginBottom: 7 },
  radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 9, height: 9, borderRadius: 5 },
  goalTitle: { flex: 1, fontSize: 12, fontWeight: '600' },
  targetRow: { flexDirection: 'row', gap: 4 },
  targetOption: { minWidth: 32, height: 42, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1, borderRadius: 13 },
  targetNumber: { fontSize: 17, fontWeight: '700' },
  targetLabel: { fontSize: 10, fontWeight: '600' },
  helper: { fontSize: 10, lineHeight: 16, marginTop: 9 },
  empty: { fontSize: 12, lineHeight: 19, textAlign: 'center', paddingVertical: 25 },
  error: { fontSize: 11, lineHeight: 16, marginTop: 10 },
  primaryButton: { minHeight: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  primaryButtonText: { fontSize: 13, fontWeight: '700' },
  clearButton: { minHeight: 38, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  clearButtonText: { fontSize: 11, fontWeight: '600' },
});
