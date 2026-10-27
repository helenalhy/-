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

type DogStaffInteractionAction = 'groom' | 'pet' | 'feed' | 'play';
type AreaDogStaff = { dog: DogStaffProfile; look: DogStaffLook; index: number };
type DogStaffInteraction = { dogDecorationId: string; action: DogStaffInteractionAction; id: number };
const DOG_STAFF_INTERACTION_DURATION_MS = 5000;
type DogCareColorToken =
  | 'candyPink' | 'candyLavender' | 'candyOrange' | 'candySky' | 'candyMint'
  | 'candyCaramel'
  | 'candyLemon' | 'candyCoral' | 'candyRose' | 'candyLavenderDark' | 'candyPeach'
  | 'candyCaramelDark' | 'candyCream' | 'candyMintDark' | 'candySkyDark';

const DOG_STAFF_INTERACTIONS: {
  id: DogStaffInteractionAction;
  title: string;
  description: string;
}[] = [
  { id: 'groom', title: '梳毛', description: '輕輕梳順蓬鬆毛毛' },
  { id: 'pet', title: '摸摸牠', description: '溫柔摸摸頭，享受親密時光' },
  { id: 'feed', title: '餵食', description: '送上店裡準備的小點心' },
  { id: 'play', title: '一起玩', description: '陪狗狗開心玩一會' },
];

const DOG_CARE_COLOR_TOKENS: Record<string, DogCareColorToken> = {
  'fluffy-staff-huahua': 'candyPink',
  'fluffy-staff-milkshake': 'candyLavender',
  'fluffy-staff-pudding': 'candyOrange',
  'fluffy-staff-xiaoniu': 'candySky',
  'fluffy-staff-tangtang': 'candyMint',
  'fluffy-staff-pipi': 'candyLemon',
  'fluffy-staff-amber': 'candyCaramel',
  'fluffy-staff-cloud': 'candyRose',
  'fluffy-staff-wonton': 'candyLavenderDark',
  'fluffy-staff-butter': 'candyPeach',
  'fluffy-staff-sesame': 'candyCaramelDark',
  'fluffy-staff-snowball': 'candyCream',
  'fluffy-staff-maomao': 'candyMintDark',
  'fluffy-staff-poppy': 'candySkyDark',
};

function getDogCareColor(dogKey: string, colors: ReturnType<typeof useColors>) {
  const token = DOG_CARE_COLOR_TOKENS[dogKey];
  return token ? colors[token] : colors.primary;
}

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
                  <View style={[styles.interactionDogPreview, { backgroundColor: colors.secondary }]}>
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
                  兌換後附送 · 每次互動約 5 秒，不耗金幣
                </Text>
                <View style={styles.interactionActions}>
                  {DOG_STAFF_INTERACTIONS.map((action) => (
                    <Pressable
                      key={action.id}
                      testID={`dog-staff-interaction-${selectedDog.dog.key}-${action.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={action.id === 'pet'
                        ? `免費摸摸${selectedDog.dog.name}，不耗金幣`
                        : `免費為${selectedDog.dog.name}${action.title}，不耗金幣`}
                      onPress={() => {
                        interactionSequence.current += 1;
                        setDogInteraction({
                          dogDecorationId: selectedDog.dog.decorationId,
                          action: action.id,
                          id: interactionSequence.current,
                        });
                        const response = action.id === 'groom'
                          ? `${selectedDog.dog.name}舒服地享受梳毛，毛毛變得蓬鬆亮澤。`
                          : action.id === 'pet'
                            ? `${selectedDog.dog.name}舒服地瞇起眼睛，享受你的摸摸。`
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
                      <View style={[styles.interactionActionIcon, { backgroundColor: colors.secondary, borderColor: getDogCareColor(selectedDog.dog.key, colors) }]}>
                        <DogCareIllustration
                          action={action.id}
                          color={getDogCareColor(selectedDog.dog.key, colors)}
                          size={38}
                        />
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
    const cycleDuration = interaction.action === 'feed' ? 1000 : 500;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(reaction, {
        toValue: 1,
        duration: cycleDuration / 2,
        easing: Easing.out(Easing.quad),
        useNativeDriver: native,
      }),
      Animated.timing(reaction, {
        toValue: 0,
        duration: cycleDuration / 2,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: native,
      }),
    ]), { iterations: DOG_STAFF_INTERACTION_DURATION_MS / cycleDuration });
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
    inputRange: [0, 0.5, 1],
    outputRange: interaction?.action === 'groom'
      ? ['0deg', '-8deg', '6deg']
      : interaction?.action === 'play'
        ? ['0deg', '-6deg', '8deg']
        : interaction?.action === 'pet' ? ['0deg', '7deg', '-4deg']
        : ['0deg', '-3deg', '3deg'],
  });
  const reactionLift = reaction.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: interaction?.action === 'play'
      ? [0, -13, 0]
      : interaction?.action === 'feed' ? [0, -5, 0]
        : interaction?.action === 'pet' ? [0, -6, 0] : [0, -2, 0],
  });
  const interactionFloatX = reaction.interpolate({
    inputRange: [0, 1],
    outputRange: interaction?.action === 'groom'
      ? [-7, 7]
      : interaction?.action === 'pet' ? [3, -3] : [0, 0],
  });
  const interactionFloatY = reaction.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: interaction?.action === 'play'
      ? [6, -16, 6]
      : interaction?.action === 'feed' ? [6, -7, 6]
        : interaction?.action === 'pet' ? [8, -5, 8] : [3, -3, 3],
  });
  const interactionOpacity = reaction.interpolate({ inputRange: [0, 0.12, 0.85, 1], outputRange: [0, 1, 1, 0] });
  const interactionAction = interaction?.action;
  const interactionColor = getDogCareColor(dog.key, colors);
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
        accessibilityHint="開啟免費的梳毛、摸摸牠、餵食和玩耍互動"
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
              happy={interaction?.action === 'groom' || interaction?.action === 'pet'}
            />
          </View>
        </Animated.View>
        {interactionAction ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.interactionFloat,
              {
                backgroundColor: colors.card,
                borderColor: interactionColor,
                opacity: interactionOpacity,
                transform: [{ translateX: interactionFloatX }, { translateY: interactionFloatY }],
              },
            ]}
          >
            <DogCareIllustration action={interactionAction} color={interactionColor} size={24} />
          </Animated.View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

function DogCareIllustration({
  action,
  color,
  size,
}: {
  action: DogStaffInteractionAction;
  color: string;
  size: number;
}) {
  const colors = useColors();
  if (action === 'groom') {
    return (
      <View
        testID="dog-care-icon-comb"
        accessible={false}
        style={[styles.careIllustration, { width: size, height: size }]}
      >
        <View style={[styles.combHead, { top: size * 0.14, left: size * 0.05, width: size * 0.78, height: size * 0.2, backgroundColor: color }]}>
          <View style={[styles.combShine, { backgroundColor: colors.card }]} />
        </View>
        {Array.from({ length: 5 }, (_, index) => (
          <View key={index} style={[styles.combTooth, { left: size * (0.14 + index * 0.12), top: size * 0.33, height: size * 0.2, backgroundColor: color }]} />
        ))}
        <View style={[styles.combHandle, { left: size * 0.48, top: size * 0.48, width: size * 0.17, height: size * 0.4, backgroundColor: color }]} />
      </View>
    );
  }
  if (action === 'feed') {
    return (
      <View
        testID="dog-care-icon-food"
        accessible={false}
        style={[styles.careIllustration, { width: size, height: size }]}
      >
        <View style={[styles.foodBowl, { left: size * 0.12, top: size * 0.42, width: size * 0.76, height: size * 0.42, borderBottomLeftRadius: size * 0.32, borderBottomRightRadius: size * 0.32, backgroundColor: color }]} />
        <View style={[styles.foodBowlRim, { left: size * 0.08, top: size * 0.38, width: size * 0.84, height: size * 0.12, borderRadius: size * 0.12, backgroundColor: colors.card, borderColor: color }]} />
        {[0.32, 0.5, 0.68].map((left, index) => (
          <View key={index} style={[styles.foodPiece, { left: size * left, top: size * (index === 1 ? 0.19 : 0.25), backgroundColor: color }]} />
        ))}
      </View>
    );
  }
  if (action === 'pet') {
    return (
      <View
        testID="dog-care-icon-pet"
        accessible={false}
        style={[styles.careIllustration, { width: size, height: size }]}
      >
        <View style={[styles.petFinger, { left: size * 0.24, top: size * 0.08, width: size * 0.13, height: size * 0.39, backgroundColor: color }]} />
        <View style={[styles.petFinger, { left: size * 0.39, top: size * 0.02, width: size * 0.13, height: size * 0.42, backgroundColor: color }]} />
        <View style={[styles.petFinger, { left: size * 0.54, top: size * 0.08, width: size * 0.13, height: size * 0.39, backgroundColor: color }]} />
        <View style={[styles.petPalm, { left: size * 0.25, top: size * 0.36, width: size * 0.5, height: size * 0.5, backgroundColor: color }]} />
        <View style={[styles.petThumb, { left: size * 0.08, top: size * 0.5, width: size * 0.34, height: size * 0.14, backgroundColor: color }]} />
        <View style={[styles.petShine, { left: size * 0.4, top: size * 0.53, backgroundColor: colors.card }]} />
        <View style={[styles.petMotionMark, { right: size * 0.04, top: size * 0.14, borderColor: color }]} />
      </View>
    );
  }
  return (
    <View
      testID="dog-care-icon-ball"
      accessible={false}
      style={[styles.careIllustration, { width: size, height: size }]}
    >
      <View style={[styles.toyBall, { left: size * 0.12, top: size * 0.12, width: size * 0.76, height: size * 0.76, borderRadius: size * 0.38, backgroundColor: color, borderColor: colors.card }]}>
        <View style={[styles.ballStripe, { backgroundColor: colors.card }]} />
        <View style={[styles.ballPatch, { backgroundColor: colors.card }]} />
      </View>
      <View style={[styles.ballSpark, { top: size * 0.04, right: size * 0.02, backgroundColor: color }]} />
    </View>
  );
}

const STAFF_DOG_WIDTH = 50;
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
  interactionActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8 },
  interactionAction: { width: '47%', flexGrow: 0, minWidth: 0, minHeight: 94, borderWidth: 1, borderRadius: 17, paddingHorizontal: 7, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', gap: 4 },
  interactionActionIcon: { width: 48, height: 48, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  interactionActionTitle: { fontSize: 12, fontWeight: '800' },
  interactionActionDescription: { minHeight: 23, fontSize: 8, lineHeight: 11, textAlign: 'center' },
  interactionFeedback: { minHeight: 18, fontSize: 11, lineHeight: 16, fontWeight: '700', textAlign: 'center' },
  careIllustration: { position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  combHead: { position: 'absolute', borderRadius: 4, justifyContent: 'center' },
  combShine: { position: 'absolute', top: 1, left: 3, width: '42%', height: 1.5, borderRadius: 2, opacity: 0.9 },
  combTooth: { position: 'absolute', width: 2.5, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  combHandle: { position: 'absolute', borderRadius: 4, transform: [{ rotate: '-34deg' }] },
  foodBowl: { position: 'absolute' },
  foodBowlRim: { position: 'absolute', borderWidth: 1.5 },
  foodPiece: { position: 'absolute', width: 3.5, height: 3.5, borderRadius: 2 },
  toyBall: { position: 'absolute', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 1.5 },
  ballStripe: { position: 'absolute', width: '130%', height: 4, borderRadius: 4, transform: [{ rotate: '-38deg' }] },
  ballPatch: { position: 'absolute', top: '18%', left: '18%', width: '25%', height: '25%', borderRadius: 20 },
  ballSpark: { position: 'absolute', width: 4, height: 4, borderRadius: 3 },
  petFinger: { position: 'absolute', borderRadius: 8 },
  petPalm: { position: 'absolute', borderRadius: 9 },
  petThumb: { position: 'absolute', borderRadius: 8, transform: [{ rotate: '-38deg' }] },
  petShine: { position: 'absolute', width: 3, height: 6, borderRadius: 3 },
  petMotionMark: { position: 'absolute', width: 4, height: 8, borderRightWidth: 1.5, borderTopWidth: 1, borderTopRightRadius: 5, transform: [{ rotate: '20deg' }] },
});
