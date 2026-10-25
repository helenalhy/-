import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import palette from '@/constants/colors';
import { getShopFacadeVariant, resolveMallObjectArchetype, type MallVisualCategory } from '@/constants/mall-visual-profile';
import { ThemedMallObject } from './ThemedMallObject';
import { MallCustomers } from './MallCustomers';

const c = palette.light;
const useNativeDriver = Platform.OS !== 'web';

export function MallObjectVisual({ id, itemId, color, icon, category, isActive = true }: {
  id: string;
  itemId?: string;
  color: string;
  icon: string;
  category: MallVisualCategory;
  isActive?: boolean;
}) {
  const motion = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;
  const animationSeed = itemId ?? id;

  useEffect(() => {
    if (!isActive) {
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
  }, [animationSeed, isActive, motion, shimmer]);

  const archetype = resolveMallObjectArchetype(id, icon, category);
  let drawing: React.ReactNode;
  if (category === 'shop') {
    drawing = <IllustratedShop id={animationSeed} color={color} icon={icon} />;
  } else if (archetype === 'central-fountain') {
    drawing = <MiniFountain color={color} />;
  } else if (archetype === 'wooden-bench') {
    drawing = <View style={s.object}><View style={[s.benchBack, { backgroundColor: c.candyCaramelDark }]} /><View style={[s.benchSeat, { backgroundColor: color }]} /><View style={s.legs}><View style={[s.leg, { backgroundColor: c.candyInk }]} /><View style={[s.leg, { backgroundColor: c.candyInk }]} /></View></View>;
  } else if (archetype === 'garden-lights') {
    drawing = <View style={s.object}><View style={[s.lampGlow, { backgroundColor: color }]} /><View style={[s.lampStem, { backgroundColor: c.candyCaramelDark }]} /><View style={[s.lampBase, { backgroundColor: c.candyCaramelDark }]} /></View>;
  } else if (archetype === 'colorful-planter') {
    drawing = <View style={s.object}><View style={s.flowers}>{[c.candyRose, c.candyLemon, c.candyLavender].map((flower, i) => <View key={i} style={s.flower}><View style={[s.flowerHead, { backgroundColor: flower, borderColor: c.candyRoseDark }]} /><View style={[s.flowerStem, { backgroundColor: c.candyMintDark }]} /></View>)}</View><View style={[s.planter, { backgroundColor: color }]} /></View>;
  } else if (archetype === 'rest-pavilion') {
    drawing = <View style={s.object}><View style={[s.pavilionRoof, { borderBottomColor: color }]} /><View style={s.pavilionColumns}><View style={[s.column, { backgroundColor: c.candyPeach }]} /><View style={[s.column, { backgroundColor: c.candyPeach }]} /></View><View style={[s.pavilionBase, { backgroundColor: color }]} /></View>;
  } else if (archetype === 'cloud-walk') {
    drawing = <View style={s.object}><View style={s.walkway}>{[0, 1, 2, 3].map((n) => <View key={n} style={[s.paving, { backgroundColor: n % 2 ? c.candyPeach : c.candyCream }]} />)}</View><View style={[s.pathPlant, { backgroundColor: c.candyMintDark }]} /></View>;
  } else {
    drawing = <ThemedMallObject id={archetype} color={color} icon={icon} />;
  }

  const sparkleScale = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1.15] });
  return (
    <View pointerEvents="none" style={s.illustrationCanvas}>
      <Animated.View style={[s.illustrationMotion, { transform: [{ translateY: motion }] }]}>
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

function IllustratedShop({ id, color, icon }: { id: string; color: string; icon: string }) {
  const variant = getShopFacadeVariant(id);
  const stripeCount = variant === 2 ? 6 : 5;

  return (
    <View style={[s.shop, variant === 1 && s.shopArched, variant === 2 && s.shopWide, variant === 3 && s.shopBoutique]}>
      <View style={[s.shopSign, { backgroundColor: color, borderColor: c.candyCaramelDark }, variant === 2 && s.shopSignWide]}>
        <Feather name={icon as keyof typeof Feather.glyphMap} size={variant === 3 ? 8 : 9} color={c.card} />
        <View style={s.shopSignGlint} />
      </View>
      <View style={[s.awning, { backgroundColor: color }, variant === 2 && s.awningWide]}>
        {Array.from({ length: stripeCount }, (_, index) => (
          <View key={index} style={[s.stripe, { backgroundColor: index % 2 ? color : c.card }]} />
        ))}
      </View>
      <View style={s.scallopRow}>
        {Array.from({ length: stripeCount }, (_, index) => (
          <View key={index} style={[s.scallop, { backgroundColor: index % 2 ? c.card : color }]} />
        ))}
      </View>
      <View style={[s.shopFront, { backgroundColor: c.candyCream, borderColor: color }]}>
        <View style={[s.window, variant === 1 && s.windowArched]}>
          <View style={s.windowHighlight} />
          <Feather name={icon as keyof typeof Feather.glyphMap} size={variant === 2 ? 11 : 13} color={c.candyCaramelDark} />
          <View style={s.displayShelf}>
            {[c.candyPink, c.candyLemon, c.candyMint].map((shade, index) => (
              <View key={index} style={[s.displayDot, { backgroundColor: shade }]} />
            ))}
          </View>
        </View>
        <View style={[s.door, { backgroundColor: color, borderColor: c.candyCaramelDark }]}>
          <View style={s.doorPane} />
          <View style={s.doorHandle} />
        </View>
      </View>
      <View style={[s.shopBase, { backgroundColor: c.candyCaramelDark }]} />
    </View>
  );
}

function MiniFountain({ color }: { color: string }) {
  const rise = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(rise, { toValue: -4, duration: 900, useNativeDriver }),
      Animated.timing(rise, { toValue: 0, duration: 900, useNativeDriver }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [rise]);
  return <View style={s.object}><Animated.View style={{ transform: [{ translateY: rise }] }}><Feather name="droplet" size={24} color={c.candySkyDark} /></Animated.View><View style={[s.fountainBowl, { backgroundColor: color, borderColor: c.candySkyDark }]} /><View style={[s.fountainFoot, { backgroundColor: c.candyLavender }]} /></View>;
}

export function MallAmbience({ floor = 1 }: { floor?: number }) {
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
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[s.sparkle, { left: '24%', top: '8%', opacity: shimmer }]}><Feather name="star" size={11} color={c.card} /></Animated.View>
      <Animated.View style={[s.sparkle, { right: '20%', top: '11%', opacity: shimmer }]}><Feather name="star" size={8} color={c.card} /></Animated.View>
      <Animated.View style={[s.waterGlint, { opacity: shimmer }]}><Feather name="droplet" size={14} color={c.candySkyDark} /></Animated.View>
      <MallCustomers floor={floor} />
    </View>
  );
}

const s = StyleSheet.create({
  illustrationCanvas: { width: 62, height: 47, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  illustrationMotion: { width: 62, height: 47, alignItems: 'center', justifyContent: 'center' },
  objectSparkle: { position: 'absolute', right: 6, top: 4 },
  shop: { width: 62, height: 47, alignItems: 'center', justifyContent: 'flex-end' },
  shopArched: { transform: [{ scaleX: 0.96 }] },
  shopWide: { transform: [{ scaleX: 0.98 }] },
  shopBoutique: { transform: [{ scale: 0.94 }] },
  shopSign: { height: 8, minWidth: 34, paddingHorizontal: 5, marginBottom: 1, borderWidth: 1, borderRadius: 5, alignItems: 'center', justifyContent: 'center', zIndex: 2, overflow: 'hidden' },
  shopSignWide: { minWidth: 47, height: 9 },
  shopSignGlint: { position: 'absolute', width: 4, height: 4, borderRadius: 2, right: 3, top: 1, backgroundColor: c.candyLemon },
  awning: { width: 59, height: 7, flexDirection: 'row', overflow: 'hidden', borderTopLeftRadius: 4, borderTopRightRadius: 4, borderWidth: 1, borderBottomWidth: 0, borderColor: c.candyCaramelDark },
  awningWide: { height: 8, width: 62 },
  stripe: { flex: 1, height: 8 },
  scallopRow: { height: 4, width: 57, marginTop: -1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  scallop: { flex: 1, height: 4, marginHorizontal: 0.4, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderWidth: 0.5, borderTopWidth: 0, borderColor: c.candyCaramelDark },
  shopFront: { width: 58, flex: 1, borderWidth: 2, flexDirection: 'row', padding: 2, gap: 3, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  window: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 3, borderWidth: 1, borderColor: c.card, overflow: 'hidden' },
  windowArched: { borderTopLeftRadius: 9, borderTopRightRadius: 9 },
  windowHighlight: { position: 'absolute', width: 18, height: 3, top: 2, left: 2, borderRadius: 2, backgroundColor: c.card, opacity: 0.62 },
  displayShelf: { position: 'absolute', bottom: 2, left: 2, right: 2, height: 4, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', borderTopWidth: 0.5, borderColor: c.candyCaramelDark },
  displayDot: { width: 3, height: 3, borderRadius: 2 },
  door: { width: 12, borderWidth: 1, borderTopLeftRadius: 5, borderTopRightRadius: 5, overflow: 'hidden' },
  doorPane: { position: 'absolute', top: 3, left: 2, right: 2, height: 7, borderRadius: 2, backgroundColor: c.candySky, opacity: 0.72 },
  doorHandle: { position: 'absolute', width: 2, height: 2, borderRadius: 1, right: 2, bottom: 6, backgroundColor: c.candyLemon },
  shopBase: { width: 61, height: 3, borderRadius: 2 },
  object: { width: 62, height: 47, alignItems: 'center', justifyContent: 'flex-end' },
  benchBack: { height: 13, width: 49, borderRadius: 3 },
  benchSeat: { height: 7, width: 55, borderRadius: 2 },
  legs: { width: 43, justifyContent: 'space-between', flexDirection: 'row' },
  leg: { width: 4, height: 10 },
  lampGlow: { width: 23, height: 18, borderRadius: 9 },
  lampStem: { width: 4, height: 24 },
  lampBase: { width: 20, height: 4, borderRadius: 2 },
  flowers: { flexDirection: 'row', gap: 3, alignItems: 'flex-end' },
  flower: { alignItems: 'center' },
  flowerHead: { width: 13, height: 13, borderRadius: 7, borderWidth: 1 },
  flowerStem: { width: 3, height: 13 },
  planter: { width: 53, height: 14, borderBottomLeftRadius: 9, borderBottomRightRadius: 9 },
  pavilionRoof: { width: 0, height: 0, borderLeftWidth: 30, borderRightWidth: 30, borderBottomWidth: 18, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  pavilionColumns: { flexDirection: 'row', justifyContent: 'space-between', width: 42 },
  column: { width: 5, height: 23 },
  pavilionBase: { width: 58, height: 6, borderRadius: 2 },
  walkway: { flexDirection: 'row', flexWrap: 'wrap', width: 52, transform: [{ rotate: '-12deg' }] },
  paving: { width: 25, height: 15, margin: 0.5, borderRadius: 2 },
  pathPlant: { width: 12, height: 20, borderRadius: 7, position: 'absolute', right: 0, top: 8 },
  fountainBowl: { width: 48, height: 13, borderWidth: 2, borderRadius: 24 },
  fountainFoot: { width: 55, height: 7, borderRadius: 20 },
  sparkle: { position: 'absolute' },
  waterGlint: { position: 'absolute', left: '48%', top: '82%' },
  visitor: { position: 'absolute', alignItems: 'center' },
  head: { width: 5, height: 5, borderRadius: 3 },
  body: { width: 7, height: 12, borderRadius: 3 },
});
