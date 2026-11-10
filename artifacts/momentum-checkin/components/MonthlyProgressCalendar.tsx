import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Habit } from '@/context/HabitsContext';
import { useColors } from '@/hooks/useColors';
import {
  getCalendarDayStatus,
  getCalendarDaySummary,
  getLocalMonthCalendarDays,
} from '@/lib/streak-protection';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];
const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

function getMonthName(date: Date): string {
  return `${date.getFullYear()}年 ${MONTHS[date.getMonth()]}`;
}

function formatSelectedDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

export function MonthlyProgressCalendar({
  habits,
  today,
  protectedStreakDates,
}: {
  habits: readonly Habit[];
  today: string;
  protectedStreakDates: readonly string[];
}) {
  const colors = useColors();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(today);
  const [todayYear, todayMonth] = today.split('-').map(Number);
  const displayedMonth = useMemo(
    () => new Date(todayYear, todayMonth - 1 + monthOffset, 1, 12),
    [todayYear, todayMonth, monthOffset],
  );
  const cells = getLocalMonthCalendarDays(displayedMonth.getFullYear(), displayedMonth.getMonth());
  const summary = selectedDate
    ? getCalendarDaySummary(habits, selectedDate)
    : { completed: [], scheduled: [], isRestDay: false };
  const protectedSelectedDay = selectedDate ? protectedStreakDates.includes(selectedDate) : false;
  const selectedIsFuture = selectedDate > today;

  function changeMonth(delta: number) {
    const nextOffset = monthOffset + delta;
    if (nextOffset > 0) return;
    const nextMonth = new Date(todayYear, todayMonth - 1 + nextOffset + 1, 0, 12);
    const nextDay = nextOffset === 0
      ? today
      : `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`;
    setMonthOffset(nextOffset);
    setSelectedDate(nextDay);
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="monthly-progress-calendar">
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>打卡月曆</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>點選日期查看當天完成的目標</Text>
        </View>
        <View style={styles.monthControls}>
          <Pressable
            onPress={() => changeMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="查看上一個月"
            testID="calendar-previous-month"
            style={({ pressed }) => [styles.monthButton, { backgroundColor: colors.secondary, opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="chevron-left" size={17} color={colors.primary} />
          </Pressable>
          <Pressable
            onPress={() => changeMonth(1)}
            disabled={monthOffset >= 0}
            accessibilityRole="button"
            accessibilityLabel="查看下一個月"
            accessibilityState={{ disabled: monthOffset >= 0 }}
            testID="calendar-next-month"
            style={({ pressed }) => [styles.monthButton, { backgroundColor: colors.secondary, opacity: monthOffset >= 0 ? 0.35 : pressed ? 0.7 : 1 }]}
          >
            <Feather name="chevron-right" size={17} color={colors.primary} />
          </Pressable>
        </View>
      </View>
      <Text style={[styles.monthTitle, { color: colors.foreground }]}>{getMonthName(displayedMonth)}</Text>

      <View style={styles.grid}>
        {WEEKDAYS.map((weekday) => (
          <Text key={weekday} style={[styles.weekday, { color: colors.mutedForeground }]}>{weekday}</Text>
        ))}
        {cells.map((dateKey, index) => {
          if (!dateKey) return <View key={`blank-${index}`} style={styles.dayCell} />;
          const status = getCalendarDayStatus(habits, dateKey, today, protectedStreakDates);
          const selected = selectedDate === dateKey;
          const isToday = today === dateKey;
          const backgroundColor = status === 'complete'
            ? colors.primary
            : status === 'partial'
              ? colors.candyPink
              : status === 'leave'
                ? colors.candyLemon
                : colors.background;
          const textColor = status === 'complete' ? colors.primaryForeground : colors.foreground;
          const dayNumber = Number(dateKey.slice(-2));
          const label = status === 'rest' ? '休' : status === 'leave' ? '假' : '';
          return (
            <Pressable
              key={dateKey}
              onPress={() => setSelectedDate(dateKey)}
              disabled={status === 'future'}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: status === 'future' }}
              accessibilityLabel={`${formatSelectedDate(dateKey)}${status === 'complete' ? '，全部完成' : status === 'partial' ? '，部分完成' : status === 'rest' ? '，休息日' : status === 'leave' ? '，請假卡保護連續日數' : ''}`}
              testID={`calendar-day-${dateKey}`}
              style={({ pressed }) => [
                styles.dayCell,
                styles.dateButton,
                { backgroundColor, borderColor: selected || isToday ? colors.primary : 'transparent', opacity: pressed ? 0.72 : status === 'future' ? 0.38 : 1 },
              ]}
            >
              <Text style={[styles.dayNumber, { color: textColor, fontWeight: isToday || selected ? '700' : '500' }]}>{dayNumber}</Text>
              {label ? <Text style={[styles.dayLabel, { color: status === 'leave' ? colors.candyCaramelDark : colors.mutedForeground }]}>{label}</Text> : null}
              {status === 'partial' ? <View style={[styles.partialDot, { backgroundColor: colors.primary }]} /> : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>全完成</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendSwatch, { backgroundColor: colors.candyPink }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>部分完成</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={[styles.restLegend, { color: colors.mutedForeground }]}>休</Text>
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>休息日</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={[styles.restLegend, { color: colors.candyCaramelDark }]}>假</Text>
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>保護日</Text>
        </View>
      </View>

      <View style={[styles.detailCard, { backgroundColor: colors.secondary }]} testID="calendar-selected-day-details">
        <View style={styles.detailHeading}>
          <Text style={[styles.detailTitle, { color: colors.foreground }]}>
            {selectedDate ? formatSelectedDate(selectedDate) : '選擇日期'}
          </Text>
          {summary.isRestDay && !selectedIsFuture ? (
            <Text style={[styles.restTag, { color: colors.primary, backgroundColor: colors.card }]}>休</Text>
          ) : null}
        </View>
        {protectedSelectedDay ? (
          <Text style={[styles.leaveNote, { color: colors.candyCaramelDark }]}>
            請假卡保住連續日數；這天不會記作目標打卡或獲得金幣。
          </Text>
        ) : null}
        {selectedIsFuture ? (
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>未來日期尚未有完成紀錄。</Text>
        ) : summary.completed.length > 0 ? (
          <View style={styles.goalList}>
            {summary.completed.map((title) => (
              <View key={title} style={styles.goalRow}>
                <Feather name="check-circle" size={14} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.foreground }]}>{title}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {summary.isRestDay ? '這天沒有安排練習。' : '這天沒有完成目標。'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 21, padding: 16, marginTop: 13 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headingCopy: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 10, lineHeight: 15, marginTop: 4 },
  monthControls: { flexDirection: 'row', gap: 6 },
  monthButton: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 17, marginBottom: 11 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  weekday: { width: '13.4%', textAlign: 'center', fontSize: 10, fontWeight: '600', paddingBottom: 7 },
  dayCell: { width: '13.4%', aspectRatio: 1, marginBottom: 5 },
  dateButton: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12, position: 'relative' },
  dayNumber: { fontSize: 11 },
  dayLabel: { fontSize: 8, lineHeight: 10, marginTop: 1 },
  partialDot: { position: 'absolute', bottom: 3, width: 4, height: 4, borderRadius: 2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendSwatch: { width: 10, height: 10, borderRadius: 4 },
  legendText: { fontSize: 9 },
  restLegend: { minWidth: 10, fontSize: 9, fontWeight: '700', textAlign: 'center' },
  detailCard: { borderRadius: 14, padding: 12, marginTop: 14 },
  detailHeading: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailTitle: { flex: 1, fontSize: 11, fontWeight: '700' },
  restTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, fontSize: 9, fontWeight: '700' },
  leaveNote: { fontSize: 10, lineHeight: 16, marginTop: 7 },
  detailText: { fontSize: 10, lineHeight: 16, marginTop: 6 },
  goalList: { gap: 5, marginTop: 6 },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
