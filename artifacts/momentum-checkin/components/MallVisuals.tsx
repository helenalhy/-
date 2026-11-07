import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, View, type ImageSourcePropType, type ViewStyle } from 'react-native';
import palette from '@/constants/colors';
import { getShopFacadeVariant, resolveMallObjectArchetype, type MallObjectArchetype, type MallVisualCategory } from '@/constants/mall-visual-profile';
import { getMallFloorArtProfile } from '@/constants/mall-floor-art';
import { useReducedMotion } from '@/context/ReducedMotionContext';
import { ThemedMallObject } from './ThemedMallObject';
import { MallCustomers } from './MallCustomers';

const c = palette.light;
const useNativeDriver = Platform.OS !== 'web';

const SHOP_FACADE_ARTWORK: readonly ImageSourcePropType[] = [
  require('../assets/images/mall-shop-classic.png'),
  require('../assets/images/mall-shop-arched.png'),
  require('../assets/images/mall-shop-wide.png'),
  require('../assets/images/mall-shop-corner.png'),
];

const STOREFRONT_ROOF_GEOMETRIES: ViewStyle[] = [
  { left: '15%', width: '70%', top: '20%', height: 5, borderTopLeftRadius: 9, borderTopRightRadius: 9 },
  { left: '20%', width: '60%', top: '22%', height: 4, borderRadius: 2 },
  { left: '12%', width: '76%', top: '24%', height: 5, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  { left: '18%', width: '64%', top: '18%', height: 6, borderTopLeftRadius: 8, borderTopRightRadius: 3 },
  { left: '23%', width: '54%', top: '25%', height: 4, borderRadius: 8 },
  { left: '10%', width: '80%', top: '21%', height: 5, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
];

const STOREFRONT_WINDOW_ARRANGEMENTS: ViewStyle[] = [
  { left: '18%', right: '18%', top: '56%' },
  { left: '22%', right: '16%', top: '53%' },
  { left: '16%', right: '22%', top: '59%' },
  { left: '20%', right: '20%', top: '51%' },
  { left: '14%', right: '18%', top: '57%' },
  { left: '21%', right: '14%', top: '61%' },
  { left: '17%', right: '21%', top: '54%' },
  { left: '24%', right: '17%', top: '58%' },
  { left: '15%', right: '24%', top: '52%' },
  { left: '19%', right: '15%', top: '60%' },
];

const OBJECT_ARTWORK: Partial<Record<MallObjectArchetype, ImageSourcePropType>> = {
  'cloud-walk': require('../assets/images/mall-cloud-walk.png'),
  'central-fountain': require('../assets/images/mall-central-fountain.png'),
  'wooden-bench': require('../assets/images/mall-wooden-bench.png'),
  'garden-lights': require('../assets/images/mall-garden-lights.png'),
  'colorful-planter': require('../assets/images/mall-colorful-planter.png'),
  'rest-pavilion': require('../assets/images/mall-rest-pavilion.png'),
  'coral-aquarium': require('../assets/images/mall-coral-aquarium.png'),
  'rhythm-stage': require('../assets/images/mall-rhythm-stage.png'),
  'yoga-deck': require('../assets/images/mall-yoga-deck.png'),
  'sculpture-plaza': require('../assets/images/mall-sculpture-plaza.png'),
  'observatory-dome': require('../assets/images/mall-observatory-dome.png'),
  'tasting-court': require('../assets/images/mall-tasting-court.png'),
  'cloud-swing': require('../assets/images/mall-cloud-swing.png'),
  'shell-lantern': require('../assets/images/mall-shell-lantern.png'),
  'neon-sign': require('../assets/images/mall-neon-sign.png'),
  'aroma-diffuser': require('../assets/images/mall-aroma-diffuser.png'),
  'gallery-frames': require('../assets/images/mall-gallery-frames.png'),
  'starlight-mobile': require('../assets/images/mall-starlight-mobile.png'),
  'spice-display': require('../assets/images/mall-spice-display.png'),
  'rainbow-arch': require('../assets/images/mall-rainbow-arch.png'),
  'clothing-rack': require('../assets/images/mall-clothing-rack.png'),
  'clothing-wardrobe': require('../assets/images/mall-clothing-wardrobe.png'),
  'blouse-display': require('../assets/images/mall-blouse-display.png'),
  'skirt-display': require('../assets/images/mall-skirt-display.png'),
  'dress-display': require('../assets/images/mall-dress-display.png'),
  'kimono-display': require('../assets/images/mall-kimono-display.png'),
  'coffee-machine': require('../assets/images/mall-coffee-machine.png'),
  'ice-cream-machine': require('../assets/images/mall-ice-cream-machine.png'),
  'cotton-candy-machine': require('../assets/images/mall-cotton-candy-machine.png'),
  'candy-display': require('../assets/images/mall-candy-display.png'),
  'bakery-oven': require('../assets/images/mall-bakery-oven.png'),
  'tea-brewer': require('../assets/images/mall-tea-brewer.png'),
  'food-prep': require('../assets/images/mall-food-prep.png'),
  'flower-station': require('../assets/images/mall-flower-station.png'),
  'book-carousel': require('../assets/images/mall-book-carousel.png'),
  'capsule-machine': require('../assets/images/mall-capsule-machine.png'),
  'craft-station': require('../assets/images/mall-craft-station.png'),
  'art-workbench': require('../assets/images/mall-craft-station.png'),
  'sewing-machine': require('../assets/images/mall-sewing-machine.png'),
  'electronics-bench': require('../assets/images/mall-electronics-bench.png'),
  'jewelry-case': require('../assets/images/mall-jewelry-case.png'),
};

export function MallObjectVisual({ id, itemId, itemName, floor = 1, color, icon, category, isActive = true, presentation = 'standard', dogOutfitId, dogAccessoryId }: {
  id: string;
  itemId?: string;
  itemName?: string;
  floor?: number;
  color: string;
  icon: string;
  category: MallVisualCategory;
  isActive?: boolean;
  presentation?: 'standard' | 'mall-storefront';
  dogOutfitId?: string;
  dogAccessoryId?: string;
}) {
  const motion = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const animationSeed = itemId ?? id;
  const reducedMotion = useReducedMotion() !== false;

  useEffect(() => {
    if (!isActive || reducedMotion) {
      motion.setValue(0);
      shimmer.setValue(0);
      return;
    }

    const phaseDelay = getShopFacadeVariant(animationSeed) * 360;
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.delay(phaseDelay),
      Animated.timing(motion, { toValue: -1.5, duration: 1400, useNativeDriver }),
      Animated.timing(motion, { toValue: 0, duration: 1400, useNativeDriver }),
      Animated.delay(260),
    ]));
    const sparkleLoop = Animated.loop(Animated.sequence([
      Animated.delay(phaseDelay + 180),
      Animated.timing(shimmer, { toValue: 1, duration: 520, useNativeDriver }),
      Animated.timing(shimmer, { toValue: 0.15, duration: 850, useNativeDriver }),
      Animated.delay(1700),
    ]));
    floatLoop.start();
    sparkleLoop.start();
    return () => {
      floatLoop.stop();
      sparkleLoop.stop();
    };
  }, [animationSeed, isActive, motion, reducedMotion, shimmer]);

  const archetype = resolveMallObjectArchetype(id, icon, category);
  const artwork = category === 'shop' ? undefined : OBJECT_ARTWORK[archetype];
  const floorArt = getMallFloorArtProfile(floor, animationSeed);
  const drawing = artwork
    ? <Image source={artwork} resizeMode="contain" fadeDuration={0} style={s.sceneSprite} />
    : category === 'shop'
      ? <MallStorefrontArt itemId={animationSeed} itemName={itemName ?? '特色小店'} itemIcon={icon} floor={floor} itemColor={color} />
      : <ThemedMallObject id={archetype} color={color} icon={icon} dogOutfitId={dogOutfitId} dogAccessoryId={dogAccessoryId} />;
  const canvasPresentation = presentation === 'mall-storefront'
    ? s.mallStorefrontCanvas
    : undefined;
  const motionPresentation = presentation === 'mall-storefront'
    ? s.mallStorefrontMotion
    : undefined;

  const sparkleScale = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.15] });
  return (
    <View pointerEvents="none" style={[s.illustrationCanvas, canvasPresentation]}>
      <Animated.View style={[s.illustrationMotion, motionPresentation, { transform: [{ translateY: motion }] }]}>
        {drawing}
      </Animated.View>
      {isActive && (
        <Animated.View style={[s.objectSparkle, { opacity: shimmer, transform: [{ scale: sparkleScale }] }]}>
          <Feather name="star" size={8} color={c.candyLemon} />
        </Animated.View>
      )}
    </View>
  );
}

function MallStorefrontArt({ itemId, itemName, itemIcon, floor, itemColor }: {
  itemId: string;
  itemName: string;
  itemIcon: string;
  floor: number;
  itemColor: string;
}) {
  const art = getMallFloorArtProfile(floor, itemId);
  const signShape = [
    { borderRadius: 3, borderTopLeftRadius: 7 },
    { borderRadius: 8 },
    { borderRadius: 2 },
    { borderRadius: 5, borderBottomRightRadius: 9 },
    { borderRadius: 9, borderTopRightRadius: 2 },
    { borderRadius: 4, borderBottomLeftRadius: 1 },
    { borderRadius: 6, borderTopLeftRadius: 1 },
    { borderRadius: 2, borderTopRightRadius: 8 },
    { borderRadius: 10, borderBottomRightRadius: 2 },
  ][art.signStyle];
  const roofGeometry = STOREFRONT_ROOF_GEOMETRIES[art.roofStyle];
  const windowArrangement = STOREFRONT_WINDOW_ARRANGEMENTS[art.windowStyle];
  const facade = SHOP_FACADE_ARTWORK[art.variant % SHOP_FACADE_ARTWORK.length];
  const canopyStripes = 3 + (art.canopyStyle % 5);
  const windowDisplayCount = 1 + (art.displayStyle % 3);
  const railRadius = [2, 4, 8, 12, 1, 6, 10, 3, 14, 5, 9, 7][art.trimStyle];

  return (
    <View testID={`mall-storefront-art-${floor}-${itemId}`} style={s.storefrontArt}>
      <View style={[s.storefrontThemeGlow, { backgroundColor: art.shopSoft }]} />
      <Image
        testID={`mall-storefront-base-art-${floor}-${itemId}`}
        source={facade}
        resizeMode="contain"
        fadeDuration={0}
        style={s.storefrontArtworkImage}
      />
      <View pointerEvents="none" style={s.storefrontDetails}>
        <View style={[s.storefrontRoofAccent, roofGeometry, { backgroundColor: art.shopAccent, borderColor: art.secondary }]}>
          {Array.from({ length: canopyStripes }, (_, index) => (
            <View
              key={`canopy-${index}`}
              style={[
                s.storefrontCanopyStripe,
                {
                  backgroundColor: (index + art.canopyStyle) % 2 === 0 ? art.shopSoft : art.secondary,
                  width: `${Math.max(8, 100 / canopyStripes - 2)}%`,
                },
              ]}
            />
          ))}
        </View>
        <View style={[s.storefrontFloorEmblem, { backgroundColor: art.accent, borderColor: art.secondary }]}>
          <Feather name={art.emblem as keyof typeof Feather.glyphMap} size={6} color={palette.light.card} />
        </View>
        <View style={[s.storefrontSign, signShape, { backgroundColor: art.shopSoft, borderColor: art.shopAccent }]}>
          <Feather name={itemIcon as keyof typeof Feather.glyphMap} size={5} color={art.shopAccent} />
          <Text numberOfLines={1} style={[s.storefrontSignText, { color: art.shopAccent }]}>{itemName}</Text>
        </View>
        <View style={[s.storefrontDisplayTag, s.storefrontDisplayTagLeft, { left: windowArrangement.left, top: windowArrangement.top, backgroundColor: art.shopSoft, borderColor: art.shopAccent }]}>
          <Feather name={art.ornament as keyof typeof Feather.glyphMap} size={5} color={art.shopAccent} />
          <View style={[s.storefrontDisplayDot, { backgroundColor: itemColor }]} />
        </View>
        <View style={[s.storefrontDisplayTag, s.storefrontDisplayTagRight, { right: windowArrangement.right, top: windowArrangement.top, backgroundColor: art.shopSoft, borderColor: art.shopAccent }]}>
          <Feather name={art.secondaryOrnament as keyof typeof Feather.glyphMap} size={5} color={art.accent} />
          <View style={[s.storefrontDisplayDot, { backgroundColor: art.secondary }]} />
        </View>
        <View style={[s.storefrontDisplayRow, { bottom: `${12 + (art.displayStyle % 4)}%` }]}>
          {Array.from({ length: windowDisplayCount }, (_, index) => (
            <View
              key={`display-${index}`}
              style={[
                s.storefrontDisplayProduct,
                {
                  backgroundColor: index % 2 ? art.shopSoft : itemColor,
                  borderColor: art.shopAccent,
                  height: 4 + ((art.displayStyle + index) % 4),
                },
              ]}
            >
              <Feather
                name={(index + art.displayStyle) % 2 ? art.ornament as keyof typeof Feather.glyphMap : itemIcon as keyof typeof Feather.glyphMap}
                size={4}
                color={art.shopAccent}
              />
            </View>
          ))}
        </View>
        <View style={[s.storefrontFloorRail, { backgroundColor: art.accent, borderRadius: railRadius, borderColor: art.secondary }]}>
          <Feather name={art.emblem as keyof typeof Feather.glyphMap} size={5} color={palette.light.card} />
          <Text style={s.storefrontMark}>{floor}F · {String(art.displayMark).padStart(3, '0')}</Text>
          <View style={[s.storefrontRailGem, { backgroundColor: art.secondary }]} />
        </View>
      </View>
    </View>
  );
}

export function MallAmbience({ floor = 1, totalCheckIns = 0 }: { floor?: number; totalCheckIns?: number }) {
  const shimmer = useRef(new Animated.Value(0.25)).current;
  useEffect(() => {
    const twinkle = Animated.loop(Animated.sequence([
      Animated.timing(shimmer, { toValue: 0.95, duration: 1600, useNativeDriver: false }),
      Animated.timing(shimmer, { toValue: 0.25, duration: 1600, useNativeDriver: false }),
    ]));
    twinkle.start();
    return () => { twinkle.stop(); };
  }, [shimmer]);
  return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.visitorLayer]}>
      <Animated.View style={[s.sparkle, { left: '24%', top: '8%', opacity: shimmer }]}><Feather name="star" size={11} color={c.card} /></Animated.View>
      <Animated.View style={[s.sparkle, { right: '20%', top: '11%', opacity: shimmer }]}><Feather name="star" size={8} color={c.card} /></Animated.View>
      <Animated.View style={[s.waterGlint, { opacity: shimmer }]}><Feather name="droplet" size={14} color={c.candySkyDark} /></Animated.View>
      {floor === 1 && totalCheckIns >= 25 ? (
        <>
          <Animated.View style={[s.sparkle, { left: '13%', top: '19%', opacity: shimmer }]}><Feather name="star" size={9} color={c.candyLemon} /></Animated.View>
          <Animated.View style={[s.sparkle, { right: '12%', top: '28%', opacity: shimmer }]}><Feather name="star" size={7} color={c.candyPeach} /></Animated.View>
        </>
      ) : null}
      {floor === 15 && totalCheckIns >= 75 ? (
        <>
          <Animated.View style={[s.petal, { left: '17%', top: '17%', opacity: shimmer }]} />
          <Animated.View style={[s.petal, { right: '18%', top: '24%', opacity: shimmer, transform: [{ rotate: '38deg' }] }]} />
          <Animated.View style={[s.petal, { right: '32%', top: '12%', opacity: shimmer, transform: [{ rotate: '-28deg' }] }]} />
        </>
      ) : null}
      {floor === 20 && totalCheckIns >= 150 ? (
        <Animated.View style={[s.rainbowSparkles, { opacity: shimmer }]}>
          {[c.candyRoseDark, c.candyPeach, c.candyLemon, c.candyMintDark, c.candySkyDark].map((color, index) => (
            <View key={color} style={[s.rainbowDot, { backgroundColor: color, transform: [{ translateY: index % 2 ? 0 : -3 }] }]} />
          ))}
        </Animated.View>
      ) : null}
      <MallCustomers floor={floor} />
    </View>
  );
}

const s = StyleSheet.create({
  illustrationCanvas: { width: 62, height: 47, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  illustrationMotion: { width: 62, height: 47, alignItems: 'center', justifyContent: 'center' },
  mallStorefrontCanvas: { width: 84, height: 63 },
  mallStorefrontMotion: { width: 84, height: 63 },
  sceneSprite: { width: '100%', height: '100%' },
  storefrontArt: { width: 82, height: 62, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  storefrontThemeGlow: { position: 'absolute', top: 5, width: 72, height: 50, borderRadius: 28, opacity: 0.28 },
  storefrontArtworkImage: { position: 'absolute', width: '100%', height: '100%' },
  storefrontDetails: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  storefrontRoofAccent: { position: 'absolute', borderWidth: 0.6, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center', overflow: 'hidden', zIndex: 2 },
  storefrontCanopyStripe: { height: '55%', borderRadius: 3, opacity: 0.9 },
  storefrontFloorEmblem: { position: 'absolute', top: '5%', alignSelf: 'center', width: 10, height: 10, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  storefrontSign: { position: 'absolute', top: '31%', left: '31%', width: '38%', height: 8, borderWidth: 0.8, paddingHorizontal: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1, overflow: 'hidden', zIndex: 3 },
  storefrontSignText: { maxWidth: 22, fontSize: 3.8, lineHeight: 5, fontWeight: '900' },
  storefrontDisplayTag: { position: 'absolute', top: '56%', width: 9, height: 9, borderWidth: 0.7, borderRadius: 4, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  storefrontDisplayTagLeft: { transform: [{ rotate: '-8deg' }] },
  storefrontDisplayTagRight: { transform: [{ rotate: '8deg' }] },
  storefrontDisplayDot: { position: 'absolute', bottom: 0, right: 0, width: 3, height: 3, borderRadius: 2 },
  storefrontDisplayRow: { position: 'absolute', left: '42%', right: '42%', height: 9, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 1, zIndex: 2 },
  storefrontDisplayProduct: { minWidth: 4, borderWidth: 0.5, borderTopLeftRadius: 3, borderTopRightRadius: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  storefrontFloorRail: { position: 'absolute', bottom: '7%', alignSelf: 'center', minHeight: 8, borderWidth: 0.6, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, zIndex: 3 },
  storefrontMark: { color: palette.light.card, fontSize: 4, fontWeight: '900' },
  storefrontRailGem: { width: 3, height: 3, borderRadius: 2, transform: [{ rotate: '45deg' }] },
  objectSparkle: { position: 'absolute', right: 6, top: 4 },
  visitorLayer: { zIndex: 10, elevation: 10 },
  sparkle: { position: 'absolute' },
  waterGlint: { position: 'absolute', left: '48%', top: '82%' },
  petal: { position: 'absolute', width: 7, height: 10, borderRadius: 6, backgroundColor: c.candyPink },
  rainbowSparkles: { position: 'absolute', right: '15%', top: '16%', flexDirection: 'row', gap: 3 },
  rainbowDot: { width: 5, height: 5, borderRadius: 3 },
});
