import { Feather } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useReducedMotion } from '@/context/ReducedMotionContext';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';
import { getDogFluffyImage } from '@/constants/dog-fluffy-images';
import { MallObjectVisual } from '@/components/MallVisuals';
import type { MallItem } from '@/constants/mall';
import {
  DAILY_LOGIN_COINS,
  DAILY_LOGIN_STREAK_BONUS_COINS,
  DAILY_LOGIN_STREAK_LENGTH,
  getNextDailyLoginStreak,
} from '@/lib/daily-login-rewards';
import {
  GUEST_COLUMNS,
  GUEST_FRAME_CELLS,
  GUEST_FRAME_SIZES_BY_FLOOR,
  GUEST_ROWS,
  GUEST_SHEETS,
} from '@/constants/mall-guests';
import {
  getDailyDogGreeting,
  getNextDailyDogPose,
  getDailyMallVisitor,
  type DailyDogPose,
  getVisitorDiaryDates,
  getWeeklyMallEvent,
  getWeeklyMomentumDays,
} from '@/lib/daily-engagement';
import {
  DAILY_DOG_TASK_REWARD,
  getDailyDogTask,
  getDailyDogTaskRewardKey,
} from '@/lib/daily-dog-task';
import type { Habit } from '@/context/HabitsContext';
import type { EncouragementStyle } from '@/lib/daily-personalization';

function VisitorPortrait({ date, size = 52 }: { date: string; size?: number }) {
  const colors = useColors();
  const visitor = getDailyMallVisitor(date);
  const frame = GUEST_FRAME_SIZES_BY_FLOOR[visitor.floor - 1] ?? { width: 48, height: 64 };
  const frameCell = GUEST_FRAME_CELLS[visitor.guestIndex % GUEST_FRAME_CELLS.length];
  const frameHeight = size;
  const frameWidth = Math.round(frameHeight * (frame.width / frame.height));
  return (
    <View
      style={[
        styles.portrait,
        { width: frameWidth, height: frameHeight, backgroundColor: colors.secondary },
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image
        source={GUEST_SHEETS[visitor.floor - 1]}
        resizeMode="stretch"
        fadeDuration={0}
        style={{
          position: 'absolute',
          left: -frameCell.column * frameWidth,
          top: -frameCell.row * frameHeight,
          width: frameWidth * GUEST_COLUMNS,
          height: frameHeight * GUEST_ROWS,
        }}
      />
    </View>
  );
}

function formatDiaryDate(dateKey: string): string {
  const [, month, day] = dateKey.split('-').map(Number);
  return `${month}/${day}`;
}

export function DailyMallVisitorCard({
  today,
  checkInDates,
  hasCheckedInToday,
}: {
  today: string;
  checkInDates: readonly string[];
  hasCheckedInToday: boolean;
}) {
  const colors = useColors();
  const [diaryOpen, setDiaryOpen] = useState(false);
  const visitor = getDailyMallVisitor(today);
  const diaryDates = getVisitorDiaryDates(checkInDates, today);
  return (
    <>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="daily-mall-visitor">
        <View style={[styles.cardIcon, { backgroundColor: colors.candyMint }]}>
          <Feather name="map-pin" size={16} color={colors.primary} />
        </View>
        <VisitorPortrait date={today} size={62} />
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>今日來訪 · {visitor.floor}F</Text>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{visitor.floorTitle}的旅人</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>
            {hasCheckedInToday ? '旅人替你的今日進度留下了一段話。' : visitor.story}
          </Text>
        </View>
        <Pressable
          onPress={() => setDiaryOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="打開商場訪客日記"
          testID="open-visitor-diary"
          style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="book-open" size={16} color={colors.primary} />
        </Pressable>
      </View>

      <Modal
        visible={diaryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDiaryOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDiaryOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="關閉訪客日記"
          />
          <View style={[styles.diaryPanel, { backgroundColor: colors.card, borderColor: colors.border }]} accessibilityViewIsModal testID="visitor-diary">
            <View style={styles.diaryHeader}>
              <View style={styles.copy}>
                <Text style={[styles.title, { color: colors.foreground }]}>商場訪客日記</Text>
                <Text style={[styles.body, { color: colors.mutedForeground }]}>每次完成目標，都會為今天留下新的足跡。</Text>
              </View>
              <Pressable
                onPress={() => setDiaryOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="關閉訪客日記"
                style={styles.closeButton}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <ScrollView style={styles.diaryList} showsVerticalScrollIndicator={false}>
              {diaryDates.length > 0 ? diaryDates.map((date) => {
                const entry = getDailyMallVisitor(date);
                return (
                  <View key={date} style={[styles.diaryEntry, { backgroundColor: colors.secondary }]} testID={`visitor-diary-entry-${date}`}>
                    <VisitorPortrait date={date} size={48} />
                    <View style={styles.copy}>
                      <Text style={[styles.diaryDate, { color: colors.primary }]}>{formatDiaryDate(date)} · {entry.floor}F {entry.floorTitle}</Text>
                      <Text style={[styles.body, { color: colors.foreground }]}>{entry.story}</Text>
                    </View>
                  </View>
                );
              }) : (
                <View style={styles.emptyDiary}>
                  <Feather name="book-open" size={23} color={colors.primary} />
                  <Text style={[styles.body, { color: colors.mutedForeground, textAlign: 'center' }]}>
                    完成一個目標後，今天的旅人就會在這裡留下第一篇日記。
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function WeeklyMallEventCard({ habits, today }: { habits: readonly Habit[]; today: string }) {
  const colors = useColors();
  const event = getWeeklyMallEvent(today);
  const completedDays = getWeeklyMomentumDays(habits, today);
  const progress = Math.min(100, Math.round((completedDays / event.targetDays) * 100));
  const isComplete = completedDays >= event.targetDays;
  const icon = event.icon as keyof typeof Feather.glyphMap;
  return (
    <View style={[styles.eventCard, { backgroundColor: colors.secondary }]} testID="weekly-mall-event">
      <View style={[styles.eventIcon, { backgroundColor: isComplete ? colors.candyMint : colors.candyLemon }]}>
        <Feather name={icon} size={17} color={colors.primary} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>本週商場活動</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{event.title}</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>{event.description}</Text>
        <View style={[styles.eventTrack, { backgroundColor: colors.card }]}>
          <View style={[styles.eventFill, { width: `${progress}%`, backgroundColor: isComplete ? colors.candyMintDark : colors.primary }]} />
        </View>
        <Text style={[styles.eventStatus, { color: colors.primary }]}>
          {isComplete ? '本週活動完成！謝謝你替商場留下這些足跡。' : `完成日 ${Math.min(completedDays, event.targetDays)}/${event.targetDays} · 平常的目標就會累積`}
        </Text>
      </View>
    </View>
  );
}

export function DailyDogGreetingCard({
  today,
  celebrationCount,
  style,
}: {
  today: string;
  celebrationCount: number;
  style: EncouragementStyle;
}) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const [greeted, setGreeted] = useState(false);
  const { dog, greeting, reply } = getDailyDogGreeting(today, style);
  const native = Platform.OS !== 'web';
  const jump = useRef(new Animated.Value(0)).current;
  const confetti = useRef(new Animated.Value(0)).current;
  const previousCelebrationCount = useRef(celebrationCount);
  const [poseState, setPoseState] = useState<{ dogKey: string; pose: DailyDogPose }>({
    dogKey: dog.key,
    pose: 2,
  });
  const displayedPose = poseState.dogKey === dog.key ? poseState.pose : 2;

  const playCelebration = useCallback(() => {
    if (reduceMotion !== false) return undefined;
    jump.setValue(0);
    confetti.setValue(0);
    const animation = Animated.parallel([
      Animated.sequence([
        Animated.timing(jump, {
          toValue: 1,
          duration: 210,
          easing: Easing.out(Easing.quad),
          useNativeDriver: native,
        }),
        Animated.timing(jump, {
          toValue: 0,
          duration: 330,
          easing: Easing.in(Easing.quad),
          useNativeDriver: native,
        }),
      ]),
      Animated.timing(confetti, {
        toValue: 1,
        duration: 760,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: native,
      }),
    ]);
    animation.start(({ finished }) => {
      if (finished) confetti.setValue(0);
    });
    return animation;
  }, [confetti, jump, native, reduceMotion]);

  useEffect(() => {
    if (celebrationCount <= previousCelebrationCount.current) return;
    previousCelebrationCount.current = celebrationCount;
    const animation = playCelebration();
    return () => animation?.stop();
  }, [celebrationCount, playCelebration]);

  const confettiColors = [
    colors.candyPink,
    colors.candyLemon,
    colors.candyMint,
    colors.candySky,
    colors.candyLavender,
    colors.candyPeach,
    colors.candyRose,
    colors.candyMintDark,
  ];
  const confettiPieces = [
    { x: -22, y: -24, rotate: '300deg' },
    { x: -8, y: -31, rotate: '220deg' },
    { x: 10, y: -29, rotate: '320deg' },
    { x: 24, y: -18, rotate: '240deg' },
    { x: -25, y: 0, rotate: '300deg' },
    { x: 26, y: 2, rotate: '220deg' },
    { x: -18, y: 22, rotate: '320deg' },
    { x: 18, y: 23, rotate: '240deg' },
  ];

  return (
    <View style={[styles.dogCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="daily-dog-greeting">
      <View style={[styles.dogPortrait, { backgroundColor: dog.color }]}>
        {confettiPieces.map((piece, index) => (
          <Animated.View
            key={`confetti-${index}`}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
              styles.confettiPiece,
              { backgroundColor: confettiColors[index] },
              {
                opacity: confetti.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                transform: [
                  { translateX: confetti.interpolate({ inputRange: [0, 1], outputRange: [0, piece.x] }) },
                  { translateY: confetti.interpolate({ inputRange: [0, 1], outputRange: [0, piece.y] }) },
                  { rotate: confetti.interpolate({ inputRange: [0, 1], outputRange: ['0deg', piece.rotate] }) },
                ],
              },
            ]}
          />
        ))}
        <Animated.View style={{ transform: [{ translateY: jump.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }] }}>
          <ExpoImage
            source={getDogFluffyImage(dog.key, displayedPose)}
            style={styles.dailyDogPose}
            contentFit="contain"
            accessible={false}
          />
        </Animated.View>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>狗狗每日打招呼</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{dog.name}今天陪你</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>
          {greeted ? `${dog.name}：${reply}` : greeting}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          setGreeted(true);
          setPoseState((previous) => {
            const currentPose = previous.dogKey === dog.key ? previous.pose : 2;
            return { dogKey: dog.key, pose: getNextDailyDogPose(currentPose) };
          });
          playCelebration();
        }}
        accessibilityRole="button"
        accessibilityLabel={`和${dog.name}打招呼`}
        testID="greet-daily-dog"
        style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.candyPink, opacity: pressed ? 0.72 : 1 }]}
      >
        <Feather name="heart" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

export function DailyDogTaskCard({
  today,
  style,
  rewardedCheckIns,
  onClaim,
}: {
  today: string;
  style: EncouragementStyle;
  rewardedCheckIns: readonly string[];
  onClaim: () => Promise<number>;
}) {
  const colors = useColors();
  const { dog } = getDailyDogGreeting(today, style);
  const task = getDailyDogTask(today);
  const claimed = rewardedCheckIns.includes(getDailyDogTaskRewardKey(today));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claimLock = useRef(false);

  async function completeTask() {
    if (claimed || busy || claimLock.current) return;
    claimLock.current = true;
    setBusy(true);
    setError(null);
    try {
      const reward = await onClaim();
      if (reward <= 0) setError('今日任務已領取，明天再和狗狗一起挑戰。');
    } catch {
      setError('獎勵暫時未能保存，請再試一次。');
    } finally {
      claimLock.current = false;
      setBusy(false);
    }
  }

  return (
    <View style={[styles.dailyTaskCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="daily-dog-task">
      <View style={styles.dailyTaskMain}>
        <View style={[styles.dailyTaskPortrait, { backgroundColor: dog.color }]}>
          <DogAttendant kind={dog.kind as DogAttendantKind} happy={claimed} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>狗狗陪伴 · 每日小任務</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{dog.name}今天想和你一起完成</Text>
          <Text style={[styles.dailyTaskPrompt, { color: colors.foreground }]}>{task.title}</Text>
        </View>
      </View>
      <View style={styles.dailyTaskFooter}>
        <Text style={[styles.dailyTaskReward, { color: claimed ? colors.candyMintDark : colors.primary }]}>
          {claimed ? `已完成 · +${DAILY_DOG_TASK_REWARD} 金幣已入帳` : `完成後獲得 +${DAILY_DOG_TASK_REWARD} 金幣`}
        </Text>
        <Pressable
          onPress={() => void completeTask()}
          disabled={claimed || busy}
          accessibilityRole="button"
          accessibilityState={{ disabled: claimed || busy, busy }}
          accessibilityLabel={claimed ? '今日狗狗小任務已領取獎勵' : `完成今日狗狗小任務並領取 ${DAILY_DOG_TASK_REWARD} 金幣`}
          testID="claim-daily-dog-task"
          style={[
            styles.dailyTaskButton,
            { backgroundColor: claimed ? colors.candyMint : colors.candyPink, opacity: busy ? 0.65 : 1 },
          ]}
        >
          <Feather name={claimed ? 'check' : busy ? 'loader' : 'gift'} size={14} color={colors.primary} />
          <Text style={[styles.dailyTaskButtonText, { color: colors.primary }]}>
            {claimed ? '已領取' : busy ? '保存中…' : '我完成了'}
          </Text>
        </Pressable>
      </View>
      {error ? <Text style={[styles.dailyTaskError, { color: colors.destructive }]} accessibilityRole="alert">{error}</Text> : null}
    </View>
  );
}

export function DailyLoginRewardCard({
  today,
  lastLoginDate,
  streak,
  lastPrizeItem,
  nextPrizeItem,
  onClaim,
}: {
  today: string;
  lastLoginDate: string | null;
  streak: number;
  lastPrizeItem: MallItem | null;
  nextPrizeItem: MallItem | null;
  onClaim: () => Promise<void>;
}) {
  const colors = useColors();
  const claimed = lastLoginDate === today;
  const displayStreak = claimed ? streak : getNextDailyLoginStreak(today, lastLoginDate, streak);
  const [showPrizePreview, setShowPrizePreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const claimLock = useRef(false);
  const claimedDaySevenPrize = claimed && displayStreak === DAILY_LOGIN_STREAK_LENGTH;
  const previewPrizeItem = claimedDaySevenPrize ? lastPrizeItem : nextPrizeItem;

  async function claimReward() {
    if (claimed || busy || claimLock.current) return;
    claimLock.current = true;
    setBusy(true);
    setError(null);
    try {
      await onClaim();
    } catch {
      setError('簽到獎勵暫時未能保存，請再試一次。');
    } finally {
      claimLock.current = false;
      setBusy(false);
    }
  }

  return (
    <View
      style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="daily-login-reward"
    >
      <View style={styles.loginHeader}>
        <View style={[styles.loginIcon, { backgroundColor: colors.candyPink }]}>
          <Feather name={claimed && displayStreak === DAILY_LOGIN_STREAK_LENGTH ? 'award' : 'calendar'} size={17} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>每日簽到獎勵</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>
            連續第 {displayStreak} / {DAILY_LOGIN_STREAK_LENGTH} 日
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {claimed ? `今日已自動領取 +${DAILY_LOGIN_COINS} 金幣` : `開啟 App 即可領取 +${DAILY_LOGIN_COINS} 金幣`}
          </Text>
        </View>
      </View>

      <View style={styles.loginProgress} accessibilityLabel={`七日簽到進度 ${displayStreak} / ${DAILY_LOGIN_STREAK_LENGTH}`}>
        {Array.from({ length: DAILY_LOGIN_STREAK_LENGTH }, (_, index) => (
          index === DAILY_LOGIN_STREAK_LENGTH - 1 ? (
            <Pressable
              key={index}
              onPress={() => setShowPrizePreview(true)}
              accessibilityRole="button"
              accessibilityLabel="預覽連續七日簽到大獎"
              testID="daily-login-prize-preview"
              style={[
                styles.loginProgressDay,
                { backgroundColor: index < displayStreak ? colors.candyLemon : colors.secondary },
              ]}
            >
              <Feather name="gift" size={13} color={index < displayStreak ? colors.primary : colors.mutedForeground} />
            </Pressable>
          ) : (
            <View
              key={index}
              style={[
                styles.loginProgressDay,
                { backgroundColor: index < displayStreak ? colors.candyPink : colors.secondary },
              ]}
            >
              <Text style={[styles.loginProgressNumber, { color: index < displayStreak ? colors.primary : colors.mutedForeground }]}>{index + 1}</Text>
            </View>
          )
        ))}
      </View>

      <View style={styles.loginFooter}>
        <Text style={[styles.loginBonus, { color: colors.primary }]}>
          {claimedDaySevenPrize && lastPrizeItem
            ? `七日大獎已領取：${lastPrizeItem.name} · +${DAILY_LOGIN_STREAK_BONUS_COINS} 金幣`
            : claimed && displayStreak === DAILY_LOGIN_STREAK_LENGTH
              ? `七日簽到已完成 · +${DAILY_LOGIN_STREAK_BONUS_COINS} 金幣`
              : displayStreak === DAILY_LOGIN_STREAK_LENGTH
              ? `今日可領七日大獎 · 額外 +${DAILY_LOGIN_STREAK_BONUS_COINS} 金幣及商場裝飾`
              : `連續七日可得額外 +${DAILY_LOGIN_STREAK_BONUS_COINS} 金幣及商場裝飾`}
        </Text>
        {!claimed ? (
          <Pressable
            onPress={() => void claimReward()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={busy ? '正在保存每日簽到獎勵' : `領取今日 ${DAILY_LOGIN_COINS} 金幣簽到獎勵`}
            accessibilityState={{ disabled: busy, busy }}
            testID="claim-daily-login-reward"
            style={[styles.loginButton, { backgroundColor: colors.primary, opacity: busy ? 0.65 : 1 }]}
          >
            <Feather name={busy ? 'loader' : 'check'} size={13} color={colors.primaryForeground} />
            <Text style={[styles.loginButtonText, { color: colors.primaryForeground }]}>{busy ? '保存中…' : '今日簽到'}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={[styles.loginFootnote, { color: colors.mutedForeground }]}>點按第 7 日禮物預覽大獎；漏掉一天會重新計算連續天數。</Text>
      {error ? <Text style={[styles.dailyTaskError, { color: colors.destructive }]} accessibilityRole="alert">{error}</Text> : null}

      <Modal
        visible={showPrizePreview}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPrizePreview(false)}
      >
        <View style={styles.prizeBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setShowPrizePreview(false)}
            accessibilityRole="button"
            accessibilityLabel="關閉大獎預覽"
          />
          <View style={[styles.prizePanel, { backgroundColor: colors.card, borderColor: colors.border }]} testID="daily-login-prize-modal">
            <View style={styles.prizeHeader}>
              <View style={styles.copy}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>連續 7 日簽到大獎</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>第 7 日禮物</Text>
              </View>
              <Pressable
                onPress={() => setShowPrizePreview(false)}
                accessibilityRole="button"
                accessibilityLabel="關閉大獎預覽"
                style={styles.prizeClose}
              >
                <Feather name="x" size={18} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={[styles.prizeArt, { backgroundColor: previewPrizeItem?.color ?? colors.candyLemon }]}>
              {previewPrizeItem ? (
                <MallObjectVisual
                  id={previewPrizeItem.visual ?? previewPrizeItem.id}
                  itemId={previewPrizeItem.id}
                  itemName={previewPrizeItem.name}
                  floor={previewPrizeItem.floor}
                  color={previewPrizeItem.color}
                  icon={previewPrizeItem.icon}
                  category="decor"
                  isActive
                />
              ) : (
                <Feather name="star" size={32} color={colors.primary} />
              )}
            </View>
            <Text style={[styles.prizeName, { color: colors.foreground }]}>
              {previewPrizeItem?.name ?? '額外 30 金幣'}
            </Text>
            <Text style={[styles.prizeDescription, { color: colors.mutedForeground }]}>
              {previewPrizeItem
                ? '連續簽到 7 日即可免費獲得這件商場裝飾，並額外領取 30 金幣。'
                : '可兌換的裝飾已全部擁有；連續簽到 7 日仍會額外領取 30 金幣。'}
            </Text>
            <Pressable
              onPress={() => setShowPrizePreview(false)}
              accessibilityRole="button"
              accessibilityLabel="返回每日簽到"
              style={[styles.prizeDone, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.prizeDoneText, { color: colors.primaryForeground }]}>知道了</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function DailyRecapCard({
  today,
  habits,
  coins,
  earnedCoins,
}: {
  today: string;
  habits: readonly Habit[];
  coins: number;
  earnedCoins: number | null;
}) {
  const colors = useColors();
  const reduceMotion = useReducedMotion();
  const celebration = useRef(new Animated.Value(1)).current;
  const completed = habits.filter((habit) => habit.checkIns.includes(today));
  const previousCompletedCount = useRef(completed.length);
  useEffect(() => {
    if (reduceMotion !== false || completed.length <= previousCompletedCount.current) return undefined;
    previousCompletedCount.current = completed.length;
    celebration.setValue(0.88);
    const animation = Animated.sequence([
      Animated.spring(celebration, { toValue: 1.1, useNativeDriver: Platform.OS !== 'web', speed: 20, bounciness: 7 }),
      Animated.spring(celebration, { toValue: 1, useNativeDriver: Platform.OS !== 'web', speed: 18, bounciness: 5 }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [celebration, completed.length, reduceMotion]);
  if (completed.length === 0) return null;
  const names = completed.map((habit) => habit.title).slice(0, 3);
  const more = completed.length - names.length;
  return (
    <View style={[styles.recapCard, { backgroundColor: colors.candyPink }]} testID="daily-recap">
      <Animated.View style={[styles.cardIcon, { backgroundColor: colors.card, transform: [{ scale: celebration }] }]}>
        <Feather name={completed.length === habits.length ? 'award' : 'check-circle'} size={17} color={colors.primary} />
      </Animated.View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {completed.length === habits.length ? '今天的小步回顧' : '今天已經完成一小步'}
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          完成 {completed.length} 項：{names.join('、')}{more > 0 ? `，以及另外 ${more} 項` : ''}
        </Text>
        <Text style={[styles.recapReward, { color: colors.primary }]}>
          {earnedCoins === null ? '本機今日獎勵紀錄尚未建立' : `本機今日新得 ${earnedCoins} 金幣`}
          {' · '}目前餘額 {coins}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 11 },
  cardIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  portrait: { overflow: 'hidden', borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  title: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  body: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  iconButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBackdrop: { flex: 1, justifyContent: 'center', padding: 18, backgroundColor: 'rgba(38, 25, 42, 0.42)' },
  diaryPanel: { width: '100%', maxWidth: 440, maxHeight: '82%', alignSelf: 'center', borderWidth: 1, borderRadius: 23, padding: 16 },
  diaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 10 },
  closeButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  diaryList: { flexGrow: 0 },
  diaryEntry: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 10, borderRadius: 15, marginTop: 8 },
  diaryDate: { fontSize: 10, fontWeight: '700' },
  emptyDiary: { minHeight: 150, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 24 },
  eventCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderRadius: 18, padding: 13, marginTop: 11 },
  eventIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  eventTrack: { height: 6, borderRadius: 99, overflow: 'hidden', marginTop: 8 },
  eventFill: { height: '100%', borderRadius: 99 },
  eventStatus: { fontSize: 9, lineHeight: 13, fontWeight: '600', marginTop: 5 },
  dogCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 18, padding: 10, marginTop: 11 },
  dogPortrait: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'visible', zIndex: 1 },
  dailyDogPose: { width: 50, height: 50 },
  dailyTaskCard: { borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 10 },
  dailyTaskMain: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dailyTaskPortrait: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dailyTaskPrompt: { fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 4 },
  dailyTaskFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  dailyTaskReward: { flex: 1, fontSize: 10, fontWeight: '700' },
  dailyTaskButton: { minHeight: 34, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  dailyTaskButtonText: { fontSize: 10, fontWeight: '700' },
  dailyTaskError: { fontSize: 10, lineHeight: 14, marginTop: 7 },
  loginCard: { borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 10 },
  loginHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loginIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  loginProgress: { flexDirection: 'row', gap: 6, marginTop: 12 },
  loginProgressDay: { flex: 1, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  loginProgressNumber: { fontSize: 10, fontWeight: '700' },
  loginFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 10 },
  loginBonus: { flex: 1, fontSize: 10, lineHeight: 15, fontWeight: '700' },
  loginButton: { minHeight: 34, borderRadius: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  loginButtonText: { fontSize: 10, fontWeight: '700' },
  loginFootnote: { fontSize: 9, lineHeight: 13, marginTop: 7 },
  prizeBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(38, 25, 42, 0.42)' },
  prizePanel: { width: '100%', maxWidth: 360, borderWidth: 1, borderRadius: 23, padding: 18, alignItems: 'center' },
  prizeHeader: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  prizeClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  prizeArt: { width: 124, height: 100, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  prizeName: { fontSize: 16, fontWeight: '700', marginTop: 12, textAlign: 'center' },
  prizeDescription: { fontSize: 12, lineHeight: 18, marginTop: 7, textAlign: 'center' },
  prizeDone: { minHeight: 42, alignSelf: 'stretch', borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  prizeDoneText: { fontSize: 12, fontWeight: '700' },
  confettiPiece: { position: 'absolute', left: 23, top: 20, width: 5, height: 8, borderRadius: 2, zIndex: 2 },
  recapCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, padding: 12, marginTop: 11 },
  recapReward: { fontSize: 9, lineHeight: 14, fontWeight: '700', marginTop: 4 },
});
