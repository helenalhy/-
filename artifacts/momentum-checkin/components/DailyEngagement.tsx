import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import {
  GUEST_COLUMNS,
  GUEST_FRAME_CELLS,
  GUEST_FRAME_SIZES_BY_FLOOR,
  GUEST_ROWS,
  GUEST_SHEETS,
} from '@/constants/mall-guests';
import {
  getDailyDogGreeting,
  getDailyMallVisitor,
  getVisitorDiaryDates,
  getWeeklyMallEvent,
  getWeeklyMomentumDays,
} from '@/lib/daily-engagement';
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
  const { dog, greeting } = getDailyDogGreeting(today, style);
  const native = Platform.OS !== 'web';
  const bounce = useRef(new Animated.Value(1)).current;
  const previousCelebrationCount = useRef(celebrationCount);
  const [greeted, setGreeted] = useState(false);

  useEffect(() => {
    if (reduceMotion !== false) return undefined;
    if (celebrationCount <= previousCelebrationCount.current) return;
    previousCelebrationCount.current = celebrationCount;
    bounce.setValue(0.86);
    const animation = Animated.sequence([
      Animated.spring(bounce, { toValue: 1.12, useNativeDriver: native, speed: 22, bounciness: 10 }),
      Animated.spring(bounce, { toValue: 1, useNativeDriver: native, speed: 18, bounciness: 5 }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [bounce, celebrationCount, native, reduceMotion]);

  return (
    <View style={[styles.dogCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="daily-dog-greeting">
      <View style={[styles.dogPortrait, { backgroundColor: dog.color }]}>
        <Animated.View style={{ transform: [{ scale: bounce }] }}>
          <DogAttendant kind={dog.kind as DogAttendantKind} happy={greeted || celebrationCount > 0} />
        </Animated.View>
      </View>
      <View style={styles.copy}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>狗狗每日打招呼</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>{dog.name}今天陪你</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]} numberOfLines={2}>
          {greeted ? `${dog.name}：很高興今天也見到你！` : greeting}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          setGreeted(true);
          if (reduceMotion !== false) return;
          bounce.setValue(0.86);
          Animated.sequence([
            Animated.spring(bounce, { toValue: 1.12, useNativeDriver: native, speed: 22, bounciness: 10 }),
            Animated.spring(bounce, { toValue: 1, useNativeDriver: native, speed: 18, bounciness: 5 }),
          ]).start();
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
  dogPortrait: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  recapCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, padding: 12, marginTop: 11 },
  recapReward: { fontSize: 9, lineHeight: 14, fontWeight: '700', marginTop: 4 },
});
