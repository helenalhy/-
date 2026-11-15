import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import { MallObjectVisual } from '@/components/MallVisuals';
import { ShopInteriorScene } from '@/components/ShopInteriorScene';
import { CosmeticsTryOn } from '@/components/CosmeticsTryOn';
import { PhotoStudioTryOn } from '@/components/PhotoStudioTryOn';
import { ShopDisplayFixturePanel } from '@/components/ShopDisplayFixturePanel';
import { DogStaffCustomizer, type DogStaffListArtStyle } from '@/components/DogStaffCustomizer';
import { DogCompanionModal } from '@/components/DogCompanionModal';
import { DogCollectionBook } from '@/components/DogCollectionBook';
import {
  getShopInteriorDecorations,
  getShopInteriorSceneKey,
  getShopTypeLabel,
  getShopInteriorPlacementId,
  getShopInteriorAreaPlacements,
  getShopInteriorAreaLabel,
  parseShopInteriorPlacementId,
  SHOP_INTERIOR_AREAS,
  SHOP_INTERIOR_SLOTS,
  type ShopInteriorAreaId,
  type ShopInteriorSlotId,
} from '@/constants/mall-shop-interior';
import {
  DOG_STAFF_PROFILE_BY_DECORATION_ID,
  DOG_STAFF_PROFILES,
  getDogStaffDefaultArea,
  getDefaultDogStaffLook,
  resolveDogStaffLook,
  type DogStaffAreaId,
  type DogStaffLook,
} from '@/constants/dog-staff-customization';
import { MALL_FLOORS, MALL_ITEM_BY_ID } from '@/constants/mall';
import type { MallVisualCategory } from '@/constants/mall-visual-profile';
import {
  canDisplayShopProducts,
  getCosmeticsTryOnCatalog,
  getShopFixtureProductCatalog,
  SHOP_DISPLAY_SLOT_COUNT,
} from '@/constants/mall-shop-display';
import { useColors } from '@/hooks/useColors';
import { useReducedMotion } from '@/context/ReducedMotionContext';
import { DOG_COMPANION_SHOP_ID } from '@/lib/dog-companion';

function ShopInteriorAnimatedObject({
  id,
  itemId,
  color,
  icon,
  category,
  visual,
  itemName,
  floor,
  testID,
}: {
  id: string;
  itemId: string;
  itemName?: string;
  floor?: number;
  color: string;
  icon: string;
  category: MallVisualCategory;
  visual?: string;
  testID?: string;
}) {
  const reducedMotion = useReducedMotion() !== false;
  const entranceScale = useRef(new Animated.Value(0.76)).current;
  const entranceOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      entranceScale.setValue(1);
      entranceOpacity.setValue(1);
      return;
    }
    entranceScale.setValue(0.76);
    entranceOpacity.setValue(0);
    const animation = Animated.parallel([
      Animated.spring(entranceScale, {
        toValue: 1,
        friction: 6,
        tension: 130,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(entranceOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [id, itemId, entranceScale, entranceOpacity, reducedMotion]);

  return (
    <Animated.View
      testID={testID}
      accessible={false}
      pointerEvents="none"
      style={[styles.objectEntrance, { opacity: entranceOpacity, transform: [{ scale: entranceScale }] }]}
    >
      <MallObjectVisual id={visual ?? id} itemId={itemId} itemName={itemName} floor={floor} color={color} icon={icon} category={category} isActive />
    </Animated.View>
  );
}

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
    setShopInteriorFixtureProduct,
    placeShopInteriorDogStaff,
    storeShopInteriorDogStaff,
    recordDogCompanionInteraction,
    ensureDogCollectionRewards,
    today,
    updateShopInteriorDogLook,
    saveShopInteriorDogLook,
    deleteShopInteriorDogLook,
  } = useHabits();
  const [selectedSlot, setSelectedSlot] = useState<ShopInteriorSlotId>(SHOP_INTERIOR_SLOTS[0].id);
  const [selectedAreaOverride, setSelectedAreaOverride] = useState<{
    shopId: string;
    areaId: ShopInteriorAreaId;
  } | null>(null);
  const [workingDecoration, setWorkingDecoration] = useState<string | null>(null);
  const [activeFixtureId, setActiveFixtureId] = useState<string | null>(null);
  const [selectedDisplaySlot, setSelectedDisplaySlot] = useState(0);
  const [workingDisplayProduct, setWorkingDisplayProduct] = useState(false);
  const [notice, setNotice] = useState('');
  const [slotAccessibilityResult, setSlotAccessibilityResult] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [activeDogCompanionId, setActiveDogCompanionId] = useState<string | null>(null);
  const [dogStaffListArtStyle, setDogStaffListArtStyle] = useState<DogStaffListArtStyle>('fluffy');
  const [dogStaffListArtStyleLoaded, setDogStaffListArtStyleLoaded] = useState(false);
  const [dogCollectionVisible, setDogCollectionVisible] = useState(false);
  const handleDogListArtStyleChange = useCallback((style: DogStaffListArtStyle, loaded?: boolean) => {
    setDogStaffListArtStyle(style);
    if (loaded) setDogStaffListArtStyleLoaded(true);
  }, []);
  const interior = shop ? shopInteriors[shop.id] : undefined;
  const selectedArea = selectedAreaOverride && selectedAreaOverride.shopId === shop?.id
    ? selectedAreaOverride.areaId
    : getDogStaffDefaultArea(interior?.dogStaffPlacements);
  const ownedDecorationIds = interior?.ownedDecorations ?? [];
  const ownedDecorationKey = ownedDecorationIds.slice().sort().join('|');
  const decorations = useMemo(
    () => getShopInteriorDecorations(shop?.shopType, shop?.id, shop?.name, ownedDecorationIds),
    [shop?.shopType, shop?.id, shop?.name, ownedDecorationKey],
  );
  const interiorDecorations = useMemo(
    () => decorations.filter(({ id }) => !DOG_STAFF_PROFILE_BY_DECORATION_ID[id]),
    [decorations],
  );
  const fixtureProducts = useMemo(() => {
    if (!shop) return {};
    return Object.fromEntries(
      interiorDecorations
        .filter(canDisplayShopProducts)
        .map((fixture) => [
          fixture.id,
          getShopFixtureProductCatalog(shop.id, shop.name, shop.shopType, fixture),
        ])
        .filter(([, products]) => (products as { id: string }[]).length > 0),
    ) as Record<string, ReturnType<typeof getShopFixtureProductCatalog>>;
  }, [shop?.id, shop?.name, shop?.shopType, interiorDecorations]);
  const cosmeticsTryOnProducts = useMemo(() => {
    if (!shop || shop.shopType !== 'cosmetics') return [];
    return getCosmeticsTryOnCatalog();
  }, [shop?.shopType]);
  const owned = new Set(interior?.ownedDecorations ?? []);
  const placements = interior?.placements ?? {};
  const areaPlacements = useMemo(
    () => getShopInteriorAreaPlacements(placements, selectedArea),
    [placements, selectedArea],
  );
  const selectedPlacementId = getShopInteriorPlacementId(selectedArea, selectedSlot);
  const selectedDecorationId = areaPlacements[selectedSlot];
  const selectedDecoration = interiorDecorations.find(({ id }) => id === selectedDecorationId);
  const activeFixture = activeFixtureId
    ? interiorDecorations.find(({ id }) => id === activeFixtureId) ?? null
    : null;
  const activeFixtureProducts = activeFixture && shop
    ? fixtureProducts[activeFixture.id] ?? getShopFixtureProductCatalog(shop.id, shop.name, shop.shopType, activeFixture)
    : [];
  const activeFixtureSlots = activeFixture
    ? interior?.fixtureContents?.[activeFixture.id] ?? Array.from({ length: SHOP_DISPLAY_SLOT_COUNT }, () => null)
    : [];
  const floor = shop ? MALL_FLOORS[shop.floor - 1] : MALL_FLOORS[0];
  const activeDogCompanion = DOG_STAFF_PROFILES.find(({ decorationId }) => decorationId === activeDogCompanionId) ?? null;
  const dogCompanionAffection = activeDogCompanion
    ? interior?.dogCompanion?.affection[activeDogCompanion.decorationId] ?? 0
    : 0;
  const activeDogCompanionLook = activeDogCompanion
    ? resolveDogStaffLook(
      activeDogCompanion.decorationId,
      interior?.dogStaffLooks?.[activeDogCompanion.decorationId],
    ) ?? getDefaultDogStaffLook(activeDogCompanion.decorationId) ?? undefined
    : undefined;
  const hasAccess = !!shop && shop.category === 'shop' && purchasedItems.includes(shop.id);
  const catalogPageSize = 10;
  const catalogPageCount = Math.max(1, Math.ceil(interiorDecorations.length / catalogPageSize));
  const visibleDecorations = interiorDecorations.slice((catalogPage - 1) * catalogPageSize, catalogPage * catalogPageSize);

  function selectArea(areaId: ShopInteriorAreaId) {
    if (shop) setSelectedAreaOverride({ shopId: shop.id, areaId });
  }

  function openDogCompanion(dogDecorationId: string) {
    setDogCollectionVisible(false);
    setActiveDogCompanionId(dogDecorationId);
  }

  async function openDogCollection() {
    if (!shop || shop.id !== DOG_COMPANION_SHOP_ID) return;
    try {
      const rewardCoins = await ensureDogCollectionRewards(shop.id);
      if (rewardCoins > 0) setNotice(`狗狗圖鑑獎勵已領取，共獲得 ${rewardCoins} 金幣。`);
      setDogCollectionVisible(true);
    } catch (error) {
      Alert.alert('狗狗圖鑑無法開啟', error instanceof Error ? error.message : '請稍後再試。');
    }
  }

  async function placeDecoration(decorationId: string, price: number) {
    if (!shop || !hasAccess || workingDecoration) return;
    const alreadyOwned = owned.has(decorationId);
    if (!alreadyOwned && coins < price) {
      const missing = price - coins;
      const message = `金幣不足：目前有 ${coins} 枚，兌換需要 ${price} 枚，還差 ${missing} 枚。完成目標即可賺取金幣。`;
      setNotice(message);
      setSlotAccessibilityResult('');
      return;
    }
    setWorkingDecoration(decorationId);
    setNotice('');
    setSlotAccessibilityResult('');
    try {
      await placeShopInteriorDecoration(shop.id, decorationId, selectedPlacementId);
      const location = `${getShopInteriorAreaLabel(selectedArea)}${SHOP_INTERIOR_SLOTS.find(({ id }) => id === selectedSlot)?.label ?? '店內'}`;
      const result = alreadyOwned
        ? `已免費將項目移至${location}。舊項目仍保留在店內收藏。`
        : `已兌換並放在${location}，扣除 ${price} 金幣。`;
      setNotice(result);
      setSlotAccessibilityResult(result);
    } catch (error) {
      Alert.alert('項目未能放置', error instanceof Error ? error.message : '請稍後再試。');
    } finally {
      setWorkingDecoration(null);
    }
  }

  async function updateFixtureProduct(productId: string | null) {
    if (!shop || !activeFixture || !hasAccess || workingDisplayProduct) return;
    setWorkingDisplayProduct(true);
    setNotice('');
    setSlotAccessibilityResult('');
    try {
      await setShopInteriorFixtureProduct(shop.id, activeFixture.id, selectedDisplaySlot, productId);
      const productName = activeFixtureProducts.find(({ id }) => id === productId)?.name;
      setNotice(productId
        ? `已將${productName ?? '商品'}放入${activeFixture.name}第 ${selectedDisplaySlot + 1} 格，免費陳列。`
        : `已清空${activeFixture.name}第 ${selectedDisplaySlot + 1} 格，沒有扣除金幣。`);
    } catch (error) {
      Alert.alert('商品陳列未完成', error instanceof Error ? error.message : '請稍後再試。');
    } finally {
      setWorkingDisplayProduct(false);
    }
  }

  async function saveDogStaffLook(dogDecorationId: string, look: DogStaffLook) {
    if (!shop) return;
    await updateShopInteriorDogLook(shop.id, dogDecorationId, look);
  }

  async function saveNamedDogStaffLook(dogDecorationId: string, name: string, look: DogStaffLook) {
    if (!shop) return;
    await saveShopInteriorDogLook(shop.id, dogDecorationId, name, look);
  }

  async function deleteNamedDogStaffLook(dogDecorationId: string, savedLookId: string) {
    if (!shop) return;
    await deleteShopInteriorDogLook(shop.id, dogDecorationId, savedLookId);
  }

  async function arrangeDogStaff(dogDecorationId: string, areaId: DogStaffAreaId) {
    if (!shop || !hasAccess || workingDecoration) return;
    setWorkingDecoration(dogDecorationId);
    setNotice('');
    setSlotAccessibilityResult('');
    try {
      await placeShopInteriorDogStaff(shop.id, dogDecorationId, areaId);
      selectArea(areaId);
    } catch (error) {
      throw error;
    } finally {
      setWorkingDecoration(null);
    }
  }

  async function storeDogStaff(dogDecorationId: string) {
    if (!shop || !hasAccess || workingDecoration) return;
    setWorkingDecoration(dogDecorationId);
    setNotice('');
    setSlotAccessibilityResult('');
    try {
      await storeShopInteriorDogStaff(shop.id, dogDecorationId);
    } catch (error) {
      throw error;
    } finally {
      setWorkingDecoration(null);
    }
  }

  async function storeSelectedDecoration() {
    if (!shop || !selectedDecoration || workingDecoration) return;
    setWorkingDecoration(selectedDecoration.id);
    setNotice('');
    setSlotAccessibilityResult('');
    try {
      await storeShopInteriorDecoration(shop.id, selectedPlacementId);
      const result = `已將${selectedDecoration.name}收進這間店的收藏，沒有退款或扣除金幣。`;
      setNotice(result);
      setSlotAccessibilityResult(result);
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
              <ShopInteriorAnimatedObject
                testID="shop-interior-storefront-visual"
                id={shop.visual ?? shop.id}
                itemId={shop.id}
                itemName={shop.name}
                floor={shop.floor}
                color={shop.color}
                icon={shop.icon}
                category="shop"
              />
              <View style={[styles.shopTypePill, { backgroundColor: colors.card }]}>
                <Feather name="shopping-bag" size={13} color={colors.primary} />
                <Text style={[styles.shopTypeText, { color: colors.primary }]}>{getShopTypeLabel(shop.shopType, shop.id)}</Text>
              </View>
              <Text testID="shop-interior-name" style={[styles.shopName, { color: colors.foreground }]}>{shop.name}</Text>
              <Text style={[styles.shopLocation, { color: colors.mutedForeground }]}>
                {shop.floor}F · {floor.title} · 完成目標賺金幣，讓店裡慢慢變成喜歡的樣子
              </Text>
            </View>

            <ShopInteriorScene
              testID="shop-interior-scene"
              sceneKey={getShopInteriorSceneKey(shop.shopType, shop.id, shop.name)}
              shopName={shop.name}
              shopId={shop.id}
              floor={shop.floor}
              shopColor={shop.color}
              areaId={selectedArea}
              areaLabel={getShopInteriorAreaLabel(selectedArea)}
              placements={areaPlacements}
              decorations={interiorDecorations}
              dogStaffLooks={interior?.dogStaffLooks}
              dogStaffPlacements={interior?.dogStaffPlacements}
              fixtureContents={interior?.fixtureContents}
              fixtureProducts={fixtureProducts}
              selectedSlot={selectedSlot}
              accessibilityResult={slotAccessibilityResult}
              onSelectSlot={(slot) => {
                setSelectedSlot(slot);
                setNotice('');
                setSlotAccessibilityResult('');
              }}
              onOpenDisplayFixture={(fixtureId) => {
                setSelectedDisplaySlot(0);
                setActiveFixtureId(fixtureId);
              }}
              onOpenDogCompanion={shop.id === DOG_COMPANION_SHOP_ID ? openDogCompanion : undefined}
            />

            {shop.shopType === 'cosmetics' && (
              <CosmeticsTryOn products={cosmeticsTryOnProducts} />
            )}
            {shop.id === 'portrait-photo-studio' && <PhotoStudioTryOn />}

            <View style={[styles.areaPager, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Pressable
                testID="shop-interior-area-prev"
                accessibilityRole="button"
                accessibilityLabel="上一個店內區域"
                accessibilityState={{ disabled: SHOP_INTERIOR_AREAS.findIndex(({ id }) => id === selectedArea) === 0 }}
                disabled={SHOP_INTERIOR_AREAS.findIndex(({ id }) => id === selectedArea) === 0}
                onPress={() => {
                  const index = SHOP_INTERIOR_AREAS.findIndex(({ id }) => id === selectedArea);
                  if (index > 0) {
                    selectArea(SHOP_INTERIOR_AREAS[index - 1].id);
                    setNotice('');
                    setSlotAccessibilityResult('');
                  }
                }}
                style={[styles.areaButton, { backgroundColor: colors.secondary, opacity: selectedArea === 'main' ? 0.45 : 1 }]}
              >
                <Feather name="chevron-left" size={18} color={colors.primary} />
              </Pressable>
              <View style={styles.areaCopy}>
                <Text testID="shop-interior-area-label" style={[styles.areaTitle, { color: colors.foreground }]}>
                  {getShopInteriorAreaLabel(selectedArea)}
                </Text>
                <Text style={[styles.areaSubtitle, { color: colors.mutedForeground }]}>
                  區域 {SHOP_INTERIOR_AREAS.findIndex(({ id }) => id === selectedArea) + 1} / {SHOP_INTERIOR_AREAS.length} · 8 個位置
                </Text>
              </View>
              <Pressable
                testID="shop-interior-area-next"
                accessibilityRole="button"
                accessibilityLabel="下一個店內區域"
                accessibilityState={{ disabled: SHOP_INTERIOR_AREAS.findIndex(({ id }) => id === selectedArea) === SHOP_INTERIOR_AREAS.length - 1 }}
                disabled={SHOP_INTERIOR_AREAS.findIndex(({ id }) => id === selectedArea) === SHOP_INTERIOR_AREAS.length - 1}
                onPress={() => {
                  const index = SHOP_INTERIOR_AREAS.findIndex(({ id }) => id === selectedArea);
                  if (index < SHOP_INTERIOR_AREAS.length - 1) {
                    selectArea(SHOP_INTERIOR_AREAS[index + 1].id);
                    setNotice('');
                    setSlotAccessibilityResult('');
                  }
                }}
                style={[styles.areaButton, { backgroundColor: colors.secondary, opacity: selectedArea === 'extension-5' ? 0.45 : 1 }]}
              >
                <Feather name="chevron-right" size={18} color={colors.primary} />
              </Pressable>
            </View>

            {shop.id === 'fluffy-marshmallow-cafe' && (
              <DogStaffCustomizer
                dogs={DOG_STAFF_PROFILES}
                ownedDecorationIds={ownedDecorationIds}
                looks={interior?.dogStaffLooks}
                savedLooks={interior?.dogStaffOutfits}
                areaPlacements={interior?.dogStaffPlacements}
                coins={coins}
                busyDogId={workingDecoration}
                onRedeem={(dogDecorationId, areaId) => arrangeDogStaff(dogDecorationId, areaId)}
                onMoveDog={arrangeDogStaff}
                onStoreDog={storeDogStaff}
                onSelectLook={saveDogStaffLook}
                onSaveLook={saveNamedDogStaffLook}
                onDeleteLook={deleteNamedDogStaffLook}
                onOpenDogCompanion={openDogCompanion}
                onDogListArtStyleChange={handleDogListArtStyleChange}
                onOpenCollection={() => void openDogCollection()}
              />
            )}

            <View style={styles.sectionHeading}>
              <View>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>挑選店內設備與佈置</Text>
                <Text style={[styles.sectionCopy, { color: colors.mutedForeground }]}>
                  不同店型有專屬設備；點選已擺放的貨架或展示物件，可免費陳列本店商品。
                </Text>
              </View>
              <View style={[styles.selectedSlotPill, { backgroundColor: colors.secondary }]}>
                <Feather name="map-pin" size={12} color={colors.primary} />
                <Text style={[styles.selectedSlotText, { color: colors.primary }]}>
                  {getShopInteriorAreaLabel(selectedArea)} · {SHOP_INTERIOR_SLOTS.find(({ id }) => id === selectedSlot)?.label}
                </Text>
              </View>
            </View>

            <View style={[styles.decorationPager, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text testID="shop-decoration-page-count" style={[styles.pageCount, { color: colors.mutedForeground }]}>
                第 {catalogPage} / {catalogPageCount} 頁 · 共 {interiorDecorations.length} 款
                {shop.id === 'fluffy-marshmallow-cafe' ? '（狗狗店員可點擊互動）' : ''}
              </Text>
              <View style={styles.pageActions}>
                <Pressable
                  testID="shop-decoration-page-prev"
                  accessibilityRole="button"
                  accessibilityLabel="上一頁裝飾選擇"
                  accessibilityState={{ disabled: catalogPage <= 1 }}
                  disabled={catalogPage <= 1}
                  onPress={() => setCatalogPage((page) => Math.max(1, page - 1))}
                  style={[styles.pageButton, { backgroundColor: colors.secondary, opacity: catalogPage <= 1 ? 0.45 : 1 }]}
                >
                  <Feather name="chevron-left" size={18} color={colors.primary} />
                </Pressable>
                <Pressable
                  testID="shop-decoration-page-next"
                  accessibilityRole="button"
                  accessibilityLabel="下一頁裝飾選擇"
                  accessibilityState={{ disabled: catalogPage >= catalogPageCount }}
                  disabled={catalogPage >= catalogPageCount}
                  onPress={() => setCatalogPage((page) => Math.min(catalogPageCount, page + 1))}
                  style={[styles.pageButton, { backgroundColor: colors.secondary, opacity: catalogPage >= catalogPageCount ? 0.45 : 1 }]}
                >
                  <Feather name="chevron-right" size={18} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            {selectedDecoration && (
              <Pressable
                testID="shop-interior-store-decoration"
                accessibilityRole="button"
                accessibilityLabel={`收起${selectedDecoration.name}，保留在店內收藏，不退款`}
                disabled={workingDecoration !== null}
                onPress={() => void storeSelectedDecoration()}
                style={[styles.storeButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              >
                <Feather name="archive" size={15} color={colors.primary} />
                <Text style={[styles.storeButtonText, { color: colors.primary }]}>收起目前項目 · 收藏保留</Text>
              </Pressable>
            )}

            {notice ? (
              <Text testID="shop-interior-notice" accessibilityRole="text" accessibilityLiveRegion={slotAccessibilityResult ? 'none' : 'polite'} style={[styles.notice, { color: colors.primary }]}>
                {notice}
              </Text>
            ) : null}

            <View style={styles.decorationList}>
              {visibleDecorations.map((decoration) => {
                const isOwned = owned.has(decoration.id);
                const currentPlacementId = Object.entries(placements).find(([, id]) => id === decoration.id)?.[0];
                const currentPlacement = currentPlacementId ? parseShopInteriorPlacementId(currentPlacementId) : null;
                const alreadyHere = currentPlacementId === selectedPlacementId;
                const currentLocation = currentPlacement
                  ? `${getShopInteriorAreaLabel(currentPlacement.areaId)}${SHOP_INTERIOR_SLOTS.find(({ id }) => id === currentPlacement.slotId)?.label ?? ''}`
                  : null;
                const affordable = coins >= decoration.price;
                const disabled = workingDecoration !== null || alreadyHere;
                return (
                  <View
                    key={decoration.id}
                    testID={`shop-decoration-${decoration.id}`}
                    style={[styles.decorationCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={[styles.decorationShowcase, { backgroundColor: colors.candyCream, borderColor: decoration.color }]}>
                      <ShopInteriorAnimatedObject
                        testID={`shop-decoration-visual-${decoration.id}`}
                        id={decoration.id}
                        itemId={`${shop.id}:catalog:${decoration.id}`}
                        color={decoration.color}
                        icon={decoration.icon}
                        category="decor"
                        visual={decoration.visual}
                      />
                    </View>
                    <View style={styles.decorationCopy}>
                      <View style={styles.decorationTitleRow}>
                        <Text style={[styles.decorationName, { color: colors.foreground }]}>{decoration.name}</Text>
                        {decoration.limitedEdition && (
                          <View
                            testID={`shop-decoration-limited-${decoration.id}`}
                            style={[styles.limitedBadge, { backgroundColor: colors.candyRose }]}
                          >
                            <Text style={[styles.limitedBadgeText, { color: colors.foreground }]}>限定</Text>
                          </View>
                        )}
                        {decoration.itemKind === 'equipment' && (
                          <View
                            testID={`shop-decoration-equipment-${decoration.id}`}
                            style={[styles.equipmentBadge, { backgroundColor: colors.candyMint }]}
                          >
                            <Text style={[styles.equipmentBadgeText, { color: colors.foreground }]}>設備</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.decorationDescription, { color: colors.mutedForeground }]}>{decoration.description}</Text>
                      <Text style={[styles.decorationCost, { color: colors.candyCaramelDark }]}>
                        {isOwned
                          ? currentPlacement
                            ? `已佈置於${currentLocation} · 可免費換位`
                            : '已兌換 · 可免費佈置'
                          : affordable
                            ? `完成目標取得 ${decoration.price} 金幣`
                            : `還差 ${decoration.price - coins} 金幣 · 完成目標可取得`}
                      </Text>
                    </View>
                    <Pressable
                      testID={`shop-decoration-place-${decoration.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={alreadyHere ? `${decoration.name}已在${getShopInteriorAreaLabel(selectedArea)}${SHOP_INTERIOR_SLOTS.find(({ id }) => id === selectedSlot)?.label}` : isOwned ? `免費佈置${decoration.name}於${getShopInteriorAreaLabel(selectedArea)}${SHOP_INTERIOR_SLOTS.find(({ id }) => id === selectedSlot)?.label}` : `兌換${decoration.name}並佈置於${getShopInteriorAreaLabel(selectedArea)}${SHOP_INTERIOR_SLOTS.find(({ id }) => id === selectedSlot)?.label}，${decoration.price}金幣${affordable ? '' : `，金幣不足，還差 ${decoration.price - coins} 枚`}`}
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
              金幣只來自已完成的目標；店內設備與佈置不設付費、儲值或現金購買。
            </Text>
          </>
        ) : null}
      </ScrollView>
      {shop?.id === DOG_COMPANION_SHOP_ID && (
        <>
          <DogCompanionModal
            visible={activeDogCompanion !== null && dogStaffListArtStyleLoaded}
            dog={activeDogCompanion}
            artStyle={dogStaffListArtStyle}
            dogLook={activeDogCompanionLook}
            owned={Boolean(activeDogCompanion && owned.has(activeDogCompanion.decorationId))}
            coins={coins}
            today={today}
            affection={dogCompanionAffection}
            onClose={() => setActiveDogCompanionId(null)}
            onInteract={(dogDecorationId, action, requestedAffection, coinCost) => (
              recordDogCompanionInteraction(shop.id, dogDecorationId, action, requestedAffection, coinCost)
            )}
          />
          <DogCollectionBook
            visible={dogCollectionVisible}
            dogs={DOG_STAFF_PROFILES}
            ownedDecorationIds={ownedDecorationIds}
            companionState={interior?.dogCompanion}
            onClose={() => setDogCollectionVisible(false)}
            onOpenOwnedDog={(dogDecorationId) => {
              setDogCollectionVisible(false);
              setActiveDogCompanionId(dogDecorationId);
            }}
            onGoToMallFloor={() => {
              setDogCollectionVisible(false);
              router.push({ pathname: '/(tabs)/mall', params: { floor: String(shop.floor) } });
            }}
          />
        </>
      )}
      <ShopDisplayFixturePanel
        key={activeFixtureId ?? 'no-fixture'}
        visible={!!activeFixtureId && hasAccess}
        shopName={shop?.name ?? ''}
        fixture={activeFixture}
        products={activeFixtureProducts}
        slots={activeFixtureSlots}
        selectedSlot={selectedDisplaySlot}
        busy={workingDisplayProduct}
        onSelectSlot={setSelectedDisplaySlot}
        onPlaceProduct={(productId) => void updateFixtureProduct(productId)}
        onClearSlot={() => void updateFixtureProduct(null)}
        onClose={() => setActiveFixtureId(null)}
      />
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
  areaPager: { minHeight: 58, paddingHorizontal: 9, paddingVertical: 7, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  areaButton: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  areaCopy: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  areaTitle: { fontSize: 14, fontWeight: '800' },
  areaSubtitle: { fontSize: 10, marginTop: 2 },
  room: { borderRadius: 25, borderWidth: 2, overflow: 'hidden', padding: 10, shadowColor: '#6A4B57', shadowOpacity: 0.1, shadowRadius: 12, elevation: 3 },
  roomSign: { minHeight: 32, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 13, marginBottom: 8, borderRadius: 12, borderWidth: 1 },
  roomSignText: { fontSize: 12, fontWeight: '800', maxWidth: 180 },
  signLight: { width: 6, height: 6, borderRadius: 3 },
  roomWall: { borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden', paddingHorizontal: 10, paddingTop: 10 },
  roomTopTrim: { height: 5, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.8)' },
  shelfLine: { height: 27, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', borderBottomWidth: 3, borderColor: '#D7B891', paddingBottom: 3, marginBottom: 7 },
  miniProduct: { width: 15, height: 15, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderWidth: 1, borderColor: 'rgba(110,80,65,0.18)' },
  roomGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, borderBottomWidth: 2, paddingBottom: 10 },
  roomSlot: { width: '31.8%', minHeight: 104, borderWidth: 1.5, borderRadius: 15, paddingVertical: 7, paddingHorizontal: 3, alignItems: 'center', justifyContent: 'center', gap: 3 },
  objectEntrance: { alignItems: 'center', justifyContent: 'center' },
  roomObjectStage: { width: 70, height: 56, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  emptyDecorBadge: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
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
  decorationPager: { minHeight: 48, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageCount: { fontSize: 11, fontWeight: '700' },
  pageActions: { flexDirection: 'row', gap: 8 },
  pageButton: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  storeButton: { minHeight: 42, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  storeButtonText: { fontSize: 12, fontWeight: '700' },
  notice: { fontSize: 12, lineHeight: 17 },
  decorationList: { gap: 9 },
  decorationCard: { minHeight: 81, borderWidth: 1, borderRadius: 17, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  decorationShowcase: { width: 70, height: 56, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  decorationCopy: { flex: 1, gap: 2 },
  decorationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  decorationName: { flexShrink: 1, fontSize: 13, fontWeight: '800' },
  limitedBadge: { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  limitedBadgeText: { fontSize: 8, fontWeight: '800' },
  equipmentBadge: { borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  equipmentBadgeText: { fontSize: 8, fontWeight: '800' },
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
