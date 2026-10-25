import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHabits } from '@/context/HabitsContext';
import {
  getShopInteriorDecorations,
  getShopTypeLabel,
  SHOP_INTERIOR_SLOTS,
  type ShopInteriorSlotId,
} from '@/constants/mall-shop-interior';
import { MALL_FLOORS, MALL_ITEM_BY_ID } from '@/constants/mall';
import { useColors } from '@/hooks/useColors';

export default function MallShopInteriorScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { itemId: rawItemId } = useLocalSearchParams<{ itemId?: string | string[] }>();
  const shopId = Array.isArray(rawItemId) ? rawItemId[0] : rawItemId;
  const shop = shopId ? MALL_ITEM_BY_ID[shopId] : undefined;
  const {
    coins,
    isLoading,
    purchasedItems,
    shopInteriors,
    placeShopInteriorDecoration,
    storeShopInteriorDecoration,
  } = useHabits();
  const [selectedSlot, setSelectedSlot] = useState<ShopInteriorSlotId>(SHOP_INTERIOR_SLOTS[0].id);
  const [workingDecoration, setWorkingDecoration] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const interior = shop ? shopInteriors[shop.id] : undefined;
  const decorations = useMemo(
    () => getShopInteriorDecorations(shop?.shopType),
    [shop?.shopType],
  );
  const owned = new Set(interior?.ownedDecorations ?? []);
  const placements = interior?.placements ?? {};
  const selectedDecorationId = placements[selectedSlot];
  const selectedDecoration = decorations.find(({ id }) => id === selectedDecorationId);
  const floor = shop ? MALL_FLOORS[shop.floor - 1] : MALL_FLOORS[0];
  const hasAccess = !!shop && shop.category === 'shop' && purchasedItems.includes(shop.id);

  async function placeDecoration(decorationId: string, price: number) {
    if (!shop || !hasAccess || workingDecoration) return;
    const alreadyOwned = owned.has(decorationId);
    setWorkingDecoration(decorationId);
    setNotice('');
    try {
      await placeShopInteriorDecoration(shop.id, decorationId, selectedSlot);
      const location = SHOP_INTERIOR_SLOTS.find(({ id }) => id === selectedSlot)?.label ?? '店內';
      setNotice(alreadyOwned
        ? `已免費將裝飾移至${location}。舊裝飾仍保留在店內收藏。`
        : `已兌換並放在${location}，扣除 ${price} 金幣。`);
    } catch (error) {
      Alert.alert('裝飾未能放置', error instanceof Error ? error.message : '請稍後再試。');
    } finally {
      setWorkingDecoration(null);
    }
  }

  async function storeSelectedDecoration() {
    if (!shop || !selectedDecoration || workingDecoration) return;
    setWorkingDecoration(selectedDecoration.id);
    setNotice('');
    try {
      await storeShopInteriorDecoration(shop.id, selectedSlot);
      setNotice(`已將${selectedDecoration.name}收進這間店的裝飾收藏，沒有退款或扣除金幣。`);
    } catch (error) {
      Alert.alert('收納未完成', error instanceof Error ? error.message : '請稍後再試。');
    } finally {
      setWorkingDecoration(null);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? 67 : 12,
            paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            testID="shop-interior-back"
            accessibilityRole="button"
            accessibilityLabel="返回商場"
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={20} color={colors.primary} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>MOMENTUM MALL</Text>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>店內佈置</Text>
          </View>
          <View
            testID="shop-interior-wallet"
            accessibilityLabel={`目前有 ${coins} 金幣`}
            style={[styles.wallet, { backgroundColor: colors.primary }]}
          >
            <Feather name="star" size={14} color={colors.primaryForeground} />
            <Text style={[styles.walletText, { color: colors.primaryForeground }]}>{coins}</Text>
          </View>
        </View>

        {!shop || shop.category !== 'shop' ? (
          <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="alert-circle" size={22} color={colors.primary} />
            <Text style={[styles.messageTitle, { color: colors.foreground }]}>找不到這間商店</Text>
            <Text style={[styles.messageCopy, { color: colors.mutedForeground }]}>請從商場已兌換的店鋪重新進入。</Text>
          </View>
        ) : isLoading ? (
          <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="loader" size={22} color={colors.primary} />
            <Text style={[styles.messageTitle, { color: colors.foreground }]}>正在讀取商場資料</Text>
          </View>
        ) : !hasAccess ? (
          <View style={[styles.messageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={22} color={colors.primary} />
            <Text style={[styles.messageTitle, { color: colors.foreground }]}>先用金幣兌換這間商店</Text>
            <Text style={[styles.messageCopy, { color: colors.mutedForeground }]}>店內佈置只對已兌換的商店開放。金幣只由完成目標取得。</Text>
            <Pressable
              testID="shop-interior-open-mall"
              accessibilityRole="button"
              onPress={() => router.replace('/mall')}
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>返回商場</Text>
              <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
            </Pressable>
          </View>
        ) : shop ? (
          <>
            <View style={[styles.shopHeader, { backgroundColor: floor.surface, borderColor: colors.border }]}>
              <View style={[styles.shopTypePill, { backgroundColor: colors.card }]}>
                <Feather name="shopping-bag" size={13} color={colors.primary} />
                <Text style={[styles.shopTypeText, { color: colors.primary }]}>{getShopTypeLabel(shop.shopType)}</Text>
              </View>
              <Text testID="shop-interior-name" style={[styles.shopName, { color: colors.foreground }]}>{shop.name}</Text>
              <Text style={[styles.shopLocation, { color: colors.mutedForeground }]}>
                {shop.floor}F · {floor.title} · 完成目標賺金幣，讓店裡慢慢變成喜歡的樣子
              </Text>
            </View>

            <View
              testID="shop-interior-scene"
              style={[styles.room, { backgroundColor: colors.candyCream, borderColor: shop.color }]}
            >
              <View style={[styles.roomSign, { backgroundColor: shop.color, borderColor: colors.candyCaramelDark }]}>
                <Feather name={shop.icon as keyof typeof Feather.glyphMap} size={13} color={colors.foreground} />
                <Text numberOfLines={1} style={[styles.roomSignText, { color: colors.foreground }]}>{shop.name}</Text>
                <View style={[styles.signLight, { backgroundColor: colors.candyLemon }]} />
              </View>
              <View style={[styles.roomWall, { backgroundColor: floor.surface }]}>
                <View style={styles.roomTopTrim} />
                <View style={styles.shelfLine}>
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <View
                      key={index}
                      style={[
                        styles.miniProduct,
                        { backgroundColor: [colors.candyPink, colors.candyMint, colors.candyLemon, colors.candyLavender][index % 4] },
                      ]}
                    />
                  ))}
                </View>
                <View style={[styles.roomGrid, { borderColor: colors.border }]}>
                  {SHOP_INTERIOR_SLOTS.map((slot) => {
                    const decorationId = placements[slot.id];
                    const decoration = decorations.find((candidate) => candidate.id === decorationId);
                    const selected = selectedSlot === slot.id;
                    return (
                      <Pressable
                        key={slot.id}
                        testID={`shop-interior-slot-${slot.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`${slot.label}${decoration ? `，目前是${decoration.name}` : '，尚未佈置'}${selected ? '，目前選取' : ''}`}
                        accessibilityState={{ selected }}
                        onPress={() => setSelectedSlot(slot.id)}
                        style={[
                          styles.roomSlot,
                          {
                            backgroundColor: colors.card,
                            borderColor: selected ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <View style={[styles.slotIllustration, { backgroundColor: decoration?.color ?? colors.secondary }]}>
                          <Feather
                            name={(decoration?.icon ?? slot.icon) as keyof typeof Feather.glyphMap}
                            size={19}
                            color={colors.primary}
                          />
                        </View>
                        <Text numberOfLines={1} style={[styles.slotName, { color: colors.foreground }]}>
                          {decoration?.name ?? slot.label}
                        </Text>
                        <Text style={[styles.slotStatus, { color: selected ? colors.primary : colors.mutedForeground }]}>
                          {selected ? '選取位置' : decoration ? '已佈置' : '可佈置'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={[styles.roomFloor, { backgroundColor: colors.candyCaramel }]}>
                  <View style={styles.floorTileRow}>
                    {[0, 1, 2, 3, 4, 5, 6].map((tile) => (
                      <View key={tile} style={[styles.floorTile, { borderColor: colors.candyCaramelDark }]} />
                    ))}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>挑選店內裝飾</Text>
                <Text style={[styles.sectionCopy, { color: colors.mutedForeground }]}>
                  先選上方位置；已兌換的裝飾可免費換位，舊裝飾會保留。
                </Text>
              </View>
              <View style={[styles.selectedSlotPill, { backgroundColor: colors.secondary }]}>
                <Feather name="map-pin" size={12} color={colors.primary} />
                <Text style={[styles.selectedSlotText, { color: colors.primary }]}>
                  {SHOP_INTERIOR_SLOTS.find(({ id }) => id === selectedSlot)?.label}
                </Text>
              </View>
            </View>

            {selectedDecoration && (
              <Pressable
                testID="shop-interior-store-decoration"
                accessibilityRole="button"
                accessibilityLabel={`收起${selectedDecoration.name}，保留在收藏，不退款`}
                disabled={workingDecoration !== null}
                onPress={() => void storeSelectedDecoration()}
                style={[styles.storeButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <Feather name="archive" size={15} color={colors.primary} />
                <Text style={[styles.storeButtonText, { color: colors.primary }]}>收起目前裝飾 · 收藏保留</Text>
              </Pressable>
            )}

            {notice ? (
              <Text testID="shop-interior-notice" accessibilityRole="text" accessibilityLiveRegion="polite" style={[styles.notice, { color: colors.primary }]}>
                {notice}
              </Text>
            ) : null}

            <View style={styles.decorationList}>
              {decorations.map((decoration) => {
                const isOwned = owned.has(decoration.id);
                const currentSlot = Object.entries(placements).find(([, id]) => id === decoration.id)?.[0];
                const alreadyHere = currentSlot === selectedSlot;
                const affordable = coins >= decoration.price;
                const disabled = workingDecoration !== null || alreadyHere || (!isOwned && !affordable);
                return (
                  <View
                    key={decoration.id}
                    testID={`shop-decoration-${decoration.id}`}
                    style={[styles.decorationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.decorationIcon, { backgroundColor: decoration.color }]}>
                      <Feather name={decoration.icon as keyof typeof Feather.glyphMap} size={20} color={colors.foreground} />
                    </View>
                    <View style={styles.decorationCopy}>
                      <Text style={[styles.decorationName, { color: colors.foreground }]}>{decoration.name}</Text>
                      <Text style={[styles.decorationDescription, { color: colors.mutedForeground }]}>{decoration.description}</Text>
                      <Text style={[styles.decorationCost, { color: colors.candyCaramelDark }]}>
                        {isOwned
                          ? currentSlot
                            ? `已佈置於${SHOP_INTERIOR_SLOTS.find(({ id }) => id === currentSlot)?.label} · 可免費換位`
                            : '已兌換 · 可免費佈置'
                          : affordable
                            ? `完成目標取得 ${decoration.price} 金幣`
                            : `還差 ${decoration.price - coins} 金幣 · 完成目標可取得`}
                      </Text>
                    </View>
                    <Pressable
                      testID={`shop-decoration-place-${decoration.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={alreadyHere ? `${decoration.name}已在${SHOP_INTERIOR_SLOTS.find(({ id }) => id === selectedSlot)?.label}` : isOwned ? `免費佈置${decoration.name}於${SHOP_INTERIOR_SLOTS.find(({ id }) => id === selectedSlot)?.label}` : `兌換${decoration.name}並佈置於${SHOP_INTERIOR_SLOTS.find(({ id }) => id === selectedSlot)?.label}，${decoration.price}金幣${affordable ? '' : `，還差 ${decoration.price - coins} 枚`}`}
                      accessibilityState={{ disabled }}
                      disabled={disabled}
                      onPress={() => void placeDecoration(decoration.id, decoration.price)}
                      style={[
                        styles.placeButton,
                        { backgroundColor: isOwned ? colors.secondary : colors.primary, opacity: disabled ? 0.5 : 1 },
                      ]}
                    >
                      {workingDecoration === decoration.id
                        ? <Feather name="loader" size={16} color={isOwned ? colors.primary : colors.primaryForeground} />
                        : <Feather name={alreadyHere ? 'check' : isOwned ? 'move' : 'plus'} size={16} color={isOwned ? colors.primary : colors.primaryForeground} />}
                    </Pressable>
                  </View>
                );
              })}
            </View>
            <Text style={[styles.freeNote, { color: colors.mutedForeground }]}>
              金幣只來自已完成的目標；裝飾不設付費、儲值或現金購買。
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 14 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  headerTitle: { fontSize: 21, fontWeight: '800', marginTop: 2 },
  wallet: { minWidth: 68, height: 42, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  walletText: { fontSize: 15, fontWeight: '800' },
  shopHeader: { padding: 16, borderRadius: 22, borderWidth: 1, alignItems: 'center', gap: 5 },
  shopTypePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  shopTypeText: { fontSize: 11, fontWeight: '700' },
  shopName: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  shopLocation: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  room: { borderRadius: 25, borderWidth: 2, overflow: 'hidden', padding: 10, shadowColor: '#6A4B57', shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  roomSign: { minHeight: 32, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, marginBottom: 8, borderRadius: 12, borderWidth: 1 },
  roomSignText: { fontSize: 12, fontWeight: '800', maxWidth: 180 },
  signLight: { width: 6, height: 6, borderRadius: 3 },
  roomWall: { borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', paddingHorizontal: 10, paddingTop: 10 },
  roomTopTrim: { height: 5, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)' },
  shelfLine: { height: 27, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 3, borderColor: '#D7B891', paddingBottom: 3, marginBottom: 7 },
  miniProduct: { width: 15, height: 15, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderWidth: 1, borderColor: 'rgba(110,80,65,0.18)' },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, borderBottomWidth: 2, paddingBottom: 10 },
  roomSlot: { width: '31.8%', minHeight: 78, borderWidth: 1.5, borderRadius: 13, paddingVertical: 6, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', gap: 3 },
  slotIllustration: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  slotName: { maxWidth: '100%', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  slotStatus: { fontSize: 8 },
  roomFloor: { height: 28, marginHorizontal: -10, paddingHorizontal: 9, paddingTop: 3 },
  floorTileRow: { flexDirection: 'row', height: 25 },
  floorTile: { flex: 1, borderTopWidth: 1, borderLeftWidth: 1, opacity: 0.35 },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionCopy: { fontSize: 11, lineHeight: 16, marginTop: 3, maxWidth: 250 },
  selectedSlotPill: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5 },
  selectedSlotText: { fontSize: 11, fontWeight: '700' },
  storeButton: { minHeight: 42, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  storeButtonText: { fontSize: 12, fontWeight: '700' },
  notice: { fontSize: 12, lineHeight: 17 },
  decorationList: { gap: 9 },
  decorationCard: { minHeight: 81, borderWidth: 1, borderRadius: 17, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  decorationIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  decorationCopy: { flex: 1, gap: 2 },
  decorationName: { fontSize: 13, fontWeight: '800' },
  decorationDescription: { fontSize: 10, lineHeight: 14 },
  decorationCost: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  placeButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  freeNote: { fontSize: 10, textAlign: 'center', lineHeight: 15 },
  messageCard: { borderRadius: 22, borderWidth: 1, alignItems: 'center', padding: 22, gap: 10 },
  messageTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  messageCopy: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  primaryButton: { minHeight: 46, borderRadius: 15, marginTop: 4, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryButtonText: { fontSize: 13, fontWeight: '800' },
});
