import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ImageBackground, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { MallObjectVisual } from '@/components/MallVisuals';
import { SHOP_INTERIOR_SLOTS, type ShopInteriorDecoration, type ShopInteriorSlotId, type ShopInteriorSceneKey } from '@/constants/mall-shop-interior';
import { classifyDecoration, mapCoverPoint, resolveObjectAnchor } from '@/constants/mall-shop-scene-anchors';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';
import { canDisplayShopProducts, SHOP_DISPLAY_SLOT_COUNT, type ShopDisplayProduct } from '@/constants/mall-shop-display';
import { ShopMerchandiseVisual } from '@/components/ShopMerchandiseVisual';
import {
  DOG_STAFF_PROFILE_BY_DECORATION_ID,
  DOG_STAFF_STATIONS,
  resolveDogStaffLook,
  type DogStaffLook,
  type DogStaffStationId,
} from '@/constants/dog-staff-customization';
import { useColors } from '@/hooks/useColors';

const SCENES: Record<ShopInteriorSceneKey, number> = {
  general: require('../assets/images/shop-room-gifts.jpg'),
  cafe: require('../assets/images/shop-room-cafe.jpg'),
  candy: require('../assets/images/shop-room-candy.jpg'),
  icecream: require('../assets/images/shop-room-icecream.jpg'),
  bakery: require('../assets/images/shop-room-bakery.jpg'),
  tea: require('../assets/images/shop-room-tea.jpg'),
  food: require('../assets/images/shop-room-food.jpg'),
  flower: require('../assets/images/shop-room-florist.jpg'),
  book: require('../assets/images/shop-room-bookshop.jpg'),
  toy: require('../assets/images/shop-room-toy.jpg'),
  craft: require('../assets/images/shop-room-craft.jpg'),
  womenswear: require('../assets/images/shop-room-fashion.jpg'),
  bridal: require('../assets/images/shop-room-bridal.jpg'),
  eveningwear: require('../assets/images/shop-room-eveningwear.jpg'),
  kimono: require('../assets/images/shop-room-kimono.jpg'),
  supermarket: require('../assets/images/shop-room-market.jpg'),
  hyakuen: require('../assets/images/shop-room-hyakuen.jpg'),
  swimwear: require('../assets/images/shop-room-swimwear.jpg'),
  cosplay: require('../assets/images/shop-room-cosplay.jpg'),
  electronics: require('../assets/images/shop-room-electronics.jpg'),
  boutique: require('../assets/images/shop-room-boutique.jpg'),
};

export function ShopInteriorScene({
  testID,
  sceneKey,
  shopName,
  shopColor,
  areaLabel,
  placements,
  decorations,
  dogStaffLooks,
  dogStaffPlacements,
  fixtureContents,
  fixtureProducts,
  selectedSlot,
  onSelectSlot,
  onOpenDisplayFixture,
}: {
  testID: string;
  sceneKey: ShopInteriorSceneKey;
  shopName: string;
  shopColor: string;
  areaLabel: string;
  placements: Partial<Record<ShopInteriorSlotId, string>>;
  decorations: ShopInteriorDecoration[];
  dogStaffLooks?: Record<string, DogStaffLook>;
  dogStaffPlacements?: Partial<Record<DogStaffStationId, string>>;
  fixtureContents?: Record<string, (string | null)[]>;
  fixtureProducts?: Record<string, ShopDisplayProduct[]>;
  selectedSlot: ShopInteriorSlotId;
  onSelectSlot: (slot: ShopInteriorSlotId) => void;
  onOpenDisplayFixture: (decorationId: string) => void;
}) {
  const colors = useColors();
  const [size, setSize] = useState({ width: 360, height: 383 });
  const merchandiseMotion = useRef(new Animated.Value(0)).current;
  const hasMerchandise = Object.values(fixtureContents ?? {}).some((slots) => slots.some(Boolean));
  useEffect(() => {
    if (!hasMerchandise) {
      merchandiseMotion.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(merchandiseMotion, { toValue: 1, duration: 1050, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(merchandiseMotion, { toValue: 0, duration: 1250, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [hasMerchandise, merchandiseMotion]);
  return (
    <View
      testID={testID}
      style={[
        styles.frame,
        {
          borderColor: shopColor,
          backgroundColor: colors.candyCream,
          shadowColor: colors.candyCaramelDark,
        },
      ]}
    >
      <ImageBackground onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })} source={SCENES[sceneKey]} resizeMode="cover" style={styles.imageStage} imageStyle={styles.imageShape}>
        <View style={styles.topScrim} pointerEvents="none" />
        <View style={[styles.namePlaque, { backgroundColor: colors.card, borderColor: shopColor }]} pointerEvents="none">
          <View style={[styles.plaqueDot, { backgroundColor: shopColor }]} />
          <Text numberOfLines={1} style={[styles.nameText, { color: colors.foreground }]}>{shopName}</Text>
        </View>
        {SHOP_INTERIOR_SLOTS.map((slot) => {
          const decoration = decorations.find(({ id }) => id === placements[slot.id]);
          const dogLook = decoration ? resolveDogStaffLook(decoration.id, dogStaffLooks?.[decoration.id]) : null;
          const displayEnabled = !!decoration
            && canDisplayShopProducts(decoration)
            && (fixtureProducts?.[decoration.id]?.length ?? 0) > 0;
          const productById = new Map((decoration ? fixtureProducts?.[decoration.id] : undefined)?.map((product) => [product.id, product]));
          const displayedProducts = (decoration ? fixtureContents?.[decoration.id] : undefined)
            ?.map((productId) => productId ? productById.get(productId) : undefined)
            .filter((product): product is ShopDisplayProduct => !!product) ?? [];
          const selected = selectedSlot === slot.id;
          const profile = decoration ? classifyDecoration(decoration) : { cls: 'tabletop' as const, scale: 1 };
          const point = mapCoverPoint(resolveObjectAnchor(sceneKey, slot.id, profile.cls), size.width, size.height);
          const lift = (OBJECT_H * (1 - profile.scale)) / 2;
          return (
            <Pressable
              key={slot.id}
              testID={`shop-interior-slot-${slot.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${areaLabel}，${slot.label}${decoration ? `，目前是${decoration.name}` : '，尚未佈置'}${displayEnabled ? `，已陳列 ${displayedProducts.length} 款商品，點選可管理貨架商品` : ''}${selected ? '，目前選取' : ''}`}
              accessibilityHint={displayEnabled ? '點選開啟這個展示架的商品陳列；關閉後仍可從下方收納或調整家具。' : '選取這個店內位置，再從下方選擇佈置'}
              accessibilityState={{ selected }}
              onPress={() => {
                onSelectSlot(slot.id);
                if (decoration && displayEnabled) onOpenDisplayFixture(decoration.id);
              }}
              style={[styles.hotspot, { left: point.x - HOTSPOT_W / 2, top: point.y - HOTSPOT_H }]}
            >
              {decoration ? (
                <>
                  <View pointerEvents="none" style={styles.contactShadow} />
                  <View pointerEvents="none" style={[styles.objectVisual, { transform: [{ translateY: lift }, { scale: profile.scale }] }]}>
                    <MallObjectVisual
                      id={decoration.visual ?? decoration.id}
                      itemId={`${shopName}:${decoration.id}`}
                      color={decoration.color}
                      icon={decoration.icon}
                      category="decor"
                      isActive
                      dogOutfitId={dogLook?.outfitId}
                      dogAccessoryId={dogLook?.accessoryId}
                    />
                    {displayedProducts.length > 0 && (
                      <View pointerEvents="none" style={styles.displayedProductsRow}>
                        {displayedProducts.slice(0, 3).map((product, index) => (
                          <ShopMerchandiseVisual
                            key={`${product.id}-${index}`}
                            product={product}
                            motion={merchandiseMotion}
                            size={18}
                            index={index}
                          />
                        ))}
                        {displayedProducts.length > 3 && (
                          <Text style={[styles.moreDisplayedProducts, { color: colors.foreground }]}>+{displayedProducts.length - 3}</Text>
                        )}
                      </View>
                    )}
                  </View>
                  {displayEnabled && (
                    <View pointerEvents="none" style={[styles.displayCountBadge, { backgroundColor: colors.card, borderColor: shopColor }]}>
                      <Feather name="package" size={8} color={shopColor} />
                      <Text style={[styles.displayCountText, { color: colors.foreground }]}>{displayedProducts.length}/{SHOP_DISPLAY_SLOT_COUNT}</Text>
                    </View>
                  )}
                  {selected && <View pointerEvents="none" style={[styles.selectRing, { borderColor: colors.primary }]} />}
                </>
              ) : (
                <View
                  pointerEvents="none"
                  style={[styles.emptyMarker, selected ? { borderColor: colors.primary, backgroundColor: 'rgba(255,251,244,0.8)' } : null]}
                >
                  <Feather name={slot.icon as keyof typeof Feather.glyphMap} size={15} color={selected ? colors.primary : colors.mutedForeground} />
                </View>
              )}
              <View pointerEvents="none" style={[styles.slotLabelPill, selected && { borderColor: colors.primary, backgroundColor: colors.card }]}>
                <Text numberOfLines={1} style={[styles.slotLabel, { color: colors.foreground }]}>
                  {decoration?.name ?? slot.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ImageBackground>
      {sceneKey === 'cafe' && (
        <View
          testID="dog-staff-scene-dock"
          accessibilityLabel="CAFÉ 狗狗店員專屬站位區，不佔用一般佈置位置"
          style={[styles.dogStaffDock, { backgroundColor: colors.candyCream, borderTopColor: shopColor }]}
        >
          <View style={styles.dogStaffDockHeading}>
            <View style={[styles.dockHeadingDot, { backgroundColor: shopColor }]} />
            <Text style={[styles.dogStaffDockTitle, { color: colors.foreground }]}>CAFÉ 店員專屬站位</Text>
            <Text style={[styles.dogStaffDockCount, { color: colors.mutedForeground }]}>14 個 · 獨立於 48 個佈置位置</Text>
          </View>
          <View style={styles.dogStaffStationGrid}>
            {DOG_STAFF_STATIONS.map((station, index) => {
              const dogId = dogStaffPlacements?.[station.id];
              const dog = dogId ? DOG_STAFF_PROFILE_BY_DECORATION_ID[dogId] : undefined;
              const look = dogId && dog ? resolveDogStaffLook(dogId, dogStaffLooks?.[dogId]) : null;
              return (
                <View
                  key={station.id}
                  testID={`dog-staff-scene-station-${station.id}`}
                  accessible
                  accessibilityLabel={`${station.label}，${dog?.name ?? '空站位'}`}
                  style={[
                    styles.dogStaffStation,
                    {
                      backgroundColor: dog ? colors.card : 'rgba(255,255,255,0.48)',
                      borderColor: dog ? shopColor : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.stationLabel, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {station.label}
                  </Text>
                  <View style={styles.stationDog}>
                    {dog && look ? (
                      <AnimatedStaffDog
                        kind={dog.kind as DogAttendantKind}
                        outfitId={look.outfitId}
                        accessoryId={look.accessoryId}
                      />
                    ) : (
                      <Feather name="user" size={13} color={colors.mutedForeground} />
                    )}
                  </View>
                  <Text style={[styles.stationDogName, { color: dog ? colors.foreground : colors.mutedForeground }]} numberOfLines={1}>
                    {dog?.name ?? `空位 ${index + 1}`}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

function AnimatedStaffDog({
  kind,
  outfitId,
  accessoryId,
}: {
  kind: DogAttendantKind;
  outfitId: string;
  accessoryId: string;
}) {
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: -1.5, duration: 900, useNativeDriver: false }),
      Animated.timing(bob, { toValue: 0, duration: 900, useNativeDriver: false }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [bob]);
  return (
    <Animated.View style={[styles.animatedStationDog, { transform: [{ translateY: bob }, { scale: 0.5 }] }]}>
      <DogAttendant kind={kind} outfitId={outfitId} accessoryId={accessoryId} />
    </Animated.View>
  );
}

const OBJECT_H = 47;
const HOTSPOT_W = 64;
const HOTSPOT_H = 50;

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    borderRadius: 25,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  imageStage: { width: '100%', aspectRatio: 0.94, minHeight: 360, maxHeight: 510, justifyContent: 'flex-start' },
  imageShape: { width: '100%', height: '100%' },
  topScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,248,239,0.08)',
  },
  namePlaque: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    maxWidth: '72%',
    minHeight: 30,
    borderWidth: 1.5,
    borderRadius: 13,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#74575D',
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 2,
  },
  plaqueDot: { width: 7, height: 7, borderRadius: 4 },
  nameText: { fontSize: 11, fontWeight: '800' },
  hotspot: {
    position: 'absolute',
    width: HOTSPOT_W,
    height: HOTSPOT_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
    zIndex: 2,
  },
  contactShadow: {
    position: 'absolute',
    bottom: -1,
    width: 38,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(92,60,60,0.22)',
  },
  objectVisual: { width: 62, height: OBJECT_H, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  displayedProductsRow: { position: 'absolute', top: 11, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 2, zIndex: 3 },
  moreDisplayedProducts: { fontSize: 7, lineHeight: 9, fontWeight: '900', backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: 5, overflow: 'hidden', paddingHorizontal: 2 },
  displayCountBadge: { position: 'absolute', top: -5, right: -5, minHeight: 17, flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4, borderWidth: 1, borderRadius: 7, zIndex: 4 },
  displayCountText: { fontSize: 7, lineHeight: 10, fontWeight: '800' },
  selectRing: { position: 'absolute', bottom: -2, width: 56, height: 56, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed' },
  emptyMarker: {
    width: 38,
    height: 38,
    marginBottom: 0,
    borderRadius: 13,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,251,244,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabelPill: {
    position: 'absolute',
    top: HOTSPOT_H + 1,
    maxWidth: 84,
    minHeight: 16,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.48)',
    backgroundColor: 'rgba(255,251,244,0.70)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: { maxWidth: '100%', fontSize: 8, lineHeight: 11, fontWeight: '800', textAlign: 'center' },
  dogStaffDock: { width: '100%', borderTopWidth: 2, paddingHorizontal: 8, paddingTop: 7, paddingBottom: 8 },
  dogStaffDockHeading: { minHeight: 18, flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  dockHeadingDot: { width: 6, height: 6, borderRadius: 4 },
  dogStaffDockTitle: { fontSize: 9, fontWeight: '900' },
  dogStaffDockCount: { marginLeft: 'auto', fontSize: 8, fontWeight: '700' },
  dogStaffStationGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 5 },
  dogStaffStation: { width: '13.4%', minHeight: 63, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, paddingVertical: 3, gap: 1 },
  stationLabel: { maxWidth: '100%', fontSize: 7, lineHeight: 9, fontWeight: '700', textAlign: 'center' },
  stationDog: { width: '100%', height: 27, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  animatedStationDog: { position: 'absolute', width: 50, height: 45, alignItems: 'center', justifyContent: 'center' },
  stationDogName: { maxWidth: '100%', fontSize: 8, lineHeight: 10, fontWeight: '800', textAlign: 'center' },
});
