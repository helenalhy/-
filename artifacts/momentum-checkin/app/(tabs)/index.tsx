import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import {
  getStreak,
  REWARD_CATEGORY_LABELS,
  useHabits,
  type Habit,
} from '@/context/HabitsContext';
import MallScreen from './mall';

const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

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

function HabitRow({ habit, done, onToggle, onEdit }: {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.habitCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.habitIcon, { backgroundColor: habit.color }]}>
        <Feather name={habit.icon as keyof typeof Feather.glyphMap} size={20} color={colors.foreground} />
      </View>
      <Pressable style={styles.habitInfo} onPress={onEdit} accessibilityRole="button" accessibilityLabel={`編輯${habit.title}`}>
        <Text style={[styles.habitTitle, { color: colors.foreground }, done && styles.doneText]}>{habit.title}</Text>
        <Text style={[styles.habitReason, { color: colors.mutedForeground }]} numberOfLines={1}>{habit.reason}</Text>
      </Pressable>
      <Pressable
        style={[styles.checkButton, { backgroundColor: done ? colors.primary : colors.secondary }]}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={done ? `取消${habit.title}打卡` : `完成${habit.title}`}
        testID={`checkin-${habit.id}`}
      >
        <Feather name={done ? 'check' : 'plus'} size={20} color={done ? colors.primaryForeground : colors.primary} />
      </Pressable>
    </View>
  );
}

export function TodayScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, isLoading, storageError, today, coins, toggleCheckIn } = useHabits();
  const week = getWeek(today);
  const todayDone = habits.filter((habit) => habit.checkIns.includes(today)).length;
  const percent = habits.length === 0 ? 0 : Math.round((todayDone / habits.length) * 100);
  const date = new Date(`${today}T12:00:00`);
  const weekday = dayNames[date.getDay()];
  const dateLabel = `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
  const totalStreak = Math.max(0, ...habits.map((habit) => getStreak(habit.checkIns, today)));

  async function handleToggle(habit: Habit) {
    try {
      const reward = await toggleCheckIn(habit.id);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (reward > 0) {
        Alert.alert(
          '太棒了，完成一小步！',
          `獲得 ${reward} 金幣和 1 張${REWARD_CATEGORY_LABELS[habit.rewardCategory]}，商場又更近一步了。`,
        );
      }
    } catch {
      Alert.alert('沒有儲存成功', '請再試一次。');
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
            <Pressable style={[styles.coinPill, { backgroundColor: colors.secondary }]} onPress={() => router.navigate('/')} accessibilityRole="button" accessibilityLabel={`${coins} 金幣，前往商場`}>
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
          onPress={() => router.navigate('/')}
          accessibilityRole="button"
          accessibilityLabel="前往商場"
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

        <View style={[styles.weekCard, { backgroundColor: colors.primary }]}>
          <View style={styles.weekHeader}>
            <View>
              <Text style={[styles.weekEyebrow, { color: colors.primaryForeground, opacity: 0.78 }]}>本週的你</Text>
              <Text style={[styles.weekScore, { color: colors.primaryForeground }]}>{todayDone}<Text style={[styles.weekTotal, { color: colors.primaryForeground, opacity: 0.8 }]}> / {habits.length} 今日完成</Text></Text>
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

        <View style={styles.sectionHeading}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>今天的練習</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>每一次打卡，都在累積改變</Text>
          </View>
          <Text style={[styles.counter, { color: colors.primary }]}>{todayDone}/{habits.length}</Text>
        </View>

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
            {habits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                done={habit.checkIns.includes(today)}
                onToggle={() => void handleToggle(habit)}
                onEdit={() => router.push({ pathname: '/habit-editor', params: { id: habit.id } })}
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
            <Text style={[styles.quoteText, { color: colors.mutedForeground }]}>休息不是放棄，也是照顧自己的方式。</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function IndexScreen() {
  return <MallScreen />;
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
  mallShortcut: { flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 17, padding: 12, marginBottom: 17 },
  mallShortcutIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
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
  counter: { fontSize: 14, fontWeight: '700' },
  habitList: { gap: 10 },
  habitCard: { minHeight: 75, borderRadius: 19, borderWidth: 1, flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  habitIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  habitInfo: { flex: 1, justifyContent: 'center', minWidth: 0 },
  habitTitle: { fontSize: 15, fontWeight: '600' },
  doneText: { textDecorationLine: 'line-through', opacity: 0.62 },
  habitReason: { fontSize: 11, marginTop: 5 },
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
});
