import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';
import { MallObjectVisual } from '@/components/MallVisuals';
import { MALL_SLOT_IDS, getMallSlotFloor } from '@/constants/mall-layout';
import { useHabits } from '@/context/HabitsContext';
import { useColors } from '@/hooks/useColors';
import { getDailyMallSurprise, getDailyMallSurpriseRedeemPrice } from '@/lib/daily-mall-surprise';

export function MallDailySurpriseCard({ today }: { today: string }) {
  const colors = useColors();
  const surprise = getDailyMallSurprise(today);
  const { coins, isLoading, mallPlacements, purchasedItems, purchaseMallItem } = useHabits();
  const [redeeming, setRedeeming] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const isDog = surprise.kind === 'dog';
  const item = surprise.kind === 'decoration' ? surprise.item : null;
  const redeemPrice = item ? getDailyMallSurpriseRedeemPrice(item.price) : null;
  const isOwned = item ? purchasedItems.includes(item.id) : false;
  const emptyFloorSlot = item
    ? MALL_SLOT_IDS.find((slotId) => getMallSlotFloor(slotId) === item.floor && !mallPlacements[slotId]) ?? null
    : null;

  async function redeemSurprise() {
    if (!item || redeemPrice === null || !emptyFloorSlot || redeeming || isOwned) return;
    if (coins < redeemPrice) {
      setNotice(`金幣不足：目前有 ${coins} 枚，今日兌換需要 ${redeemPrice} 枚，還差 ${redeemPrice - coins} 枚。`);
      return;
    }

    setRedeeming(true);
    setNotice(null);
    try {
      await purchaseMallItem(item.id, redeemPrice, item.category, 0, emptyFloorSlot);
      setNotice(`已用 ${redeemPrice} 金幣兌換，並放置於 ${item.floor}F。`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '兌換未完成，請稍後再試。');
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="mall-daily-surprise"
      accessibilityLabel={isDog
        ? `今日限時驚喜，${surprise.dog.name}來商場拜訪，只停留到今日午夜`
        : `今日限時驚喜，${item?.name}今日可用${redeemPrice}金幣限時兌換`}
    >
      <View style={styles.main}>
        <View style={[styles.art, { backgroundColor: isDog ? colors.candyPink : item?.color }]}>
          {isDog ? (
            <DogAttendant kind={surprise.dog.kind as DogAttendantKind} happy />
          ) : item ? (
            <MallObjectVisual
              id={item.visual ?? item.id}
              itemId={item.id}
              itemName={item.name}
              floor={item.floor}
              color={item.color}
              icon={item.icon}
              category="decor"
              isActive
            />
          ) : null}
        </View>
        <View style={styles.copy}>
          <View style={styles.eyebrowRow}>
            <Feather name="star" size={12} color={colors.primary} />
            <Text style={[styles.eyebrow, { color: colors.primary }]}>今日限時驚喜</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isDog ? `${surprise.dog.name}來商場拜訪` : item?.name}
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {isDog
              ? '和可愛的狗狗店員打個招呼吧。'
              : `原價 ${item?.price} 金幣 · 今日半價 ${redeemPrice} 金幣`}
          </Text>
        </View>
      </View>
      {isDog ? (
        <View style={[styles.expiry, { backgroundColor: colors.secondary }]}>
          <Feather name="clock" size={11} color={colors.primary} />
          <Text style={[styles.expiryText, { color: colors.mutedForeground }]}>只停留到今日午夜</Text>
        </View>
      ) : item && redeemPrice !== null ? (
        <>
          <View style={styles.actionRow}>
            <View style={[styles.expiry, { backgroundColor: colors.secondary }]}>
              <Feather name="clock" size={11} color={colors.primary} />
              <Text style={[styles.expiryText, { color: colors.mutedForeground }]}>
                午夜前有效 · 放置於 {item.floor}F
              </Text>
            </View>
            <Pressable
              testID="mall-daily-surprise-redeem"
              accessibilityRole="button"
              accessibilityLabel={isOwned
                ? `${item.name}已兌換`
                : !emptyFloorSlot
                  ? `${item.floor}樓位置已滿，暫時無法兌換`
                  : `用${redeemPrice}金幣兌換${item.name}`}
              accessibilityState={{
                disabled: isLoading || redeeming || isOwned || !emptyFloorSlot,
                busy: redeeming,
              }}
              disabled={isLoading || redeeming || isOwned || !emptyFloorSlot}
              onPress={() => void redeemSurprise()}
              style={({ pressed }) => [
                styles.redeemButton,
                { backgroundColor: colors.primary },
                pressed && styles.pressed,
                (isLoading || redeeming || isOwned || !emptyFloorSlot) && styles.disabled,
              ]}
            >
              <Feather name={isOwned ? 'check' : 'gift'} size={13} color={colors.primaryForeground} />
              <Text style={[styles.redeemText, { color: colors.primaryForeground }]}>
                {isOwned ? '已兌換' : !emptyFloorSlot ? '樓層已滿' : redeeming ? '兌換中' : `兌換 · ${redeemPrice}`}
              </Text>
            </Pressable>
          </View>
          {notice ? (
            <Text
              accessibilityLiveRegion="polite"
              style={[styles.notice, { color: notice.startsWith('已用') ? colors.candyMintDark : colors.destructive }]}
            >
              {notice}
            </Text>
          ) : !isOwned && !emptyFloorSlot ? (
            <Text style={[styles.notice, { color: colors.mutedForeground }]}>
              {item.floor}F 暫時沒有空位，先收納一件物品再來兌換。
            </Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 10, overflow: 'hidden' },
  main: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  art: { width: 70, height: 64, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  copy: { flex: 1, minWidth: 0 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  title: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  body: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  expiry: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5, marginTop: 9 },
  expiryText: { fontSize: 9, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 },
  redeemButton: { minHeight: 34, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  redeemText: { fontSize: 11, fontWeight: '700' },
  notice: { fontSize: 10, lineHeight: 14, marginTop: 7 },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.58 },
});
