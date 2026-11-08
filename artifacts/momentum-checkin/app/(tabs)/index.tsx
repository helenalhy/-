import { Feather } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useReducedMotion } from '@/context/ReducedMotionContext';
import { getDailyMotivationalQuote } from '@/constants/daily-motivation';
import { scheduleReminderSnooze, updateReminderCheckInStatus } from '@workspace/api-client-react';
import { readReminderSettings } from '@/lib/reminder-settings';
import { canMakeUpYesterday, getPreviousLocalDate, getPreviousScheduledDate, getWeekday, MAKEUP_USE_PREFIX } from '@/lib/habit-schedule';
import { DogCompanionPicker, DEFAULT_DOG_COMPANION_ID } from '@/components/DogCompanionPicker';
import { DOG_STAFF_PROFILES } from '@/constants/dog-staff-customization';
import { recommendMinimumAction } from '@/lib/minimum-action-suggestions';
import { FULL_CHECK_IN_REWARD, getMinimumActionReward } from '@/lib/proportional-checkin-reward';
import {
  getStreak,
  useHabits,
  type Habit,
} from '@/context/HabitsContext';
const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

type StartScenario = 'low-energy' | 'short-time' | 'stuck';

const START_SCENARIOS: { id: StartScenario; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: 'low-energy', label: '沒精神', icon: 'cloud' },
  { id: 'short-time', label: '時間少', icon: 'clock' },
  { id: 'stuck', label: '卡住了', icon: 'help-circle' },
];

const START_SCENARIO_PROMPTS: Record<StartScenario, string> = {
  'low-energy': '今天不用做很多，先完成一個最小步驟就好。',
  'short-time': '只留兩分鐘給這個目標，做一小步也算進展。',
  stuck: '先跟著建議做第一步，不用先想完整計畫。',
};

function getWeek(todayKey: string) {
  const [year, month, day] = todayKey.split('-').map(Number);
  const today = new Date(year, month - 1, day);
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      day: date.getDate(),
      label: dayNames[date.getDay()],
    };
  });
}

const SNOOZE_DELAY_MINUTES = 30;

function TwoMinuteStarterModal({
  habit,
  reduceMotion,
  minimumActionIsRecommendation,
  startPrompt,
  onClose,
  onCompleteMinimumAction,
  onSnooze,
  onOpenReminderSettings,
}: {
  habit: Habit;
  reduceMotion: boolean | null;
  minimumActionIsRecommendation: boolean;
  startPrompt: string | null;
  onClose: () => void;
  onCompleteMinimumAction?: () => Promise<boolean>;
  onSnooze: () => Promise<void>;
  onOpenReminderSettings: () => void;
}) {
  const colors = useColors();
  const [endAt, setEndAt] = useState(() => Date.now() + 120_000);
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState(false);
  const [pausedRemaining, setPausedRemaining] = useState(120_000);
  const [completed, setCompleted] = useState(false);
  const [isRecordingMinimumAction, setIsRecordingMinimumAction] = useState(false);
  const [minimumActionRecorded, setMinimumActionRecorded] = useState(false);
  const [focusMode, setFocusMode] = useState<'normal' | 'minimum'>(habit.minimumAction ? 'minimum' : 'normal');
  const [selectedDogId, setSelectedDogId] = useState(DEFAULT_DOG_COMPANION_ID);
  const [showRecoveryActions, setShowRecoveryActions] = useState(false);
  const [isSchedulingSnooze, setIsSchedulingSnooze] = useState(false);
  const [snoozeScheduled, setSnoozeScheduled] = useState(false);
  const [rescueError, setRescueError] = useState('');
  const minimumActionReward = getMinimumActionReward(
    habit.title,
    habit.minimumAction ?? '先做 2 分鐘',
  );
  const remainingMs = paused ? pausedRemaining : Math.max(0, endAt - now);

  useEffect(() => {
    if (paused || completed) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, [paused, completed]);

  useEffect(() => {
    if (paused || completed || remainingMs > 0) return;
    setCompleted(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [completed, paused, remainingMs]);

  function pause() {
    setPausedRemaining(remainingMs);
    setPaused(true);
    setShowRecoveryActions(true);
    setRescueError('');
  }

  function resume() {
    const timestamp = Date.now();
    setNow(timestamp);
    setEndAt(timestamp + pausedRemaining);
    setPaused(false);
  }

  function restart() {
    const timestamp = Date.now();
    setNow(timestamp);
    setEndAt(timestamp + 120_000);
    setPausedRemaining(120_000);
    setPaused(false);
    setCompleted(false);
  }

  function requestClose() {
    if (completed || minimumActionRecorded || snoozeScheduled) {
      onClose();
      return;
    }
    if (!paused) {
      setPausedRemaining(remainingMs);
      setPaused(true);
    }
    setShowRecoveryActions(true);
    setRescueError('');
  }

  function chooseTwoMinuteVersion() {
    setFocusMode('minimum');
    setShowRecoveryActions(false);
    setRescueError('');
    restart();
  }

  function chooseNormalTarget() {
    setFocusMode('normal');
    setShowRecoveryActions(false);
    restart();
  }

  async function scheduleLater() {
    if (isSchedulingSnooze || snoozeScheduled) return;
    setIsSchedulingSnooze(true);
    setRescueError('');
    try {
      await onSnooze();
      setSnoozeScheduled(true);
      setShowRecoveryActions(false);
    } catch (error) {
      setRescueError(error instanceof Error ? error.message : '無法安排稍後提醒，請確認通知設定後再試。');
    } finally {
      setIsSchedulingSnooze(false);
    }
  }

  async function recordMinimumAction() {
    if (!onCompleteMinimumAction || isRecordingMinimumAction || minimumActionRecorded) return;
    setIsRecordingMinimumAction(true);
    try {
      if (await onCompleteMinimumAction()) {
        setMinimumActionRecorded(true);
        setPausedRemaining(remainingMs);
        setPaused(true);
        setShowRecoveryActions(false);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } catch {
      Alert.alert('沒有儲存成功', '最小行動尚未記錄，請再試一次。');
    } finally {
      setIsRecordingMinimumAction(false);
    }
  }

  const seconds = Math.ceil(remainingMs / 1000);
  const timerLabel = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const elapsedPercent = Math.min(100, Math.max(0, ((120_000 - remainingMs) / 120_000) * 100));

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType={reduceMotion === false ? 'fade' : 'none'}
      onRequestClose={requestClose}
    >
      <View style={styles.focusBackdrop}>
        <Pressable style={styles.actionBackdropDismiss} onPress={requestClose} accessibilityRole="button" accessibilityLabel="關閉兩分鐘開始計時" />
        <View style={[styles.focusPanel, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityViewIsModal testID="two-minute-starter-modal">
          <ScrollView
            style={styles.focusScroll}
            contentContainerStyle={styles.focusPanelContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.focusHeader}>
            <View style={[styles.focusIcon, { backgroundColor: colors.candyLemon }]}>
              <Feather name="clock" size={18} color={colors.candyCaramelDark} />
            </View>
            <View style={styles.focusTitleCopy}>
                <Text style={[styles.focusTitle, { color: colors.foreground }]} accessibilityRole="header">
                  {minimumActionRecorded
                    ? '你完成了一小步'
                    : focusMode === 'minimum' ? '先做兩分鐘版本' : '先開始兩分鐘'}
                </Text>
              <Text style={[styles.focusSubtitle, { color: colors.mutedForeground }]} numberOfLines={2}>{habit.title}</Text>
            </View>
            <Pressable onPress={requestClose} accessibilityRole="button" accessibilityLabel="關閉計時器" testID="close-two-minute-timer" style={styles.focusClose}>
              <Feather name="x" size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <DogCompanionPicker
            selectedDogId={selectedDogId}
            onSelect={setSelectedDogId}
            celebrating={completed || minimumActionRecorded}
            reduceMotion={reduceMotion}
          />

          {startPrompt ? (
            <Text style={[styles.focusPrompt, { color: colors.mutedForeground }]} testID="quick-start-prompt">
              {startPrompt}
            </Text>
          ) : null}

          {focusMode === 'minimum' ? (
            <View style={[styles.minimumActionCard, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.minimumActionLabel, { color: colors.primary }]}>
                {habit.minimumAction
                  ? minimumActionIsRecommendation ? '今日建議的最小行動' : '今天的最小行動'
                  : '兩分鐘版本'}
              </Text>
              <Text style={[styles.minimumActionDetail, { color: colors.foreground }]}>
                {habit.minimumAction ?? '只做兩分鐘，從最容易開始的一步做起，不需要完成整個目標。'}
              </Text>
              <Text style={[styles.minimumRewardCopy, { color: colors.mutedForeground }]}>
                完成小步 +{minimumActionReward} 金幣 · 完整目標 +{FULL_CHECK_IN_REWARD} 金幣
              </Text>
            </View>
          ) : null}

          <Text style={[styles.focusTimer, { color: colors.primary }]} accessibilityLabel={`計時剩餘 ${timerLabel}`}>
            {timerLabel}
          </Text>
          <View style={[styles.focusTrack, { backgroundColor: colors.secondary }]}>
            <View style={[styles.focusFill, { backgroundColor: colors.primary, width: `${elapsedPercent}%` }]} />
          </View>
          <Text style={[styles.focusMessage, { color: colors.mutedForeground }]}>
            {minimumActionRecorded
              ? `最小行動已記錄。${DOG_STAFF_PROFILES.find((dog) => dog.key === selectedDogId)?.name ?? '狗狗'}也替你開心！`
              : snoozeScheduled
                ? `已安排 ${SNOOZE_DELAY_MINUTES} 分鐘後提醒你，不會重複安排這次提醒。`
                : focusMode === 'minimum' && habit.minimumAction
                  ? minimumActionIsRecommendation
                    ? completed
                      ? '兩分鐘完成了！確認完成這個建議步驟後，才會記錄今日打卡。'
                      : '這是依照目標提供的建議；完成後自行確認，才會記錄打卡。'
                    : completed
                      ? '兩分鐘完成了！只有你確認完成最小行動後，才會記錄打卡和發放原有金幣。'
                      : '完成最小行動後，可自行確認打卡；倒數不會自動打卡或發放金幣。'
                  : completed
                    ? '兩分鐘完成了！這代表你已開始，狗狗會為這一步慶祝；計時不會自動打卡。'
                    : '不用一次做到完美，先開始就很好。計時不會自動打卡或發放金幣。'}
          </Text>

          {onCompleteMinimumAction && focusMode === 'minimum' ? (
            <Pressable
              onPress={() => void recordMinimumAction()}
              disabled={isRecordingMinimumAction || minimumActionRecorded}
              accessibilityRole="button"
              accessibilityLabel={`確認完成最小行動：${habit.minimumAction}，並記錄${habit.title}打卡`}
              accessibilityState={{ disabled: isRecordingMinimumAction || minimumActionRecorded, busy: isRecordingMinimumAction }}
              testID={`complete-minimum-action-${habit.id}`}
              style={[styles.minimumCompleteButton, { backgroundColor: colors.candyMint, opacity: isRecordingMinimumAction || minimumActionRecorded ? 0.65 : 1 }]}
            >
              <Feather name={minimumActionRecorded ? 'check-circle' : 'check'} size={16} color={colors.foreground} />
              <Text style={[styles.minimumCompleteText, { color: colors.foreground }]}>
                {isRecordingMinimumAction
                  ? '記錄中…'
                  : minimumActionRecorded
                    ? '已完成並打卡'
                    : minimumActionIsRecommendation ? '完成建議行動並打卡' : '完成最小行動並打卡'}
              </Text>
            </Pressable>
          ) : null}

          {showRecoveryActions ? (
            <View style={[styles.rescueCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.rescueTitle, { color: colors.foreground }]}>卡住了也沒關係</Text>
              <Text style={[styles.rescueDescription, { color: colors.mutedForeground }]}>
                不用重複提醒自己，選一個比較輕鬆的下一步。
              </Text>
              <Pressable
                onPress={chooseTwoMinuteVersion}
                accessibilityRole="button"
                testID={`rescue-two-minute-${habit.id}`}
                style={[styles.rescueOption, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name="clock" size={15} color={colors.primary} />
                <View style={styles.rescueOptionCopy}>
                  <Text style={[styles.rescueOptionTitle, { color: colors.primary }]}>改做 2 分鐘版本</Text>
                  <Text style={[styles.rescueOptionDescription, { color: colors.mutedForeground }]}>
                    {habit.minimumAction ?? '只做最容易開始的一小步'}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                onPress={() => void scheduleLater()}
                disabled={isSchedulingSnooze || snoozeScheduled}
                accessibilityRole="button"
                accessibilityState={{ disabled: isSchedulingSnooze || snoozeScheduled, busy: isSchedulingSnooze }}
                testID={`rescue-snooze-${habit.id}`}
                style={[styles.rescueOption, { backgroundColor: colors.card, borderColor: colors.border, opacity: isSchedulingSnooze ? 0.65 : 1 }]}
              >
                {isSchedulingSnooze
                  ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Feather name="bell" size={15} color={colors.primary} />}
                <View style={styles.rescueOptionCopy}>
                  <Text style={[styles.rescueOptionTitle, { color: colors.primary }]}>
                    {isSchedulingSnooze ? '安排中…' : `改到 ${SNOOZE_DELAY_MINUTES} 分鐘後`}
                  </Text>
                  <Text style={[styles.rescueOptionDescription, { color: colors.mutedForeground }]}>
                    這是一次性提醒，不會改動每日提醒時段。
                  </Text>
                </View>
              </Pressable>
              {rescueError ? (
                <>
                  <Text style={[styles.rescueError, { color: colors.destructive }]}>{rescueError}</Text>
                  <Pressable onPress={onOpenReminderSettings} accessibilityRole="button" style={styles.rescueSettingsLink}>
                    <Text style={[styles.rescueSettingsText, { color: colors.primary }]}>開啟通知設定</Text>
                    <Feather name="arrow-up-right" size={12} color={colors.primary} />
                  </Pressable>
                </>
              ) : null}
              <View style={styles.rescueFooter}>
                <Pressable
                  onPress={() => { setShowRecoveryActions(false); resume(); }}
                  accessibilityRole="button"
                  style={styles.rescueTextButton}
                >
                  <Text style={[styles.rescueFooterText, { color: colors.primary }]}>繼續計時</Text>
                </Pressable>
                <Pressable onPress={onClose} accessibilityRole="button" style={styles.rescueTextButton}>
                  <Text style={[styles.rescueFooterText, { color: colors.mutedForeground }]}>先關閉</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.focusActions}>
            {completed && !minimumActionRecorded && !snoozeScheduled ? (
              <Pressable onPress={restart} accessibilityRole="button" testID="restart-two-minute-timer" style={[styles.focusPrimary, { backgroundColor: colors.primary }]}>
                <Feather name="rotate-ccw" size={16} color={colors.primaryForeground} />
                <Text style={[styles.focusPrimaryText, { color: colors.primaryForeground }]}>再開始兩分鐘</Text>
              </Pressable>
            ) : !minimumActionRecorded && !snoozeScheduled ? (
              <Pressable
                onPress={paused ? () => { setShowRecoveryActions(false); resume(); } : pause}
                accessibilityRole="button"
                testID={paused ? 'resume-two-minute-timer' : 'pause-two-minute-timer'}
                style={[styles.focusPrimary, { backgroundColor: colors.primary }]}
              >
                <Feather name={paused ? 'play' : 'pause'} size={16} color={colors.primaryForeground} />
                <Text style={[styles.focusPrimaryText, { color: colors.primaryForeground }]}>{paused ? '繼續計時' : '暫停'}</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={minimumActionRecorded || snoozeScheduled
                ? onClose
                : focusMode === 'minimum' ? chooseNormalTarget : requestClose}
              accessibilityRole="button"
              accessibilityLabel={minimumActionRecorded || snoozeScheduled
                ? '完成並關閉'
                : focusMode === 'minimum' ? '改做正常目標' : '先到這裡'}
              testID="finish-two-minute-timer"
              style={[styles.focusSecondary, { backgroundColor: colors.secondary }]}
            >
              <Text style={[styles.focusSecondaryText, { color: colors.primary }]}>
                {minimumActionRecorded || snoozeScheduled
                  ? '完成'
                  : focusMode === 'minimum' ? '改做正常目標' : completed ? '知道了' : '先到這裡'}
              </Text>
            </Pressable>
          </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function HabitRow({ habit, done, reward, isRestDay, canMakeUp, showMakeUp, makeUpRewardAlreadyEarned, completedStep, onToggle, onMakeUp, onStartTwoMinute, onEdit, onManage }: {
  habit: Habit;
  done: boolean;
  reward: number;
  isRestDay: boolean;
  canMakeUp: boolean;
  showMakeUp: boolean;
  makeUpRewardAlreadyEarned: boolean;
  completedStep?: string;
  onToggle: (step?: string) => Promise<unknown>;
  onMakeUp: () => Promise<void>;
  onStartTwoMinute: (minimumAction: string, isRecommendation: boolean) => void;
  onEdit: () => void;
  onManage: () => void;
}) {
  const colors = useColors();
  const longPressTriggered = useRef(false);
  const recommendedMinimumAction = habit.minimumAction ?? recommendMinimumAction(habit);
  const minimumActionReward = getMinimumActionReward(habit.title, recommendedMinimumAction);
  return (
    <View style={[styles.habitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.habitIcon, { backgroundColor: habit.color }]}>
        <Feather name={habit.icon as keyof typeof Feather.glyphMap} size={20} color={colors.foreground} />
      </View>
      <View style={styles.habitInfo}>
       <Pressable
        style={styles.habitTitleArea}
        onPressIn={() => {
          longPressTriggered.current = false;
        }}
        onPress={() => {
          if (longPressTriggered.current) return;
          onEdit();
        }}
        onLongPress={() => {
          longPressTriggered.current = true;
          onManage();
        }}
        delayLongPress={450}
        accessibilityRole="button"
        accessibilityLabel={`編輯${habit.title}${!done && reward > 0 ? `，完整目標可獲得 ${reward} 金幣，最小行動可獲得 ${minimumActionReward} 金幣` : ''}`}
        accessibilityHint="長按可開啟修改或刪除選項"
        testID={`habit-info-${habit.id}`}
      >
        <Text style={[styles.habitTitle, { color: colors.foreground }, done && styles.doneText]}>{habit.title}</Text>
        <Text style={[styles.habitReason, { color: colors.mutedForeground }]} numberOfLines={1}>{habit.reason}</Text>
      </Pressable>
        {isRestDay && !done ? (
          <Text style={[styles.habitRestNote, { color: colors.primary }]}>今天是安排好的休息日</Text>
        ) : null}
        {!done && !isRestDay ? (
          <Text style={[styles.minimumActionNote, { color: colors.mutedForeground }]} numberOfLines={2}>
            {habit.minimumAction
              ? `最小行動：${habit.minimumAction}`
              : `建議最小行動：${recommendedMinimumAction}`}
          </Text>
        ) : null}
        {habit.steps.length > 0 && !done && !isRestDay ? (
          <View style={styles.stepList}>
            {habit.steps.map((step) => (
              <Pressable
                key={step}
                onPress={() => void onToggle(step)}
                accessibilityRole="button"
                accessibilityLabel={`完成小步驟：${step}，並完成今日目標`}
                testID={`habit-step-${habit.id}-${habit.steps.indexOf(step)}`}
                style={({ pressed }) => [
                  styles.stepChip,
                  { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="check" size={10} color={colors.primary} />
                <Text style={[styles.stepChipText, { color: colors.primary }]} numberOfLines={1}>{step}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {done && completedStep ? (
          <Text style={[styles.habitStepDone, { color: colors.primary }]} numberOfLines={1}>今日完成：{completedStep}</Text>
        ) : null}
        {!done && !isRestDay ? (
          <Pressable
            onPress={() => onStartTwoMinute(recommendedMinimumAction, !habit.minimumAction)}
            accessibilityRole="button"
            accessibilityLabel={habit.minimumAction
              ? `開始${habit.title}的最小行動：${habit.minimumAction}，並開啟兩分鐘計時`
              : `試試${habit.title}的建議最小行動：${recommendedMinimumAction}，並開啟兩分鐘計時`}
            testID={`focus-start-${habit.id}`}
            style={({ pressed }) => [styles.focusStartButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.72 : 1 }]}
          >
            <Feather name="clock" size={11} color={colors.primary} />
            <Text style={[styles.focusStartText, { color: colors.primary }]}>
              {habit.minimumAction ? '開始最小行動 · 2 分鐘' : '試試建議 · 2 分鐘'}
            </Text>
          </Pressable>
        ) : null}
        {!done && reward > 0 && (
          <View
            style={[styles.rewardHint, { backgroundColor: colors.candyLemon }]}
            testID={`habit-reward-${habit.id}`}
          >
            <Feather name="circle" size={11} color={colors.candyCaramelDark} />
            <Text style={[styles.rewardHintText, { color: colors.candyCaramelDark }]}>
              完整 +{reward} · 小步 +{minimumActionReward} 金幣
            </Text>
          </View>
        )}
        {showMakeUp ? (
          <Pressable
            onPress={() => void onMakeUp()}
            disabled={!canMakeUp}
            accessibilityRole="button"
            accessibilityLabel={canMakeUp ? `補回昨天的${habit.title}打卡，每週一次${makeUpRewardAlreadyEarned ? '；昨天已領取金幣' : '；可獲得 20 金幣'}` : '本週補打卡機會已用完'}
            accessibilityState={{ disabled: !canMakeUp }}
            testID={`makeup-checkin-${habit.id}`}
            style={[styles.makeupButton, { backgroundColor: canMakeUp ? colors.candyLemon : colors.background, opacity: canMakeUp ? 1 : 0.55 }]}
          >
            <Feather name={canMakeUp ? 'rotate-ccw' : 'check-circle'} size={11} color={colors.candyCaramelDark} />
            <Text style={[styles.makeupText, { color: colors.candyCaramelDark }]}>
              {canMakeUp
                ? makeUpRewardAlreadyEarned ? '補回昨天 · 已領過金幣' : '補回昨天 · +20 金幣'
                : '本週補打卡已用完'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      <Pressable
        style={styles.manageButton}
        onPress={onManage}
        accessibilityRole="button"
        accessibilityLabel={`管理${habit.title}`}
        testID={`manage-habit-${habit.id}`}
      >
        <Feather name="more-horizontal" size={18} color={colors.mutedForeground} />
      </Pressable>
      <View style={habit.minimumAction && !done ? styles.checkActionGroup : undefined}>
        <Pressable
          style={[styles.checkButton, { backgroundColor: done ? colors.primary : colors.secondary }]}
          onPress={() => void onToggle()}
          disabled={!done && isRestDay}
          accessibilityRole="button"
          accessibilityLabel={done
            ? `取消${habit.title}打卡`
            : isRestDay
              ? `${habit.title}今天是休息日`
              : habit.minimumAction ? `正常完成${habit.title}` : `完成${habit.title}`}
          testID={`checkin-${habit.id}`}
        >
          <Feather name={done ? 'check' : 'plus'} size={20} color={done ? colors.primaryForeground : colors.primary} />
        </Pressable>
        {habit.minimumAction && !done ? (
          <Text style={[styles.checkActionLabel, { color: colors.mutedForeground }]}>正常</Text>
        ) : null}
      </View>
    </View>
  );
}

export function TodayScreen() {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { habits, isLoading, storageError, today, coins, rewardedCheckIns, getCheckInReward, toggleCheckIn, makeUpYesterday, deleteHabit } = useHabits();
  const [focusHabit, setFocusHabit] = useState<Habit | null>(null);
  const [focusActionIsRecommendation, setFocusActionIsRecommendation] = useState(false);
  const [focusStartPrompt, setFocusStartPrompt] = useState<string | null>(null);
  const [startScenario, setStartScenario] = useState<StartScenario | null>(null);
  const [isChoosingFocusedHabit, setIsChoosingFocusedHabit] = useState(false);
  const [focusedHabitId, setFocusedHabitId] = useState<string | null>(null);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const dailyQuote = getDailyMotivationalQuote(today);
  const week = getWeek(today);
  const scheduledToday = habits.filter((habit) => !habit.restDays.includes(getWeekday(today)));
  const startableHabits = habits.filter((habit) => (
    !habit.checkIns.includes(today) && !habit.restDays.includes(getWeekday(today))
  ));
  const focusedHabit = habits.find((habit) => habit.id === focusedHabitId) ?? null;
  const visibleHabits = focusedHabit ? [focusedHabit] : habits;
  const scheduledTodayDone = scheduledToday.filter((habit) => habit.checkIns.includes(today)).length;
  const percent = scheduledToday.length === 0 ? 100 : Math.min(100, Math.round((scheduledTodayDone / scheduledToday.length) * 100));
  const todayCounter = scheduledToday.length === 0 ? '休息日' : `${scheduledTodayDone}/${scheduledToday.length}`;
  const date = new Date(`${today}T12:00:00`);
  const weekday = dayNames[date.getDay()];
  const dateLabel = `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  async function scheduleHabitSnooze(habit: Habit): Promise<void> {
    const settings = await readReminderSettings();
    if (!settings.enabled || !settings.endpoint) {
      throw new Error('請先在「設定」開啟打卡通知，才能在關閉頁面後收到稍後提醒。');
    }
    const result = await scheduleReminderSnooze({
      endpoint: settings.endpoint,
      habitId: habit.id,
      habitTitle: habit.title,
      fireAt: new Date(Date.now() + SNOOZE_DELAY_MINUTES * 60_000).toISOString(),
    });
    if (!result.scheduled) throw new Error('無法安排稍後提醒，請稍後再試。');
  }
  function openReminderSettingsFromSnooze() {
    setFocusHabit(null);
    setFocusActionIsRecommendation(false);
    setFocusStartPrompt(null);
    router.push('/reminders');
  }
  const totalStreak = Math.max(0, ...habits.map((habit) => getStreak(habit.checkIns, today, habit.restDays)));
  const makeupDatesThisAccount = [
    ...habits.flatMap((habit) => habit.makeupCheckIns),
    ...rewardedCheckIns.flatMap((key) => key.startsWith(MAKEUP_USE_PREFIX) ? [key.slice(MAKEUP_USE_PREFIX.length)] : []),
  ];
  const restartHabit = habits.find((habit) => {
    if (habit.checkIns.includes(today) || habit.restDays.includes(getWeekday(today))) return false;
    const previousScheduledDate = getPreviousScheduledDate(today, habit.restDays, habit.createdAt);
    return Boolean(
      previousScheduledDate
      && !habit.checkIns.includes(previousScheduledDate)
      && habit.checkIns.some((dateKey) => dateKey < previousScheduledDate),
    );
  });

  function openHabitActions(habit: Habit) {
    setSelectedHabit(habit);
    setConfirmingDelete(false);
    setDeleteError(null);
  }

  function closeHabitActions() {
    if (isDeleting) return;
    setSelectedHabit(null);
    setConfirmingDelete(false);
    setDeleteError(null);
  }

  function editSelectedHabit() {
    if (!selectedHabit) return;
    const id = selectedHabit.id;
    setSelectedHabit(null);
    setConfirmingDelete(false);
    router.push({ pathname: '/habit-editor', params: { id } });
  }

  async function confirmDeleteHabit() {
    if (!selectedHabit || isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteHabit(selectedHabit.id);
      setSelectedHabit(null);
      setConfirmingDelete(false);
    } catch {
      setDeleteError('刪除失敗，目標仍保留，請再試一次。');
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggle(habit: Habit, step?: string, rewardAmount?: number): Promise<boolean> {
    try {
      const reward = await toggleCheckIn(habit.id, step, rewardAmount);
      if (Platform.OS === 'web') {
        const wasDone = habit.checkIns.includes(today);
        const hasCheckedInToday = !wasDone || habits.some(
          (item) => item.id !== habit.id && item.checkIns.includes(today),
        );
        void readReminderSettings()
          .then((settings) => {
            if (!settings.enabled || !settings.endpoint) return;
            return updateReminderCheckInStatus({
              endpoint: settings.endpoint,
              habitId: habit.id,
              hasCheckedInToday,
            });
          })
          .catch(() => {});
      }
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        // A haptics failure must not make a successfully saved check-in look incomplete.
      }
      if (reward > 0) {
        Alert.alert(
          '太棒了，完成一小步！',
          `獲得 ${reward} 金幣！可以免費換取喜歡的商店、設施或裝修。`,
        );
      }
      return true;
    } catch {
      Alert.alert('沒有儲存成功', '請再試一次。');
      return false;
    }
  }

  async function handleMakeUp(habit: Habit) {
    try {
      const reward = await makeUpYesterday(habit.id);
      Alert.alert(
        '昨天的打卡已補回',
        reward > 0
          ? `獲得 ${reward} 金幣；補回紀錄和金幣已一併保存。`
          : '補回紀錄已保存；這項目昨天已領過金幣，因此不會重複發放。',
      );
    } catch (error) {
      Alert.alert('暫時無法補打卡', error instanceof Error ? error.message : '請稍後再試。');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 28, paddingTop: Platform.OS === 'web' ? 67 : 12 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topline}>
          <View>
            <Text style={[styles.brand, { color: colors.primary }]}>MOMENTUM</Text>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>{dateLabel} · 星期{weekday}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={[styles.coinPill, { backgroundColor: colors.secondary }]} onPress={() => router.navigate('/mall')} accessibilityRole="button" accessibilityLabel={`${coins} 金幣，前往商場`}>
              <Feather name="shopping-bag" size={14} color={colors.primary} />
              <Text style={[styles.coinText, { color: colors.primary }]}>商場 {coins}</Text>
            </Pressable>
            <Pressable style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={() => router.push('/habit-editor')} accessibilityRole="button" accessibilityLabel="新增目標">
              <Feather name="plus" size={20} color={colors.primaryForeground} />
            </Pressable>
          </View>
        </View>

        <View style={styles.greeting}>
          <Text style={[styles.greetingTitle, { color: colors.foreground }]}>今天，先完成一小步。</Text>
          <Text style={[styles.greetingBody, { color: colors.mutedForeground }]}>不用一次做到完美，願意開始就很了不起。</Text>
        </View>

        <Pressable
          style={[styles.mallShortcut, { backgroundColor: colors.secondary }]}
          onPress={() => router.navigate('/mall')}
          accessibilityRole="button"
          accessibilityLabel="前往商場"
          testID="today-mall-shortcut"
        >
          <View style={[styles.mallShortcutIcon, { backgroundColor: colors.candyLemon }]}>
            <Feather name="shopping-bag" size={18} color={colors.primary} />
          </View>
          <View style={styles.mallShortcutCopy}>
            <Text style={[styles.mallShortcutTitle, { color: colors.foreground }]}>前往你的商場</Text>
            <Text style={[styles.mallShortcutSubtitle, { color: colors.mutedForeground }]}>用打卡獎勵打造喜歡的街區</Text>
          </View>
          <Feather name="arrow-right" size={17} color={colors.primary} />
        </Pressable>

        {Platform.OS === 'web' ? (
          <Pressable
            style={[styles.reminderShortcut, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/reminders')}
            accessibilityRole="button"
            accessibilityLabel="設定每日打卡通知提醒"
            testID="today-reminder-shortcut"
          >
            <View style={[styles.reminderShortcutIcon, { backgroundColor: colors.candyPink }]}>
              <Feather name="bell" size={17} color={colors.primary} />
            </View>
            <View style={styles.mallShortcutCopy}>
              <Text style={[styles.mallShortcutTitle, { color: colors.foreground }]}>設定打卡提醒</Text>
              <Text style={[styles.mallShortcutSubtitle, { color: colors.mutedForeground }]}>每天選一個適合自己的時間</Text>
            </View>
            <Feather name="arrow-right" size={17} color={colors.primary} />
          </Pressable>
        ) : null}

        <View style={[styles.weekCard, { backgroundColor: colors.primary }]}>
          <View style={styles.weekHeader}>
            <View>
              <Text style={[styles.weekEyebrow, { color: colors.primaryForeground, opacity: 0.78 }]}>本週的你</Text>
              <Text style={[styles.weekScore, { color: colors.primaryForeground }]}>{scheduledTodayDone}<Text style={[styles.weekTotal, { color: colors.primaryForeground, opacity: 0.8 }]}> / {scheduledToday.length} 今日完成</Text></Text>
            </View>
            <View style={[styles.streakBadge, { backgroundColor: colors.candyLemon }]}>
              <Feather name="zap" size={14} color={colors.candyCaramelDark} />
              <Text style={[styles.streakText, { color: colors.foreground }]}>{totalStreak} 天連續</Text>
            </View>
          </View>
          <View style={styles.weekDays}>
            {week.map((day) => {
              const doneCount = habits.filter((habit) => habit.checkIns.includes(day.key)).length;
              const isToday = day.key === today;
              return (
                <View key={day.key} style={styles.dayColumn}>
                  <Text style={[styles.dayName, { color: colors.primaryForeground, opacity: 0.72 }, isToday && { opacity: 1, fontWeight: '700' }]}>{day.label}</Text>
                  <View style={[
                    styles.dayDot,
                    { backgroundColor: doneCount > 0 ? colors.candyMint : colors.candyRoseDark },
                    isToday && { width: 22, height: 22, borderRadius: 8, backgroundColor: colors.candyLemon },
                  ]}>
                    {doneCount > 0 && <View style={[styles.dayDotInner, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[styles.dayNumber, { color: colors.primaryForeground, opacity: 0.72 }, isToday && { opacity: 1, fontWeight: '700' }]}>{day.day}</Text>
                </View>
              );
            })}
          </View>
          <View style={styles.progressRow}>
            <View style={[styles.progressTrack, { backgroundColor: colors.candyRoseDark }]}>
              <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: colors.candyLemon }]} />
            </View>
            <Text style={[styles.progressLabel, { color: colors.primaryForeground }]}>{percent}%</Text>
          </View>
        </View>

        {restartHabit ? (
          <View style={[styles.restartCard, { backgroundColor: colors.secondary }] } testID="gentle-restart-card">
            <View style={[styles.restartIcon, { backgroundColor: colors.candyPink }]}>
              <Feather name="heart" size={17} color={colors.primary} />
            </View>
            <View style={styles.restartCopy}>
              <Text style={[styles.restartTitle, { color: colors.foreground }]}>重新開始也算進步</Text>
              <Text style={[styles.restartSubtitle, { color: colors.mutedForeground }]}>
                漏掉幾天不會抹掉之前的努力。今天只選一個小步驟，從兩分鐘開始就好。
              </Text>
            </View>
            <Pressable
              onPress={() => {
                setFocusHabit(restartHabit);
                setFocusActionIsRecommendation(false);
                setFocusStartPrompt(null);
              }}
              accessibilityRole="button"
              accessibilityLabel={`從兩分鐘開始重新進行${restartHabit.title}`}
              testID="gentle-restart-action"
              style={({ pressed }) => [styles.restartButton, { backgroundColor: colors.primary, opacity: pressed ? 0.75 : 1 }]}
            >
              <Feather name="play" size={14} color={colors.primaryForeground} />
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>今天的練習</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>長按目標或點「⋯」即可修改或刪除</Text>
          </View>
          <View style={styles.sectionTools}>
            <Text style={[styles.counter, { color: colors.primary }]}>{todayCounter}</Text>
            <Pressable
              onPress={() => {
                if (focusedHabitId) {
                  setFocusedHabitId(null);
                  setIsChoosingFocusedHabit(false);
                } else {
                  setIsChoosingFocusedHabit((current) => !current);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={focusedHabitId ? '顯示全部目標' : '選擇今天專注的一個目標'}
              testID="today-focus-toggle"
              style={({ pressed }) => [
                styles.focusToggle,
                { backgroundColor: focusedHabitId ? colors.primary : colors.secondary, opacity: pressed ? 0.72 : 1 },
              ]}
            >
              <Feather name={focusedHabitId ? 'list' : 'target'} size={13} color={focusedHabitId ? colors.primaryForeground : colors.primary} />
              <Text style={[styles.focusToggleText, { color: focusedHabitId ? colors.primaryForeground : colors.primary }]}>
                {focusedHabitId ? '全部' : '專注一項'}
              </Text>
            </Pressable>
          </View>
        </View>

        {!isLoading && habits.length > 0 ? (
          <View style={[styles.quickStartCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="quick-start-card">
            <View style={styles.quickStartHeading}>
              <View style={[styles.quickStartIcon, { backgroundColor: colors.candyLemon }]}>
                <Feather name="zap" size={16} color={colors.candyCaramelDark} />
              </View>
              <View style={styles.quickStartCopy}>
                <Text style={[styles.quickStartTitle, { color: colors.foreground }]}>選一種方式，輕鬆開始</Text>
                <Text style={[styles.quickStartSubtitle, { color: colors.mutedForeground }]}>不用等有動力，先做一小步就可以</Text>
              </View>
            </View>
            <View style={styles.scenarioRow}>
              {START_SCENARIOS.map((scenario) => {
                const selected = startScenario === scenario.id;
                return (
                  <Pressable
                    key={scenario.id}
                    onPress={() => setStartScenario(selected ? null : scenario.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`我${scenario.label}，幫我開始一個目標`}
                    testID={`start-scenario-${scenario.id}`}
                    style={({ pressed }) => [
                      styles.scenarioButton,
                      {
                        backgroundColor: selected ? colors.primary : colors.secondary,
                        borderColor: selected ? colors.primary : colors.border,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Feather name={scenario.icon} size={13} color={selected ? colors.primaryForeground : colors.primary} />
                    <Text style={[styles.scenarioText, { color: selected ? colors.primaryForeground : colors.primary }]}>{scenario.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {startScenario ? (
              <View style={[styles.quickStartChoices, { backgroundColor: colors.background }]} testID="quick-start-choices">
                <Text style={[styles.quickStartPrompt, { color: colors.foreground }]}>
                  {START_SCENARIO_PROMPTS[startScenario]} 選一個目標開始：
                </Text>
                {startableHabits.length > 0 ? startableHabits.map((habit) => {
                  const action = habit.minimumAction ?? recommendMinimumAction(habit);
                  return (
                    <Pressable
                      key={habit.id}
                      onPress={() => {
                        setFocusHabit({ ...habit, minimumAction: action });
                        setFocusActionIsRecommendation(!habit.minimumAction);
                        setFocusStartPrompt(START_SCENARIO_PROMPTS[startScenario]);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`開始${habit.title}：${action}，兩分鐘`}
                      testID={`quick-start-habit-${habit.id}`}
                      style={({ pressed }) => [
                        styles.quickStartHabit,
                        { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
                      ]}
                    >
                      <View style={[styles.quickStartHabitIcon, { backgroundColor: habit.color }]}>
                        <Feather name={habit.icon as keyof typeof Feather.glyphMap} size={14} color={colors.foreground} />
                      </View>
                      <View style={styles.quickStartHabitCopy}>
                        <Text style={[styles.quickStartHabitTitle, { color: colors.foreground }]} numberOfLines={1}>{habit.title}</Text>
                        <Text style={[styles.quickStartHabitAction, { color: colors.mutedForeground }]} numberOfLines={1}>{action}</Text>
                      </View>
                      <Feather name="play-circle" size={20} color={colors.primary} />
                    </Pressable>
                  );
                }) : (
                  <Text style={[styles.quickStartEmpty, { color: colors.mutedForeground }]}>今天的目標都完成了，現在可以安心休息。</Text>
                )}
              </View>
            ) : null}
          </View>
        ) : null}

        {isChoosingFocusedHabit ? (
          <View style={[styles.focusChooser, { backgroundColor: colors.secondary }]} testID="today-focus-chooser">
            <Text style={[styles.focusChooserTitle, { color: colors.foreground }]}>今天先專注哪一項？</Text>
            <Text style={[styles.focusChooserSubtitle, { color: colors.mutedForeground }]}>其他目標會保留，稍後可再顯示全部。</Text>
            {startableHabits.length > 0 ? startableHabits.map((habit) => (
              <Pressable
                key={habit.id}
                onPress={() => {
                  setFocusedHabitId(habit.id);
                  setIsChoosingFocusedHabit(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`今天專注${habit.title}`}
                testID={`choose-focus-habit-${habit.id}`}
                style={({ pressed }) => [
                  styles.focusChoice,
                  { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Feather name="target" size={15} color={colors.primary} />
                <Text style={[styles.focusChoiceText, { color: colors.foreground }]} numberOfLines={1}>{habit.title}</Text>
                <Feather name="chevron-right" size={15} color={colors.mutedForeground} />
              </Pressable>
            )) : (
              <Text style={[styles.quickStartEmpty, { color: colors.mutedForeground }]}>今天沒有待完成目標，可以先休息。</Text>
            )}
            <Pressable
              onPress={() => setIsChoosingFocusedHabit(false)}
              accessibilityRole="button"
              testID="cancel-focus-choice"
              style={styles.focusChooserCancel}
            >
              <Text style={[styles.focusChooserCancelText, { color: colors.primary }]}>取消</Text>
            </Pressable>
          </View>
        ) : null}

        {focusedHabit ? (
          <View style={[styles.focusedNotice, { backgroundColor: colors.candyPink }]} testID="today-focused-notice">
            <Feather name="target" size={14} color={colors.primary} />
            <Text style={[styles.focusedNoticeText, { color: colors.foreground }]} numberOfLines={1}>
              目前專注：{focusedHabit.title}
            </Text>
            <Pressable
              onPress={() => setFocusedHabitId(null)}
              accessibilityRole="button"
              accessibilityLabel="顯示全部目標"
              testID="show-all-habits"
              style={styles.showAllButton}
            >
              <Text style={[styles.showAllText, { color: colors.primary }]}>顯示全部</Text>
            </Pressable>
          </View>
        ) : null}

        {storageError && (
          <View style={[styles.errorBox, { backgroundColor: colors.candyPink }]}>
            <Feather name="alert-circle" size={16} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>{storageError}</Text>
          </View>
        )}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        ) : habits.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="sun" size={24} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>從一個小目標開始</Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>挑一件你想為自己做到的事，今天就可以開始。</Text>
            <Pressable style={[styles.emptyAction, { backgroundColor: colors.primary }]} onPress={() => router.push('/habit-editor')}>
              <Text style={[styles.emptyActionText, { color: colors.primaryForeground }]}>新增第一個目標</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.habitList}>
            {visibleHabits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                done={habit.checkIns.includes(today)}
                reward={getCheckInReward(habit.id)}
                isRestDay={habit.restDays.includes(getWeekday(today))}
                canMakeUp={canMakeUpYesterday(habit, today, makeupDatesThisAccount)}
                showMakeUp={
                  habit.createdAt <= getPreviousLocalDate(today)
                  && !habit.checkIns.includes(getPreviousLocalDate(today))
                  && !habit.restDays.includes(getWeekday(getPreviousLocalDate(today)))
                }
                makeUpRewardAlreadyEarned={rewardedCheckIns.includes(`${habit.id}:${getPreviousLocalDate(today)}`)}
                completedStep={habit.stepCheckIns[today]}
                onToggle={(step) => handleToggle(habit, step)}
                onMakeUp={() => handleMakeUp(habit)}
                onStartTwoMinute={(minimumAction, isRecommendation) => {
                  setFocusHabit({ ...habit, minimumAction });
                  setFocusActionIsRecommendation(isRecommendation);
                  setFocusStartPrompt(null);
                }}
                onEdit={() => router.push({ pathname: '/habit-editor', params: { id: habit.id } })}
                onManage={() => openHabitActions(habit)}
              />
            ))}
          </View>
        )}

        <View style={[styles.quoteCard, { backgroundColor: colors.secondary }]}>
          <View style={[styles.quoteMark, { backgroundColor: colors.candyMint }]}>
            <Feather name="heart" size={17} color={colors.primary} />
          </View>
          <View style={styles.quoteCopy}>
            <Text style={[styles.quoteTitle, { color: colors.foreground }]}>記得對自己好一點</Text>
            <Text style={[styles.quoteText, { color: colors.mutedForeground }]}>{dailyQuote}</Text>
          </View>
        </View>
      </ScrollView>
      <Modal
        testID="habit-action-modal"
        visible={selectedHabit !== null}
        transparent
        animationType={reduceMotion === false ? 'fade' : 'none'}
        onRequestClose={closeHabitActions}
      >
        <View style={styles.actionBackdrop}>
          <Pressable
            style={styles.actionBackdropDismiss}
            onPress={closeHabitActions}
            accessibilityRole="button"
            accessibilityLabel="關閉目標選單"
            testID="dismiss-habit-actions"
          />
          <View
            style={[styles.actionPanel, { backgroundColor: colors.card, borderColor: colors.border }]}
            accessibilityViewIsModal
          >
            {confirmingDelete ? (
              <>
                <Text style={[styles.actionTitle, { color: colors.foreground }]} accessibilityRole="header">
                  刪除「{selectedHabit?.title}」？
                </Text>
                <Text style={[styles.actionDescription, { color: colors.mutedForeground }]}>
                  過去的打卡紀錄也會一併刪除，這個動作無法復原。已領取的金幣不會扣回。
                </Text>
                {deleteError && (
                  <Text style={[styles.actionError, { color: colors.destructive }]} accessibilityRole="alert">
                    {deleteError}
                  </Text>
                )}
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                  onPress={() => {
                    setConfirmingDelete(false);
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  accessibilityRole="button"
                  testID="cancel-delete-habit"
                >
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>保留目標</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.destructive, opacity: isDeleting ? 0.7 : 1 }]}
                  onPress={() => void confirmDeleteHabit()}
                  disabled={isDeleting}
                  accessibilityRole="button"
                  testID="confirm-delete-habit"
                >
                  <Feather name="trash-2" size={17} color={colors.primaryForeground} />
                  <Text style={[styles.actionButtonText, { color: colors.primaryForeground }]}>
                    {isDeleting ? '刪除中…' : '確定刪除'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={[styles.actionTitle, { color: colors.foreground }]} accessibilityRole="header">
                  管理目標
                </Text>
                <Text style={[styles.actionDescription, { color: colors.mutedForeground }]}>
                  {selectedHabit?.title}
                </Text>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.secondary }]}
                  onPress={editSelectedHabit}
                  accessibilityRole="button"
                  testID={`edit-habit-${selectedHabit?.id ?? ''}`}
                >
                  <Feather name="edit-2" size={17} color={colors.primary} />
                  <Text style={[styles.actionButtonText, { color: colors.primary }]}>修改目標</Text>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.candyPink }]}
                  onPress={() => {
                    setConfirmingDelete(true);
                    setDeleteError(null);
                  }}
                  accessibilityRole="button"
                  testID={`delete-habit-${selectedHabit?.id ?? ''}`}
                >
                  <Feather name="trash-2" size={17} color={colors.destructive} />
                  <Text style={[styles.actionButtonText, { color: colors.destructive }]}>刪除目標</Text>
                </Pressable>
                <Pressable
                  style={styles.actionCancel}
                  onPress={closeHabitActions}
                  accessibilityRole="button"
                >
                  <Text style={[styles.actionCancelText, { color: colors.mutedForeground }]}>取消</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
      {focusHabit ? (
        <TwoMinuteStarterModal
          habit={focusHabit}
          reduceMotion={reduceMotion}
          minimumActionIsRecommendation={focusActionIsRecommendation}
          startPrompt={focusStartPrompt}
          onClose={() => {
            setFocusHabit(null);
            setFocusActionIsRecommendation(false);
            setFocusStartPrompt(null);
          }}
          onCompleteMinimumAction={focusHabit.minimumAction
            ? () => handleToggle(
              focusHabit,
              undefined,
              getMinimumActionReward(focusHabit.title, focusHabit.minimumAction ?? '先做 2 分鐘'),
            )
            : undefined}
          onSnooze={() => scheduleHabitSnooze(focusHabit)}
          onOpenReminderSettings={openReminderSettingsFromSnooze}
        />
      ) : null}
    </SafeAreaView>
  );
}

export default function IndexScreen() {
  return <Redirect href="/welcome" />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 22, gap: 0 },
  topline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  coinPill: { height: 38, paddingHorizontal: 11, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  coinText: { fontSize: 13, fontWeight: '700' },
  brand: { fontSize: 11, fontWeight: '700', letterSpacing: 2.2 },
  date: { fontSize: 13, marginTop: 5 },
  addButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  greeting: { marginTop: 28, marginBottom: 20 },
  greetingTitle: { fontSize: 25, fontWeight: '700', letterSpacing: -0.6 },
  greetingBody: { fontSize: 14, marginTop: 8, lineHeight: 21 },
  mallShortcut: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 17, padding: 12, marginBottom: 10 },
  mallShortcutIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  reminderShortcut: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 17, borderWidth: 1, padding: 12, marginBottom: 17 },
  reminderShortcutIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  mallShortcutCopy: { flex: 1 },
  mallShortcutTitle: { fontSize: 12, fontWeight: '700' },
  mallShortcutSubtitle: { fontSize: 10, marginTop: 4 },
  weekCard: { borderRadius: 24, padding: 20, overflow: 'hidden' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekEyebrow: { fontSize: 12, fontWeight: '500' },
  weekScore: { fontSize: 25, fontWeight: '700', marginTop: 5 },
  weekTotal: { fontSize: 13, fontWeight: '500' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 99 },
  streakText: { fontSize: 11, fontWeight: '700' },
  weekDays: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  dayColumn: { alignItems: 'center', gap: 7, minWidth: 25 },
  dayName: { fontSize: 10 },
  dayDot: { width: 7, height: 7, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  dayDotInner: { width: 3, height: 3, borderRadius: 2 },
  dayNumber: { fontSize: 11 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
  progressTrack: { height: 5, flex: 1, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99 },
  progressLabel: { fontSize: 11, fontWeight: '600', width: 30, textAlign: 'right' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { fontSize: 12, marginTop: 4 },
  sectionTools: { alignItems: 'flex-end', gap: 7 },
  focusToggle: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, borderRadius: 10 },
  focusToggleText: { fontSize: 10, fontWeight: '700' },
  counter: { fontSize: 14, fontWeight: '700' },
  quickStartCard: { borderWidth: 1, borderRadius: 19, padding: 13, marginBottom: 12 },
  quickStartHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  quickStartIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickStartCopy: { flex: 1, minWidth: 0 },
  quickStartTitle: { fontSize: 13, fontWeight: '700' },
  quickStartSubtitle: { fontSize: 10, marginTop: 3 },
  scenarioRow: { flexDirection: 'row', gap: 7, marginTop: 12 },
  scenarioButton: { flex: 1, minHeight: 37, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1, borderRadius: 11, paddingHorizontal: 5 },
  scenarioText: { fontSize: 10, fontWeight: '700' },
  quickStartChoices: { borderRadius: 13, padding: 9, marginTop: 11, gap: 6 },
  quickStartPrompt: { fontSize: 10, lineHeight: 15, marginBottom: 2 },
  quickStartHabit: { minHeight: 49, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8 },
  quickStartHabitIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickStartHabitCopy: { flex: 1, minWidth: 0 },
  quickStartHabitTitle: { fontSize: 11, fontWeight: '700' },
  quickStartHabitAction: { fontSize: 9, marginTop: 3 },
  quickStartEmpty: { fontSize: 11, lineHeight: 16, paddingVertical: 6 },
  focusChooser: { borderRadius: 17, padding: 13, marginBottom: 11 },
  focusChooserTitle: { fontSize: 13, fontWeight: '700' },
  focusChooserSubtitle: { fontSize: 10, marginTop: 4, marginBottom: 7 },
  focusChoice: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, marginTop: 6 },
  focusChoiceText: { flex: 1, fontSize: 11, fontWeight: '600' },
  focusChooserCancel: { alignSelf: 'flex-end', paddingHorizontal: 9, paddingVertical: 7, marginTop: 3 },
  focusChooserCancelText: { fontSize: 10, fontWeight: '700' },
  focusedNotice: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 12, paddingHorizontal: 10, marginBottom: 10 },
  focusedNoticeText: { flex: 1, fontSize: 10, fontWeight: '700' },
  showAllButton: { paddingVertical: 7, paddingLeft: 5 },
  showAllText: { fontSize: 10, fontWeight: '700' },
  habitList: { gap: 10 },
  habitCard: { minHeight: 75, borderRadius: 19, borderWidth: 1, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  habitIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  habitInfo: { flex: 1, justifyContent: 'center', minWidth: 0 },
  habitTitleArea: { minWidth: 0 },
  manageButton: { width: 32, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  habitTitle: { fontSize: 15, fontWeight: '600' },
  doneText: { textDecorationLine: 'line-through', opacity: 0.62 },
  habitReason: { fontSize: 11, marginTop: 5 },
  habitRestNote: { fontSize: 10, fontWeight: '700', marginTop: 6 },
  minimumActionNote: { fontSize: 10, lineHeight: 15, marginTop: 6 },
  stepList: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 7 },
  stepChip: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 9 },
  stepChipText: { fontSize: 10, maxWidth: 160 },
  habitStepDone: { fontSize: 10, marginTop: 6 },
  focusStartButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 },
  focusStartText: { fontSize: 10, fontWeight: '700' },
  checkActionGroup: { alignItems: 'center', gap: 2 },
  checkActionLabel: { fontSize: 9, fontWeight: '600' },
  makeupButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 9 },
  makeupText: { fontSize: 10, fontWeight: '700' },
  rewardHint: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, marginTop: 6 },
  rewardHintText: { fontSize: 10, fontWeight: '700' },
  checkButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  loader: { paddingVertical: 30 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 12 },
  errorText: { fontSize: 12, flex: 1 },
  emptyCard: { borderWidth: 1, borderRadius: 20, alignItems: 'center', padding: 24, gap: 9 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  emptyCopy: { fontSize: 13, lineHeight: 20, textAlign: 'center' },
  emptyAction: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, marginTop: 8 },
  emptyActionText: { fontSize: 13, fontWeight: '600' },
  quoteCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, marginTop: 19, marginBottom: 2, padding: 15 },
  quoteMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  quoteCopy: { flex: 1 },
  quoteTitle: { fontSize: 13, fontWeight: '600' },
  quoteText: { fontSize: 11, marginTop: 4 },
  restartCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 13, borderRadius: 17, padding: 12 },
  restartIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  restartCopy: { flex: 1, minWidth: 0 },
  restartTitle: { fontSize: 12, fontWeight: '700' },
  restartSubtitle: { fontSize: 10, lineHeight: 15, marginTop: 4 },
  restartButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  focusBackdrop: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(38, 25, 42, 0.42)' },
  focusPanel: { width: '100%', maxWidth: 390, maxHeight: '92%', alignSelf: 'center', borderWidth: 1, borderRadius: 25, padding: 0, overflow: 'hidden' },
  focusScroll: { flexShrink: 1 },
  focusPanelContent: { padding: 22 },
  focusHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  focusIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  focusTitleCopy: { flex: 1, minWidth: 0 },
  focusTitle: { fontSize: 17, fontWeight: '700' },
  focusSubtitle: { fontSize: 11, marginTop: 3 },
  focusPrompt: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 17, paddingHorizontal: 8 },
  focusClose: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  focusTimer: { textAlign: 'center', fontSize: 54, fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 27 },
  focusTrack: { height: 8, borderRadius: 99, overflow: 'hidden', marginTop: 14 },
  focusFill: { height: '100%', borderRadius: 99 },
  focusMessage: { textAlign: 'center', fontSize: 12, lineHeight: 18, marginTop: 15, minHeight: 36 },
  minimumActionCard: { borderRadius: 15, padding: 13, marginTop: 19 },
  minimumActionLabel: { fontSize: 10, fontWeight: '700' },
  minimumActionDetail: { fontSize: 14, lineHeight: 21, fontWeight: '600', marginTop: 4 },
  minimumRewardCopy: { fontSize: 10, lineHeight: 15, marginTop: 5, fontWeight: '600' },
  minimumCompleteButton: { minHeight: 47, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 15 },
  minimumCompleteText: { fontSize: 12, fontWeight: '700' },
  focusActions: { gap: 9, marginTop: 22 },
  focusPrimary: { minHeight: 47, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  focusPrimaryText: { fontSize: 13, fontWeight: '700' },
  focusSecondary: { minHeight: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  focusSecondaryText: { fontSize: 12, fontWeight: '700' },
  rescueCard: { borderWidth: 1, borderRadius: 16, padding: 12, marginTop: 13 },
  rescueTitle: { fontSize: 13, fontWeight: '700' },
  rescueDescription: { fontSize: 10, lineHeight: 15, marginTop: 4, marginBottom: 8 },
  rescueOption: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, marginTop: 7 },
  rescueOptionCopy: { flex: 1, minWidth: 0 },
  rescueOptionTitle: { fontSize: 11, fontWeight: '700' },
  rescueOptionDescription: { fontSize: 9, lineHeight: 13, marginTop: 2 },
  rescueError: { fontSize: 10, lineHeight: 15, marginTop: 8 },
  rescueSettingsLink: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 7 },
  rescueSettingsText: { fontSize: 10, fontWeight: '700' },
  rescueFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  rescueTextButton: { paddingVertical: 9, paddingHorizontal: 4 },
  rescueFooterText: { fontSize: 10, fontWeight: '700' },
  actionBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: 'rgba(38, 25, 42, 0.38)' },
  actionBackdropDismiss: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  actionPanel: { width: '100%', maxWidth: 440, alignSelf: 'center', borderWidth: 1, borderRadius: 24, padding: 20, gap: 10 },
  actionTitle: { fontSize: 18, fontWeight: '700' },
  actionDescription: { fontSize: 13, lineHeight: 20, marginBottom: 3 },
  actionError: { fontSize: 12, lineHeight: 18 },
  actionButton: { minHeight: 48, borderRadius: 15, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  actionButtonText: { fontSize: 14, fontWeight: '700' },
  actionCancel: { minHeight: 42, alignItems: 'center', justifyContent: 'center', padding: 8 },
  actionCancelText: { fontSize: 13, fontWeight: '600' },
});
