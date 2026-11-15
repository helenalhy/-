import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import type { ShopDisplayProduct, ShopProductIllustration } from '@/constants/mall-shop-display';
import { CharacterMerchandiseVisual } from '@/components/CharacterMerchandiseVisual';
import { useColors } from '@/hooks/useColors';
import { useReducedMotion } from '@/context/ReducedMotionContext';

type MerchandiseMotionProfile = {
  lift: number;
  tilt: number;
  scale: number;
  sparkle: number;
};

type ProductArtShape =
  | 'cloud' | 'box' | 'mug' | 'card' | 'charm' | 'stone' | 'bathSalt' | 'bathPouch' | 'bathSoap' | 'yukata' | 'woodenComb' | 'woodenBath' | 'cake' | 'stack'
  | 'cookie' | 'pudding' | 'cone' | 'popsicle' | 'lollipop' | 'bread' | 'triangle'
  | 'bento' | 'pot' | 'plush' | 'blocks' | 'capsule' | 'puzzle' | 'train'
  | 'ball' | 'vase' | 'basket' | 'wand' | 'hat' | 'carton' | 'bag'
  | 'headphones' | 'camera' | 'speaker' | 'console' | 'cable' | 'projector'
  | 'brush' | 'sachet' | 'mask' | 'pencil' | 'bucket' | 'swimwear' | 'teaCup'
  | 'compact' | 'lipstick' | 'palette' | 'mascara' | 'nailPolish';
type ProductArtConfig = {
  shape: ProductArtShape;
  icon: keyof typeof Feather.glyphMap;
};

const PRODUCT_SPECIFIC_ART: Partial<Record<ShopProductIllustration, ProductArtConfig>> = {
  bathSalt: { shape: 'bathSalt', icon: 'sun' },
  bathPouch: { shape: 'bathPouch', icon: 'wind' },
  bathSoap: { shape: 'bathSoap', icon: 'heart' },
  yukata: { shape: 'yukata', icon: 'feather' },
  woodenComb: { shape: 'woodenComb', icon: 'grid' },
  woodenBath: { shape: 'woodenBath', icon: 'droplet' },
  cloud: { shape: 'cloud', icon: 'cloud' },
  box: { shape: 'box', icon: 'package' },
  mug: { shape: 'mug', icon: 'coffee' },
  sticker: { shape: 'card', icon: 'image' },
  charm: { shape: 'charm', icon: 'star' },
  diffuserStone: { shape: 'stone', icon: 'droplet' },
  cake: { shape: 'cake', icon: 'sun' },
  pancake: { shape: 'stack', icon: 'circle' },
  cookie: { shape: 'cookie', icon: 'sun' },
  pudding: { shape: 'pudding', icon: 'sun' },
  candy: { shape: 'ball', icon: 'heart' },
  icecream: { shape: 'cone', icon: 'sun' },
  popsicle: { shape: 'popsicle', icon: 'droplet' },
  lollipop: { shape: 'lollipop', icon: 'circle' },
  bread: { shape: 'bread', icon: 'sun' },
  pizza: { shape: 'triangle', icon: 'pie-chart' },
  riceball: { shape: 'triangle', icon: 'star' },
  bento: { shape: 'bento', icon: 'grid' },
  plant: { shape: 'pot', icon: 'feather' },
  plush: { shape: 'plush', icon: 'heart' },
  blocks: { shape: 'blocks', icon: 'grid' },
  capsule: { shape: 'capsule', icon: 'circle' },
  puzzle: { shape: 'puzzle', icon: 'grid' },
  musicbox: { shape: 'box', icon: 'music' },
  train: { shape: 'train', icon: 'truck' },
  yarn: { shape: 'ball', icon: 'circle' },
  pottery: { shape: 'vase', icon: 'coffee' },
  basket: { shape: 'basket', icon: 'package' },
  wand: { shape: 'wand', icon: 'star' },
  hat: { shape: 'hat', icon: 'sun' },
  carton: { shape: 'carton', icon: 'droplet' },
  snack: { shape: 'bag', icon: 'gift' },
  headphones: { shape: 'headphones', icon: 'headphones' },
  camera: { shape: 'camera', icon: 'camera' },
  speaker: { shape: 'speaker', icon: 'music' },
  gameConsole: { shape: 'console', icon: 'cpu' },
  cable: { shape: 'cable', icon: 'zap' },
  projector: { shape: 'projector', icon: 'monitor' },
  brush: { shape: 'brush', icon: 'edit-2' },
  sachet: { shape: 'sachet', icon: 'sun' },
  mask: { shape: 'mask', icon: 'moon' },
  postcard: { shape: 'card', icon: 'image' },
  pencil: { shape: 'pencil', icon: 'edit-3' },
  bucket: { shape: 'bucket', icon: 'package' },
  swimwear: { shape: 'swimwear', icon: 'droplet' },
  teaCup: { shape: 'teaCup', icon: 'coffee' },
  compact: { shape: 'compact', icon: 'sun' },
  lipstick: { shape: 'lipstick', icon: 'heart' },
  palette: { shape: 'palette', icon: 'grid' },
  mascara: { shape: 'mascara', icon: 'eye' },
  nailPolish: { shape: 'nailPolish', icon: 'droplet' },
};

const SPECIAL_PRODUCT_SHAPES: Record<ProductArtShape, ViewStyle> = {
  bathSalt: { width: 23, height: 26, borderRadius: 5, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  bathPouch: { width: 22, height: 24, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  bathSoap: { width: 25, height: 16, borderRadius: 6 },
  yukata: { width: 21, height: 28, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  woodenComb: { width: 29, height: 9, borderRadius: 3 },
  woodenBath: { width: 27, height: 18, borderBottomLeftRadius: 7, borderBottomRightRadius: 7 },
  cloud: { width: 30, height: 23, borderRadius: 16 },
  box: { width: 27, height: 23, borderRadius: 5 },
  mug: { width: 23, height: 22, borderRadius: 5, borderTopLeftRadius: 3 },
  card: { width: 29, height: 22, borderRadius: 4, transform: [{ rotate: '-8deg' }] },
  charm: { width: 23, height: 23, borderRadius: 12 },
  stone: { width: 29, height: 19, borderRadius: 12, transform: [{ rotate: '-7deg' }] },
  cake: { width: 25, height: 24, borderRadius: 6, borderTopLeftRadius: 13, borderTopRightRadius: 13 },
  stack: { width: 28, height: 22, borderRadius: 12 },
  cookie: { width: 25, height: 25, borderRadius: 13 },
  pudding: { width: 24, height: 23, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  cone: { width: 23, height: 26, borderTopLeftRadius: 13, borderTopRightRadius: 13, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  popsicle: { width: 17, height: 25, borderRadius: 8 },
  lollipop: { width: 22, height: 22, borderRadius: 12 },
  bread: { width: 29, height: 20, borderRadius: 12, borderBottomLeftRadius: 7, borderBottomRightRadius: 7 },
  triangle: { width: 24, height: 23, borderRadius: 4, transform: [{ rotate: '45deg' }] },
  bento: { width: 30, height: 22, borderRadius: 4 },
  pot: { width: 22, height: 16, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  plush: { width: 22, height: 22, borderRadius: 12 },
  blocks: { width: 23, height: 23, borderRadius: 4, transform: [{ rotate: '-5deg' }] },
  capsule: { width: 22, height: 27, borderRadius: 12 },
  puzzle: { width: 26, height: 23, borderRadius: 5 },
  train: { width: 29, height: 17, borderRadius: 5 },
  ball: { width: 23, height: 23, borderRadius: 12 },
  vase: { width: 20, height: 25, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  basket: { width: 29, height: 18, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  wand: { width: 6, height: 30, borderRadius: 4, transform: [{ rotate: '25deg' }] },
  hat: { width: 29, height: 13, borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  carton: { width: 20, height: 27, borderRadius: 4, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  bag: { width: 24, height: 25, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 7, borderBottomRightRadius: 7 },
  headphones: { width: 26, height: 25, borderTopLeftRadius: 13, borderTopRightRadius: 13 },
  camera: { width: 29, height: 20, borderRadius: 5 },
  speaker: { width: 21, height: 27, borderRadius: 6 },
  console: { width: 29, height: 20, borderRadius: 5 },
  cable: { width: 25, height: 25, borderRadius: 13 },
  projector: { width: 29, height: 18, borderRadius: 5 },
  brush: { width: 8, height: 28, borderRadius: 3, transform: [{ rotate: '-18deg' }] },
  sachet: { width: 25, height: 22, borderRadius: 8, borderTopLeftRadius: 11, borderTopRightRadius: 11 },
  mask: { width: 29, height: 19, borderRadius: 8 },
  pencil: { width: 7, height: 29, borderRadius: 3, transform: [{ rotate: '24deg' }] },
  bucket: { width: 23, height: 20, borderBottomLeftRadius: 7, borderBottomRightRadius: 7 },
  swimwear: { width: 23, height: 26, borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  teaCup: { width: 27, height: 17, borderRadius: 5, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  compact: { width: 25, height: 19, borderRadius: 9 },
  lipstick: { width: 14, height: 27, borderRadius: 4, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  palette: { width: 30, height: 22, borderRadius: 5 },
  mascara: { width: 17, height: 27, borderRadius: 6 },
  nailPolish: { width: 21, height: 22, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
};

const MERCHANDISE_MOTION_PROFILES: Partial<Record<ShopProductIllustration, MerchandiseMotionProfile>> = {
  bathSalt: { lift: 0.7, tilt: 2, scale: 1.035, sparkle: 0.68 },
  bathPouch: { lift: 1.2, tilt: 4, scale: 1.045, sparkle: 0.72 },
  bathSoap: { lift: 0.5, tilt: 3, scale: 1.04, sparkle: 0.68 },
  yukata: { lift: 0.8, tilt: 3, scale: 1.025, sparkle: 0.58 },
  woodenComb: { lift: 0.4, tilt: 2, scale: 1.025, sparkle: 0.52 },
  woodenBath: { lift: 0.3, tilt: 1, scale: 1.02, sparkle: 0.48 },
  bottle: { lift: 1.2, tilt: 3, scale: 1.04, sparkle: 0.78 },
  garment: { lift: 0.8, tilt: 4, scale: 1.025, sparkle: 0.58 },
  cloak: { lift: 1.1, tilt: 6, scale: 1.04, sparkle: 0.72 },
  wig: { lift: 0.9, tilt: 7, scale: 1.03, sparkle: 0.7 },
  ring: { lift: 0.5, tilt: 10, scale: 1.14, sparkle: 1 },
  treat: { lift: 1.7, tilt: 2, scale: 1.055, sparkle: 0.82 },
  croissant: { lift: 2.3, tilt: 4, scale: 1.075, sparkle: 0.96 },
  drink: { lift: 1.4, tilt: 3, scale: 1.06, sparkle: 0.86 },
  produce: { lift: 1.2, tilt: 6, scale: 1.05, sparkle: 0.76 },
  device: { lift: 0.3, tilt: 0, scale: 1.09, sparkle: 0.92 },
  book: { lift: 0.6, tilt: 3, scale: 1.035, sparkle: 0.62 },
  flower: { lift: 1, tilt: 8, scale: 1.045, sparkle: 0.82 },
  gift: { lift: 1.4, tilt: 3, scale: 1.065, sparkle: 0.88 },
  jewel: { lift: 0.5, tilt: 9, scale: 1.13, sparkle: 1 },
  handbag: { lift: 1.1, tilt: 7, scale: 1.07, sparkle: 0.9 },
  earring: { lift: 0.7, tilt: 11, scale: 1.12, sparkle: 1 },
  watch: { lift: 0.4, tilt: 6, scale: 1.08, sparkle: 0.95 },
  scarf: { lift: 1.5, tilt: 8, scale: 1.06, sparkle: 0.8 },
  hairclip: { lift: 0.8, tilt: 10, scale: 1.1, sparkle: 0.95 },
  shoe: { lift: 0.6, tilt: 8, scale: 1.06, sparkle: 0.78 },
  wallet: { lift: 0.6, tilt: 4, scale: 1.05, sparkle: 0.82 },
  necklace: { lift: 0.8, tilt: 8, scale: 1.1, sparkle: 1 },
  towel: { lift: 0.7, tilt: 4, scale: 1.04, sparkle: 0.7 },
  fan: { lift: 1.1, tilt: 9, scale: 1.08, sparkle: 0.92 },
  compact: { lift: 0.7, tilt: 5, scale: 1.09, sparkle: 0.95 },
  lipstick: { lift: 0.9, tilt: 8, scale: 1.08, sparkle: 0.92 },
  palette: { lift: 0.8, tilt: 4, scale: 1.06, sparkle: 0.84 },
  mascara: { lift: 0.6, tilt: 7, scale: 1.07, sparkle: 0.88 },
  nailPolish: { lift: 1, tilt: 6, scale: 1.08, sparkle: 0.94 },
};
const DEFAULT_MOTION_PROFILE: MerchandiseMotionProfile = {
  lift: 1,
  tilt: 5,
  scale: 1.05,
  sparkle: 0.82,
};

export function ShopMerchandiseVisual({
  product,
  motion,
  size = 42,
  index = 0,
}: {
  product: ShopDisplayProduct;
  motion: Animated.Value;
  size?: number;
  index?: number;
}) {
  const colors = useColors();
  const reducedMotion = useReducedMotion() !== false;
  const accents = [
    colors.candyRose,
    colors.candyPeach,
    colors.candyCoral,
    colors.candyMint,
    colors.candyLavender,
    colors.candySky,
    colors.candyLemon,
  ];
  const accent = accents[(product.variant + index) % accents.length];
  const garmentStyle = product.variant % 11;
  const isDress = garmentStyle === 1 || garmentStyle === 4 || garmentStyle === 9;
  const isSkirt = garmentStyle === 2 || garmentStyle === 5 || garmentStyle === 10;
  const productArtwork = PRODUCT_SPECIFIC_ART[product.illustration];
  const animation = MERCHANDISE_MOTION_PROFILES[product.illustration] ?? DEFAULT_MOTION_PROFILE;
  const direction = (product.variant + index) % 2 === 0 ? 1 : -1;
  const lift = reducedMotion ? 0 : motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(animation.lift + (index % 3) * 0.15)],
  });
  const tilt = reducedMotion ? '0deg' : motion.interpolate({
    inputRange: [0, 1],
    outputRange: [`${-animation.tilt * direction}deg`, `${animation.tilt * direction}deg`],
  });
  const pulse = reducedMotion ? 1 : motion.interpolate({ inputRange: [0, 1], outputRange: [1, animation.scale] });
  const shimmer = reducedMotion ? 0.2 : motion.interpolate({ inputRange: [0, 1], outputRange: [0.18, animation.sparkle] });
  const steamLift = reducedMotion ? 0 : motion.interpolate({ inputRange: [0, 1], outputRange: [2, -3] });

  if (product.theme === 'chiikawa' || product.theme === 'winnie') {
    return <CharacterMerchandiseVisual product={product} motion={motion} size={size} index={index} />;
  }

  return (
    <Animated.View
      testID={`shop-merchandise-visual-${product.id}`}
      accessible={false}
      importantForAccessibility="no"
      style={[styles.canvas, { width: size, height: size, transform: [{ translateY: lift }, { rotate: tilt }, { scale: pulse }] }]}
    >
      <View pointerEvents="none" style={[styles.softHalo, { backgroundColor: product.color }]} />
      <View pointerEvents="none" style={[styles.drawing, { transform: [{ scale: size / 42 }] }]}>
        {product.illustration === 'bottle' && (
          <>
            <View style={[styles.bottleCap, { backgroundColor: colors.candyCaramelDark }]} />
            <View style={[styles.bottleNeck, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
            <View style={[
              styles.bottle,
              garmentStyle === 1 ? styles.bottleRound
                : garmentStyle === 2 ? styles.bottleSquare
                  : garmentStyle === 3 ? styles.bottleTall
                    : garmentStyle === 4 ? styles.bottleWide
                      : garmentStyle === 5 ? styles.bottleSlim : null,
              { backgroundColor: product.color, borderColor: colors.candyCaramelDark },
            ]}>
              <View style={[styles.bottleLabel, { backgroundColor: colors.candyCream }]}>
                <Feather name={product.icon as keyof typeof Feather.glyphMap} size={8} color={colors.candyRoseDark} />
                <View style={[styles.bottleLabelLine, { backgroundColor: colors.candyCaramel }]} />
              </View>
              <View style={[styles.bottleShine, { backgroundColor: colors.card }]} />
              <View style={[styles.bottleGem, { backgroundColor: accent, borderColor: colors.candyCream }]} />
            </View>
          </>
        )}
        {product.illustration === 'ring' && (
          <>
            <View style={[styles.ringBand, { borderColor: product.color }]} />
            <View style={[styles.ringStone, { backgroundColor: accent, borderColor: colors.candyCream }]} />
            <View style={[styles.ringShine, { backgroundColor: colors.card }]} />
          </>
        )}
        {product.illustration === 'wig' && (
          <>
            <View style={[styles.wigSideLock, styles.wigSideLockLeft, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.wigSideLock, styles.wigSideLockRight, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.wigBase, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
              <View style={[styles.wigFringe, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
              <View style={[styles.wigShine, { backgroundColor: colors.card }]} />
            </View>
          </>
        )}
        {product.illustration === 'cloak' && (
          <>
            <View style={[styles.cloakBody, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
              <View style={[styles.cloakPanel, { backgroundColor: accent }]} />
              <View style={[styles.cloakCloud, { backgroundColor: colors.candyCoral }]}>
                <Feather name="cloud" size={7} color={colors.candyCream} />
              </View>
            </View>
            <View style={[styles.cloakCollar, { borderColor: colors.candyCaramelDark, backgroundColor: colors.candyCream }]} />
          </>
        )}
        {product.illustration === 'garment' && (
          <>
            <View style={[styles.hanger, { borderColor: colors.candyCaramelDark }]} />
            <View style={[
              styles.garment,
              isDress ? styles.garmentDress : isSkirt ? styles.garmentSkirt : null,
              garmentStyle === 6 || garmentStyle === 8 ? styles.garmentJacket : null,
              { backgroundColor: product.color, borderColor: colors.candyCaramelDark },
            ]}>
              {isDress ? (
                <>
                  <View style={[styles.garmentSleeve, styles.garmentSleeveLeft, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
                  <View style={[styles.garmentSleeve, styles.garmentSleeveRight, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
                  <View style={[styles.garmentBodice, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
                  <View style={[styles.garmentWaist, { backgroundColor: accent }]} />
                  <View style={[styles.garmentHem, { borderTopColor: colors.candyCream }]} />
                  {garmentStyle === 4 && <View style={[styles.dressBow, { backgroundColor: accent }]} />}
                  {garmentStyle === 1 && <View style={[styles.dressGem, { backgroundColor: colors.candyLemon, borderColor: colors.candyCream }]} />}
                  {garmentStyle === 9 && <View style={[styles.dressLace, { borderColor: colors.candyCream }]} />}
                </>
              ) : isSkirt ? (
                <>
                  <View style={[styles.skirtWaist, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
                  <View style={[styles.skirtPleat, styles.skirtPleatLeft, { borderColor: colors.candyCream }]} />
                  <View style={[styles.skirtPleat, styles.skirtPleatRight, { borderColor: colors.candyCream }]} />
                  <View style={[styles.garmentHem, { borderTopColor: colors.candyCream }]} />
                  {garmentStyle === 5 && <View style={[styles.skirtRibbon, { backgroundColor: accent }]} />}
                  {garmentStyle === 10 && <View style={[styles.skirtGem, { backgroundColor: colors.candyLemon }]} />}
                </>
              ) : (
                <>
                  <View style={[styles.garmentCollar, garmentStyle === 3 ? styles.garmentWideCollar : null, { borderColor: colors.candyCaramelDark }]} />
                  {garmentStyle === 7 ? (
                    <View style={[styles.garmentBow, { backgroundColor: accent }]} />
                  ) : (
                    <>
                      <View style={[styles.garmentButton, { backgroundColor: accent }]} />
                      {garmentStyle === 6 && <View style={[styles.garmentButton, styles.garmentSecondButton, { backgroundColor: accent }]} />}
                    </>
                  )}
                  {garmentStyle !== 7 && <View style={[styles.garmentPocket, { borderColor: colors.candyCream }]} />}
                  {(garmentStyle === 3 || garmentStyle === 8) && <View style={[styles.garmentStripe, { backgroundColor: colors.candyCream }]} />}
                  {garmentStyle === 6 && <View style={[styles.garmentBadge, { backgroundColor: colors.candyLemon }]} />}
                </>
              )}
            </View>
          </>
        )}
        {product.illustration === 'handbag' && (
          <>
            {garmentStyle === 3 ? (
              <View style={[styles.handbagCrossbody, { borderColor: colors.candyCaramelDark }]} />
            ) : (
              <View style={[styles.handbagHandle, garmentStyle === 7 ? styles.handbagDoubleHandle : null, { borderColor: colors.candyCaramelDark }]} />
            )}
            <View style={[
              styles.handbagBody,
              garmentStyle === 1 ? styles.handbagRound : garmentStyle === 2 ? styles.handbagSatchel : garmentStyle === 6 ? styles.handbagMini : garmentStyle === 9 ? styles.handbagWide : null,
              { backgroundColor: product.color, borderColor: colors.candyCaramelDark },
            ]}>
              <View style={[styles.handbagFlap, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
              <View style={[styles.handbagClasp, { backgroundColor: colors.candyLemon, borderColor: colors.candyCream }]} />
              {(garmentStyle === 4 || garmentStyle === 10) && <View style={[styles.handbagRibbon, { backgroundColor: colors.candyRose }]} />}
              {garmentStyle === 5 && <Feather name="star" size={8} color={colors.candyCream} />}
              {garmentStyle === 8 && <Feather name="heart" size={8} color={colors.candyCream} />}
            </View>
            <View style={[styles.handbagSide, { backgroundColor: accent }]} />
          </>
        )}
        {product.illustration === 'earring' && (
          <>
            <View style={[styles.earringLoop, styles.earringLeft, { borderColor: product.color }]} />
            <View style={[styles.earringLoop, styles.earringRight, { borderColor: accent }]} />
            <View style={[styles.earringGem, styles.earringGemLeft, { backgroundColor: accent, borderColor: colors.candyCream }]} />
            <View style={[styles.earringGem, styles.earringGemRight, { backgroundColor: product.color, borderColor: colors.candyCream }]} />
            {garmentStyle % 2 === 0 && <View style={[styles.earringDrop, { backgroundColor: colors.candyLemon, borderColor: colors.candyCream }]} />}
          </>
        )}
        {product.illustration === 'watch' && (
          <>
            <View style={[styles.watchStrap, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.watchFace, { backgroundColor: colors.candyCream, borderColor: product.color }]}>
              <View style={[styles.watchHand, { backgroundColor: colors.candyCaramelDark, transform: [{ rotate: `${(product.variant % 12) * 30}deg` }] }]} />
              <View style={[styles.watchDot, { backgroundColor: colors.candyRoseDark }]} />
            </View>
            {garmentStyle % 2 === 0 && <View style={[styles.watchGem, { backgroundColor: colors.candyLemon }]} />}
          </>
        )}
        {product.illustration === 'scarf' && (
          <>
            <View style={[styles.scarfLoop, { borderColor: colors.candyCaramelDark, backgroundColor: product.color }]} />
            <View style={[styles.scarfTail, styles.scarfTailLeft, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.scarfTail, styles.scarfTailRight, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.scarfStripe, { backgroundColor: colors.candyCream }]} />
            {garmentStyle % 2 === 1 && <Feather name="star" size={7} color={colors.candyLemon} />}
          </>
        )}
        {product.illustration === 'hairclip' && (
          <>
            <View style={[styles.hairclipBar, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.hairclipBowLeft, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.hairclipBowRight, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.hairclipCenter, { backgroundColor: colors.candyLemon, borderColor: colors.candyCream }]} />
            {garmentStyle % 2 === 1 && <View style={[styles.hairclipGem, { backgroundColor: colors.candySky }]} />}
          </>
        )}
        {product.illustration === 'shoe' && (
          <>
            <View style={[styles.shoeSole, { backgroundColor: colors.candyCream, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.shoeBody, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.shoeToe, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.shoeHeel, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            {garmentStyle % 2 === 0 && <Feather name="heart" size={7} color={colors.candyRoseDark} />}
          </>
        )}
        {product.illustration === 'wallet' && (
          <>
            <View style={[styles.walletBody, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.walletFlap, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.walletButton, { backgroundColor: colors.candyLemon, borderColor: colors.candyCream }]} />
            <View style={[styles.walletSeam, { borderColor: colors.candyCream }]} />
            {garmentStyle % 2 === 1 && <Feather name={product.icon as keyof typeof Feather.glyphMap} size={7} color={colors.candyRoseDark} />}
          </>
        )}
        {product.illustration === 'necklace' && (
          <>
            <View style={[styles.necklaceChain, { borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.necklacePendant, { backgroundColor: product.color, borderColor: colors.candyCream }]} />
            {garmentStyle % 2 === 0 && <View style={[styles.necklaceGem, { backgroundColor: colors.candyLemon, borderColor: colors.candyCream }]} />}
          </>
        )}
        {product.illustration === 'towel' && (
          <>
            <View style={[styles.towelBack, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.towelFold, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
              <View style={[styles.towelStripe, { backgroundColor: colors.candyCream }]} />
              {garmentStyle % 2 === 0 && <Feather name="heart" size={7} color={colors.candyRoseDark} />}
            </View>
          </>
        )}
        {product.illustration === 'fan' && (
          <>
            <View style={[styles.fanFold, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
            {[0, 1, 2, 3].map((fold) => (
              <View key={fold} style={[styles.fanRib, { backgroundColor: colors.candyCream, transform: [{ rotate: `${(fold - 1.5) * 18}deg` }] }]} />
            ))}
            <View style={[styles.fanHandle, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            <Feather name={product.icon as keyof typeof Feather.glyphMap} size={7} color={colors.candyRoseDark} />
          </>
        )}
        {product.illustration === 'treat' && (
          <>
            <View style={[styles.treatTop, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]}>
              <Feather name={product.icon as keyof typeof Feather.glyphMap} size={9} color={colors.candyRoseDark} />
              <View style={[styles.sugarPearl, styles.sugarPearlLeft, { backgroundColor: colors.candyCream }]} />
              <View style={[styles.sugarPearl, styles.sugarPearlRight, { backgroundColor: colors.candyLemon }]} />
            </View>
            <View style={[styles.treatBase, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
              <View style={[styles.treatStripe, { backgroundColor: colors.candyCream }]} />
            </View>
            <View style={[styles.treatPlate, { backgroundColor: colors.candyCream, borderColor: colors.candyCaramel }]} />
          </>
        )}
        {product.illustration === 'croissant' && (
          <>
            <Animated.View
              pointerEvents="none"
              style={[styles.croissantSteam, styles.croissantSteamLeft, { opacity: reducedMotion ? 0 : shimmer, transform: [{ translateY: steamLift }] }]}
            >
              <Feather name="wind" size={9} color={colors.candyCaramel} />
            </Animated.View>
            <Animated.View
              pointerEvents="none"
              style={[styles.croissantSteam, styles.croissantSteamRight, { opacity: reducedMotion ? 0 : shimmer, transform: [{ translateY: steamLift }] }]}
            >
              <Feather name="wind" size={8} color={colors.candyPeach} />
            </Animated.View>
            <View style={[styles.croissantPlate, { backgroundColor: colors.candyCream, borderColor: colors.candyCaramel }]} />
            <View style={[styles.croissantBody, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
              <View style={[styles.croissantRoll, styles.croissantRollLeft, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
              <View style={[styles.croissantRoll, styles.croissantRollCenter, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
              <View style={[styles.croissantRoll, styles.croissantRollRight, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
              <View style={[styles.croissantSeam, styles.croissantSeamLeft, { backgroundColor: colors.candyCream }]} />
              <View style={[styles.croissantSeam, styles.croissantSeamRight, { backgroundColor: colors.candyCream }]} />
              <Feather name="star" size={6} color={colors.candyLemon} />
            </View>
          </>
        )}
        {product.illustration === 'drink' && (
          <>
            <View style={[styles.drinkLid, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.drinkCup, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
              <View style={[styles.drinkFoam, { backgroundColor: colors.candyCream }]}>
                <Feather name={product.icon as keyof typeof Feather.glyphMap} size={8} color={colors.candyRoseDark} />
              </View>
              <View style={[styles.drinkPearl, { backgroundColor: colors.candyCaramelDark }]} />
              <View style={[styles.drinkPearl, styles.drinkPearlSecond, { backgroundColor: colors.candyCaramelDark }]} />
            </View>
            <View style={[styles.drinkStraw, { backgroundColor: colors.candyRoseDark }]} />
          </>
        )}
        {product.illustration === 'produce' && (
          <>
            <View style={styles.produceFruitRow}>
              {[product.color, accent, colors.candyLemon].map((fruit, fruitIndex) => (
                <View key={fruitIndex} style={[styles.produceFruit, { backgroundColor: fruit, borderColor: colors.card }]}>
                  {fruitIndex === 1 && <Feather name="star" size={6} color={colors.candyCream} />}
                </View>
              ))}
            </View>
            <View style={[styles.produceBasket, { backgroundColor: colors.candyCaramel, borderColor: colors.candyCaramelDark }]}>
              <View style={[styles.basketBand, { backgroundColor: colors.candyPeach }]} />
            </View>
          </>
        )}
        {product.illustration === 'device' && (
          <View style={[styles.device, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
            <View style={[styles.deviceScreen, { backgroundColor: colors.candyCream, borderColor: accent }]}>
              <Feather name={product.icon as keyof typeof Feather.glyphMap} size={10} color={colors.candyRoseDark} />
            </View>
            <View style={[styles.deviceButton, { backgroundColor: accent }]} />
            <View style={[styles.deviceShine, { backgroundColor: colors.card }]} />
          </View>
        )}
        {product.illustration === 'book' && (
          <>
            <View style={[styles.bookBack, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.bookCover, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
              <Feather name={product.icon as keyof typeof Feather.glyphMap} size={10} color={colors.candyRoseDark} />
              <View style={[styles.bookTitleLine, { backgroundColor: colors.candyCream }]} />
            </View>
            <View style={[styles.bookPages, { backgroundColor: colors.candyCream }]} />
          </>
        )}
        {product.illustration === 'flower' && (
          <>
            <View style={[styles.flowerVase, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
              <View style={[styles.vaseWater, { backgroundColor: colors.candySky }]} />
            </View>
            <View style={[styles.flowerStem, { backgroundColor: colors.candyMintDark }]} />
            {[0, 1, 2, 3].map((petal) => (
              <View
                key={petal}
                style={[
                  styles.flowerPetal,
                  { backgroundColor: accent },
                  petal === 0 ? styles.petalTop : null,
                  petal === 1 ? styles.petalRight : null,
                  petal === 2 ? styles.petalBottom : null,
                  petal === 3 ? styles.petalLeft : null,
                ]}
              />
            ))}
            <View style={[styles.flowerCenter, { backgroundColor: colors.candyLemon }]} />
          </>
        )}
        {product.illustration === 'jewel' && (
          <>
            <View style={[styles.jewelTray, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
              <Feather name={product.icon as keyof typeof Feather.glyphMap} size={12} color={colors.candyRoseDark} />
            </View>
            <View style={[styles.jewelStone, { backgroundColor: accent, borderColor: colors.candyCream }]} />
            <View style={[styles.jewelStone, styles.jewelStoneSecond, { backgroundColor: colors.candyLemon, borderColor: colors.candyCream }]} />
          </>
        )}
        {product.illustration === 'gift' && (
          <>
            <View style={[styles.giftLid, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]}>
              <View style={[styles.giftBow, { borderColor: colors.candyRoseDark }]} />
            </View>
            <View style={[styles.giftBox, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
              <View style={[styles.giftRibbon, { backgroundColor: colors.candyCream }]} />
              <Feather name={product.icon as keyof typeof Feather.glyphMap} size={8} color={colors.candyRoseDark} />
            </View>
          </>
        )}
        {productArtwork && (
          <>
            {productArtwork.shape === 'lollipop' && <View style={[styles.specialLollipopStick, { backgroundColor: colors.candyCaramel }]} />}
            {productArtwork.shape === 'train' && (
              <>
                <View style={[styles.specialTrainWheel, styles.specialTrainWheelLeft, { backgroundColor: colors.candyCaramelDark }]} />
                <View style={[styles.specialTrainWheel, styles.specialTrainWheelRight, { backgroundColor: colors.candyCaramelDark }]} />
              </>
            )}
            {productArtwork.shape === 'hat' && <View style={[styles.specialHatBrim, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />}
            {productArtwork.shape === 'bucket' && <View style={[styles.specialBucketHandle, { borderColor: colors.candyCaramelDark }]} />}
            {productArtwork.shape === 'lipstick' && <View style={[styles.specialCosmeticCap, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />}
            {productArtwork.shape === 'mascara' && <View style={[styles.specialMascaraWand, { backgroundColor: colors.candyRoseDark }]} />}
            {productArtwork.shape === 'nailPolish' && <View style={[styles.specialNailPolishCap, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />}
            {productArtwork.shape === 'bathPouch' && <View style={[styles.bathPouchTie, { backgroundColor: accent }]} />}
            {productArtwork.shape === 'yukata' && (
              <>
                <View style={[styles.yukataSleeve, styles.yukataSleeveLeft, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
                <View style={[styles.yukataSleeve, styles.yukataSleeveRight, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
              </>
            )}
            {productArtwork.shape === 'woodenBath' && <View style={[styles.woodenBathRim, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />}
            <View
              style={[
                styles.specialObject,
                SPECIAL_PRODUCT_SHAPES[productArtwork.shape],
                { backgroundColor: product.color, borderColor: colors.candyCaramelDark },
              ]}
            >
              <Feather
                name={productArtwork.icon}
                size={productArtwork.shape === 'wand' || productArtwork.shape === 'pencil' || productArtwork.shape === 'brush' ? 9 : 14}
                color={colors.candyRoseDark}
              />
              {(productArtwork.shape === 'bento' || productArtwork.shape === 'blocks') && (
                <View style={[styles.specialGridLine, { backgroundColor: colors.candyCream }]} />
              )}
              {productArtwork.shape === 'palette' && (
                <>
                  <View style={[styles.specialPaletteDivider, { backgroundColor: colors.candyCream }]} />
                  <View style={[styles.specialPalettePan, { backgroundColor: accent }]} />
                </>
              )}
              {productArtwork.shape === 'compact' && <View style={[styles.specialCompactShine, { backgroundColor: colors.candyCream }]} />}
              {productArtwork.shape === 'pot' && <View style={[styles.specialLeaf, { backgroundColor: colors.candyMintDark }]} />}
              {productArtwork.shape === 'plush' && <View style={[styles.specialPlushEar, styles.specialPlushEarLeft, { backgroundColor: accent }]} />}
              {productArtwork.shape === 'plush' && <View style={[styles.specialPlushEar, styles.specialPlushEarRight, { backgroundColor: accent }]} />}
            </View>
            {productArtwork.shape === 'sachet' && (
              <>
                <View style={[styles.specialSachetNeck, { borderColor: colors.candyCaramelDark }]} />
                <View style={[styles.specialSachetTie, { backgroundColor: accent }]} />
              </>
            )}
            {productArtwork.shape === 'bathSalt' && (
              <>
                <View style={[styles.bathSaltSeal, { backgroundColor: accent }]} />
                <View style={[styles.bathSaltLabel, { backgroundColor: colors.candyCream }]}>
                  <Feather name="star" size={7} color={colors.candyRoseDark} />
                </View>
                <View style={[styles.bathSaltGrain, styles.bathSaltGrainLeft, { backgroundColor: colors.candyCream }]} />
                <View style={[styles.bathSaltGrain, styles.bathSaltGrainRight, { backgroundColor: colors.candyCream }]} />
              </>
            )}
            {productArtwork.shape === 'bathPouch' && (
              <>
                <View style={[styles.bathPouchCord, styles.bathPouchCordLeft, { borderColor: colors.candyCaramelDark }]} />
                <View style={[styles.bathPouchCord, styles.bathPouchCordRight, { borderColor: colors.candyCaramelDark }]} />
                <View style={[styles.bathPouchEmblem, { backgroundColor: colors.candyCream }]} />
              </>
            )}
            {productArtwork.shape === 'bathSoap' && (
              <>
                <View style={[styles.bathSoapShine, { backgroundColor: colors.candyCream }]} />
                <View style={[styles.bathSoapBubble, styles.bathSoapBubbleLeft, { borderColor: colors.candySky }]} />
                <View style={[styles.bathSoapBubble, styles.bathSoapBubbleRight, { borderColor: colors.candySky }]} />
              </>
            )}
            {productArtwork.shape === 'yukata' && (
              <>
                <View style={[styles.yukataObi, { backgroundColor: accent }]} />
                <View style={[styles.yukataCollarLeft, { backgroundColor: colors.candyCream }]} />
                <View style={[styles.yukataCollarRight, { backgroundColor: colors.candyCream }]} />
                <Feather name="sun" size={5} color={colors.candyRoseDark} style={styles.yukataFlower} />
              </>
            )}
            {productArtwork.shape === 'woodenComb' && (
              <>
                {[0, 1, 2, 3, 4, 5, 6].map((tooth) => (
                  <View
                    key={tooth}
                    style={[
                      styles.woodenCombTooth,
                      { left: 8 + tooth * 3, backgroundColor: product.color, borderColor: colors.candyCaramelDark },
                    ]}
                  />
                ))}
                <View style={[styles.woodenCombGrain, { backgroundColor: colors.candyCream }]} />
              </>
            )}
            {productArtwork.shape === 'woodenBath' && (
              <>
                <View style={[styles.woodenBathBand, styles.woodenBathBandTop, { backgroundColor: colors.candyCaramelDark }]} />
                <View style={[styles.woodenBathBand, styles.woodenBathBandBottom, { backgroundColor: colors.candyCaramelDark }]} />
                <View style={[styles.woodenBathWater, { backgroundColor: colors.candySky }]} />
              </>
            )}
          </>
        )}
        <View style={[styles.groundShadow, { backgroundColor: colors.candyCaramel }]} />
      </View>
      <Animated.View pointerEvents="none" style={[styles.sparkle, { opacity: shimmer, transform: [{ translateY: lift }] }]}>
        <Feather name={product.illustration === 'croissant' ? 'sun' : product.illustration === 'drink' ? 'droplet' : 'star'} size={7} color={colors.candyLemon} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  canvas: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  softHalo: { position: 'absolute', width: 33, height: 33, borderRadius: 20, opacity: 0.2 },
  drawing: { width: 42, height: 42, alignItems: 'center', justifyContent: 'flex-end', overflow: 'visible' },
  groundShadow: { position: 'absolute', bottom: 1, width: 27, height: 4, borderRadius: 6, opacity: 0.48 },
  bottleCap: { position: 'absolute', top: 4, width: 10, height: 4, borderRadius: 2 },
  bottleNeck: { position: 'absolute', top: 7, width: 10, height: 6, borderWidth: 1, borderBottomWidth: 0 },
  bottle: { position: 'absolute', bottom: 5, width: 22, height: 27, borderWidth: 1.2, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  bottleRound: { width: 25, height: 23, borderRadius: 12 },
  bottleSquare: { width: 23, height: 24, borderRadius: 3 },
  bottleTall: { width: 19, height: 30, borderRadius: 5 },
  bottleWide: { width: 27, height: 21, borderRadius: 7 },
  bottleSlim: { width: 18, height: 26, borderRadius: 5 },
  bottleLabel: { width: 15, height: 13, borderRadius: 4, alignItems: 'center', justifyContent: 'center', gap: 1 },
  bottleLabelLine: { width: 8, height: 1, borderRadius: 1, opacity: 0.8 },
  bottleShine: { position: 'absolute', left: 3, top: 5, width: 2, height: 13, borderRadius: 2, opacity: 0.8 },
  bottleGem: { position: 'absolute', right: -2, top: 5, width: 5, height: 5, borderWidth: 0.6, borderRadius: 3 },
  ringBand: { position: 'absolute', bottom: 9, width: 20, height: 20, borderWidth: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ringStone: { position: 'absolute', top: 7, width: 8, height: 8, borderWidth: 1, borderRadius: 3, transform: [{ rotate: '45deg' }] },
  ringShine: { position: 'absolute', top: 9, left: 19, width: 2, height: 6, borderRadius: 2, opacity: 0.9 },
  wigBase: { position: 'absolute', bottom: 8, width: 26, height: 22, borderWidth: 1.2, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  wigFringe: { position: 'absolute', top: 9, left: 3, width: 18, height: 8, borderBottomWidth: 1, borderBottomLeftRadius: 10, borderBottomRightRadius: 6, transform: [{ rotate: '-8deg' }] },
  wigShine: { position: 'absolute', top: 4, left: 5, width: 3, height: 8, borderRadius: 3, opacity: 0.75 },
  wigSideLock: { position: 'absolute', bottom: 8, width: 7, height: 19, borderWidth: 1, borderRadius: 5 },
  wigSideLockLeft: { left: 5, transform: [{ rotate: '8deg' }] },
  wigSideLockRight: { right: 5, transform: [{ rotate: '-8deg' }] },
  cloakBody: { position: 'absolute', bottom: 5, width: 27, height: 29, borderWidth: 1.2, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 13, borderBottomRightRadius: 13, alignItems: 'center', justifyContent: 'center' },
  cloakPanel: { position: 'absolute', top: 6, bottom: 4, width: 2, borderRadius: 2, opacity: 0.9 },
  cloakCloud: { position: 'absolute', right: 2, top: 12, width: 10, height: 8, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  cloakCollar: { position: 'absolute', bottom: 31, width: 14, height: 7, borderWidth: 1, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  hanger: { position: 'absolute', top: 3, width: 17, height: 9, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, zIndex: 2 },
  garment: { position: 'absolute', bottom: 5, width: 25, height: 29, borderWidth: 1.2, borderTopLeftRadius: 9, borderTopRightRadius: 9, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  garmentCollar: { position: 'absolute', top: 0, width: 10, height: 6, borderBottomWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  garmentButton: { position: 'absolute', top: 9, width: 3, height: 3, borderRadius: 2 },
  garmentPocket: { position: 'absolute', right: 3, bottom: 5, width: 5, height: 6, borderWidth: 0.7, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  garmentDress: { width: 27, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  garmentSkirt: { width: 28, height: 25, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 11, borderBottomRightRadius: 11 },
  garmentJacket: { borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  garmentSleeve: { position: 'absolute', top: 3, width: 8, height: 11, borderWidth: 1, borderRadius: 5 },
  garmentSleeveLeft: { left: -5, transform: [{ rotate: '20deg' }] },
  garmentSleeveRight: { right: -5, transform: [{ rotate: '-20deg' }] },
  garmentBodice: { position: 'absolute', top: 1, width: 13, height: 11, borderWidth: 1, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  garmentWaist: { position: 'absolute', top: 11, left: 2, right: 2, height: 3, borderRadius: 3 },
  garmentHem: { position: 'absolute', left: 1, right: 1, bottom: 2, height: 5, borderTopWidth: 1, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  garmentWideCollar: { width: 14, height: 7 },
  garmentSecondButton: { top: 15 },
  garmentBow: { position: 'absolute', top: 7, width: 9, height: 6, borderRadius: 4 },
  garmentStripe: { position: 'absolute', top: 13, left: 3, width: 17, height: 2, opacity: 0.8 },
  garmentBadge: { position: 'absolute', top: 13, right: 5, width: 5, height: 5, borderRadius: 3 },
  dressBow: { position: 'absolute', top: 11, width: 9, height: 6, borderRadius: 4 },
  dressGem: { position: 'absolute', top: 17, width: 5, height: 5, borderWidth: 1, borderRadius: 3 },
  dressLace: { position: 'absolute', left: 2, right: 2, bottom: 2, height: 4, borderTopWidth: 1, borderRadius: 3, borderStyle: 'dotted' },
  skirtWaist: { position: 'absolute', top: 1, left: 2, right: 2, height: 5, borderWidth: 0.7, borderRadius: 4 },
  skirtPleat: { position: 'absolute', top: 7, width: 5, height: 12, borderLeftWidth: 1, borderBottomWidth: 1, borderBottomLeftRadius: 5 },
  skirtPleatLeft: { left: 5, transform: [{ rotate: '8deg' }] },
  skirtPleatRight: { right: 5, transform: [{ rotate: '-8deg' }] },
  skirtRibbon: { position: 'absolute', top: 8, width: 7, height: 5, borderRadius: 4 },
  skirtGem: { position: 'absolute', top: 8, left: 11, width: 5, height: 5, borderRadius: 3 },
  treatTop: { position: 'absolute', bottom: 15, width: 24, height: 14, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sugarPearl: { position: 'absolute', width: 3, height: 3, borderRadius: 2 },
  sugarPearlLeft: { left: 4, top: 3 },
  sugarPearlRight: { right: 4, bottom: 3 },
  treatBase: { position: 'absolute', bottom: 6, width: 19, height: 12, borderWidth: 1, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, alignItems: 'center' },
  treatStripe: { width: 2, height: 9, opacity: 0.75 },
  treatPlate: { position: 'absolute', bottom: 3, width: 30, height: 5, borderWidth: 1, borderRadius: 10 },
  croissantSteam: { position: 'absolute', top: 1, zIndex: 2 },
  croissantSteamLeft: { left: 10 },
  croissantSteamRight: { right: 10, top: 4 },
  croissantPlate: { position: 'absolute', bottom: 3, width: 31, height: 5, borderWidth: 1, borderRadius: 10 },
  croissantBody: { position: 'absolute', bottom: 8, width: 29, height: 18, borderWidth: 1.2, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  croissantRoll: { position: 'absolute', bottom: 0, width: 10, height: 15, borderWidth: 0.8, borderRadius: 7 },
  croissantRollLeft: { left: 1, transform: [{ rotate: '-31deg' }] },
  croissantRollCenter: { bottom: 3, width: 11, height: 16, borderRadius: 8 },
  croissantRollRight: { right: 1, transform: [{ rotate: '31deg' }] },
  croissantSeam: { position: 'absolute', top: 2, width: 2, height: 10, borderRadius: 2, opacity: 0.9 },
  croissantSeamLeft: { left: 8, transform: [{ rotate: '-15deg' }] },
  croissantSeamRight: { right: 8, transform: [{ rotate: '15deg' }] },
  drinkLid: { position: 'absolute', bottom: 30, width: 22, height: 5, borderWidth: 1, borderRadius: 4 },
  drinkCup: { position: 'absolute', bottom: 5, width: 20, height: 25, borderWidth: 1, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, alignItems: 'center', justifyContent: 'center' },
  drinkFoam: { width: 14, height: 11, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  drinkStraw: { position: 'absolute', bottom: 26, left: 26, width: 2, height: 12, transform: [{ rotate: '15deg' }] },
  drinkPearl: { position: 'absolute', bottom: 3, left: 5, width: 3, height: 3, borderRadius: 2 },
  drinkPearlSecond: { left: 11, bottom: 5 },
  produceFruitRow: { position: 'absolute', bottom: 17, flexDirection: 'row', alignItems: 'flex-end', gap: 1 },
  produceFruit: { width: 11, height: 12, borderWidth: 1, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  produceBasket: { position: 'absolute', bottom: 6, width: 30, height: 12, borderWidth: 1, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, alignItems: 'center' },
  basketBand: { width: 28, height: 3, marginTop: 3, borderRadius: 2 },
  device: { position: 'absolute', bottom: 5, width: 23, height: 31, borderWidth: 1.2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  deviceScreen: { width: 16, height: 20, borderWidth: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  deviceButton: { width: 4, height: 2, borderRadius: 2, marginTop: 2 },
  deviceShine: { position: 'absolute', top: 5, left: 3, width: 2, height: 8, opacity: 0.75 },
  bookBack: { position: 'absolute', bottom: 7, left: 6, width: 21, height: 27, borderWidth: 1, borderRadius: 3, transform: [{ rotate: '-7deg' }] },
  bookCover: { position: 'absolute', bottom: 5, width: 21, height: 29, borderWidth: 1.2, borderRadius: 3, alignItems: 'center', justifyContent: 'center', gap: 3 },
  bookTitleLine: { width: 10, height: 2, borderRadius: 2 },
  bookPages: { position: 'absolute', bottom: 5, right: 7, width: 2, height: 27 },
  flowerVase: { position: 'absolute', bottom: 5, width: 18, height: 14, borderWidth: 1, borderTopLeftRadius: 4, borderTopRightRadius: 4, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, alignItems: 'center' },
  vaseWater: { width: 14, height: 2, marginTop: 4, borderRadius: 2 },
  flowerStem: { position: 'absolute', bottom: 16, width: 2, height: 13 },
  flowerPetal: { position: 'absolute', width: 8, height: 8, borderRadius: 5 },
  petalTop: { top: 6 },
  petalRight: { top: 11, left: 23 },
  petalBottom: { top: 17 },
  petalLeft: { top: 11, left: 11 },
  flowerCenter: { position: 'absolute', top: 12, left: 18, width: 5, height: 5, borderRadius: 3 },
  jewelTray: { position: 'absolute', bottom: 5, width: 29, height: 13, borderWidth: 1, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  jewelStone: { position: 'absolute', bottom: 17, left: 11, width: 9, height: 9, borderWidth: 1, borderRadius: 3, transform: [{ rotate: '45deg' }] },
  jewelStoneSecond: { left: 23, bottom: 15, width: 7, height: 7 },
  handbagHandle: { position: 'absolute', top: 7, width: 17, height: 14, borderWidth: 2, borderBottomWidth: 0, borderTopLeftRadius: 9, borderTopRightRadius: 9 },
  handbagDoubleHandle: { width: 23 },
  handbagCrossbody: { position: 'absolute', top: 4, left: 8, width: 26, height: 24, borderWidth: 2, borderBottomWidth: 0, borderTopLeftRadius: 13, borderTopRightRadius: 13, transform: [{ rotate: '-18deg' }] },
  handbagBody: { position: 'absolute', bottom: 5, width: 29, height: 24, borderWidth: 1.2, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 9, borderBottomRightRadius: 9, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  handbagRound: { width: 26, height: 22, borderRadius: 11 },
  handbagSatchel: { width: 31, height: 21, borderRadius: 4 },
  handbagMini: { width: 22, height: 20, borderRadius: 7 },
  handbagWide: { width: 33, height: 20, borderRadius: 5 },
  handbagFlap: { position: 'absolute', top: 0, left: 1, right: 1, height: 9, borderWidth: 0.8, borderTopLeftRadius: 5, borderTopRightRadius: 5, borderBottomLeftRadius: 6, borderBottomRightRadius: 6 },
  handbagClasp: { position: 'absolute', top: 7, width: 5, height: 5, borderWidth: 0.8, borderRadius: 3 },
  handbagSide: { position: 'absolute', right: 5, bottom: 8, width: 3, height: 15, borderRadius: 3, opacity: 0.7 },
  handbagRibbon: { position: 'absolute', top: 5, left: 4, width: 8, height: 5, borderRadius: 5 },
  earringLoop: { position: 'absolute', top: 9, width: 10, height: 14, borderWidth: 2, borderTopWidth: 1, borderRadius: 7 },
  earringLeft: { left: 7, transform: [{ rotate: '12deg' }] },
  earringRight: { right: 7, top: 13, transform: [{ rotate: '-12deg' }] },
  earringGem: { position: 'absolute', width: 6, height: 6, borderWidth: 1, borderRadius: 4 },
  earringGemLeft: { left: 9, top: 24 },
  earringGemRight: { right: 9, top: 28 },
  earringDrop: { position: 'absolute', top: 30, width: 5, height: 7, borderWidth: 1, borderTopLeftRadius: 2, borderTopRightRadius: 2, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  watchStrap: { position: 'absolute', width: 13, height: 34, borderWidth: 1, borderRadius: 5 },
  watchFace: { position: 'absolute', width: 22, height: 22, borderWidth: 2, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  watchHand: { position: 'absolute', top: 4, width: 2, height: 7, borderRadius: 2, transformOrigin: 'bottom' },
  watchDot: { position: 'absolute', width: 3, height: 3, borderRadius: 2 },
  watchGem: { position: 'absolute', top: 7, right: 7, width: 4, height: 4, borderRadius: 3 },
  scarfLoop: { position: 'absolute', top: 7, width: 25, height: 15, borderWidth: 2, borderBottomWidth: 1, borderRadius: 12, transform: [{ rotate: '-8deg' }] },
  scarfTail: { position: 'absolute', top: 18, width: 10, height: 19, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  scarfTailLeft: { left: 10, transform: [{ rotate: '8deg' }] },
  scarfTailRight: { right: 9, top: 21, transform: [{ rotate: '-9deg' }] },
  scarfStripe: { position: 'absolute', top: 25, left: 12, width: 17, height: 2, borderRadius: 2 },
  hairclipBar: { position: 'absolute', bottom: 16, width: 32, height: 8, borderWidth: 1, borderRadius: 6, transform: [{ rotate: '-12deg' }] },
  hairclipBowLeft: { position: 'absolute', top: 8, left: 9, width: 12, height: 10, borderWidth: 1, borderRadius: 8, transform: [{ rotate: '28deg' }] },
  hairclipBowRight: { position: 'absolute', top: 8, right: 9, width: 12, height: 10, borderWidth: 1, borderRadius: 8, transform: [{ rotate: '-28deg' }] },
  hairclipCenter: { position: 'absolute', top: 11, width: 7, height: 7, borderWidth: 1, borderRadius: 4 },
  hairclipGem: { position: 'absolute', bottom: 11, width: 5, height: 5, borderRadius: 3 },
  shoeSole: { position: 'absolute', bottom: 7, left: 5, width: 32, height: 7, borderWidth: 1, borderRadius: 6, transform: [{ rotate: '-7deg' }] },
  shoeBody: { position: 'absolute', bottom: 11, left: 8, width: 27, height: 15, borderWidth: 1, borderTopLeftRadius: 13, borderTopRightRadius: 6, borderBottomLeftRadius: 4, borderBottomRightRadius: 5, transform: [{ rotate: '-7deg' }] },
  shoeToe: { position: 'absolute', bottom: 14, left: 7, width: 11, height: 9, borderWidth: 1, borderRadius: 7, transform: [{ rotate: '-13deg' }] },
  shoeHeel: { position: 'absolute', bottom: 8, right: 8, width: 5, height: 8, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  walletBody: { position: 'absolute', bottom: 7, width: 29, height: 22, borderWidth: 1.2, borderRadius: 6 },
  walletFlap: { position: 'absolute', bottom: 19, width: 27, height: 10, borderWidth: 1, borderBottomLeftRadius: 7, borderBottomRightRadius: 7 },
  walletButton: { position: 'absolute', bottom: 19, width: 5, height: 5, borderWidth: 0.7, borderRadius: 3 },
  walletSeam: { position: 'absolute', bottom: 11, width: 21, height: 1, borderTopWidth: 1, opacity: 0.9 },
  necklaceChain: { position: 'absolute', top: 7, width: 28, height: 24, borderWidth: 1.4, borderBottomWidth: 0, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  necklacePendant: { position: 'absolute', top: 22, width: 12, height: 13, borderWidth: 1, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, transform: [{ rotate: '45deg' }] },
  necklaceGem: { position: 'absolute', top: 25, width: 5, height: 5, borderWidth: 1, borderRadius: 3 },
  towelBack: { position: 'absolute', bottom: 8, width: 30, height: 17, borderWidth: 1, borderRadius: 5, transform: [{ rotate: '7deg' }] },
  towelFold: { position: 'absolute', bottom: 10, width: 25, height: 17, borderWidth: 1, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  towelStripe: { width: 18, height: 3, borderRadius: 2 },
  fanFold: { position: 'absolute', top: 5, width: 31, height: 25, borderWidth: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  fanRib: { position: 'absolute', top: 8, width: 1, height: 23, borderRadius: 1 },
  fanHandle: { position: 'absolute', bottom: 4, width: 6, height: 15, borderWidth: 1, borderRadius: 4 },
  giftLid: { position: 'absolute', bottom: 24, width: 27, height: 7, borderWidth: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  giftBow: { width: 8, height: 5, borderWidth: 1, borderRadius: 5 },
  giftBox: { position: 'absolute', bottom: 5, width: 23, height: 20, borderWidth: 1, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, alignItems: 'center', justifyContent: 'center' },
  giftRibbon: { position: 'absolute', width: 3, height: 18, opacity: 0.8 },
  specialObject: { position: 'absolute', top: 7, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  specialLollipopStick: { position: 'absolute', top: 27, width: 2, height: 11, borderRadius: 2 },
  specialTrainWheel: { position: 'absolute', top: 28, width: 7, height: 7, borderRadius: 4 },
  specialTrainWheelLeft: { left: 8 },
  specialTrainWheelRight: { right: 8 },
  specialHatBrim: { position: 'absolute', top: 17, width: 34, height: 4, borderWidth: 1, borderRadius: 4 },
  specialBucketHandle: { position: 'absolute', top: 8, width: 18, height: 12, borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10 },
  specialSachetNeck: { position: 'absolute', top: 3, width: 10, height: 8, borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 7, borderTopRightRadius: 7, zIndex: 2 },
  specialSachetTie: { position: 'absolute', top: 9, width: 13, height: 3, borderRadius: 2, zIndex: 2 },
  specialCosmeticCap: { position: 'absolute', top: 2, width: 11, height: 8, borderWidth: 1, borderRadius: 3 },
  specialMascaraWand: { position: 'absolute', top: 3, width: 3, height: 9, borderRadius: 2 },
  specialNailPolishCap: { position: 'absolute', top: 3, width: 9, height: 7, borderWidth: 1, borderRadius: 2 },
  bathSaltSeal: { position: 'absolute', top: 5, width: 15, height: 4, borderRadius: 2, zIndex: 1 },
  bathSaltLabel: { position: 'absolute', top: 16, width: 14, height: 11, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  bathSaltGrain: { position: 'absolute', top: 29, width: 3, height: 3, borderRadius: 2 },
  bathSaltGrainLeft: { left: 14 },
  bathSaltGrainRight: { right: 14, top: 27 },
  bathPouchTie: { position: 'absolute', top: 6, width: 11, height: 3, borderRadius: 3, zIndex: 1 },
  bathPouchCord: { position: 'absolute', top: 3, width: 5, height: 9, borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 5, borderTopRightRadius: 5, zIndex: 1 },
  bathPouchCordLeft: { left: 15, transform: [{ rotate: '-22deg' }] },
  bathPouchCordRight: { right: 15, transform: [{ rotate: '22deg' }] },
  bathPouchEmblem: { position: 'absolute', top: 19, width: 6, height: 6, borderRadius: 4 },
  bathSoapShine: { position: 'absolute', top: 21, width: 11, height: 2, borderRadius: 2 },
  bathSoapBubble: { position: 'absolute', top: 8, width: 5, height: 5, borderWidth: 1, borderRadius: 4 },
  bathSoapBubbleLeft: { left: 12 },
  bathSoapBubbleRight: { right: 12, top: 5, width: 4, height: 4 },
  yukataSleeve: { position: 'absolute', top: 15, width: 9, height: 17, borderWidth: 1, borderRadius: 3 },
  yukataSleeveLeft: { left: 4, transform: [{ rotate: '12deg' }] },
  yukataSleeveRight: { right: 4, transform: [{ rotate: '-12deg' }] },
  yukataObi: { position: 'absolute', top: 23, width: 19, height: 4, borderRadius: 2, zIndex: 1 },
  yukataCollarLeft: { position: 'absolute', top: 9, left: 18, width: 4, height: 14, borderRadius: 2, transform: [{ rotate: '-24deg' }], zIndex: 1 },
  yukataCollarRight: { position: 'absolute', top: 9, right: 18, width: 4, height: 14, borderRadius: 2, transform: [{ rotate: '24deg' }], zIndex: 1 },
  yukataFlower: { position: 'absolute', top: 13, right: 18, zIndex: 2 },
  woodenCombTooth: { position: 'absolute', top: 26, width: 2, height: 7, borderWidth: 0.6, borderTopWidth: 0, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  woodenCombGrain: { position: 'absolute', top: 22, width: 18, height: 1, borderRadius: 1 },
  woodenBathRim: { position: 'absolute', top: 15, width: 30, height: 6, borderWidth: 1, borderRadius: 5, zIndex: 1 },
  woodenBathBand: { position: 'absolute', left: 9, right: 9, height: 2, borderRadius: 2 },
  woodenBathBandTop: { top: 26 },
  woodenBathBandBottom: { top: 32 },
  woodenBathWater: { position: 'absolute', top: 21, width: 18, height: 2, borderRadius: 2 },
  specialGridLine: { position: 'absolute', width: 1, height: 15, backgroundColor: 'white', opacity: 0.8 },
  specialPaletteDivider: { position: 'absolute', width: 1, height: 14, backgroundColor: 'white', opacity: 0.8 },
  specialPalettePan: { position: 'absolute', top: 4, left: 5, width: 5, height: 5, borderRadius: 3 },
  specialCompactShine: { position: 'absolute', top: 3, width: 13, height: 3, borderRadius: 2 },
  specialLeaf: { position: 'absolute', top: -8, width: 8, height: 13, borderRadius: 8, transform: [{ rotate: '24deg' }] },
  specialPlushEar: { position: 'absolute', top: -3, width: 8, height: 9, borderRadius: 6 },
  specialPlushEarLeft: { left: 1 },
  specialPlushEarRight: { right: 1 },
  sparkle: { position: 'absolute', right: 1, top: 0 },
});
