import { Feather } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, ImageBackground, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MallObjectVisual } from '@/components/MallVisuals';
import { SHOP_INTERIOR_SLOTS, type ShopInteriorAreaId, type ShopInteriorDecoration, type ShopInteriorSlotId, type ShopInteriorSceneKey } from '@/constants/mall-shop-interior';
import { classifyDecoration, mapCoverPoint, resolveObjectAnchor } from '@/constants/mall-shop-scene-anchors';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';
import { canDisplayShopProducts, SHOP_DISPLAY_SLOT_COUNT, type ShopDisplayProduct } from '@/constants/mall-shop-display';
import { ShopMerchandiseVisual } from '@/components/ShopMerchandiseVisual';
import {
  DOG_STAFF_PROFILES,
  DOG_STAFF_ROUTES,
  resolveDogStaffLook,
  type DogStaffAreaPlacements,
  type DogStaffLook,
  type DogStaffProfile,
} from '@/constants/dog-staff-customization';
import { useColors } from '@/hooks/useColors';

type DogStaffInteractionAction = 'groom' | 'feed' | 'play';
type AreaDogStaff = { dog: DogStaffProfile; look: DogStaffLook; index: number };
type DogStaffInteraction = { dogDecorationId: string; action: DogStaffInteractionAction; id: number };

const DOG_STAFF_INTERACTIONS: {
  id: DogStaffInteractionAction;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  description: string;
}[] = [
  { id: 'groom', title: '梳毛', icon: 'wind', description: '輕輕梳順蓬鬆毛毛' },
  { id: 'feed', title: '餵食', icon: 'gift', description: '送上店裡準備的小點心' },
  { id: 'play', title: '一起玩', icon: 'play', description: '陪狗狗開心玩一會' },
];

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
  areaId,
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
  areaId: ShopInteriorAreaId;
  areaLabel: string;
  placements: Partial<Record<ShopInteriorSlotId, string>>;
  decorations: ShopInteriorDecoration[];
  dogStaffLooks?: Record<string, DogStaffLook>;
  dogStaffPlacements?: DogStaffAreaPlacements;
  fixtureContents?: Record<string, (string | null)[]>;
  fixtureProducts?: Record<string, ShopDisplayProduct[]>;
  selectedSlot: ShopInteriorSlotId;
  onSelectSlot: (slot: ShopInteriorSlotId) => void;
  onOpenDisplayFixture: (decorationId: string) => void;
}) {
  const colors = useColors();
  const [size, setSize] = useState({ width: 360, height: 383 });
  const [reducedMotion, setReducedMotion] = useState(false);
  const [selectedDog, setSelectedDog] = useState<AreaDogStaff | null>(null);
  const [dogInteraction, setDogInteraction] = useState<DogStaffInteraction | null>(null);
  const [interactionMessage, setInteractionMessage] = useState('');
  const interactionSequence = useRef(0);
  const merchandiseMotion = useRef(new Animated.Value(0)).current;
  const completeDogInteraction = useCallback((id: number) => {
    setDogInteraction((current) => current?.id === id ? null : current);
  }, []);
  const hasMerchandise = Object.values(fixtureContents ?? {}).some((slots) => slots.some(Boolean));
  const areaDogStaff = sceneKey === 'cafe'
    ? DOG_STAFF_PROFILES
      .flatMap((dog, index) => {
        if (dogStaffPlacements?.[dog.decorationId] !== areaId) return [];
        const look = resolveDogStaffLook(dog.decorationId, dogStaffLooks?.[dog.decorationId]);
        return look ? [{ dog, look, index }] : [];
      })
    : [];
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (active) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  useEffect(() => {
    setSelectedDog(null);
    setDogInteraction(null);
    setInteractionMessage('');
  }, [areaId]);
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
        {areaDogStaff.length > 0 && (
          <View
            testID={`dog-staff-scene-area-${areaId}`}
            pointerEvents="box-none"
            style={StyleSheet.absoluteFill}
          >
            {areaDogStaff.map(({ dog, look, index }) => (
              <WalkingStaffDog
                key={dog.decorationId}
                testID={`dog-staff-walker-${dog.key}`}
                dog={dog}
                look={look}
                index={index}
                width={size.width}
                height={size.height}
                reducedMotion={reducedMotion}
                interaction={dogInteraction?.dogDecorationId === dog.decorationId ? dogInteraction : null}
                onPress={() => {
                  setSelectedDog({ dog, look, index });
                  setInteractionMessage('');
                }}
                onInteractionComplete={completeDogInteraction}
              />
            ))}
          </View>
        )}
      </ImageBackground>
      <Modal
        visible={selectedDog !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedDog(null)}
        statusBarTranslucent
      >
        <View style={styles.interactionBackdrop}>
          <Pressable
            testID="dog-staff-interaction-dismiss"
            accessibilityRole="button"
            accessibilityLabel="關閉狗狗互動"
            onPress={() => setSelectedDog(null)}
            style={StyleSheet.absoluteFill}
          />
          {selectedDog && (
            <SafeAreaView edges={['bottom']} style={styles.interactionSheetDock}>
              <View
                testID="dog-staff-interaction-sheet"
                accessibilityViewIsModal
                style={[styles.interactionSheet, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.interactionHandle, { backgroundColor: colors.border }]} />
                <View style={styles.interactionHeader}>
                  <View style={[styles.interactionDogPreview, { backgroundColor: colors.candyPeach }]}>
                    <DogAttendant
                      kind={selectedDog.dog.kind as DogAttendantKind}
                      outfitId={selectedDog.look.outfitId}
                      accessoryId={selectedDog.look.accessoryId}
                    />
                  </View>
                  <View style={styles.interactionHeaderCopy}>
                    <Text style={[styles.interactionEyebrow, { color: colors.primary }]}>毛茸茸棉花糖CAFE · 狗狗互動</Text>
                    <Text style={[styles.interactionTitle, { color: colors.foreground }]}>{selectedDog.dog.name} · {selectedDog.dog.breed}</Text>
                  </View>
                  <Pressable
                    testID="dog-staff-interaction-close"
                    accessibilityRole="button"
                    accessibilityLabel="關閉狗狗互動"
                    onPress={() => setSelectedDog(null)}
                    style={[styles.interactionClose, { backgroundColor: colors.secondary }]}
                  >
                    <Feather name="x" size={18} color={colors.primary} />
                  </Pressable>
                </View>
                <Text style={[styles.interactionHelper, { color: colors.mutedForeground }]}>
                  兌換狗店員後附送 · 梳毛、餵食和玩耍都不耗金幣
                </Text>
                <View style={styles.interactionActions}>
                  {DOG_STAFF_INTERACTIONS.map((action) => (
                    <Pressable
                      key={action.id}
                      testID={`dog-staff-interaction-${selectedDog.dog.key}-${action.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`免費為${selectedDog.dog.name}${action.title}，不耗金幣`}
                      onPress={() => {
                        interactionSequence.current += 1;
                        setDogInteraction({
                          dogDecorationId: selectedDog.dog.decorationId,
                          action: action.id,
                          id: interactionSequence.current,
                        });
                        const response = action.id === 'groom'
                          ? `${selectedDog.dog.name}舒服地享受梳毛，毛毛變得蓬鬆亮澤。`
                          : action.id === 'feed'
                            ? `${selectedDog.dog.name}開心地吃完小點心，尾巴搖個不停。`
                            : `${selectedDog.dog.name}玩得很開心，蹦蹦跳跳地回來了。`;
                        setInteractionMessage(response);
                      }}
                      style={({ pressed }) => [
                        styles.interactionAction,
                        {
                          backgroundColor: pressed ? colors.secondary : colors.background,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <View style={[styles.interactionActionIcon, { backgroundColor: colors.candyPeach }]}>
                        <Feather name={action.icon} size={19} color={colors.primary} />
                      </View>
                      <Text style={[styles.interactionActionTitle, { color: colors.foreground }]}>{action.title}</Text>
                      <Text style={[styles.interactionActionDescription, { color: colors.mutedForeground }]}>{action.description}</Text>
                    </Pressable>
                  ))}
                </View>
                {interactionMessage ? (
                  <Text
                    testID="dog-staff-interaction-feedback"
                    accessibilityLiveRegion="polite"
                    style={[styles.interactionFeedback, { color: colors.primary }]}
                  >
                    {interactionMessage}
                  </Text>
                ) : null}
              </View>
            </SafeAreaView>
          )}
        </View>
      </Modal>
    </View>
  );
}

function WalkingStaffDog({
  testID,
  dog,
  look,
  index,
  width,
  height,
  reducedMotion,
  interaction,
  onPress,
  onInteractionComplete,
}: {
  testID: string;
  dog: DogStaffProfile;
  look: DogStaffLook;
  index: number;
  width: number;
  height: number;
  reducedMotion: boolean;
  interaction: DogStaffInteraction | null;
  onPress: () => void;
  onInteractionComplete: (id: number) => void;
}) {
  const route = DOG_STAFF_ROUTES[index % DOG_STAFF_ROUTES.length];
  const progress = useRef(new Animated.Value(0)).current;
  const stride = useRef(new Animated.Value(0)).current;
  const facing = useRef(new Animated.Value(route.to > route.from ? 1 : -1)).current;
  const reaction = useRef(new Animated.Value(0)).current;
  const colors = useColors();
  const native = Platform.OS !== 'web';
  useEffect(() => {
    if (reducedMotion) return;
    function walk(to: number) {
      return Animated.parallel([
        Animated.timing(progress, { toValue: to, duration: route.duration, easing: Easing.linear, useNativeDriver: native }),
        Animated.loop(Animated.sequence([
          Animated.timing(stride, { toValue: 1, duration: 300, useNativeDriver: native }),
          Animated.timing(stride, { toValue: -1, duration: 300, useNativeDriver: native }),
        ]), { iterations: Math.max(1, Math.floor(route.duration / 600)) }),
      ]);
    }
    const direction = route.to > route.from ? 1 : -1;
    const journey = Animated.loop(Animated.sequence([
      Animated.delay(index * 180),
      Animated.timing(facing, { toValue: direction, duration: 0, useNativeDriver: native }),
      walk(1),
      Animated.timing(stride, { toValue: 0, duration: 100, useNativeDriver: native }),
      Animated.delay(1800 + index * 130),
      Animated.timing(facing, { toValue: -direction, duration: 0, useNativeDriver: native }),
      walk(0),
      Animated.timing(stride, { toValue: 0, duration: 100, useNativeDriver: native }),
      Animated.delay(1400),
    ]));
    journey.start();
    return () => journey.stop();
  }, [facing, index, native, progress, reducedMotion, route, stride]);
  useEffect(() => {
    if (!interaction) {
      reaction.setValue(0);
      return;
    }
    if (reducedMotion) {
      reaction.setValue(0);
      onInteractionComplete(interaction.id);
      return;
    }
    reaction.setValue(0);
    const pulses = interaction.action === 'play' ? [1, 0, 1, 0] : [1, 0];
    const animation = Animated.sequence(pulses.map((value) => Animated.timing(reaction, {
      toValue: value,
      duration: value ? 230 : 190,
      easing: value ? Easing.out(Easing.quad) : Easing.inOut(Easing.quad),
      useNativeDriver: native,
    })));
    animation.start(({ finished }) => {
      if (finished) onInteractionComplete(interaction.id);
    });
    return () => animation.stop();
  }, [interaction?.action, interaction?.id, native, onInteractionComplete, reaction, reducedMotion]);
  const bob = stride.interpolate({ inputRange: [-1, 0, 1], outputRange: [-1.2, 0, -1.2] });
  const maxLeft = Math.max(0, width - STAFF_DOG_WIDTH);
  const fromX = Math.min(maxLeft, Math.max(0, route.from * width / 100));
  const toX = Math.min(maxLeft, Math.max(0, route.to * width / 100));
  const top = Math.min(route.top * height / 100, Math.max(0, height - STAFF_DOG_HEIGHT - 7));
  const reactionRotate = reaction.interpolate({
    inputRange: [0, 1],
    outputRange: interaction?.action === 'groom'
      ? ['0deg', '-10deg']
      : interaction?.action === 'play' ? ['0deg', '8deg'] : ['0deg', '0deg'],
  });
  const reactionLift = reaction.interpolate({
    inputRange: [0, 1],
    outputRange: [0, interaction?.action === 'play' ? -12 : interaction?.action === 'feed' ? -5 : -2],
  });
  const interactionIcon = DOG_STAFF_INTERACTIONS.find(({ id }) => id === interaction?.action)?.icon;
  return (
    <Animated.View
      style={[
        styles.staffDog,
        {
          left: fromX,
          top,
          zIndex: route.top,
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, toX - fromX] }) },
            { translateY: bob },
          ],
        },
      ]}
    >
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${dog.name}，${dog.breed}，點擊照顧或陪牠玩`}
        accessibilityHint="開啟免費的梳毛、餵食和玩耍互動"
        onPress={onPress}
        style={styles.staffDogTapTarget}
      >
        <View style={styles.staffDogShadow} pointerEvents="none" />
        <Animated.View
          pointerEvents="none"
          style={{
            transform: [
              { scaleX: facing },
              { translateY: bob },
              { translateY: reactionLift },
              { rotate: stride.interpolate({ inputRange: [-1, 1], outputRange: ['-2deg', '2deg'] }) },
              { rotate: reactionRotate },
            ],
          }}
        >
          <View
            style={styles.staffDogIllustration}
            accessible={false}
            importantForAccessibility="no-hide-descendants"
          >
            <DogAttendant
              kind={dog.kind as DogAttendantKind}
              outfitId={look.outfitId}
              accessoryId={look.accessoryId}
            />
          </View>
        </Animated.View>
        {interactionIcon ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.interactionFloat,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: reaction,
                transform: [{
                  translateY: reaction.interpolate({ inputRange: [0, 1], outputRange: [7, -13] }),
                }],
              },
            ]}
          >
            <Feather name={interactionIcon} size={12} color={colors.primary} />
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const STAFF_DOG_WIDTH = 42;
const STAFF_DOG_HEIGHT = 50;
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
  staffDog: { position: 'absolute', width: STAFF_DOG_WIDTH, height: STAFF_DOG_HEIGHT, alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' },
  staffDogTapTarget: { width: STAFF_DOG_WIDTH, height: STAFF_DOG_HEIGHT, alignItems: 'center', justifyContent: 'flex-end' },
  staffDogShadow: { position: 'absolute', bottom: 4, left: 8, width: 26, height: 5, borderRadius: 4, backgroundColor: 'rgba(77,58,46,0.28)' },
  staffDogIllustration: { width: 50, height: 45, alignItems: 'center', justifyContent: 'center', transform: [{ scale: 0.72 }] },
  interactionFloat: { position: 'absolute', top: 0, right: 1, width: 22, height: 22, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  interactionBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(62,36,50,0.44)' },
  interactionSheetDock: { maxHeight: '92%', justifyContent: 'flex-end' },
  interactionSheet: { maxHeight: '100%', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, paddingHorizontal: 16, paddingTop: 9, paddingBottom: 12, gap: 12 },
  interactionHandle: { width: 38, height: 4, alignSelf: 'center', borderRadius: 4, marginBottom: 1 },
  interactionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  interactionDogPreview: { width: 48, height: 48, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  interactionHeaderCopy: { flex: 1, minWidth: 0, gap: 3 },
  interactionEyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  interactionTitle: { fontSize: 14, fontWeight: '800' },
  interactionClose: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  interactionHelper: { fontSize: 10, lineHeight: 15, textAlign: 'center' },
  interactionActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  interactionAction: { flex: 1, minWidth: 0, minHeight: 94, borderWidth: 1, borderRadius: 17, paddingHorizontal: 7, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', gap: 4 },
  interactionActionIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  interactionActionTitle: { fontSize: 12, fontWeight: '800' },
  interactionActionDescription: { minHeight: 23, fontSize: 8, lineHeight: 11, textAlign: 'center' },
  interactionFeedback: { minHeight: 18, fontSize: 11, lineHeight: 16, fontWeight: '700', textAlign: 'center' },
});
