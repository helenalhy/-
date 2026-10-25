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
  MALL_FLOOR_COUNT,
  MALL_SLOT_IDS,
  useHabits,
  type MallSlotId,
  type RewardCategory,
} from '@/context/HabitsContext';
import { useColors } from '@/hooks/useColors';
import { MallAmbience, MallObjectVisual } from '@/components/MallVisuals';
import { MALL_FLOORS, MALL_ITEMS, MALL_ITEM_BY_ID, type MallItem } from '@/constants/mall';
import { CatalogPager } from '@/components/CatalogPager';
import { getMallSlotPosition, MALL_POSITIONS_PER_FLOOR } from '@/constants/mall-layout';
import { MallWingPager } from '@/components/MallWingPager';

const CATALOG_PAGE_SIZE = 10;

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

function MallSceneSlot({
  slotId,
  item,
  isPlacementTarget,
  isPlacementMode,
  isPreview = false,
  onPress,
}: {
  slotId: MallSlotId;
  item?: MallItem;
  isPlacementTarget: boolean;
  isPlacementMode: boolean;
  isPreview?: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();
  const popIn = useRef(new Animated.Value(0.78)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const position = getSlotPosition(slotId);

  useEffect(() => {
    popIn.setValue(0.78);
    fadeIn.setValue(0);
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
        style={[styles.sceneSlot, { left: position.left, top: position.top, width: position.width, height: position.height }, isPreview && styles.sceneSlotTarget]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${position.floor} ${position.label} ${item.name}，${isPreview ? '預覽中，尚未兌換' : '點選可搬動或存入倉庫'}`}
        testID={`mall-slot-${slotId}`}
      >
        <Animated.View style={[
          styles.sceneShopBadge,
          { opacity: fadeIn, height: position.plaza ? 30 : 47, transform: [{ scale: Animated.multiply(popIn, position.scale) }] },
        ]}>
          <MallObjectVisual id={item.visual ?? item.id} color={item.color} icon={item.icon} category={item.category} />
        </Animated.View>
        <Text numberOfLines={1} style={[styles.sceneShopName, { color: palette.light.foreground, fontSize: position.plaza ? 7 : 8 }]}>{item.name}</Text>
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
      accessibilityRole="button"
      accessibilityLabel={isPlacementMode ? `${position.floor} ${position.label}空位，放置選擇的項目` : `${position.floor} ${position.label}空位，選擇要建造的項目`}
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
  const sceneOpacity = useRef(new Animated.Value(0)).current;
  const sceneOffset = useRef(new Animated.Value(14)).current;
  const { coins, purchasedItems, mallPlacements, purchaseMallItem, moveMallItem, storeMallItem, storageError, isLoading } = useHabits();
  const [showCollection, setShowCollection] = useState(false);
  const [warehouseNotice, setWarehouseNotice] = useState<string | null>(null);
  const [category, setCategory] = useState<'all' | RewardCategory>('all');
  const [currentFloor, setCurrentFloor] = useState(1);
  const [catalogPage, setCatalogPage] = useState(1);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const operationLock = useRef(false);
  const [previewSlotId, setPreviewSlotId] = useState<MallSlotId | null>(null);
  const [placementIntent, setPlacementIntent] = useState<{ itemId: string; mode: 'purchase' | 'move' | 'restore' } | null>(null);
  const ownedIds = useMemo(() => new Set(purchasedItems), [purchasedItems]);
  const placedIds = useMemo(() => new Set(Object.values(mallPlacements)), [mallPlacements]);
  const constructed = useMemo(() => MALL_ITEMS.filter((item) => placedIds.has(item.id)), [placedIds]);
  const collectionItems = useMemo(
    () => MALL_ITEMS.filter((item) => ownedIds.has(item.id) && !placedIds.has(item.id)),
    [ownedIds, placedIds],
  );
  const floorTheme = MALL_FLOORS[currentFloor - 1];
  const floorItems = MALL_ITEMS.filter((item) => item.floor === currentFloor);
  const visibleItems = (showCollection ? collectionItems : floorItems).filter((item) => category === 'all' || item.category === category);
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
    const entrance = Animated.parallel([
      Animated.timing(sceneOpacity, { toValue: 1, duration: 420, useNativeDriver: false }),
      Animated.spring(sceneOffset, { toValue: 0, friction: 8, tension: 70, useNativeDriver: false }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [sceneOpacity, sceneOffset]);

  function scrollToMallScene() {
    scrollRef.current?.scrollTo({ y: Math.max(0, mallSceneY.current - 8), animated: true });
  }

  function changeFloor(direction: number) {
    if (operationLock.current || purchasing) return;
    const nextFloor = Math.min(MALL_FLOOR_COUNT, Math.max(1, currentFloor + direction));
    if (nextFloor === currentFloor) return;
    setPreviewSlotId(null);
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
    scrollToMallScene();
  }

  function cancelPlacement() {
    if (operationLock.current) return;
    setPreviewSlotId(null);
    setPlacementIntent(null);
  }

  async function placeItemInSlot(slotId: MallSlotId, confirmed = false) {
    if (isLoading || !placementIntent || !currentPlacementItem || purchasing || operationLock.current) return;
    if (placementIntent.mode !== 'move' && mallPlacements[slotId]) return;
    if (mallPlacements[slotId] === currentPlacementItem.id) return;
    if (placementIntent.mode === 'purchase') {
      if (!confirmed) {
        setPreviewSlotId(slotId);
        return;
      }
      if (previewSlotId !== slotId || !floorSlots.includes(slotId)) return;
    }
    operationLock.current = true;
    setPurchasing(currentPlacementItem.id);
    try {
      if (placementIntent.mode === 'purchase') {
        await purchaseMallItem(
          currentPlacementItem.id,
          currentPlacementItem.price,
          currentPlacementItem.category,
          currentPlacementItem.ticketCost,
          slotId,
        );
        Alert.alert('建造完成！', `${currentPlacementItem.name}已放在 ${getSlotPosition(slotId).floor}。`);
      } else {
        await moveMallItem(currentPlacementItem.id, slotId);
        Alert.alert('位置已更新', `${currentPlacementItem.name}已放到 ${getSlotPosition(slotId).floor}，沒有扣除金幣。`);
      }
      setPlacementIntent(null);
      setPreviewSlotId(null);
      scrollToMallScene();
    } catch (error) {
      Alert.alert('沒有更新成功', error instanceof Error ? error.message : '請再試一次。');
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
      setPlacementIntent({ itemId, mode: 'move' });
      return;
    }
    setShowCollection(false);
    setCatalogPage(1);
    scrollToCatalog();
  }

  function scrollToCatalog() {
    scrollRef.current?.scrollTo({ y: Math.max(0, shopSectionY.current - 14), animated: true });
  }

  function openWarehouse() {
    if (operationLock.current || purchasing) return;
    setPlacementIntent(null);
    setPreviewSlotId(null);
    setWarehouseNotice(null);
    setShowCollection(true);
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
      setWarehouseNotice(`${currentPlacementItem.name}已存入倉庫，保留所有權，可免費取出重擺。`);
      setPlacementIntent(null);
      setPreviewSlotId(null);
      setShowCollection(true);
      setCategory('all');
      setCatalogPage(1);
      requestAnimationFrame(scrollToCatalog);
    } catch (error) {
      Alert.alert('沒有存入倉庫', error instanceof Error ? error.message : '請再試一次。');
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

        <View style={[styles.rewardHint, { backgroundColor: colors.secondary }]}>
          <Feather name="gift" size={14} color={colors.primary} />
          <Text style={[styles.rewardHintText, { color: colors.foreground }]}>
            完全免費 · 每個目標每日首次完成 +20 金幣 · 所有項目只用金幣兌換，沒有儲值或付費。
          </Text>
        </View>

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
              {placementIntent.mode === 'move' && (
                <Pressable onPress={() => void storeSelectedItem()} disabled={purchasing !== null} accessibilityRole="button" accessibilityLabel={`將${currentPlacementItem.name}存入倉庫`} testID="store-selected-item" style={styles.collectionAction}>
                  <Feather name="archive" size={20} color={colors.primary} />
                  <Text style={[styles.filterText, { color: colors.primary }]}>存入倉庫</Text>
                </Pressable>
              )}
              <Pressable onPress={cancelPlacement} disabled={purchasing !== null} accessibilityRole="button" accessibilityLabel="取消擺放" hitSlop={10}>
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
              counts={{
                main: floorSlots.filter((slotId) => getSlotPosition(slotId).wing === 'main' && mallPlacements[slotId]).length,
                annex: floorSlots.filter((slotId) => getSlotPosition(slotId).wing === 'annex' && mallPlacements[slotId]).length,
                extension: floorSlots.filter((slotId) => getSlotPosition(slotId).wing === 'extension' && mallPlacements[slotId]).length,
              }}
              onWingChange={() => setPreviewSlotId(null)}
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
                    item={isPreview ? currentPlacementItem ?? undefined : itemId ? MALL_ITEM_BY_ID[itemId] : undefined}
                    isPreview={isPreview}
                    isPlacementMode={placementIntent !== null}
                    isPlacementTarget={placementIntent !== null && !itemId}
                    onPress={() => handleSceneSlotPress(slotId)}
                  />
                );
              })}
              {active && <MallAmbience floor={currentFloor} />}
            </ImageBackground>}
            />
            <View style={[styles.mapFooter, { backgroundColor: colors.candyCream }]}>
              <Feather name="move" size={13} color={colors.primary} />
              <Text style={[styles.mapFooterText, { color: colors.foreground }]}>
                {placementIntent ? (placementIntent.mode === 'purchase' ? '點選空位預覽 · 可改選位置 · 確認兌換後才扣金幣' : placementIntent.mode === 'restore' ? '可換層或換區，選空位免費擺放' : '選位置免費搬動或交換，也可存入倉庫') : '左右滑或點上方切換區域 · 點物件可搬動或存倉'}
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
                <Pressable testID="cancel-purchase-preview" onPress={cancelPlacement} disabled={purchasing !== null} accessibilityRole="button" style={[styles.previewButton, { backgroundColor: colors.card }]}>
                  <Text style={[styles.filterText, { color: colors.primary }]}>取消預覽</Text>
                </Pressable>
                <Pressable testID="confirm-purchase-preview" onPress={() => void placeItemInSlot(previewSlotId, true)} disabled={isLoading || purchasing !== null} accessibilityRole="button" accessibilityState={{ disabled: isLoading || purchasing !== null, busy: purchasing !== null }} style={[styles.previewButton, { backgroundColor: colors.primary, opacity: purchasing ? 0.5 : 1 }]}>
                  <Text style={[styles.filterText, { color: colors.primaryForeground }]}>{purchasing ? '兌換中…' : '確認兌換'}</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {storageError && (
          <View style={[styles.storageError, { backgroundColor: colors.candyPink }]}>
            <Feather name="alert-circle" size={15} color={colors.destructive} />
            <Text style={[styles.storageErrorText, { color: colors.destructive }]}>{storageError}</Text>
          </View>
        )}

        <View style={styles.collectionTabs}>
          {([{ id: false, label: '本層兌換', icon: 'shopping-bag' }, { id: true, label: `倉庫 · ${collectionItems.length}`, icon: 'archive' }] as const).map((tab) => (
            <Pressable key={tab.label} onPress={() => { setShowCollection(tab.id); setCatalogPage(1); }} accessibilityRole="button" accessibilityState={{ selected: showCollection === tab.id }} testID={tab.id ? 'collection-tab' : 'catalog-tab'} style={[styles.filterPill, styles.collectionTab, { backgroundColor: showCollection === tab.id ? colors.secondary : colors.card, borderColor: colors.border }]}>
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
            <Text testID="floor-catalog-title" style={[styles.sceneTitle, { color: colors.foreground }]}>{showCollection ? '倉庫 · 所有樓層' : `${currentFloor}F 專屬兌換 · ${floorTheme.title}`}</Text>
            <Text style={[styles.sceneSub, { color: colors.mutedForeground }]}>{showCollection ? '商店、設施、裝修都可保存 · 不設件數上限 · 免費取出重擺' : `本層 ${floorItems.length} 款選物 · ${MALL_POSITIONS_PER_FLOOR} 個展示位，可存倉輪替`}</Text>
          </View>
          <Feather name="arrow-down" size={17} color={colors.primary} />
        </View>

        {showCollection && warehouseNotice && <Text testID="warehouse-notice" accessibilityRole="alert" style={[styles.collectionEmpty, { color: colors.primary }]}>{warehouseNotice}</Text>}

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
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.filterText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{filter.label} {(showCollection ? collectionItems : floorItems).filter((item) => filter.id === 'all' || item.category === filter.id).length}</Text>
              </Pressable>
            );
          })}
        </View>

        <CatalogPager id="catalog-top" page={currentCatalogPage} pages={catalogPages} total={visibleItems.length} onChange={changeCatalogPage} />
        <View style={styles.catalogList}>
          {showCollection && visibleItems.length === 0 && (
            <Text style={[styles.collectionEmpty, { color: colors.mutedForeground }]}>{collectionItems.length === 0 ? '倉庫暫時沒有物件。點選商場中的舊商店、設施或裝修，再按「存入倉庫」，就能騰出位置換新；之後可免費取出。' : '這個分類暫時沒有存倉物件，試試其他分類。'}</Text>
          )}
          {pagedItems.map((item) => {
            const owned = ownedIds.has(item.id);
            const enoughCoins = coins >= item.price;
            const disabled = isLoading || (owned && !showCollection) || purchasing !== null || placementIntent !== null;
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
                  <Text numberOfLines={1} style={[styles.itemDescription, { color: colors.mutedForeground }]}>{showCollection ? `${item.floor}F 原屬選物 · ${item.description}` : item.description}</Text>
                  {showCollection || owned ? <Text style={[styles.sceneSub, { color: colors.primary }]}>{showCollection ? '倉庫保存中 · 免費擺放' : placedIds.has(item.id) ? '已擺放 · 點場景可存倉' : '已存倉 · 到倉庫免費取出'}</Text> : <View style={styles.costRow}>
                    <View style={styles.costPart}><Feather name="circle" size={11} color={colors.candyCaramelDark} /><Text style={[styles.costText, { color: colors.candyCaramelDark }]}>{item.price}</Text></View>
                    <Text style={[styles.costText, { color: colors.candyCaramelDark }]}>金幣</Text>
                  </View>}
                </View>
                <Pressable
                  onPress={() => {
                    if (showCollection) {
                      setWarehouseNotice(null);
                      setPlacementIntent({ itemId: item.id, mode: 'restore' });
                      scrollToMallScene();
                    } else {
                      startPurchasePlacement(item);
                    }
                  }}
                  disabled={disabled}
                  style={[
                    styles.buildButton,
                    { backgroundColor: owned ? colors.secondary : colors.primary, opacity: disabled && !owned ? 0.55 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={showCollection ? `免費擺放${item.name}` : owned ? `${item.name}已擁有` : `選擇位置建造${item.name}`}
                  testID={`${showCollection ? 'restore' : 'build'}-${item.id}`}
                >
                  <Feather name={showCollection ? 'map-pin' : owned ? 'check' : 'plus'} size={17} color={owned ? colors.primary : colors.primaryForeground} />
                </Pressable>
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
  collectionEmpty: { fontSize: 12, lineHeight: 20, paddingVertical: 16 },
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
