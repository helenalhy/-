import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getLocalDate, getStreak, useHabits } from '@/context/HabitsContext';
import { getDailyMotivationalQuote } from '@/constants/daily-motivation';

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { habits, today } = useHabits();
  const [quoteDate, setQuoteDate] = useState(today);
  useEffect(() => {
    const refreshQuoteDate = () => {
      const currentDate = getLocalDate();
      setQuoteDate((previousDate) => previousDate === currentDate ? previousDate : currentDate);
    };
    refreshQuoteDate();
    const interval = setInterval(refreshQuoteDate, 60_000);
    return () => clearInterval(interval);
  }, []);
  const dailyQuote = getDailyMotivationalQuote(quoteDate);
  const [year, month, day] = today.split('-').map(Number);
  const todayDate = new Date(year, month - 1, day);
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - ((todayDate.getDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const count = habits.filter((habit) => habit.checkIns.includes(key)).length;
    return { key, count, label: weekdays[index], day: date.getDate() };
  });
  const weeklyDone = week.reduce((sum, dayItem) => sum + dayItem.count, 0);
  const totalCheckIns = habits.reduce((sum, habit) => sum + habit.checkIns.length, 0);
  const longestStreak = Math.max(0, ...habits.map((habit) => getStreak(habit.checkIns, today)));
  const mostConsistent = [...habits].sort((a, b) => b.checkIns.length - a.checkIns.length)[0];
  const maxBar = Math.max(1, ...week.map((item) => item.count));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: Platform.OS === 'web' ? 67 : 12, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 28 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: colors.primary }]}>YOUR JOURNEY</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>進步，正在發生。</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>每一個小小的選擇，都值得被看見。</Text>

        <View style={styles.metricGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.candyLemon }]}><Feather name="zap" size={17} color={colors.candyCaramelDark} /></View>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{longestStreak}<Text style={styles.metricUnit}> 天</Text></Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>目前最長連續</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.metricIcon, { backgroundColor: colors.candyMint }]}><Feather name="check-circle" size={17} color={colors.primary} /></View>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>{totalCheckIns}<Text style={styles.metricUnit}> 次</Text></Text>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>累積完成打卡</Text>
          </View>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeading}>
            <View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>本週節奏</Text>
              <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>完成了 {weeklyDone} 次小練習</Text>
            </View>
            <View style={[styles.chartBadge, { backgroundColor: colors.secondary }]}>
              <Feather name="trending-up" size={15} color={colors.primary} />
            </View>
          </View>
          <View style={styles.chart}>
            {week.map((item) => {
              const height = item.count === 0 ? 7 : Math.max(15, (item.count / maxBar) * 92);
              const isToday = item.key === today;
              return (
                <View style={styles.barColumn} key={item.key}>
                  <Text style={[styles.barCount, { color: colors.mutedForeground }]}>{item.count > 0 ? item.count : ''}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.bar, { height, backgroundColor: isToday ? colors.primary : item.count > 0 ? colors.candyMintDark : colors.muted }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: isToday ? colors.primary : colors.mutedForeground }]}>{item.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>你正在堅持的事</Text>
        {habits.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="bar-chart-2" size={22} color={colors.primary} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>開始一個小目標，這裡就會記下你的每一步。</Text>
          </View>
        ) : (
          <View style={styles.habitStats}>
            {habits.map((habit) => {
              const streak = getStreak(habit.checkIns, today);
              const isTop = mostConsistent?.id === habit.id && habit.checkIns.length > 0;
              return (
                <View key={habit.id} style={[styles.habitStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statIcon, { backgroundColor: habit.color }]}>
                    <Feather name={habit.icon as keyof typeof Feather.glyphMap} size={17} color={colors.foreground} />
                  </View>
                  <View style={styles.statCopy}>
                    <View style={styles.statTitleRow}>
                      <Text numberOfLines={1} style={[styles.statTitle, { color: colors.foreground }]}>{habit.title}</Text>
                      {isTop && <Text style={[styles.topTag, { color: colors.primary, backgroundColor: colors.secondary }]}>最常完成</Text>}
                    </View>
                    <Text style={[styles.statSubtitle, { color: colors.mutedForeground }]}>{habit.checkIns.length} 次完成</Text>
                  </View>
                  <View style={[styles.statStreak, { backgroundColor: colors.candyLemon }]}>
                    <Feather name="zap" size={13} color={colors.candyCaramelDark} />
                    <Text style={[styles.streakNumber, { color: colors.foreground }]}>{streak}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={[styles.noteCard, { backgroundColor: colors.secondary }]}>
          <Feather name="sun" size={17} color={colors.primary} />
          <Text style={[styles.noteText, { color: colors.foreground }]}>{dailyQuote}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 22 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 26, fontWeight: '700', marginTop: 9, letterSpacing: -0.6 },
  subtitle: { fontSize: 13, marginTop: 7, lineHeight: 20 },
  metricGrid: { flexDirection: 'row', gap: 11, marginTop: 22 },
  metricCard: { flex: 1, borderWidth: 1, borderRadius: 19, padding: 15, minHeight: 132 },
  metricIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 26, fontWeight: '700', marginTop: 12 },
  metricUnit: { fontSize: 13, fontWeight: '600' },
  metricLabel: { fontSize: 11, marginTop: 3 },
  chartCard: { borderWidth: 1, borderRadius: 21, padding: 17, marginTop: 13 },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSubtitle: { fontSize: 11, marginTop: 5 },
  chartBadge: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  chart: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, height: 134 },
  barColumn: { alignItems: 'center', flex: 1, gap: 5 },
  barCount: { fontSize: 10, height: 12 },
  barTrack: { flex: 1, width: 16, justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: 16, borderRadius: 8 },
  barLabel: { fontSize: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 26, marginBottom: 12 },
  habitStats: { gap: 9 },
  habitStat: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 17, padding: 12, gap: 11 },
  statIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  statCopy: { flex: 1, minWidth: 0 },
  statTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statTitle: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  topTag: { overflow: 'hidden', fontSize: 9, fontWeight: '600', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7 },
  statSubtitle: { fontSize: 10, marginTop: 4 },
  statStreak: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10 },
  streakNumber: { fontSize: 12, fontWeight: '700' },
  emptyCard: { borderWidth: 1, borderRadius: 17, padding: 18, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 12, lineHeight: 19, textAlign: 'center' },
  noteCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14, borderRadius: 16, marginTop: 18 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 19 },
});
