import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { ShopDisplayProduct } from '@/constants/mall-shop-display';
import { useColors } from '@/hooks/useColors';

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
  const garmentStyle = product.variant % 3;
  const lift = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [0, index % 3 === 0 ? -1.8 : -1.1],
  });
  const shimmer = motion.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0.92] });

  return (
    <Animated.View
      testID={`shop-merchandise-visual-${product.id}`}
      accessible={false}
      importantForAccessibility="no"
      style={[styles.canvas, { width: size, height: size, transform: [{ translateY: lift }] }]}
    >
      <View pointerEvents="none" style={[styles.softHalo, { backgroundColor: product.color }]} />
      <View pointerEvents="none" style={[styles.drawing, { transform: [{ scale: size / 42 }] }]}>
        {product.illustration === 'bottle' && (
          <>
            <View style={[styles.bottleCap, { backgroundColor: colors.candyCaramelDark }]} />
            <View style={[styles.bottleNeck, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
            <View style={[styles.bottle, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]}>
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
              garmentStyle === 1 ? styles.garmentDress : garmentStyle === 2 ? styles.garmentSkirt : null,
              { backgroundColor: product.color, borderColor: colors.candyCaramelDark },
            ]}>
              {garmentStyle === 1 ? (
                <>
                  <View style={[styles.garmentSleeve, styles.garmentSleeveLeft, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
                  <View style={[styles.garmentSleeve, styles.garmentSleeveRight, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
                  <View style={[styles.garmentBodice, { backgroundColor: product.color, borderColor: colors.candyCaramelDark }]} />
                  <View style={[styles.garmentWaist, { backgroundColor: accent }]} />
                  <View style={[styles.garmentHem, { borderTopColor: colors.candyCream }]} />
                </>
              ) : garmentStyle === 2 ? (
                <>
                  <View style={[styles.skirtWaist, { backgroundColor: accent, borderColor: colors.candyCaramelDark }]} />
                  <View style={[styles.skirtPleat, styles.skirtPleatLeft, { borderColor: colors.candyCream }]} />
                  <View style={[styles.skirtPleat, styles.skirtPleatRight, { borderColor: colors.candyCream }]} />
                  <View style={[styles.garmentHem, { borderTopColor: colors.candyCream }]} />
                </>
              ) : (
                <>
                  <View style={[styles.garmentCollar, { borderColor: colors.candyCaramelDark }]} />
                  <View style={[styles.garmentButton, { backgroundColor: accent }]} />
                  <View style={[styles.garmentPocket, { borderColor: colors.candyCream }]} />
                </>
              )}
            </View>
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
        <View style={[styles.groundShadow, { backgroundColor: colors.candyCaramel }]} />
      </View>
      <Animated.View pointerEvents="none" style={[styles.sparkle, { opacity: shimmer }]}>
        <Feather name="star" size={7} color={colors.candyLemon} />
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
  garmentSleeve: { position: 'absolute', top: 3, width: 8, height: 11, borderWidth: 1, borderRadius: 5 },
  garmentSleeveLeft: { left: -5, transform: [{ rotate: '20deg' }] },
  garmentSleeveRight: { right: -5, transform: [{ rotate: '-20deg' }] },
  garmentBodice: { position: 'absolute', top: 1, width: 13, height: 11, borderWidth: 1, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  garmentWaist: { position: 'absolute', top: 11, left: 2, right: 2, height: 3, borderRadius: 3 },
  garmentHem: { position: 'absolute', left: 1, right: 1, bottom: 2, height: 5, borderTopWidth: 1, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  skirtWaist: { position: 'absolute', top: 1, left: 2, right: 2, height: 5, borderWidth: 0.7, borderRadius: 4 },
  skirtPleat: { position: 'absolute', top: 7, width: 5, height: 12, borderLeftWidth: 1, borderBottomWidth: 1, borderBottomLeftRadius: 5 },
  skirtPleatLeft: { left: 5, transform: [{ rotate: '8deg' }] },
  skirtPleatRight: { right: 5, transform: [{ rotate: '-8deg' }] },
  treatTop: { position: 'absolute', bottom: 15, width: 24, height: 14, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sugarPearl: { position: 'absolute', width: 3, height: 3, borderRadius: 2 },
  sugarPearlLeft: { left: 4, top: 3 },
  sugarPearlRight: { right: 4, bottom: 3 },
  treatBase: { position: 'absolute', bottom: 6, width: 19, height: 12, borderWidth: 1, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, alignItems: 'center' },
  treatStripe: { width: 2, height: 9, opacity: 0.75 },
  treatPlate: { position: 'absolute', bottom: 3, width: 30, height: 5, borderWidth: 1, borderRadius: 10 },
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
  giftLid: { position: 'absolute', bottom: 24, width: 27, height: 7, borderWidth: 1, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  giftBow: { width: 8, height: 5, borderWidth: 1, borderRadius: 5 },
  giftBox: { position: 'absolute', bottom: 5, width: 23, height: 20, borderWidth: 1, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, alignItems: 'center', justifyContent: 'center' },
  giftRibbon: { position: 'absolute', width: 3, height: 18, opacity: 0.8 },
  sparkle: { position: 'absolute', right: 1, top: 0 },
});
