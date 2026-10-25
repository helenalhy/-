import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Alert,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import palette from '@/constants/colors';
import {
  MALL_SLOT_IDS,
  REWARD_CATEGORY_LABELS,
  useHabits,
  type MallSlotId,
  type RewardCategory,
} from '@/context/HabitsContext';
import { useColors } from '@/hooks/useColors';

type MallItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: RewardCategory;
  price: number;
  ticketCost: number;
};

const CATEGORIES: { id: 'all' | RewardCategory; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'shop', label: '店鋪' },
  { id: 'facility', label: '設施' },
  { id: 'decor', label: '裝潢' },
];

const MALL_ITEMS: MallItem[] = [
  { id: 'sunny-cafe', name: '暖陽咖啡館', description: '讓散步的人有地方歇歇腳', icon: 'coffee', color: palette.light.candyPeach, category: 'shop', price: 45, ticketCost: 1 },
  { id: 'little-bookshop', name: '慢讀書屋', description: '一間可以待上一整個下午的店', icon: 'book-open', color: palette.light.candySky, category: 'shop', price: 70, ticketCost: 2 },
  { id: 'flower-shop', name: '花花日常', description: '把街角變成一束花的樣子', icon: 'feather', color: palette.light.candyPink, category: 'shop', price: 55, ticketCost: 1 },
  { id: 'cloud-walk', name: '雲朵步道', description: '一條讓心情放晴的小路', icon: 'activity', color: palette.light.candyMint, category: 'facility', price: 30, ticketCost: 1 },
  { id: 'central-fountain', name: '中央噴泉', description: '商場中間最熱鬧的集合點', icon: 'droplet', color: palette.light.candySky, category: 'facility', price: 55, ticketCost: 2 },
  { id: 'rest-pavilion', name: '林間休息亭', description: '給認真生活的自己一個座位', icon: 'home', color: palette.light.candyLavender, category: 'facility', price: 80, ticketCost: 3 },
  { id: 'garden-lights', name: '花園路燈', description: '天黑後也有溫柔的光', icon: 'sun', color: palette.light.candyLemon, category: 'decor', price: 20, ticketCost: 1 },
  { id: 'wooden-bench', name: '木製長椅', description: '坐下來，看看今天的風景', icon: 'minus', color: palette.light.candyPeach, category: 'decor', price: 25, ticketCost: 1 },
  { id: 'colorful-planter', name: '彩色花圃', description: '每天多一點新芽和顏色', icon: 'sunrise', color: palette.light.candyCoral, category: 'decor', price: 35, ticketCost: 2 },
];

const MALL_ITEM_BY_ID = Object.fromEntries(MALL_ITEMS.map((item) => [item.id, item])) as Record<string, MallItem>;

const CATEGORY_NAMES: Record<RewardCategory, string> = {
  facility: '設施',
  shop: '店鋪',
  decor: '裝潢',
};

const MALL_SLOT_POSITIONS: Record<MallSlotId, {
  left: `${number}%`;
  top: `${number}%`;
  width: `${number}%`;
  floor: string;
}> = {
  'floor-3-left': { left: '8%', top: '16%', width: '25%', floor: '3F' },
  'floor-3-center': { left: '37.5%', top: '16%', width: '25%', floor: '3F' },
  'floor-3-right': { left: '67%', top: '16%', width: '25%', floor: '3F' },
  'floor-2-left': { left: '8%', top: '43%', width: '25%', floor: '2F' },
  'floor-2-center': { left: '37.5%', top: '43%', width: '25%', floor: '2F' },
  'floor-2-right': { left: '67%', top: '43%', width: '25%', floor: '2F' },
  'floor-1-left': { left: '8%', top: '70%', width: '25%', floor: '1F' },
  'floor-1-center': { left: '37.5%', top: '70%', width: '25%', floor: '1F' },
  'floor-1-right': { left: '67%', top: '70%', width: '25%', floor: '1F' },
};

function MallSceneSlot({
  slotId,
  item,
  isPlacementTarget,
  isPlacementMode,
  onPress,
}: {
  slotId: MallSlotId;
  item?: MallItem;
  isPlacementTarget: boolean;
  isPlacementMode: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();
  const popIn = useRef(new Animated.Value(0.78)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const position = MALL_SLOT_POSITIONS[slotId];

  useEffect(() => {
    if (!item) return;
    const animation = Animated.parallel([
      Animated.spring(popIn, { toValue: 1, friction: 5, tension: 135, useNativeDriver: false }),
      Animated.timing(fadeIn, { toValue: 1, duration: 260, useNativeDriver: false }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [item?.id, popIn, fadeIn]);

  if (item) {
    return (
      <Pressable
        style={[styles.sceneSlot, { left: position.left, top: position.top, width: position.width }]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${position.floor} ${item.name}，點選可移動`}
      >
        <Animated.View style={[
          styles.sceneShopBadge,
          { backgroundColor: item.color, opacity: fadeIn, transform: [{ scale: popIn }] },
        ]}>
          <Feather name={item.icon as keyof typeof Feather.glyphMap} size={17} color={colors.foreground} />
        </Animated.View>
        <Text numberOfLines={1} style={[styles.sceneShopName, { color: colors.foreground }]}>{item.name}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable
      style={[
        styles.sceneSlot,
        { left: position.left, top: position.top, width: position.width },
        isPlacementTarget && styles.sceneSlotTarget,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={isPlacementMode ? `${position.floor} 空位，放置選擇的項目` : `${position.floor} 空位，選擇要建造的項目`}
    >
      <View style={[
        styles.sceneEmptyBadge,
        { backgroundColor: isPlacementTarget ? colors.primary : colors.card },
        isPlacementTarget && styles.sceneEmptyBadgeActive,
      ]}>
        <Feather
          name={isPlacementTarget ? 'map-pin' : 'plus'}
          size={isPlacementTarget ? 14 : 12}
          color={isPlacementTarget ? colors.primaryForeground : colors.primary}
        />
      </View>
      {isPlacementTarget && <Text style={[styles.sceneShopName, { color: colors.primary }]}>放這裡</Text>}
    </Pressable>
  );
}

export default function MallScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const shopSectionY = useRef(0);
  const mallSceneY = useRef(0);
  const sceneOpacity = useRef(new Animated.Value(0)).current;
  const sceneOffset = useRef(new Animated.Value(14)).current;
  const { coins, purchasedItems, mallPlacements, rewardTokens, purchaseMallItem, moveMallItem, storageError } = useHabits();
  const [category, setCategory] = useState<'all' | RewardCategory>('all');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [placementIntent, setPlacementIntent] = useState<{ itemId: string; mode: 'purchase' | 'move' } | null>(null);
  const constructed = useMemo(
    () => MALL_ITEMS.filter((item) => purchasedItems.includes(item.id)),
    [purchasedItems],
  );
  const visibleItems = category === 'all'
    ? MALL_ITEMS
    : MALL_ITEMS.filter((item) => item.category === category);
  const currentPlacementItem = placementIntent ? MALL_ITEM_BY_ID[placementIntent.itemId] : null;

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(sceneOpacity, { toValue: 1, duration: 420, useNativeDriver: false }),
      Animated.spring(sceneOffset, { toValue: 0, friction: 8, tension: 70, useNativeDriver: false }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [sceneOpacity, sceneOffset]);

  async function build(item: MallItem) {
    if (purchasedItems.includes(item.id) || purchasing) return;
    if (coins < item.price) {
      Alert.alert('金幣還差一點', `完成更多目標就能再賺 ${item.price - coins} 金幣。`);
      return;
    }
    if (rewardTokens[item.category] < item.ticketCost) {
      Alert.alert(
        `${REWARD_CATEGORY_LABELS[item.category]}還不夠`,
        `完成更多${item.category === 'shop' ? '閱讀或學習' : item.category === 'facility' ? '運動或行動' : '日記或心情照顧'}目標，就能取得需要的獎勵。`,
      );
      return;
    }
    setPurchasing(item.id);
    try {
      await purchaseMallItem(item.id, item.price, item.category, item.ticketCost);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert('建造完成！', `${item.name}已加入你的商場。`);
    } catch {
      Alert.alert('沒有建造成功', '請再試一次。');
    } finally {
      setPurchasing(null);
    }
  }

  function scrollToCatalog() {
    scrollRef.current?.scrollTo({ y: Math.max(0, shopSectionY.current - 14), animated: true });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingTop: Platform.OS === 'web' ? 67 : 12, paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>MOMENTUM MALL</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>你的慢慢商場</Text>
          </View>
          <View style={[styles.coinWallet, { backgroundColor: colors.primary }]}>
            <Feather name="circle" size={16} color={colors.candyLemon} />
            <View>
              <Text style={[styles.walletNumber, { color: colors.primaryForeground }]}>{coins}</Text>
              <Text style={[styles.walletLabel, { color: colors.primaryForeground, opacity: 0.8 }]}>金幣</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>完成今天的小目標，讓喜歡的街區慢慢長大。</Text>

        <View style={styles.ticketRow}>
          {([
            { id: 'facility' as const, icon: 'map-pin', color: colors.candyMint },
            { id: 'shop' as const, icon: 'shopping-bag', color: colors.candyLemon },
            { id: 'decor' as const, icon: 'star', color: colors.candyPink },
          ]).map((ticket) => (
            <View key={ticket.id} style={[styles.ticket, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.ticketIcon, { backgroundColor: ticket.color }]}>
                <Feather name={ticket.icon as keyof typeof Feather.glyphMap} size={14} color={colors.foreground} />
              </View>
              <View>
                <Text style={[styles.ticketCount, { color: colors.foreground }]}>{rewardTokens[ticket.id]}</Text>
                <Text style={[styles.ticketName, { color: colors.mutedForeground }]}>{REWARD_CATEGORY_LABELS[ticket.id]}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={[styles.rewardHint, { backgroundColor: colors.secondary }]}>
          <Feather name="gift" size={14} color={colors.primary} />
          <Text style={[styles.rewardHintText, { color: colors.foreground }]}>
            首次完成目標 +20 金幣；運動得設施券、閱讀得店鋪券、日記得裝飾星。
          </Text>
        </View>

        <View style={styles.sceneHeading}>
          <View>
            <Text style={[styles.sceneTitle, { color: colors.foreground }]}>街區地圖</Text>
            <Text style={[styles.sceneSub, { color: colors.mutedForeground }]}>已建造 {constructed.length} 間店鋪與設施</Text>
          </View>
          <View style={[styles.buildCount, { backgroundColor: colors.secondary }]}>
            <Feather name="home" size={13} color={colors.primary} />
            <Text style={[styles.buildCountText, { color: colors.primary }]}>{constructed.length + 1}</Text>
          </View>
        </View>

        <Animated.View style={[
          styles.scene,
          { backgroundColor: colors.candyMint, borderColor: colors.border },
          { opacity: sceneOpacity, transform: [{ translateY: sceneOffset }] },
        ]}>
          <View style={[styles.sky, { backgroundColor: colors.candySky }]}>
            <PulsingSun style={[styles.skySun, { backgroundColor: colors.candyLemon }]} />
            <FloatingCloud style={styles.cloudOne} size={27} duration={2200} />
            <FloatingCloud style={styles.cloudTwo} size={21} duration={2700} />
            <View style={styles.skyCaption}>
              <Text style={[styles.skyTitle, { color: colors.foreground }]}>今天也有新的地方</Text>
              <Text style={[styles.skyText, { color: colors.mutedForeground }]}>等著你來慢慢打造</Text>
            </View>
            <Feather name="wind" size={16} color={colors.candyMintDark} style={styles.skyWind} />
          </View>
          <View style={[styles.mapBody, { backgroundColor: colors.candyMint }]}>
            <View style={styles.mapGrid}>
              {slots.map((slot, index) => (
                <View key={slot.type === 'building' ? slot.item.id : `${slot.type}-${index}`} style={styles.mapCell}>
                  {slot.type === 'landmark'
                    ? <BuildingTile isLandmark />
                    : slot.type === 'building'
                      ? <BuildingTile item={slot.item} />
                      : <BuildingTile onPress={scrollToCatalog} />}
                </View>
              ))}
            </View>
            <View style={styles.street}>
              <Feather name="move" size={13} color={colors.candyMintDark} />
              <Text style={[styles.roadLabelText, { color: colors.candyMintDark }]}>慢慢街</Text>
              <Feather name="move" size={13} color={colors.candyMintDark} />
            </View>
          </View>
          <View style={[styles.mapFooter, { backgroundColor: colors.candyCream }]}>
            <Feather name="sun" size={14} color={colors.candyCaramelDark} />
            <Text style={[styles.mapFooterText, { color: colors.mutedForeground }]}>每個小小的努力，都會在這裡留下痕跡。</Text>
          </View>
        </Animated.View>

        {storageError && (
          <View style={[styles.storageError, { backgroundColor: colors.candyPink }]}>
            <Feather name="alert-circle" size={15} color={colors.destructive} />
            <Text style={[styles.storageErrorText, { color: colors.destructive }]}>{storageError}</Text>
          </View>
        )}

        <View
          style={styles.catalogHeader}
          onLayout={(event) => { shopSectionY.current = event.nativeEvent.layout.y; }}
        >
          <View>
            <Text style={[styles.sceneTitle, { color: colors.foreground }]}>下一個想蓋什麼？</Text>
            <Text style={[styles.sceneSub, { color: colors.mutedForeground }]}>完成目標領取專屬券，再用金幣建造。</Text>
          </View>
          <Feather name="arrow-down" size={17} color={colors.primary} />
        </View>

        <View style={styles.categoryFilters}>
          {CATEGORIES.map((filter) => {
            const active = filter.id === category;
            return (
              <Pressable
                key={filter.id}
                onPress={() => setCategory(filter.id)}
                style={[
                  styles.filterPill,
                  { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.filterText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{filter.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.catalogList}>
          {visibleItems.map((item) => {
            const owned = purchasedItems.includes(item.id);
            const enoughCoins = coins >= item.price;
            const enoughTickets = rewardTokens[item.category] >= item.ticketCost;
            const disabled = owned || purchasing !== null;
            return (
              <View key={item.id} style={[styles.catalogCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.catalogIcon, { backgroundColor: item.color }]}>
                  <Feather name={item.icon as keyof typeof Feather.glyphMap} size={22} color={colors.foreground} />
                </View>
                <View style={styles.catalogInfo}>
                  <View style={styles.catalogNameRow}>
                    <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                    <Text style={[styles.itemType, { color: colors.primary, backgroundColor: colors.secondary }]}>{CATEGORY_NAMES[item.category]}</Text>
                  </View>
                  <Text numberOfLines={1} style={[styles.itemDescription, { color: colors.mutedForeground }]}>{item.description}</Text>
                  <View style={styles.costRow}>
                    <View style={styles.costPart}><Feather name="circle" size={11} color={colors.candyCaramelDark} /><Text style={[styles.costText, { color: colors.candyCaramelDark }]}>{item.price}</Text></View>
                    <Text style={[styles.costDivider, { color: colors.mutedForeground }]}>+</Text>
                    <View style={styles.costPart}><Feather name={item.category === 'facility' ? 'map-pin' : item.category === 'shop' ? 'shopping-bag' : 'star'} size={11} color={colors.primary} /><Text style={[styles.costText, { color: colors.primary }]}>{item.ticketCost}</Text></View>
                  </View>
                </View>
                <Pressable
                  onPress={() => void build(item)}
                  disabled={disabled}
                  style={[
                    styles.buildButton,
                    { backgroundColor: owned ? colors.secondary : colors.primary, opacity: disabled && !owned ? 0.55 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={owned ? `${item.name}已建造` : `建造${item.name}`}
                >
                  <Feather name={owned ? 'check' : 'plus'} size={17} color={owned ? colors.primary : colors.primaryForeground} />
                </Pressable>
                {!owned && (!enoughCoins || !enoughTickets) && (
                  <Text style={[styles.missingText, { color: colors.mutedForeground }]}>
                    {!enoughCoins ? `還差 ${item.price - coins} 金幣` : `還差 ${item.ticketCost - rewardTokens[item.category]} ${REWARD_CATEGORY_LABELS[item.category]}`}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 23, fontWeight: '700', marginTop: 6 },
  subtitle: { fontSize: 12, lineHeight: 19, marginTop: 6 },
  coinWallet: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  walletNumber: { fontSize: 14, fontWeight: '700' },
  walletLabel: { fontSize: 9, marginTop: 1 },
  ticketRow: { flexDirection: 'row', gap: 8, marginTop: 17 },
  ticket: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 14, padding: 8 },
  ticketIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  ticketCount: { fontSize: 12, fontWeight: '700' },
  ticketName: { fontSize: 9, marginTop: 1 },
  rewardHint: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, marginTop: 9 },
  rewardHintText: { flex: 1, fontSize: 10, lineHeight: 15 },
  sceneHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 11 },
  sceneTitle: { fontSize: 17, fontWeight: '700' },
  sceneSub: { fontSize: 10, marginTop: 4 },
  buildCount: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 11 },
  buildCountText: { fontSize: 11, fontWeight: '700' },
  scene: { overflow: 'hidden', borderRadius: 22, borderWidth: 1 },
  sky: { height: 96, overflow: 'hidden', justifyContent: 'center', paddingHorizontal: 16 },
  skySun: { position: 'absolute', right: 31, top: 14, width: 46, height: 46, borderRadius: 23 },
  cloudOne: { position: 'absolute', right: 93, top: 21 },
  cloudTwo: { position: 'absolute', right: 20, top: 60 },
  skyCaption: { zIndex: 1 },
  skyTitle: { fontSize: 14, fontWeight: '700' },
  skyText: { fontSize: 10, marginTop: 4 },
  skyWind: { position: 'absolute', left: 174, top: 58 },
  mapBody: { paddingHorizontal: 11, paddingVertical: 12 },
  mapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  mapCell: { width: '48%', minHeight: 103, zIndex: 1 },
  buildingTile: { flex: 1, minHeight: 103, borderWidth: 1, borderRadius: 15, padding: 9, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' },
  buildingRoof: { width: 51, height: 45, borderRadius: 14, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 5 },
  buildingDoorRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: 15 },
  buildingWindow: { width: 12, height: 11, borderRadius: 3 },
  buildingDoor: { width: 9, height: 14, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  buildingName: { fontSize: 10, fontWeight: '700', marginTop: 5 },
  builtMark: { position: 'absolute', right: 7, top: 7, width: 17, height: 17, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  emptyLot: { flex: 1, minHeight: 103, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  emptyLotIcon: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  emptyLotTitle: { fontSize: 10, fontWeight: '600', marginTop: 5 },
  emptyLotCopy: { fontSize: 8, marginTop: 2 },
  street: { alignSelf: 'center', backgroundColor: palette.light.candyPeach, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 6, marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  roadLabelText: { fontSize: 9, fontWeight: '600' },
  mapFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11 },
  mapFooterText: { fontSize: 10 },
  storageError: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderRadius: 12, marginTop: 12 },
  storageErrorText: { fontSize: 11, flex: 1 },
  catalogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 12 },
  categoryFilters: { flexDirection: 'row', gap: 7, marginBottom: 11 },
  filterPill: { paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderRadius: 99 },
  filterText: { fontSize: 11, fontWeight: '600' },
  catalogList: { gap: 9 },
  catalogCard: { minHeight: 83, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 17, padding: 10, gap: 10 },
  catalogIcon: { width: 43, height: 43, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  catalogInfo: { flex: 1, minWidth: 0 },
  catalogNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemName: { fontSize: 12, fontWeight: '700', flexShrink: 1 },
  itemType: { overflow: 'hidden', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 3, fontSize: 8, fontWeight: '600' },
  itemDescription: { fontSize: 9, marginTop: 4 },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  costPart: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  costText: { fontSize: 10, fontWeight: '700' },
  costDivider: { fontSize: 9 },
  buildButton: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  missingText: { position: 'absolute', right: 52, bottom: 8, fontSize: 8 },
});
