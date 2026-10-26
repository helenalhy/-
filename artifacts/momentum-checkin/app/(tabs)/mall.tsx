import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Alert,
  ImageBackground,
  Keyboard,
  findNodeHandle,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import palette from '@/constants/colors';
import {
  MALL_FLOOR_COUNT,
  MALL_SLOT_IDS,
  useHabits,
  type MallSlotId,
  type RewardCategory,
} from '@/context/HabitsContext';
import { useColors } from '@/hooks/useColors';
import { MallAmbience, MallObjectVisual } from '@/components/MallVisuals';
import { MALL_FLOORS, MALL_ITEMS, MALL_ITEM_BY_ID, type MallItem } from '@/constants/mall';
import { SHOP_INTERIOR_DECORATIONS } from '@/constants/mall-shop-interior';
import { CatalogPager } from '@/components/CatalogPager';
import { getMallSlotPosition, MALL_POSITIONS_PER_FLOOR, type MallWing } from '@/constants/mall-layout';
import { MallWingPager } from '@/components/MallWingPager';

const CATALOG_PAGE_SIZE = 10;
const IS_DEVELOPMENT_PREVIEW = typeof __DEV__ !== 'undefined' && __DEV__;
const RECENT_SEARCHES_STORAGE_KEY = '@momentum/mall/recent-searches';
const RECENT_SEARCHES_LIMIT = 8;
const MAX_INTERIOR_CATALOG_COST = Math.max(
  ...Object.values(SHOP_INTERIOR_DECORATIONS).map((catalog) => catalog.reduce((total, item) => total + item.price, 0)),
);
const PREVIEW_TEST_COIN_BALANCE = MALL_ITEMS.reduce((total, item) => total + item.price, 0)
  + MALL_ITEMS.filter((item) => item.category === 'shop').length * MAX_INTERIOR_CATALOG_COST;

const CATEGORIES: { id: 'all' | RewardCategory; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'shop', label: '店鋪' },
  { id: 'facility', label: '設施' },
  { id: 'decor', label: '裝潢' },
];

const CATEGORY_NAMES: Record<RewardCategory, string> = {
  facility: '設施',
  shop: '店鋪',
  decor: '裝潢',
};

const getSlotPosition = getMallSlotPosition;
const WING_NAMES: Record<MallWing, string> = {
  main: '主商場',
  annex: '延伸區',
  extension: '延伸區二',
  extension3: '延伸區三',
  extension4: '延伸區四',
};
const SEARCH_WING_FILTERS: { id: MallWing | 'unplaced'; label: string }[] = [
  { id: 'main', label: WING_NAMES.main },
  { id: 'annex', label: WING_NAMES.annex },
  { id: 'extension', label: WING_NAMES.extension },
  { id: 'extension3', label: WING_NAMES.extension3 },
  { id: 'extension4', label: WING_NAMES.extension4 },
  { id: 'unplaced', label: '尚未擺放' },
];

function MallSceneSlot({
  slotId,
  item,
  isSceneActive = true,
  isPlacementTarget,
  isPlacementMode,
  isPreview = false,
  disabled = false,
  busy = false,
  isLocationHighlighted = false,
  focusAfterResult = false,
  focusResultMessage,
  onFocusAfterResult,
  onPress,
  onLongPress,
}: {
  slotId: MallSlotId;
  item?: MallItem;
  isSceneActive?: boolean;
  isPlacementTarget: boolean;
  isPlacementMode: boolean;
  isPreview?: boolean;
  disabled?: boolean;
  busy?: boolean;
  isLocationHighlighted?: boolean;
  focusAfterResult?: boolean;
  focusResultMessage?: string | null;
  onFocusAfterResult?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
}) {
  const colors = useColors();
  const popIn = useRef(new Animated.Value(0.78)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const accessibilityRef = useRef<React.ElementRef<typeof Pressable>>(null);
  const position = getSlotPosition(slotId);

  useEffect(() => {
    popIn.setValue(item && isSceneActive ? 0.78 : 1);
    fadeIn.setValue(item && isSceneActive ? 0 : item ? 1 : 0);
    if (!item) return;
    if (!isSceneActive) return;
    const animation = Animated.parallel([
      Animated.spring(popIn, { toValue: 1, friction: 5, tension: 135, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(fadeIn, { toValue: 1, duration: 260, useNativeDriver: Platform.OS !== 'web' }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [item?.id, isSceneActive, popIn, fadeIn]);

  useEffect(() => {
    if (!focusAfterResult) return;
    const frame = requestAnimationFrame(() => {
      const node = findNodeHandle(accessibilityRef.current);
      if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
      onFocusAfterResult?.();
    });
    return () => cancelAnimationFrame(frame);
  }, [focusAfterResult, onFocusAfterResult]);

  if (item) {
    return (
      <Pressable
        style={[
          styles.sceneSlot,
          { left: position.left, top: position.top, width: position.width, height: position.height },
          isPreview && styles.sceneSlotTarget,
          isLocationHighlighted && { borderWidth: 2, borderColor: colors.primary, borderRadius: 10, backgroundColor: colors.secondary },
        ]}
        onPress={onPress}
        onLongPress={onLongPress}
        ref={accessibilityRef}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${position.floor} ${position.label} ${item.name}，${isPreview ? '預覽中，尚未兌換' : isLocationHighlighted ? '目前查看位置，已擺放' : item.category === 'shop' ? '已兌換，點選進入店內佈置，長按可選擇搬動或存入倉庫' : '已兌換，點選可搬動，長按可選擇搬動或存入倉庫'}${focusResultMessage ? `，操作結果：${focusResultMessage}` : ''}`}
        accessibilityHint={!isPreview ? item.category === 'shop' ? '點選商店動畫進入店內佈置；長按後可選擇搬動到其他位置或存入倉庫。' : '長按後可選擇搬動到其他位置或存入倉庫。' : undefined}
        accessibilityState={{ selected: isPreview || isLocationHighlighted, disabled, busy }}
        testID={`mall-slot-${slotId}`}
      >
        <Animated.View style={[
          styles.sceneShopBadge,
          { opacity: fadeIn, height: position.plaza ? 30 : 47, transform: [{ scale: Animated.multiply(popIn, position.scale) }] },
        ]}>
          <MallObjectVisual
            id={item.visual ?? item.id}
            itemId={item.id}
            color={item.color}
            icon={item.icon}
            category={item.category}
            isActive={isSceneActive}
          />
        </Animated.View>
        <Text numberOfLines={1} style={[styles.sceneShopName, { color: palette.light.foreground, fontSize: position.plaza ? 7 : 8 }]}>{item.name}</Text>
        {isLocationHighlighted && <Text style={[styles.locationMarker, { color: colors.primary, backgroundColor: colors.secondary }]}>目前位置</Text>}
        {isPreview && !position.plaza && <Text style={[styles.sceneShopName, { color: colors.primary }]}>預覽</Text>}
      </Pressable>
    );
  }
  return (
    <Pressable
      style={[
        styles.sceneSlot,
        { left: position.left, top: position.top, width: position.width, height: position.height },
        isPlacementTarget && styles.sceneSlotTarget,
      ]}
      onPress={onPress}
      ref={accessibilityRef}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={isPlacementMode ? `${position.floor} ${position.label}空位，放置選擇的項目` : `${position.floor} ${position.label}空位，選擇要建造的項目`}
      accessibilityState={{ disabled, busy }}
      testID={`mall-slot-${slotId}`}
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
  const sceneOpacity = useRef(new Animated.Value(1)).current;
  const sceneOffset = useRef(new Animated.Value(14)).current;
  const { coins, purchasedItems, mallPlacements, purchaseMallItem, moveMallItem, storeMallItem, grantTestCoins, storageError, isLoading } = useHabits();
  const [showCollection, setShowCollection] = useState(false);
  const [warehouseNotice, setWarehouseNotice] = useState<string | null>(null);
  const [placementAnnouncement, setPlacementAnnouncement] = useState('');
  const [focusResultMessage, setFocusResultMessage] = useState<string | null>(null);
  const [focusRestoreActionItemId, setFocusRestoreActionItemId] = useState<string | null>(null);
  const focusRestoreActionRef = useRef<React.ElementRef<typeof Pressable>>(null);
  const [focusResultSlotId, setFocusResultSlotId] = useState<MallSlotId | null>(null);
  const clearFocusResultSlot = useCallback(() => setFocusResultSlotId(null), []);
  const [locationFocus, setLocationFocus] = useState<{ slotId: MallSlotId; requestId: number } | null>(null);
  const locationFocusRequestId = useRef(0);
  const [category, setCategory] = useState<'all' | RewardCategory>('all');
  const [currentFloor, setCurrentFloor] = useState(1);
  const [catalogPage, setCatalogPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [recentSearchStorageError, setRecentSearchStorageError] = useState(false);
  const recentSearchesRef = useRef<string[]>([]);
  const recentSearchLoadRef = useRef<Promise<string[]> | null>(null);
  const recentSearchQueueRef = useRef<Promise<void>>(Promise.resolve());
  const recentSearchesChangedRef = useRef(false);
  const [searchFloor, setSearchFloor] = useState<number | null>(null);
  const [searchWing, setSearchWing] = useState<MallWing | 'unplaced' | null>(null);
  const [affordableOnly, setAffordableOnly] = useState(false);
  const [priceAscending, setPriceAscending] = useState(false);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [testCoinLoading, setTestCoinLoading] = useState(false);
  const operationLock = useRef(false);
  const [previewSlotId, setPreviewSlotId] = useState<MallSlotId | null>(null);
  const [placementIntent, setPlacementIntent] = useState<{ itemId: string; mode: 'purchase' | 'move' | 'restore' } | null>(null);
  const fillPreviewCoins = useCallback(async () => {
    if (!IS_DEVELOPMENT_PREVIEW || testCoinLoading) return;
    setTestCoinLoading(true);
    try {
      await grantTestCoins(PREVIEW_TEST_COIN_BALANCE);
      Alert.alert('測試金幣已補足', '已準備足夠金幣，可測試全部樓層物件及每間商店的店內佈置。');
    } catch (error) {
      Alert.alert('補足測試金幣失敗', error instanceof Error ? error.message : '請稍後再試。');
    } finally {
      setTestCoinLoading(false);
    }
  }, [grantTestCoins, testCoinLoading]);
  const ownedIds = useMemo(() => new Set(purchasedItems), [purchasedItems]);
  const placedIds = useMemo(() => new Set(Object.values(mallPlacements)), [mallPlacements]);
  const placedSlotsByItem = useMemo(
    () => new Map(Object.entries(mallPlacements).map(([slotId, itemId]) => [itemId, slotId as MallSlotId])),
    [mallPlacements],
  );
  const constructed = useMemo(() => MALL_ITEMS.filter((item) => placedIds.has(item.id)), [placedIds]);
  const collectionItems = useMemo(
    () => MALL_ITEMS.filter((item) => ownedIds.has(item.id) && !placedIds.has(item.id)),
    [ownedIds, placedIds],
  );
  const floorTheme = MALL_FLOORS[currentFloor - 1];
  const floorItems = MALL_ITEMS.filter((item) => item.floor === currentFloor);
  const searchTerm = searchQuery.trim().toLocaleLowerCase();
  const isSearching = searchTerm.length > 0;
  const searchItems = useMemo(
    () => MALL_ITEMS.filter((item) => {
      const searchableText = `${item.name} ${item.description}`.toLocaleLowerCase();
      if (!searchableText.includes(searchTerm)) return false;
      if (searchFloor !== null && item.floor !== searchFloor) return false;
      if (searchWing === null) return true;
      const slotId = placedSlotsByItem.get(item.id);
      if (searchWing === 'unplaced') return !slotId;
      return slotId !== undefined && getSlotPosition(slotId).wing === searchWing;
    }),
    [searchTerm, searchFloor, searchWing, placedSlotsByItem],
  );
  const catalogItems = isSearching ? searchItems : showCollection ? collectionItems : floorItems;
  // Warehouse items are already owned and always free to place.
  const showRedemptionControls = !showCollection || isSearching;
  const filteringAffordable = showRedemptionControls && affordableOnly;
  const eligibleItems = catalogItems.filter((item) => !filteringAffordable || (!ownedIds.has(item.id) && item.price <= coins));
  const visibleItems = eligibleItems.filter((item) => category === 'all' || item.category === category);
  if (showRedemptionControls && priceAscending) visibleItems.sort((a, b) => a.price - b.price);
  const catalogPages = Math.max(1, Math.ceil(visibleItems.length / CATALOG_PAGE_SIZE));
  const currentCatalogPage = Math.min(catalogPage, catalogPages);
  const pagedItems = visibleItems.slice((currentCatalogPage - 1) * CATALOG_PAGE_SIZE, currentCatalogPage * CATALOG_PAGE_SIZE);
  const currentPlacementItem = placementIntent ? MALL_ITEM_BY_ID[placementIntent.itemId] : null;
  const floorSlots = MALL_SLOT_IDS.filter((slotId) => slotId.startsWith(`floor-${currentFloor}-`));
  const floorItemCount = floorSlots.filter((slotId) => mallPlacements[slotId]).length;
  const isFloorFull = floorItemCount === floorSlots.length;
  const availableFloors = MALL_FLOORS.map((_, index) => {
    const floor = index + 1;
    const emptyCount = MALL_SLOT_IDS.filter(
      (slotId) => slotId.startsWith(`floor-${floor}-`) && !mallPlacements[slotId],
    ).length;
    return { floor, emptyCount };
  }).filter(({ emptyCount }) => emptyCount > 0);

  useEffect(() => {
    let active = true;
    const load = AsyncStorage.getItem(RECENT_SEARCHES_STORAGE_KEY)
      .then((raw) => {
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return [...new Set(parsed
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean))]
          .slice(0, RECENT_SEARCHES_LIMIT);
      })
      .catch(() => []);
    recentSearchLoadRef.current = load;
    void load.then((saved) => {
      if (!active || recentSearchesChangedRef.current) return;
      recentSearchesRef.current = saved;
      setRecentSearches(saved);
    });
    return () => {
      active = false;
    };
  }, []);

  function updateRecentSearches(
    update: (current: string[]) => string[],
  ): Promise<void> {
    const operation = recentSearchQueueRef.current.then(async () => {
      if (!recentSearchesChangedRef.current && recentSearchLoadRef.current) {
        const saved = await recentSearchLoadRef.current;
        recentSearchesRef.current = saved;
        setRecentSearches(saved);
      }
      const next = update(recentSearchesRef.current);
      if (
        next.length === recentSearchesRef.current.length &&
        next.every((entry, index) => entry === recentSearchesRef.current[index])
      ) return;
      recentSearchesChangedRef.current = true;
      recentSearchesRef.current = next;
      setRecentSearches(next);
      try {
        await AsyncStorage.setItem(RECENT_SEARCHES_STORAGE_KEY, JSON.stringify(next));
        setRecentSearchStorageError(false);
      } catch {
        setRecentSearchStorageError(true);
      }
    });
    recentSearchQueueRef.current = operation.catch(() => {});
    return operation;
  }

  function saveRecentSearch(query: string): Promise<void> {
    const normalized = query.trim();
    if (!normalized) return Promise.resolve();
    return updateRecentSearches((current) => [
      normalized,
      ...current.filter((entry) => entry.toLocaleLowerCase() !== normalized.toLocaleLowerCase()),
    ].slice(0, RECENT_SEARCHES_LIMIT));
  }

  function applyRecentSearch(query: string) {
    setSearchQuery(query);
    setSearchFloor(null);
    setSearchWing(null);
    setCategory('all');
    setAffordableOnly(false);
    setPriceAscending(false);
    setCatalogPage(1);
  }

  useEffect(() => {
    const entrance = Animated.parallel([
      Animated.timing(sceneOpacity, { toValue: 1, duration: 420, useNativeDriver: false }),
      Animated.spring(sceneOffset, { toValue: 0, friction: 8, tension: 70, useNativeDriver: false }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [sceneOpacity, sceneOffset]);

  useEffect(() => {
    if (!focusRestoreActionItemId) return;
    const frame = requestAnimationFrame(() => {
      const node = findNodeHandle(focusRestoreActionRef.current);
      if (node !== null) AccessibilityInfo.setAccessibilityFocus(node);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRestoreActionItemId, showCollection]);

  function scrollToMallScene() {
    scrollRef.current?.scrollTo({ y: Math.max(0, mallSceneY.current - 8), animated: true });
  }

  function announcePlacement(message: string, queue = false) {
    setFocusResultMessage(null);
    setFocusRestoreActionItemId(null);
    setPlacementAnnouncement(message);
    // Android uses the live region below. Queue VoiceOver's result behind the
    // in-progress announcement so the final outcome is not cut off.
    if (Platform.OS === 'ios') {
      AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue });
    }
  }

  function announceFocusedResult(message: string) {
    setPlacementAnnouncement(message);
    setFocusResultMessage(message);
    setFocusRestoreActionItemId(null);
  }

  function changeFloor(direction: number) {
    if (operationLock.current || purchasing) return;
    const nextFloor = Math.min(MALL_FLOOR_COUNT, Math.max(1, currentFloor + direction));
    if (nextFloor === currentFloor) return;
    setPreviewSlotId(null);
    if (previewSlotId) announcePlacement(`已切換至 ${nextFloor}F，試擺預覽已清除，尚未兌換或扣除金幣。請重新選擇位置。`);
    setCurrentFloor(nextFloor);
    setCatalogPage(1);
    sceneOpacity.setValue(0.45);
    Animated.timing(sceneOpacity, { toValue: 1, duration: 260, useNativeDriver: false }).start();
  }

  function changeCatalogPage(page: number) {
    setCatalogPage(Math.max(1, Math.min(catalogPages, page)));
    scrollRef.current?.scrollTo({ y: Math.max(0, shopSectionY.current - 8), animated: true });
  }

  function startPurchasePlacement(item: MallItem) {
    if (isLoading || purchasedItems.includes(item.id) || purchasing || placementIntent) return;
    if (coins < item.price) {
      Alert.alert('金幣還差一點', `完成更多目標就能再賺 ${item.price - coins} 金幣。`);
      return;
    }
    setWarehouseNotice(null);
    setPlacementIntent({ itemId: item.id, mode: 'purchase' });
    setPreviewSlotId(null);
    announcePlacement(`已選擇${item.name}，請選擇空位試擺，尚未兌換或扣除金幣。`);
    scrollToMallScene();
  }

  function cancelPlacement() {
    if (operationLock.current) return;
    if (placementIntent?.mode === 'purchase') {
      announcePlacement('已取消試擺，尚未兌換或扣除金幣。');
    } else if (placementIntent?.mode === 'move' && currentPlacementItem) {
      announcePlacement(`已取消搬動${currentPlacementItem.name}，原位置未更改，也沒有扣除金幣。`);
    } else if (placementIntent?.mode === 'restore' && currentPlacementItem) {
      announcePlacement(`已取消免費重擺${currentPlacementItem.name}，物件仍留在倉庫，沒有扣除金幣。`);
    }
    setPreviewSlotId(null);
    setPlacementIntent(null);
  }

  function selectSearchItem(item: MallItem) {
    if (isLoading || purchasing || operationLock.current || placementIntent) return;
    if (!ownedIds.has(item.id) && coins < item.price) {
      Alert.alert('金幣還差一點', `完成更多目標就能再賺 ${item.price - coins} 金幣。`);
      return;
    }
    Keyboard.dismiss();
    changeFloor(item.floor - currentFloor);
    setWarehouseNotice(null);
    setPreviewSlotId(null);
    const mode = ownedIds.has(item.id)
      ? placedIds.has(item.id) ? 'move' : 'restore'
      : 'purchase';
    setPlacementIntent({ itemId: item.id, mode });
    announcePlacement(`已前往 ${item.floor}F，選擇${item.name}。${mode === 'purchase' ? '請選擇空位試擺，確認兌換才扣金幣。' : mode === 'move' ? '已兌換，可免費重新擺放。可選空位搬動或選其他物件交換，也可存入倉庫；按取消可保留原位置。' : '請選空位免費重擺；按取消可讓物件留在倉庫。'}搜尋及換層沒有扣除金幣。`);
    scrollToMallScene();
  }

  function viewPlacedItemLocation(item: MallItem) {
    if (isLoading || purchasing || operationLock.current || placementIntent) return;
    const slotId = placedSlotsByItem.get(item.id);
    if (!slotId) return;
    Keyboard.dismiss();
    const position = getSlotPosition(slotId);
    locationFocusRequestId.current += 1;
    setLocationFocus({ slotId, requestId: locationFocusRequestId.current });
    changeFloor(Number(position.floor.replace('F', '')) - currentFloor);
    announcePlacement(`${item.name}目前位於 ${position.floor}・${WING_NAMES[position.wing]}・${position.label}。已跳轉並標示位置；沒有進入搬動模式、未更改擺放或扣除金幣。`);
    scrollToMallScene();
  }

  async function placeItemInSlot(slotId: MallSlotId, confirmed = false) {
    if (isLoading || !placementIntent || !currentPlacementItem || purchasing || operationLock.current) return;
    if (placementIntent.mode !== 'move' && mallPlacements[slotId]) {
      if (placementIntent.mode === 'restore') {
        const position = getSlotPosition(slotId);
        announcePlacement(`${position.floor} ${position.label}已有物件，請選空位；${currentPlacementItem.name}仍保留在倉庫，沒有扣除金幣。`);
      }
      return;
    }
    if (mallPlacements[slotId] === currentPlacementItem.id) return;
    if (placementIntent.mode === 'purchase') {
      if (!confirmed) {
        setPreviewSlotId(slotId);
        const position = getSlotPosition(slotId);
        announcePlacement(`${currentPlacementItem.name}試擺於 ${position.floor} ${position.label}，尚未兌換或扣除金幣。需要 ${currentPlacementItem.price} 金幣，請按確認兌換，或改選其他空位。`);
        return;
      }
      if (previewSlotId !== slotId || !floorSlots.includes(slotId)) return;
    }
    operationLock.current = true;
    setPurchasing(currentPlacementItem.id);
    const position = getSlotPosition(slotId);
    const location = `${position.floor} ${position.label}`;
    const displacedItem = placementIntent.mode === 'move' && mallPlacements[slotId]
      ? MALL_ITEM_BY_ID[mallPlacements[slotId]]
      : null;
    const originalSlotId = placedSlotsByItem.get(currentPlacementItem.id);
    const originalLocation = originalSlotId ? getSlotPosition(originalSlotId) : null;
    if (placementIntent.mode === 'purchase') announcePlacement(`正在兌換${currentPlacementItem.name}，位置為 ${location}，請稍候。`);
    try {
      if (placementIntent.mode === 'purchase') {
        await purchaseMallItem(
          currentPlacementItem.id,
          currentPlacementItem.price,
          currentPlacementItem.category,
          currentPlacementItem.ticketCost,
          slotId,
        );
        setFocusResultSlotId(slotId);
        announcePlacement(`${currentPlacementItem.name}已兌換，已放在 ${location}，扣除 ${currentPlacementItem.price} 金幣。`, true);
      } else {
        await moveMallItem(currentPlacementItem.id, slotId);
        setFocusResultSlotId(slotId);
        const resultMessage = placementIntent.mode === 'restore'
          ? `免費重擺完成：${currentPlacementItem.name}已從倉庫放在 ${location}，沒有扣除金幣。`
          : displacedItem
            ? `交換完成：${currentPlacementItem.name}與${displacedItem.name}已交換位置，${currentPlacementItem.name}現在位於 ${location}，沒有扣除金幣。`
            : `搬動完成：${currentPlacementItem.name}已移至 ${location}，沒有扣除金幣。`;
        announceFocusedResult(resultMessage);
      }
      setPlacementIntent(null);
      setPreviewSlotId(null);
      scrollToMallScene();
    } catch (error) {
      if (placementIntent.mode === 'purchase') {
        announcePlacement(`兌換未完成：${error instanceof Error ? error.message : '請再試一次。'} 試擺位置仍為 ${location}，可重新確認兌換或取消。`, true);
      } else {
        const retryMessage = placementIntent.mode === 'restore'
          ? `免費重擺未成功：${error instanceof Error ? error.message : '請再試一次。'} ${currentPlacementItem.name}仍留在倉庫；可重試選空位或取消。`
          : `搬動或交換未成功：${error instanceof Error ? error.message : '請再試一次。'} ${currentPlacementItem.name}${originalLocation ? `仍在 ${originalLocation.floor} ${originalLocation.label}` : '仍保留在原位置'}；可重試，或按「取消擺放」。`;
        announcePlacement(retryMessage, true);
      }
    } finally {
      operationLock.current = false;
      setPurchasing(null);
    }
  }

  function handleSceneSlotPress(slotId: MallSlotId) {
    if (isLoading || purchasing || operationLock.current) return;
    const itemId = mallPlacements[slotId];
    if (placementIntent) {
      if (!itemId || placementIntent.mode === 'move') void placeItemInSlot(slotId);
      return;
    }
    if (itemId) {
      const item = MALL_ITEM_BY_ID[itemId];
      if (item?.category === 'shop') {
        router.push({ pathname: '/mall-shop/[itemId]', params: { itemId: item.id } });
        return;
      }
      setPlacementIntent({ itemId, mode: 'move' });
      if (item) announcePlacement(`已選取${item.name}。選空位可免費搬動，選其他物件可交換位置，也可存入倉庫；按取消可保留原位置。`);
      return;
    }
    setShowCollection(false);
    setCatalogPage(1);
    scrollToCatalog();
  }

  function handleSceneSlotLongPress(slotId: MallSlotId) {
    if (isLoading || purchasing || operationLock.current || placementIntent) return;
    const itemId = mallPlacements[slotId];
    const item = itemId ? MALL_ITEM_BY_ID[itemId] : undefined;
    if (!item) return;
    setPlacementIntent({ itemId: item.id, mode: 'move' });
    announcePlacement(`已選取${item.name}。已進入搬動模式，可選空位、交換位置或存入倉庫；按取消可保留原位置。`);
  }

  function scrollToCatalog() {
    scrollRef.current?.scrollTo({ y: Math.max(0, shopSectionY.current - 14), animated: true });
  }

  function openWarehouse() {
    if (operationLock.current || purchasing) return;
    if (previewSlotId) announcePlacement('已開啟倉庫，試擺預覽已取消，尚未兌換或扣除金幣。');
    setPlacementIntent(null);
    setPreviewSlotId(null);
    setWarehouseNotice(null);
    setShowCollection(true);
    setSearchQuery('');
    setCategory('all');
    setCatalogPage(1);
    requestAnimationFrame(scrollToCatalog);
  }

  async function storeSelectedItem() {
    if (!currentPlacementItem || purchasing || operationLock.current || placementIntent?.mode !== 'move') return;
    operationLock.current = true;
    setPurchasing(currentPlacementItem.id);
    try {
      await storeMallItem(currentPlacementItem.id);
      const resultMessage = `存入倉庫完成：${currentPlacementItem.name}已存入倉庫，所有權保留，可免費取出重擺，沒有退款或扣除金幣。`;
      setWarehouseNotice(resultMessage);
      setPlacementAnnouncement('');
      setFocusResultMessage(resultMessage);
      setFocusRestoreActionItemId(currentPlacementItem.id);
      setPlacementIntent(null);
      setPreviewSlotId(null);
      setShowCollection(true);
      setSearchQuery('');
      setCategory('all');
      setCatalogPage(1);
      requestAnimationFrame(scrollToCatalog);
    } catch (error) {
      const originalSlotId = placedSlotsByItem.get(currentPlacementItem.id);
      const originalPosition = originalSlotId ? getSlotPosition(originalSlotId) : null;
      announcePlacement(`存入倉庫未成功：${error instanceof Error ? error.message : '請再試一次。'} ${currentPlacementItem.name}${originalPosition ? `仍在 ${originalPosition.floor} ${originalPosition.label}` : '仍保留在原位置'}；可重試，或按「取消擺放」。`, true);
    } finally {
      operationLock.current = false;
      setPurchasing(null);
    }
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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>MOMENTUM MALL</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>你的慢慢商場</Text>
          </View>
          <View style={[styles.coinWallet, { backgroundColor: colors.primary }]}>
            <View
              testID="mall-wallet-coin-icon"
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={[styles.coinIcon, { backgroundColor: colors.candyCaramelDark }]}
            >
              <View style={[styles.coinFace, { backgroundColor: colors.candyCaramel, borderColor: colors.candyLemon }]}>
                <Feather name="star" size={10} color={colors.candyCaramelDark} />
              </View>
            </View>
            <View>
              <Text style={[styles.walletNumber, { color: colors.primaryForeground }]}>{coins}</Text>
              <Text style={[styles.walletLabel, { color: colors.primaryForeground, opacity: 0.8 }]}>金幣</Text>
            </View>
          </View>
        </View>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>完成今天的小目標，讓喜歡的街區慢慢長大。</Text>

        <View style={[styles.rewardHint, { backgroundColor: colors.secondary }]}>
          <Feather name="gift" size={14} color={colors.primary} />
          <Text style={[styles.rewardHintText, { color: colors.foreground }]}>
            完全免費 · 每個目標每日首次完成 +20 金幣 · 所有項目只用金幣兌換，沒有儲值或付費。
          </Text>
        </View>

        {IS_DEVELOPMENT_PREVIEW && (
          <View style={[styles.testCoinPanel, { backgroundColor: colors.candyCream, borderColor: colors.secondary }]}>
            <View style={styles.testCoinCopy}>
              <Text style={[styles.testCoinTitle, { color: colors.foreground }]}>預覽測試金幣</Text>
              <Text style={[styles.testCoinDescription, { color: colors.mutedForeground }]}>
                開發預覽限定 · 補足至 {PREVIEW_TEST_COIN_BALANCE.toLocaleString()} 金幣，可測試全商場物件與店內佈置。
              </Text>
            </View>
            <Pressable
              testID="dev-fill-mall-coins"
              onPress={fillPreviewCoins}
              disabled={isLoading || purchasing !== null || testCoinLoading}
              accessibilityRole="button"
              accessibilityLabel={`預覽測試補足金幣至至少 ${PREVIEW_TEST_COIN_BALANCE} 枚，正式版不提供`}
              accessibilityState={{ disabled: isLoading || purchasing !== null || testCoinLoading, busy: testCoinLoading }}
              style={[styles.testCoinButton, { backgroundColor: colors.primary, opacity: testCoinLoading ? 0.6 : 1 }]}
            >
              <Text style={[styles.testCoinButtonText, { color: colors.primaryForeground }]}>
                {testCoinLoading ? '補足中' : '補足金幣'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.sceneHeading}>
          <View>
            <Text style={[styles.sceneTitle, { color: colors.foreground }]}>十層慢慢商場</Text>
            <Text style={[styles.sceneSub, { color: colors.mutedForeground }]}>已放置 {constructed.length} / {MALL_SLOT_IDS.length} 個店鋪與設施</Text>
          </View>
          <Pressable onPress={openWarehouse} disabled={purchasing !== null} accessibilityRole="button" accessibilityLabel={`開啟倉庫，${collectionItems.length} 件已保存物件`} testID="warehouse-shortcut" style={[styles.buildCount, { backgroundColor: colors.secondary, minHeight: 44 }]}>
            <Feather name="archive" size={15} color={colors.primary} />
            <Text style={[styles.buildCountText, { color: colors.primary }]}>倉庫 {collectionItems.length}</Text>
          </Pressable>
        </View>

        <View onLayout={(event) => { mallSceneY.current = event.nativeEvent.layout.y; }}>
          {placementIntent && currentPlacementItem && (
            <View style={[styles.placementBanner, { backgroundColor: colors.secondary }]}>
              <Feather name="map-pin" size={19} color={colors.primary} />
              <View style={styles.placementCopy}>
                <Text style={[styles.placementTitle, { color: colors.foreground }]}>
                  {placementIntent.mode === 'purchase' ? '選擇擺放位置' : placementIntent.mode === 'restore' ? '從倉庫免費擺放' : '搬動或存入倉庫'}
                </Text>
                <Text style={[styles.placementSubtitle, { color: colors.mutedForeground }]}>{currentPlacementItem.name} · 可用箭頭換層，{placementIntent.mode === 'move' ? '可搬動、交換或存倉；存倉不退金幣' : placementIntent.mode === 'restore' ? '選任一空位，不扣金幣' : '先試擺預覽，確認兌換才扣金幣'}</Text>
              </View>
              {placementIntent.mode === 'move' && currentPlacementItem.category === 'shop' && (
                <Pressable
                  testID="open-shop-interior"
                  onPress={() => router.push({ pathname: '/mall-shop/[itemId]', params: { itemId: currentPlacementItem.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`進入${currentPlacementItem.name}店內佈置`}
                  style={styles.collectionAction}
                >
                  <Feather name="home" size={20} color={colors.primary} />
                  <Text style={[styles.filterText, { color: colors.primary }]}>店內佈置</Text>
                </Pressable>
              )}
              {placementIntent.mode === 'move' && (
                <Pressable onPress={() => void storeSelectedItem()} disabled={purchasing !== null} accessibilityRole="button" accessibilityLabel={`將${currentPlacementItem.name}存入倉庫`} testID="store-selected-item" style={styles.collectionAction}>
                  <Feather name="archive" size={20} color={colors.primary} />
                  <Text style={[styles.filterText, { color: colors.primary }]}>存入倉庫</Text>
                </Pressable>
              )}
              <Pressable onPress={cancelPlacement} disabled={purchasing !== null} accessibilityRole="button" accessibilityLabel="取消擺放" testID="cancel-placement" hitSlop={10}>
                <Feather name="x-circle" size={21} color={colors.primary} />
              </Pressable>
            </View>
          )}
          <View style={[styles.floorNavigation, { backgroundColor: floorTheme.surface }]}>
            <Pressable
              onPress={() => changeFloor(-1)}
              disabled={currentFloor === 1 || purchasing !== null}
              style={[styles.floorArrow, { opacity: currentFloor === 1 || purchasing !== null ? 0.3 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="上一層"
              testID="floor-previous"
            >
              <Feather name="chevron-left" size={25} color={floorTheme.accent} />
            </Pressable>
            <View style={styles.floorInformation}>
              <Text testID="floor-current" style={[styles.floorNumber, { color: floorTheme.accent }]}>{currentFloor}F · {floorTheme.title}</Text>
              <Text style={[styles.floorCaption, { color: colors.mutedForeground }]}>共 {MALL_FLOOR_COUNT} 層 · 本層 {floorItemCount} / {MALL_POSITIONS_PER_FLOOR} 個項目</Text>
            </View>
            <Pressable
              onPress={() => changeFloor(1)}
              disabled={currentFloor === MALL_FLOOR_COUNT || purchasing !== null}
              style={[styles.floorArrow, { opacity: currentFloor === MALL_FLOOR_COUNT || purchasing !== null ? 0.3 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="下一層"
              testID="floor-next"
            >
              <Feather name="chevron-right" size={25} color={floorTheme.accent} />
            </Pressable>
          </View>
          <Text testID="floor-description" style={[styles.floorDescription, { color: colors.mutedForeground }]}>{floorTheme.description}</Text>
          {placementIntent && isFloorFull && (
            <View testID="mall-floor-full" style={[styles.fullFloorNotice, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
              <Text accessibilityLiveRegion="polite" style={[styles.placementTitle, { color: colors.foreground }]}>
                {currentFloor}F 本層已滿 · {floorItemCount} 個位置皆已佔用
              </Text>
              <Text style={[styles.fullFloorCopy, { color: colors.foreground }]}>
                {placementIntent.mode === 'move'
                  ? '仍可點選其他物件交換位置，或按「存入倉庫」騰出位置，不扣金幣。'
                  : availableFloors.length > 0
                    ? '請前往下方有空位的樓層繼續擺放，已選物件會保留。'
                    : '十層都已放滿。請先取消擺放，點選已放置物件，再按「存入倉庫」騰出空位；之後可重新選擇物件擺放。'}
              </Text>
              {availableFloors.length > 0 ? (
                <>
                  <Text style={[styles.fullFloorCopy, { color: colors.mutedForeground }]}>有空位的樓層（也可用左右箭頭換層）：</Text>
                  <View style={styles.availableFloorActions}>
                    {availableFloors.map(({ floor, emptyCount }) => (
                      <Pressable
                        key={floor}
                        testID={`mall-available-floor-${floor}`}
                        onPress={() => changeFloor(floor - currentFloor)}
                        disabled={purchasing !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`前往 ${floor}F，尚有 ${emptyCount} 個空位，保留已選物件`}
                        accessibilityState={{ disabled: purchasing !== null }}
                        style={[styles.availableFloorButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <Text style={[styles.filterText, { color: colors.primary }]}>{floor}F · {emptyCount} 空位</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : placementIntent.mode === 'move' ? (
                <Text style={[styles.fullFloorCopy, { color: colors.mutedForeground }]}>十層都已放滿；可用樓層箭頭換層交換，或先將物件存入倉庫騰出空位。</Text>
              ) : null}
              {placementIntent.mode === 'purchase' && (
                <Text style={[styles.fullFloorCopy, { color: colors.mutedForeground }]}>尚未扣除金幣；選好空位並確認兌換後才扣金幣。</Text>
              )}
            </View>
          )}
          <Animated.View style={[
            styles.scene,
            { borderColor: colors.border, opacity: sceneOpacity, transform: [{ translateY: sceneOffset }] },
          ]}>
            <MallWingPager
              focusWing={locationFocus ? getSlotPosition(locationFocus.slotId).wing : null}
              focusRequestId={locationFocus?.requestId ?? null}
              counts={{
                main: floorSlots.filter((slotId) => getSlotPosition(slotId).wing === 'main' && mallPlacements[slotId]).length,
                annex: floorSlots.filter((slotId) => getSlotPosition(slotId).wing === 'annex' && mallPlacements[slotId]).length,
                extension: floorSlots.filter((slotId) => getSlotPosition(slotId).wing === 'extension' && mallPlacements[slotId]).length,
                extension3: floorSlots.filter((slotId) => getSlotPosition(slotId).wing === 'extension3' && mallPlacements[slotId]).length,
                extension4: floorSlots.filter((slotId) => getSlotPosition(slotId).wing === 'extension4' && mallPlacements[slotId]).length,
              }}
              onWingChange={() => {
                if (previewSlotId) announcePlacement('已切換商場分區，試擺預覽已清除，尚未兌換或扣除金幣。請重新選擇位置。');
                setPreviewSlotId(null);
              }}
              renderWing={(wing, active) => <ImageBackground
              source={floorTheme.image}
              resizeMode="cover"
              style={styles.mallArtwork}
              imageStyle={styles.mallArtworkImage}
            >
              {floorSlots.filter((slotId) => getSlotPosition(slotId).wing === wing).map((slotId) => {
                const itemId = mallPlacements[slotId];
                const isPreview = !itemId && placementIntent?.mode === 'purchase' && previewSlotId === slotId;
                return (
                  <MallSceneSlot
                    key={slotId}
                    slotId={slotId}
                     isSceneActive={active}
                    item={isPreview ? currentPlacementItem ?? undefined : itemId ? MALL_ITEM_BY_ID[itemId] : undefined}
                    isPreview={isPreview}
                    disabled={isLoading || purchasing !== null}
                    busy={purchasing !== null}
                    isLocationHighlighted={locationFocus?.slotId === slotId}
                    focusAfterResult={focusResultSlotId === slotId}
                    focusResultMessage={focusResultSlotId === slotId ? focusResultMessage : null}
                    onFocusAfterResult={clearFocusResultSlot}
                    isPlacementMode={placementIntent !== null}
                    isPlacementTarget={placementIntent !== null && !itemId}
                    onPress={() => handleSceneSlotPress(slotId)}
                    onLongPress={() => handleSceneSlotLongPress(slotId)}
                  />
                );
              })}
              {active && <MallAmbience floor={currentFloor} />}
            </ImageBackground>}
            />
            <View style={[styles.mapFooter, { backgroundColor: colors.candyCream }]}>
              <Feather name="move" size={13} color={colors.primary} />
              <Text style={[styles.mapFooterText, { color: colors.foreground }]}>
                {placementIntent ? (placementIntent.mode === 'purchase' ? '點選空位預覽 · 可改選位置 · 確認兌換後才扣金幣' : placementIntent.mode === 'restore' ? '可換層或換區，選空位免費擺放' : '選位置免費搬動或交換，也可存入倉庫') : '左右滑動切換區域 · 點店鋪動畫進入店內 · 長按店鋪、設施或裝修可搬動或存入倉庫'}
              </Text>
            </View>
          </Animated.View>
          {placementIntent?.mode === 'purchase' && currentPlacementItem && previewSlotId && (
            <View testID="mall-purchase-preview" style={[styles.previewPanel, { backgroundColor: colors.secondary, borderColor: colors.primary }]}>
              <Text style={[styles.placementTitle, { color: colors.foreground }]}>試擺預覽 · {currentPlacementItem.name}</Text>
              <Text style={[styles.previewDetails, { color: colors.foreground }]}>
                {getSlotPosition(previewSlotId).floor} · {floorTheme.title} · {getSlotPosition(previewSlotId).label}
              </Text>
              <Text style={[styles.previewDetails, { color: colors.foreground }]}>
                {currentPlacementItem.price} 金幣 · 完全免費，只用打卡金幣兌換
              </Text>
              <Text style={[styles.previewDetails, { color: colors.mutedForeground }]}>尚未扣除金幣或取得物件；喜歡這個效果再確認。</Text>
              <View style={styles.previewActions}>
                <Pressable testID="cancel-purchase-preview" onPress={cancelPlacement} disabled={purchasing !== null} accessibilityRole="button" accessibilityState={{ disabled: purchasing !== null }} style={[styles.previewButton, { backgroundColor: colors.card }]}>
                  <Text style={[styles.filterText, { color: colors.primary }]}>取消預覽</Text>
                </Pressable>
                <Pressable testID="confirm-purchase-preview" onPress={() => void placeItemInSlot(previewSlotId, true)} disabled={isLoading || purchasing !== null} accessibilityRole="button" accessibilityLabel={`${purchasing ? '正在兌換' : '確認兌換'}${currentPlacementItem.name}，${getSlotPosition(previewSlotId).floor} ${getSlotPosition(previewSlotId).label}，${currentPlacementItem.price} 金幣`} accessibilityState={{ disabled: isLoading || purchasing !== null, busy: purchasing !== null }} style={[styles.previewButton, { backgroundColor: colors.primary, opacity: purchasing ? 0.5 : 1 }]}>
                  <Text style={[styles.filterText, { color: colors.primaryForeground }]}>{purchasing ? '兌換中…' : '確認兌換'}</Text>
                </Pressable>
              </View>
            </View>
          )}
          <Text testID="mall-placement-status" accessibilityRole="text" accessibilityLiveRegion={focusResultMessage ? 'none' : 'polite'} style={[styles.previewDetails, { color: colors.mutedForeground }]}>
            {placementAnnouncement}
          </Text>
        </View>

        {storageError && (
          <View style={[styles.storageError, { backgroundColor: colors.candyPink }]}>
            <Feather name="alert-circle" size={15} color={colors.destructive} />
            <Text style={[styles.storageErrorText, { color: colors.destructive }]}>{storageError}</Text>
          </View>
        )}

        <View style={styles.collectionTabs}>
          {([{ id: false, label: '本層兌換', icon: 'shopping-bag' }, { id: true, label: `倉庫 · ${collectionItems.length}`, icon: 'archive' }] as const).map((tab) => (
            <Pressable key={tab.label} onPress={() => { setShowCollection(tab.id); setSearchQuery(''); setSearchFloor(null); setSearchWing(null); setCatalogPage(1); }} accessibilityRole="button" accessibilityState={{ selected: showCollection === tab.id }} testID={tab.id ? 'collection-tab' : 'catalog-tab'} style={[styles.filterPill, styles.collectionTab, { backgroundColor: showCollection === tab.id ? colors.secondary : colors.card, borderColor: colors.border }]}>
              <Feather name={tab.icon} size={16} color={colors.primary} />
              <Text style={[styles.filterText, { color: colors.primary }]}>{tab.label}</Text>
            </Pressable>
          ))}
        </View>
        <View
          style={styles.catalogHeader}
          onLayout={(event) => { shopSectionY.current = event.nativeEvent.layout.y; }}
        >
          <View>
            <Text testID="floor-catalog-title" style={[styles.sceneTitle, { color: colors.foreground }]}>{isSearching ? '搜尋結果 · 所有樓層' : showCollection ? '倉庫 · 所有樓層' : `${currentFloor}F 專屬兌換 · ${floorTheme.title}`}</Text>
            <Text style={[styles.sceneSub, { color: colors.mutedForeground }]}>{isSearching ? `全 ${MALL_ITEMS.length} 款名稱或描述搜尋 · 本分類 ${visibleItems.length} 款結果` : showCollection ? '商店、設施、裝修都可保存 · 不設件數上限 · 免費取出重擺' : `本層 ${floorItems.length} 款選物 · ${MALL_POSITIONS_PER_FLOOR} 個展示位，可存倉輪替`}</Text>
          </View>
          <Feather name="arrow-down" size={17} color={colors.primary} />
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.primary} />
          <TextInput
            testID="mall-search-input"
            accessibilityLabel={`搜尋全部 ${MALL_ITEMS.length} 款選物名稱或描述`}
            placeholder="搜尋所有樓層的商店、設施、裝修"
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (!text.trim()) {
                setSearchFloor(null);
                setSearchWing(null);
              }
              setCatalogPage(1);
            }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            onSubmitEditing={async () => {
              await saveRecentSearch(searchQuery);
              Keyboard.dismiss();
            }}
            onEndEditing={() => { void saveRecentSearch(searchQuery); }}
            style={[styles.searchInput, { color: colors.foreground }]}
          />
          {searchQuery.length > 0 && <Pressable
            onPress={() => { void saveRecentSearch(searchQuery); setSearchQuery(''); setSearchFloor(null); setSearchWing(null); setCatalogPage(1); }}
            accessibilityRole="button"
            accessibilityLabel="清除搜尋，返回原本清單"
            testID="mall-search-clear"
            style={styles.searchClear}
          ><Feather name="x" size={18} color={colors.primary} /></Pressable>}
        </View>
        <Text style={[styles.searchHint, { color: colors.mutedForeground }]}>跨十層搜尋名稱或描述關鍵字 · 可配合分類 · 搜尋及換層不扣金幣</Text>

        {!isSearching && recentSearches.length > 0 && (
          <View testID="mall-recent-searches" style={styles.recentSearches}>
            <View style={styles.recentSearchesHeader}>
              <Text style={[styles.searchFilterTitle, { color: colors.mutedForeground }]}>最近搜尋</Text>
              <Pressable
                testID="mall-recent-searches-clear-all"
                accessibilityRole="button"
                accessibilityLabel="清除全部最近搜尋"
                onPress={() => updateRecentSearches(() => [])}
                style={styles.recentSearchClearAll}
              >
                <Text style={[styles.filterText, { color: colors.primary }]}>全部清除</Text>
              </Pressable>
            </View>
            {recentSearches.map((query, index) => (
              <View key={`${query}-${index}`} style={[styles.recentSearchRow, { borderColor: colors.border }]}>
                <Pressable
                  testID={`mall-recent-search-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`搜尋「${query}」`}
                  onPress={() => applyRecentSearch(query)}
                  style={styles.recentSearchApply}
                >
                  <Feather name="clock" size={15} color={colors.mutedForeground} />
                  <Text numberOfLines={1} style={[styles.recentSearchText, { color: colors.foreground }]}>{query}</Text>
                </Pressable>
                <Pressable
                  testID={`mall-recent-search-remove-${index}`}
                  accessibilityRole="button"
                  accessibilityLabel={`刪除最近搜尋「${query}」`}
                  onPress={() => updateRecentSearches((current) => current.filter((entry) => entry !== query))}
                  style={styles.recentSearchRemove}
                >
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}
          </View>
        )}
        {recentSearchStorageError && (
          <Text
            testID="mall-recent-search-storage-error"
            accessibilityRole="text"
            style={[styles.recentSearchStorageError, { color: colors.destructive }]}
          >
            最近搜尋未能保存到這部裝置，關閉商場後可能會遺失。
          </Text>
        )}

        {isSearching && (
          <View style={styles.searchLocationFilters}>
            <View>
              <Text style={[styles.searchFilterTitle, { color: colors.mutedForeground }]}>原屬樓層</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.searchFilterOptions} testID="mall-search-floor-filters">
                {[null, ...MALL_FLOORS.map((_, index) => index + 1)].map((floor) => {
                  const selected = searchFloor === floor;
                  const label = floor === null ? '全部' : `${floor}F`;
                  return (
                    <Pressable
                      key={label}
                      testID={floor === null ? 'mall-search-floor-all' : `mall-search-floor-${floor}`}
                      accessibilityRole="button"
                      accessibilityLabel={floor === null ? '篩選全部原屬樓層' : `篩選原屬樓層 ${floor}F`}
                      accessibilityState={{ selected }}
                      onPress={() => { setSearchFloor(floor); setCatalogPage(1); }}
                      style={[styles.filterPill, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
                    >
                      <Text style={[styles.filterText, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <View>
              <Text style={[styles.searchFilterTitle, { color: colors.mutedForeground }]}>目前擺放分區</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.searchFilterOptions} testID="mall-search-wing-filters">
                {[{ id: null, label: '全部' }, ...SEARCH_WING_FILTERS].map((filter) => {
                  const selected = searchWing === filter.id;
                  const accessibilityLabel = filter.id === null
                    ? '篩選全部目前擺放分區'
                    : filter.id === 'unplaced'
                      ? '篩選尚未擺放的選物，包含倉庫與未兌換物件'
                      : `篩選目前擺放於${filter.label}`;
                  return (
                    <Pressable
                      key={filter.id ?? 'all'}
                      testID={filter.id === null ? 'mall-search-wing-all' : `mall-search-wing-${filter.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={accessibilityLabel}
                      accessibilityState={{ selected }}
                      onPress={() => { setSearchWing(filter.id); setCatalogPage(1); }}
                      style={[styles.filterPill, { backgroundColor: selected ? colors.primary : colors.card, borderColor: selected ? colors.primary : colors.border }]}
                    >
                      <Text style={[styles.filterText, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>{filter.label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            {(searchFloor !== null || searchWing !== null) && (
              <Pressable
                testID="mall-search-clear-filters"
                accessibilityRole="button"
                accessibilityLabel="清除原屬樓層與目前擺放分區篩選"
                onPress={() => { setSearchFloor(null); setSearchWing(null); setCatalogPage(1); }}
                style={styles.searchFilterClear}
              >
                <Text style={[styles.filterText, { color: colors.primary }]}>清除樓層與分區篩選</Text>
              </Pressable>
            )}
          </View>
        )}

        {showCollection && warehouseNotice && <Text testID="warehouse-notice" accessibilityRole="text" accessibilityLiveRegion="none" style={[styles.collectionEmpty, { color: colors.primary }]}>{warehouseNotice}</Text>}

        {showRedemptionControls && (
          <View style={styles.redemptionControls}>
            <View style={styles.redemptionOptions}>
              <Pressable
                testID="mall-affordable-toggle"
                accessibilityRole="button"
                accessibilityState={{ selected: affordableOnly }}
                onPress={() => { setAffordableOnly(!affordableOnly); setCatalogPage(1); }}
                style={[styles.filterPill, styles.redemptionOption, { backgroundColor: affordableOnly ? colors.primary : colors.card, borderColor: affordableOnly ? colors.primary : colors.border }]}
              >
                <Text style={[styles.filterText, { color: affordableOnly ? colors.primaryForeground : colors.mutedForeground }]}>目前換得到</Text>
              </Pressable>
              <Pressable
                testID="mall-price-sort"
                accessibilityRole="button"
                accessibilityState={{ selected: priceAscending }}
                accessibilityLabel={priceAscending ? '金幣由低至高排序，按下恢復原本排序' : '按金幣由低至高排序'}
                onPress={() => { setPriceAscending(!priceAscending); setCatalogPage(1); }}
                style={[styles.filterPill, styles.redemptionOption, { backgroundColor: priceAscending ? colors.primary : colors.card, borderColor: priceAscending ? colors.primary : colors.border }]}
              >
                <Text style={[styles.filterText, { color: priceAscending ? colors.primaryForeground : colors.mutedForeground }]}>{priceAscending ? '金幣：由低至高 ✓' : '金幣：由低至高'}</Text>
              </Pressable>
            </View>
            <Text testID="mall-filter-results" accessibilityLiveRegion="polite" style={[styles.sceneSub, { color: colors.mutedForeground }]}>
              {filteringAffordable ? `目前 ${coins} 金幣 · 本分類換得到 ${visibleItems.length} 款（不含已擁有）` : `目前 ${coins} 金幣 · 本分類共 ${visibleItems.length} 款`}
            </Text>
            <Pressable
              testID="mall-full-catalog"
              accessibilityRole="button"
              accessibilityLabel="查看本層完整清單，清除搜尋、分類、金幣篩選及排序"
              onPress={() => { setShowCollection(false); setSearchQuery(''); setSearchFloor(null); setSearchWing(null); setCategory('all'); setAffordableOnly(false); setPriceAscending(false); setCatalogPage(1); }}
              style={[styles.fullCatalogButton, { borderColor: colors.border }]}
            >
              <Text style={[styles.filterText, { color: colors.primary }]}>查看 {currentFloor}F 完整選物清單</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.categoryFilters}>
          {CATEGORIES.map((filter) => {
            const active = filter.id === category;
            return (
              <Pressable
                key={filter.id}
                onPress={() => { setCategory(filter.id); setCatalogPage(1); }}
                style={[
                  styles.filterPill,
                  { backgroundColor: active ? colors.primary : colors.card, borderColor: active ? colors.primary : colors.border },
                ]}
                accessibilityRole="button"
                testID={`mall-category-${filter.id}`}
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.filterText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{filter.label} {eligibleItems.filter((item) => filter.id === 'all' || item.category === filter.id).length}</Text>
              </Pressable>
            );
          })}
        </View>

        <CatalogPager id="catalog-top" page={currentCatalogPage} pages={catalogPages} total={visibleItems.length} onChange={changeCatalogPage} />
        <View style={styles.catalogList}>
          {filteringAffordable && visibleItems.length === 0 && (
            <View style={styles.affordableEmpty}>
              <Text testID="mall-affordable-empty" style={[styles.collectionEmpty, { color: colors.mutedForeground }]}>目前沒有符合條件、金幣足夠且未擁有的款式。完成目標賺取更多金幣，再來挑選吧！也可切換分類、清除搜尋或查看本層完整清單；已兌換的物件可到倉庫免費重擺。</Text>
              <Pressable
                testID="mall-earn-coins"
                accessibilityRole="button"
                accessibilityLabel="前往今天頁完成目標賺取金幣"
                onPress={() => router.push('/today')}
                style={[styles.earnCoinsButton, { backgroundColor: colors.primary }]}
              >
                <Feather name="target" size={15} color={colors.primaryForeground} />
                <Text style={[styles.earnCoinsButtonText, { color: colors.primaryForeground }]}>前往今日目標賺金幣</Text>
                <Feather name="arrow-right" size={15} color={colors.primaryForeground} />
              </Pressable>
            </View>
          )}
          {!filteringAffordable && isSearching && visibleItems.length === 0 && (
            <Text testID="mall-search-empty" style={[styles.collectionEmpty, { color: colors.mutedForeground }]}>沒有符合「{searchQuery.trim()}」的選物，試試其他名稱或描述關鍵字、切換「全部」分類或清除搜尋。</Text>
          )}
          {!isSearching && showCollection && visibleItems.length === 0 && (
            <Text style={[styles.collectionEmpty, { color: colors.mutedForeground }]}>{collectionItems.length === 0 ? '倉庫暫時沒有物件。點選商場中的舊商店、設施或裝修，再按「存入倉庫」，就能騰出位置換新；之後可免費取出。' : '這個分類暫時沒有存倉物件，試試其他分類。'}</Text>
          )}
          {pagedItems.map((item) => {
            const owned = ownedIds.has(item.id);
            const enoughCoins = coins >= item.price;
            const disabled = isLoading || (owned && !showCollection && !isSearching) || purchasing !== null || placementIntent !== null;
            const placedSlotId = placedSlotsByItem.get(item.id);
            const placedPosition = placedSlotId ? getSlotPosition(placedSlotId) : null;
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
                  <Text numberOfLines={2} style={[styles.itemDescription, { color: colors.mutedForeground }]}>{isSearching ? placedPosition ? `${placedPosition.floor} · ${placedPosition.label} · ${item.price} 金幣` : `${item.floor}F · ${MALL_FLOORS[item.floor - 1].title} · ${item.price} 金幣` : showCollection ? `${item.floor}F 原屬選物 · ${item.description}` : item.description}</Text>
                  {isSearching ? <Text style={[styles.sceneSub, { color: colors.primary }]}>{owned ? placedIds.has(item.id) ? '已兌換 · 已擺放 · 免費搬動' : '已兌換 · 倉庫保存中 · 免費擺放' : '未兌換 · 選取後前往所屬樓層試擺'}</Text> : showCollection || owned ? <Text style={[styles.sceneSub, { color: colors.primary }]}>{showCollection ? '倉庫保存中 · 免費擺放' : placedIds.has(item.id) ? '已擺放 · 點場景可存倉' : '已存倉 · 到倉庫免費取出'}</Text> : <View style={styles.costRow}>
                    <View style={styles.costPart}><Feather name="circle" size={11} color={colors.candyCaramelDark} /><Text style={[styles.costText, { color: colors.candyCaramelDark }]}>{item.price}</Text></View>
                    <Text style={[styles.costText, { color: colors.candyCaramelDark }]}>金幣</Text>
                  </View>}
                </View>
                <View style={styles.catalogActions}>
                  {owned && item.category === 'shop' && (
                    <Pressable
                      testID={`shop-interior-open-${item.id}`}
                      onPress={() => router.push({ pathname: '/mall-shop/[itemId]', params: { itemId: item.id } })}
                      disabled={isLoading || purchasing !== null}
                      accessibilityRole="button"
                      accessibilityLabel={`進入${item.name}店內佈置`}
                      accessibilityState={{ disabled: isLoading || purchasing !== null }}
                      style={[styles.buildButton, { backgroundColor: colors.candyPink }]}
                    >
                      <Feather name="home" size={16} color={colors.primary} />
                    </Pressable>
                  )}
                  {isSearching && placedIds.has(item.id) && (
                    <Pressable
                      onPress={() => viewPlacedItemLocation(item)}
                      disabled={disabled}
                      style={[styles.locationButton, { backgroundColor: colors.secondary, opacity: disabled ? 0.55 : 1 }]}
                      accessibilityRole="button"
                      accessibilityLabel={`查看${item.name}目前擺放位置，不搬動物件`}
                      accessibilityState={{ disabled }}
                      testID={`search-location-${item.id}`}
                    >
                      <Feather name="map-pin" size={14} color={colors.primary} />
                      <Text style={[styles.locationButtonText, { color: colors.primary }]}>查看位置</Text>
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => {
                      if (isSearching) {
                        selectSearchItem(item);
                      } else if (showCollection) {
                        setWarehouseNotice(null);
                        setPlacementIntent({ itemId: item.id, mode: 'restore' });
                        announcePlacement(`已從倉庫選取${item.name}。請選空位免費重擺；按取消可讓物件留在倉庫，沒有扣除金幣。`);
                        scrollToMallScene();
                      } else {
                        startPurchasePlacement(item);
                      }
                    }}
                    ref={showCollection && !isSearching && focusRestoreActionItemId === item.id ? focusRestoreActionRef : undefined}
                    disabled={disabled}
                    style={[
                      styles.buildButton,
                      { backgroundColor: owned ? colors.secondary : colors.primary, opacity: disabled && !owned ? 0.55 : 1 },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${isSearching ? `選擇${item.name}，前往 ${item.floor}F，${CATEGORY_NAMES[item.category]}，${item.price} 金幣，${owned ? '已兌換，可免費重擺' : '未兌換，先試擺再確認'}` : showCollection ? `免費擺放${item.name}` : owned ? `${item.name}已擁有` : `選擇位置建造${item.name}`}${showCollection && focusRestoreActionItemId === item.id && focusResultMessage ? `，操作結果：${focusResultMessage}` : ''}`}
                    accessibilityState={{ disabled }}
                    testID={`${isSearching ? 'search-select' : showCollection ? 'restore' : 'build'}-${item.id}`}
                  >
                    <Feather name={isSearching ? 'arrow-up-right' : showCollection ? 'map-pin' : owned ? 'check' : 'plus'} size={17} color={owned ? colors.primary : colors.primaryForeground} />
                  </Pressable>
                </View>
                {!owned && !enoughCoins && (
                  <Text style={[styles.missingText, { color: colors.mutedForeground }]}>
                    {`還差 ${item.price - coins} 金幣`}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
        <CatalogPager id="catalog-bottom" page={currentCatalogPage} pages={catalogPages} total={visibleItems.length} onChange={changeCatalogPage} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  previewPanel: { marginTop: 12, padding: 14, borderRadius: 16, borderWidth: 1, gap: 7 },
  previewDetails: { fontSize: 12, lineHeight: 18 },
  previewActions: { flexDirection: 'row', gap: 10, marginTop: 5 },
  previewButton: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 10 },
  safe: { flex: 1 },
  collectionTabs: { flexDirection: 'row', gap: 8, marginTop: 20 },
  collectionTab: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  collectionAction: { alignItems: 'center', gap: 4, padding: 6 },
  affordableEmpty: { gap: 4 },
  collectionEmpty: { fontSize: 12, lineHeight: 20, paddingVertical: 16 },
  earnCoinsButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14, borderRadius: 12 },
  earnCoinsButtonText: { fontSize: 12, fontWeight: '700' },
  content: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 23, fontWeight: '700', marginTop: 6 },
  subtitle: { fontSize: 12, lineHeight: 19, marginTop: 6 },
  coinWallet: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  coinIcon: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  coinFace: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  walletNumber: { fontSize: 14, fontWeight: '700' },
  walletLabel: { fontSize: 9, marginTop: 1 },
  ticketRow: { flexDirection: 'row', gap: 8, marginTop: 17 },
  ticket: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, borderRadius: 14, padding: 8 },
  ticketIcon: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  ticketCount: { fontSize: 12, fontWeight: '700' },
  ticketName: { fontSize: 9, marginTop: 1 },
  rewardHint: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, marginTop: 9 },
  rewardHintText: { flex: 1, fontSize: 10, lineHeight: 15 },
  testCoinPanel: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 12, borderWidth: 1, marginTop: 8 },
  testCoinCopy: { flex: 1, gap: 3 },
  testCoinTitle: { fontSize: 11, fontWeight: '700' },
  testCoinDescription: { fontSize: 9, lineHeight: 13 },
  testCoinButton: { minHeight: 40, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  testCoinButtonText: { fontSize: 10, fontWeight: '700' },
  sceneHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 11 },
  sceneTitle: { fontSize: 17, fontWeight: '700' },
  sceneSub: { fontSize: 10, marginTop: 4 },
  buildCount: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 11 },
  buildCountText: { fontSize: 11, fontWeight: '700' },
  scene: { overflow: 'hidden', borderRadius: 22, borderWidth: 1 },
  floorNavigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 8, borderRadius: 16, marginBottom: 10 },
  floorArrow: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  floorInformation: { alignItems: 'center' },
  floorNumber: { fontSize: 17, fontWeight: '700' },
  floorCaption: { fontSize: 10, marginTop: 2 },
  floorDescription: { fontSize: 11, lineHeight: 17, marginBottom: 10 },
  mallArtwork: { width: '100%', aspectRatio: 1 },
  mallArtworkImage: { width: '100%', height: '100%' },
  sceneSlot: { position: 'absolute', height: '18%', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  sceneSlotTarget: { borderWidth: 1, borderColor: palette.light.primary, borderStyle: 'dashed', borderRadius: 10, backgroundColor: palette.light.candyCream },
  locationMarker: { fontSize: 8, fontWeight: '700', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5, overflow: 'hidden' },
  sceneShopBadge: { alignItems: 'center', justifyContent: 'center' },
  sceneShopName: { fontSize: 8, fontWeight: '700', backgroundColor: palette.light.candyCream, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4, maxWidth: '100%' },
  sceneEmptyBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', opacity: 0.75 },
  sceneEmptyBadgeActive: { width: 30, height: 30, borderRadius: 15, opacity: 1 },
  placementBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 14, padding: 12, marginBottom: 10 },
  placementCopy: { flex: 1 },
  placementTitle: { fontSize: 12, fontWeight: '700' },
  placementSubtitle: { fontSize: 10, marginTop: 3 },
  fullFloorNotice: { borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 10, gap: 6 },
  fullFloorCopy: { fontSize: 12, lineHeight: 18 },
  availableFloorActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  availableFloorButton: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: 44, justifyContent: 'center' },
  mapFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11 },
  mapFooterText: { fontSize: 10 },
  storageError: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, borderRadius: 12, marginTop: 12 },
  storageErrorText: { fontSize: 11, flex: 1 },
  catalogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 26, marginBottom: 12 },
  categoryFilters: { flexDirection: 'row', gap: 7, marginBottom: 11 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingLeft: 12, gap: 8, minHeight: 48 },
  searchInput: { flex: 1, minWidth: 0, fontSize: 12, paddingVertical: 12 },
  searchClear: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  searchHint: { fontSize: 11, marginTop: 7, marginBottom: 12 },
  recentSearches: { gap: 5, marginBottom: 14 },
  recentSearchesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 36 },
  recentSearchClearAll: { minHeight: 36, justifyContent: 'center', paddingHorizontal: 6 },
  recentSearchRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  recentSearchApply: { flex: 1, minWidth: 0, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9 },
  recentSearchText: { flex: 1, fontSize: 12 },
  recentSearchRemove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  recentSearchStorageError: { fontSize: 11, lineHeight: 16, marginBottom: 10 },
  searchLocationFilters: { gap: 11, marginBottom: 14 },
  searchFilterTitle: { fontSize: 11, fontWeight: '600', marginBottom: 6 },
  searchFilterOptions: { flexDirection: 'row', gap: 7, paddingRight: 4 },
  searchFilterClear: { minHeight: 36, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 4 },
  redemptionControls: { gap: 9, marginBottom: 12 },
  redemptionOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  redemptionOption: { minHeight: 44, justifyContent: 'center' },
  fullCatalogButton: { minHeight: 44, justifyContent: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  filterPill: { paddingHorizontal: 13, paddingVertical: 8, borderWidth: 1, borderRadius: 99 },
  filterText: { fontSize: 11, fontWeight: '600' },
  catalogList: { gap: 9 },
  catalogActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  locationButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8, borderRadius: 12 },
  locationButtonText: { fontSize: 10, fontWeight: '700' },
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
