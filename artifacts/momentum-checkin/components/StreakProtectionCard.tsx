import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useHabits } from '@/context/HabitsContext';
import { useColors } from '@/hooks/useColors';
import { getStreakRescueDate } from '@/lib/streak-protection';

export function StreakProtectionCard() {
  const colors = useColors();
  const {
    habits,
    today,
    coins,
    leaveCards,
    protectedStreakDates,
    purchaseStreakLeaveCard,
    rescueStreakBreak,
  } = useHabits();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const rescueDate = getStreakRescueDate(habits, today, protectedStreakDates, now);
  const canBuy = leaveCards < 2 && coins >= 50;
  const canRescue = Boolean(rescueDate && coins >= 80);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  async function buyCard() {
    if (busy || leaveCards >= 2) return;
    if (!canBuy) {
      setMessage(null);
      setError(`金幣不足：目前有 ${coins} 枚，兌換請假卡需要 50 枚，還差 ${50 - coins} 枚。完成目標即可賺取金幣。`);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await purchaseStreakLeaveCard();
      setMessage('已兌換請假卡，漏掉練習日且連續日數將中斷時會自動使用。');
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '兌換沒有成功，請再試一次。');
    } finally {
      setBusy(false);
    }
  }

  async function rescue() {
    if (busy || !rescueDate) return;
    if (!canRescue) {
      setMessage(null);
      setError(`金幣不足：目前有 ${coins} 枚，補救連續日數需要 80 枚，還差 ${80 - coins} 枚。完成目標即可賺取金幣。`);
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const date = await rescueStreakBreak();
      setMessage(`已用 80 金幣保住 ${date} 的連續日數；不會補目標或增加打卡金幣。`);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : '補救沒有成功，請再試一次。');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="streak-protection-card">
      <View style={styles.heading}>
        <View style={[styles.icon, { backgroundColor: colors.candyLemon }]}>
          <Feather name="umbrella" size={17} color={colors.candyCaramelDark} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.foreground }]}>連續日數請假卡</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            持有 {leaveCards}/2 張 · 每張 50 金幣
          </Text>
        </View>
        <View style={styles.cardCount}>
          {[0, 1].map((slot) => (
            <View
              key={slot}
              style={[
                styles.cardDot,
                { backgroundColor: slot < leaveCards ? colors.candyCaramel : colors.background, borderColor: colors.border },
              ]}
            >
              {slot < leaveCards ? <Feather name="check" size={11} color={colors.primaryForeground} /> : null}
            </View>
          ))}
        </View>
      </View>
      <Text style={[styles.note, { color: colors.mutedForeground }]}>
        漏掉練習日而連續日數將中斷時，會自動用一張保住連續紀錄；不會替目標打卡，也不會增加金幣。這和每週補打昨天的目標不同。
      </Text>
      <View style={styles.actions}>
        <Pressable
          onPress={() => void buyCard()}
          disabled={busy || leaveCards >= 2}
          accessibilityRole="button"
          accessibilityState={{ disabled: busy || leaveCards >= 2, busy }}
          accessibilityLabel={leaveCards >= 2 ? '已持有最多兩張請假卡' : canBuy ? '用50金幣兌換一張請假卡' : `金幣不足，兌換請假卡還差${50 - coins}枚`}
          testID="buy-streak-leave-card"
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: leaveCards >= 2 ? colors.background : colors.secondary },
            { opacity: pressed || busy ? 0.66 : 1 },
          ]}
        >
          <Feather name="plus-circle" size={15} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>
            {leaveCards >= 2 ? '已達持有上限' : canBuy ? '兌換請假卡 · 50' : `金幣不足 · 還差 ${50 - coins}`}
          </Text>
        </Pressable>
        {rescueDate ? (
          <Pressable
            onPress={() => void rescue()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityState={{ disabled: busy, busy }}
            accessibilityLabel={canRescue ? '在24小時內用80金幣補救連續日數' : `金幣不足，補救連續日數還差${80 - coins}枚`}
            testID="rescue-streak-break"
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: colors.candyPink },
              { opacity: pressed || busy ? 0.66 : 1 },
            ]}
          >
            <Feather name="rotate-ccw" size={15} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {canRescue ? '補救連續日數 · 80' : `金幣不足 · 還差 ${80 - coins}`}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {message ? <Text style={[styles.feedback, { color: colors.primary }]} accessibilityLiveRegion="polite">{message}</Text> : null}
      {error ? <Text style={[styles.feedback, { color: colors.destructive }]} accessibilityRole="alert">{error}</Text> : null}
      {rescueDate ? (
        <Text style={[styles.windowHint, { color: colors.mutedForeground }]}>
          昨日連續日數中斷後 24 小時內可補救；只修復連續紀錄，不會補打目標。
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 21, padding: 16, marginTop: 14 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 37, height: 37, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 10, marginTop: 4 },
  cardCount: { flexDirection: 'row', gap: 5 },
  cardDot: { width: 22, height: 22, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  note: { fontSize: 11, lineHeight: 18, marginTop: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 },
  actionButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 11, borderRadius: 12 },
  actionText: { fontSize: 10, fontWeight: '700' },
  feedback: { fontSize: 10, lineHeight: 16, marginTop: 9 },
  windowHint: { fontSize: 9, lineHeight: 14, marginTop: 8 },
});
