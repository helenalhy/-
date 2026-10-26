import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import palette from '@/constants/colors';
import { getShopFacadeVariant, resolveMallObjectArchetype, type MallObjectArchetype, type MallVisualCategory } from '@/constants/mall-visual-profile';
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
  'sewing-machine': require('../assets/images/mall-sewing-machine.png'),
  'electronics-bench': require('../assets/images/mall-electronics-bench.png'),
  'jewelry-case': require('../assets/images/mall-jewelry-case.png'),
};

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
  const artwork = category === 'shop'
    ? SHOP_FACADE_ARTWORK[getShopFacadeVariant(animationSeed)]
    : OBJECT_ARTWORK[archetype];
  const drawing = artwork
    ? <Image source={artwork} resizeMode="contain" fadeDuration={0} style={s.sceneSprite} />
    : <ThemedMallObject id={archetype} color={color} icon={icon} />;

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
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, s.visitorLayer]}>
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
  sceneSprite: { width: '100%', height: '100%' },
  objectSparkle: { position: 'absolute', right: 6, top: 4 },
  visitorLayer: { zIndex: 10, elevation: 10 },
  sparkle: { position: 'absolute' },
  waterGlint: { position: 'absolute', left: '48%', top: '82%' },
});
