import React from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { ShopDisplayProduct } from '@/constants/mall-shop-display';
import type { CharacterMerchandiseReferenceArtwork } from '@/constants/shop-character-merchandise';
import { getShopCharacterMerchandiseProfile } from '@/constants/shop-character-merchandise';
import { useColors } from '@/hooks/useColors';
import { useReducedMotion } from '@/context/ReducedMotionContext';

type CharacterId =
  | 'chiikawa' | 'hachiware' | 'usagi' | 'momonga' | 'shisa' | 'kurimanju' | 'rakko' | 'chiikawa-carousel'
  | 'pooh' | 'piglet' | 'tigger' | 'eeyore' | 'rabbit' | 'kanga' | 'roo' | 'owl';

const CHIIKAWA_STANDARD_ART: Partial<Record<CharacterId, ImageSourcePropType>> = {
  chiikawa: require('../assets/chiikawa-merch/standard-chiikawa.jpg'),
  hachiware: require('../assets/chiikawa-merch/standard-hachiware.jpg'),
  usagi: require('../assets/chiikawa-merch/standard-usagi.jpg'),
  momonga: require('../assets/chiikawa-merch/standard-momonga.jpg'),
  shisa: require('../assets/chiikawa-merch/standard-shisa.jpg'),
  kurimanju: require('../assets/chiikawa-merch/standard-kurimanju.jpg'),
  rakko: require('../assets/chiikawa-merch/standard-rakko.jpg'),
};

const CHIIKAWA_MAGICAL_ART: Partial<Record<CharacterId, ImageSourcePropType>> = {
  chiikawa: require('../assets/chiikawa-merch/magical-chiikawa.jpg'),
  hachiware: require('../assets/chiikawa-merch/magical-hachiware.jpg'),
  usagi: require('../assets/chiikawa-merch/magical-usagi.jpg'),
  momonga: require('../assets/chiikawa-merch/magical-momonga.jpg'),
  shisa: require('../assets/chiikawa-merch/magical-shisa.jpg'),
  kurimanju: require('../assets/chiikawa-merch/magical-kurimanju.jpg'),
  rakko: require('../assets/chiikawa-merch/magical-rakko.jpg'),
};

const CHIIKAWA_SPECIAL_ART: Record<
  Exclude<CharacterMerchandiseReferenceArtwork, 'standard' | 'magical'>,
  ImageSourcePropType
> = {
  'magical-group': require('../assets/chiikawa-merch/item-magical-girl-poster.jpg'),
  carousel: require('../assets/chiikawa-merch/item-carousel.jpg'),
  pens: require('../assets/chiikawa-merch/item-pens.jpg'),
  'hunting-stick': require('../assets/chiikawa-merch/item-hunting-stick-toys.png'),
  'propeller-plush': require('../assets/chiikawa-merch/item-propeller-plush.jpg'),
  'mermaid-poster': require('../assets/chiikawa-merch/item-mermaid-poster.jpg'),
  'mid-autumn-plush': require('../assets/chiikawa-merch/item-mid-autumn-plush.jpg'),
  'baby-plush': require('../assets/chiikawa-merch/item-baby-plush.jpg'),
  'character-dictionary': require('../assets/chiikawa-merch/item-character-dictionary.jpg'),
  'character-cover': require('../assets/chiikawa-merch/item-character-cover.jpg'),
  'taiko-collab': require('../assets/chiikawa-merch/item-taiko-collab.jpg'),
  'christmas-plush': require('../assets/chiikawa-merch/item-christmas-plush.jpg'),
};

function getChiikawaArtworkSource(
  characterId: CharacterId,
  referenceArtwork: CharacterMerchandiseReferenceArtwork | undefined,
): ImageSourcePropType {
  if (referenceArtwork && referenceArtwork !== 'standard' && referenceArtwork !== 'magical') {
    return CHIIKAWA_SPECIAL_ART[referenceArtwork];
  }
  if (referenceArtwork === 'magical') {
    return CHIIKAWA_MAGICAL_ART[characterId] ?? CHIIKAWA_SPECIAL_ART['magical-group'];
  }
  return CHIIKAWA_STANDARD_ART[characterId] ?? CHIIKAWA_STANDARD_ART.chiikawa!;
}

function ChiikawaReferenceArtwork({
  product,
  characterId,
  referenceArtwork,
  size,
}: {
  product: ShopDisplayProduct;
  characterId: CharacterId;
  referenceArtwork?: CharacterMerchandiseReferenceArtwork;
  size: number;
}) {
  const containArtwork = referenceArtwork !== 'standard' && referenceArtwork !== 'magical';
  const source = getChiikawaArtworkSource(characterId, referenceArtwork);
  return (
    <View
      style={[
        styles.referenceArtFrame,
        {
          width: size,
          height: size,
          backgroundColor: product.color,
          borderColor: product.color,
        },
      ]}
    >
      <Image
        testID={`shop-character-reference-image-${product.id}`}
        accessible={false}
        source={source}
        resizeMode={containArtwork ? 'contain' : 'cover'}
        style={[
          styles.referenceArtImage,
          {
            width: containArtwork ? size * 0.96 : size * 0.94,
            height: containArtwork ? size * 0.96 : size * 0.94,
            borderRadius: containArtwork ? 5 : 8,
          },
        ]}
      />
    </View>
  );
}

function CharacterFigure({
  characterId,
  colors,
  x = 32,
  y = 32,
  scale = 1,
  magicalGirl = false,
  magicalGirlColor,
  jewelColor,
}: {
  characterId: CharacterId;
  colors: ReturnType<typeof useColors>;
  x?: number;
  y?: number;
  scale?: number;
  magicalGirl?: boolean;
  magicalGirlColor?: string;
  jewelColor?: string;
}) {
  const fur = characterId === 'pooh' ? colors.candyLemon
    : characterId === 'piglet' ? colors.candyPink
      : characterId === 'tigger' ? colors.candyOrange
        : characterId === 'eeyore' ? colors.candySky
          : characterId === 'rabbit' ? colors.candyMint
            : characterId === 'kanga' ? colors.candyCaramel
              : characterId === 'roo' ? colors.candyPeach
                : characterId === 'owl' ? colors.candyCaramel
                  : characterId === 'hachiware' ? colors.candyCream
                    : characterId === 'usagi' ? colors.candyLemon
                      : characterId === 'momonga' ? colors.candyLavender
                        : characterId === 'shisa' ? colors.candyPeach
                          : characterId === 'kurimanju' ? colors.candyCaramel
                            : characterId === 'rakko' ? colors.candySky
                              : colors.candyCream;
  const outline = colors.candyCaramelDark;
  const body = characterId === 'pooh' ? colors.candyCoral
    : characterId === 'piglet' ? colors.candyRose
      : characterId === 'eeyore' ? colors.candyLavender
        : characterId === 'tigger' ? colors.candyOrange
          : fur;

  return (
    <G transform={`translate(${x - 32 * scale} ${y - 32 * scale}) scale(${scale})`}>
      <Ellipse cx="32" cy="52" rx="13" ry="10" fill={body} stroke={outline} strokeWidth="1.5" />
      {characterId === 'pooh' && <Path d="M21 49 Q32 45 43 49 L43 58 Q32 64 21 58 Z" fill={colors.primary} />}
      {characterId === 'piglet' && <Path d="M20 49 Q32 53 44 49 L42 55 Q32 60 22 55 Z" fill={colors.candySky} />}
      {characterId === 'tigger' && (
        <>
          <Path d="M24 45 L28 50 M38 45 L34 50 M25 55 L30 57 M39 55 L34 57" stroke={outline} strokeWidth="2" strokeLinecap="round" />
          <Path d="M42 54 C53 52 53 60 46 60" fill="none" stroke={outline} strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {magicalGirl && (
        <>
          <Path
            d="M20 44 Q32 40 44 44 L50 58 Q32 64 14 58 Z"
            fill={magicalGirlColor ?? colors.candyPink}
            stroke={outline}
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <Path d="M17 57 Q21 54 25 58 Q29 54 33 58 Q37 54 41 58 Q45 54 48 57" fill="none" stroke={colors.candyCream} strokeWidth="1.5" />
          <Path d="M24 44 Q32 49 40 44" fill="none" stroke={colors.candyCream} strokeWidth="1.6" />
        </>
      )}
      {characterId === 'eeyore' && (
        <>
          <Path d="M19 18 Q8 11 11 31 Q13 38 22 32 Z" fill={colors.candySkyDark} stroke={outline} strokeWidth="1.5" />
          <Path d="M45 18 Q56 12 53 31 Q50 38 42 32 Z" fill={colors.candySkyDark} stroke={outline} strokeWidth="1.5" />
          <Path d="M43 13 Q52 8 55 16 L49 20 Z" fill={colors.candyPink} stroke={outline} strokeWidth="1" />
        </>
      )}
      {(characterId === 'usagi' || characterId === 'rabbit') && (
        <>
          <Path d={characterId === 'usagi' ? 'M23 16 Q14 -3 20 1 Q28 5 30 17 Z' : 'M23 16 Q18 -2 24 2 Q31 8 30 18 Z'} fill={fur} stroke={outline} strokeWidth="1.5" />
          <Path d={characterId === 'usagi' ? 'M38 17 Q43 -4 48 2 Q50 11 42 20 Z' : 'M38 17 Q43 -1 48 4 Q50 12 42 20 Z'} fill={fur} stroke={outline} strokeWidth="1.5" />
        </>
      )}
      {(characterId === 'chiikawa' || characterId === 'momonga' || characterId === 'shisa' || characterId === 'kurimanju' || characterId === 'rakko' || characterId === 'chiikawa-carousel') && (
        <>
          <Ellipse cx="18" cy="19" rx="5" ry="6" fill={fur} stroke={outline} strokeWidth="1.4" />
          <Ellipse cx="46" cy="19" rx="5" ry="6" fill={fur} stroke={outline} strokeWidth="1.4" />
        </>
      )}
      {characterId === 'hachiware' && (
        <>
          <Path d="M18 17 L14 7 Q13 4 17 6 L26 13 M46 17 L50 7 Q51 4 47 6 L38 13" fill={colors.candySky} stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />
          <Path d="M18 18 Q32 3 46 18 L43 23 Q32 17 21 23 Z" fill={colors.candySky} />
        </>
      )}
      {characterId === 'tigger' && (
        <>
          <Circle cx="20" cy="17" r="5" fill={fur} stroke={outline} strokeWidth="1.4" />
          <Circle cx="44" cy="17" r="5" fill={fur} stroke={outline} strokeWidth="1.4" />
          <Path d="M24 11 L28 17 M40 11 L36 17" stroke={outline} strokeWidth="2" />
        </>
      )}
      {(characterId === 'pooh' || characterId === 'kanga' || characterId === 'roo') && (
        <>
          <Circle cx="19" cy="18" r="6" fill={fur} stroke={outline} strokeWidth="1.5" />
          <Circle cx="45" cy="18" r="6" fill={fur} stroke={outline} strokeWidth="1.5" />
        </>
      )}
      {characterId === 'piglet' && (
        <>
          <Path d="M23 16 Q17 0 22 2 Q30 8 29 18 Z" fill={colors.candyPink} stroke={outline} strokeWidth="1.4" />
          <Path d="M38 17 Q43 0 48 4 Q49 12 42 20 Z" fill={colors.candyPink} stroke={outline} strokeWidth="1.4" />
        </>
      )}
      {characterId === 'owl' && (
        <>
          <Path d="M19 16 L17 7 L27 14 M45 16 L47 7 L37 14" fill={colors.candyCaramel} stroke={outline} strokeWidth="1.5" strokeLinejoin="round" />
        </>
      )}
      {characterId === 'shisa' && (
        <Path d="M28 8 Q32 4 36 8 Q40 3 42 8 Q42 14 35 15 Q32 12 28 15 Q22 14 23 8 Q25 4 28 8 Z" fill={colors.candyOrange} stroke={outline} strokeWidth="1" />
      )}
      {characterId === 'kurimanju' && <Path d="M18 20 Q18 7 32 8 Q46 8 46 20 Q39 16 32 17 Q24 16 18 20 Z" fill={colors.candyCaramel} />}
      {characterId === 'rakko' && (
        <Path d="M17 19 Q15 9 24 10 Q32 2 40 10 Q49 9 47 20 Q42 17 32 17 Q22 17 17 19 Z" fill={colors.candySkyDark} />
      )}
      {characterId === 'chiikawa-carousel' && (
        <>
          <Path d="M24 14 Q32 7 40 14 L38 18 Q32 15 26 18 Z" fill={colors.candyPink} stroke={outline} strokeWidth="1" />
          <Circle cx="32" cy="11" r="3" fill={colors.candyLemon} stroke={outline} strokeWidth="0.8" />
        </>
      )}
      <Ellipse cx="32" cy="29" rx={characterId === 'usagi' ? 15 : 17} ry="15" fill={fur} stroke={outline} strokeWidth="1.6" />
      {characterId === 'hachiware' && (
        <Path d="M16 24 Q17 13 32 13 Q47 14 48 24 Q40 21 32 22 Q23 21 16 24 Z" fill={colors.candySky} />
      )}
      {characterId === 'kurimanju' && <Path d="M18 20 Q30 8 46 21 L44 25 Q32 20 20 25 Z" fill={colors.candyCaramel} />}
      {characterId === 'pooh' && <Path d="M18 17 Q32 9 46 18 L45 23 Q32 18 19 23 Z" fill={colors.candyLemon} />}
      {characterId === 'tigger' && <Path d="M19 18 L27 22 M45 18 L37 22" stroke={outline} strokeWidth="2" />}
      <Ellipse cx="25" cy="29" rx="1.6" ry="2.2" fill={outline} />
      <Ellipse cx="39" cy="29" rx="1.6" ry="2.2" fill={outline} />
      <Ellipse cx="20" cy="34" rx="3.2" ry="1.8" fill={colors.candyRose} opacity="0.85" />
      <Ellipse cx="44" cy="34" rx="3.2" ry="1.8" fill={colors.candyRose} opacity="0.85" />
      {characterId === 'usagi' || characterId === 'tigger'
        ? <Path d="M29 35 Q32 39 35 35" fill="none" stroke={outline} strokeWidth="1.5" strokeLinecap="round" />
        : <Path d="M30 35 Q32 37 34 35" fill="none" stroke={outline} strokeWidth="1.2" strokeLinecap="round" />}
      {characterId === 'pooh' && <Ellipse cx="32" cy="33" rx="3.3" ry="2.2" fill={colors.candyCaramelDark} />}
      {characterId === 'piglet' && <Ellipse cx="32" cy="34" rx="3" ry="2" fill={colors.candyRose} />}
      {characterId === 'chiikawa-carousel' && (
        <>
          <Path d="M22 48 Q32 44 42 48 L39 54 H25 Z" fill={colors.candyPink} stroke={outline} strokeWidth="1" />
          <Circle cx="32" cy="49" r="2" fill={colors.candyLemon} />
        </>
      )}
      {magicalGirl && (
        <>
          <Path d="M44 17 C39 11 36 17 43 20 C36 23 40 28 45 22 C50 28 54 23 47 20 C54 16 49 11 44 17 Z" fill={magicalGirlColor ?? colors.candyPink} stroke={outline} strokeWidth="1" />
          <Circle cx="45" cy="20" r="1.5" fill={jewelColor ?? colors.candyLemon} />
          <Path d="M32 44 L34 47 L37 47.5 L34.5 50 L35 53 L32 51.5 L29 53 L29.5 50 L27 47.5 L30 47 Z" fill={jewelColor ?? colors.candyLemon} stroke={outline} strokeWidth="0.7" />
          <Path d="M32 6 L33.5 9 L37 9.5 L34.5 12 L35 15 L32 13.5 L29 15 L29.5 12 L27 9.5 L30.5 9 Z" fill={colors.candyLemon} stroke={outline} strokeWidth="0.8" />
        </>
      )}
    </G>
  );
}

function ThemedProductArtwork({
  product,
  characterIds,
  colors,
}: {
  product: ShopDisplayProduct;
  characterIds: CharacterId[];
  colors: ReturnType<typeof useColors>;
}) {
  const stroke = colors.candyCaramelDark;
  const isGroup = characterIds.length > 1;
  const isFigure = product.illustration === 'plush' || product.illustration === 'charm';
  const magicalGirl = product.name.includes('魔法少女');
  const getCostumeColor = (characterId: CharacterId) => {
    if (characterId === 'hachiware') return colors.candySky;
    if (characterId === 'usagi') return colors.candyLemon;
    if (characterId === 'momonga') return colors.candyLavender;
    if (characterId === 'shisa') return colors.candyCoral;
    if (characterId === 'kurimanju') return colors.candyRose;
    if (characterId === 'rakko') return colors.candyMint;
    return colors.candyPink;
  };
  const drawCharacter = (characterId: CharacterId, x: number, y: number, scale: number) => (
    <CharacterFigure
      characterId={characterId}
      colors={colors}
      x={x}
      y={y}
      scale={scale}
      magicalGirl={magicalGirl}
      magicalGirlColor={getCostumeColor(characterId)}
      jewelColor={product.color}
    />
  );
  return (
    <Svg width="42" height="42" viewBox="0 0 64 64">
      <Ellipse cx="32" cy="59" rx="19" ry="3" fill={colors.candyCaramel} opacity="0.32" />
      {isGroup ? (
        <>
          <Rect x="7" y="9" width="50" height="46" rx="8" fill={colors.card} stroke={stroke} strokeWidth="1.7" />
          <Rect x="11" y="13" width="42" height="38" rx="6" fill={product.color} opacity="0.72" />
          {characterIds.slice(0, 4).map((characterId, characterIndex) => (
            <G key={characterId}>
              {drawCharacter(
                characterId,
                characterIds.length === 2 ? (characterIndex === 0 ? 23 : 41) : 16 + characterIndex * 10.5,
                38,
                characterIds.length === 2 ? 0.48 : 0.34,
              )}
            </G>
          ))}
          <Path d="M16 47 Q32 43 48 47" stroke={colors.candyCream} strokeWidth="1.4" opacity="0.8" />
        </>
      ) : isFigure ? (
        <>
          {product.illustration === 'charm' && (
            <>
              <Circle cx="32" cy="7" r="3.3" fill="none" stroke={stroke} strokeWidth="1.7" />
              <Path d="M32 10 L32 14" stroke={stroke} strokeWidth="1.5" />
            </>
          )}
          {drawCharacter(characterIds[0], 32, product.illustration === 'charm' ? 37 : 34, product.illustration === 'charm' ? 0.78 : 0.91)}
          {product.illustration === 'charm' && <Circle cx="32" cy="57" r="1.7" fill={product.color} />}
        </>
      ) : product.illustration === 'mug' ? (
        <>
          <Path d="M13 20 H46 V44 Q46 51 39 51 H21 Q13 51 13 44 Z" fill={product.color} stroke={stroke} strokeWidth="1.8" />
          <Path d="M46 25 H51 Q58 25 56 33 Q55 40 46 39" fill="none" stroke={stroke} strokeWidth="2.2" />
          <Path d="M17 24 H42" stroke={colors.card} strokeWidth="2" opacity="0.8" />
          {drawCharacter(characterIds[0], 30, 36, 0.48)}
        </>
      ) : product.illustration === 'box' ? (
        <>
          <Rect x="10" y="15" width="44" height="38" rx="5" fill={product.color} stroke={stroke} strokeWidth="1.8" />
          <Path d="M32 15 V53 M10 27 H54" stroke={colors.candyCream} strokeWidth="2" />
          <Path d="M32 17 C23 8 18 15 27 21 M32 17 C41 8 46 15 37 21" fill="none" stroke={colors.candyRoseDark} strokeWidth="2" />
          {drawCharacter(characterIds[0], 32, 39, 0.48)}
        </>
      ) : (
        <>
          <Rect x="11" y="7" width="42" height="50" rx={product.illustration === 'sticker' ? 10 : 4} fill={colors.card} stroke={stroke} strokeWidth="1.8" />
          <Rect x="15" y="11" width="34" height="42" rx={product.illustration === 'sticker' ? 8 : 2} fill={product.color} opacity="0.76" />
          {product.illustration === 'book' && <Path d="M32 11 V53 M28 13 H32" stroke={colors.candyCream} strokeWidth="1.5" />}
          {product.illustration === 'sticker' && <Circle cx="47" cy="13" r="4" fill={colors.candyLemon} stroke={colors.card} strokeWidth="1.5" />}
          {drawCharacter(characterIds[0], 32, 34, 0.6)}
          <Path d="M19 49 Q32 45 45 49" stroke={colors.candyCream} strokeWidth="1.5" opacity="0.8" />
        </>
      )}
      <Path d="M8 14 L10 11 L12 14 L10 17 Z M52 49 L54 46 L56 49 L54 52 Z" fill={colors.candyLemon} />
    </Svg>
  );
}

export function CharacterMerchandiseVisual({
  product,
  motion,
  size,
  index,
}: {
  product: ShopDisplayProduct;
  motion: Animated.Value;
  size: number;
  index: number;
}) {
  const colors = useColors();
  const reducedMotion = useReducedMotion() !== false;
  const character = getShopCharacterMerchandiseProfile(product.theme, product.name, product.variant);
  if (!character) return null;
  const characterIds = [character.id, ...(character.companionIds ?? [])] as CharacterId[];
  const lift = reducedMotion ? 0 : motion.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5 - (index % 3) * 0.25] });
  const tilt = reducedMotion ? '0deg' : motion.interpolate({
    inputRange: [0, 1],
    outputRange: [index % 2 ? '3deg' : '-3deg', index % 2 ? '-3deg' : '3deg'],
  });
  const scale = reducedMotion ? 1 : motion.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  return (
    <Animated.View
      testID={`shop-character-merchandise-${product.id}`}
      accessible={false}
      importantForAccessibility="no"
      style={[styles.canvas, { width: size, height: size, transform: [{ translateY: lift }, { rotate: tilt }, { scale }] }]}
    >
      <View pointerEvents="none" style={[styles.halo, { backgroundColor: product.color }]} />
      {character.theme === 'chiikawa' ? (
        <ChiikawaReferenceArtwork
          product={product}
          characterId={character.id as CharacterId}
          referenceArtwork={character.referenceArtwork}
          size={size * 0.92}
        />
      ) : (
        <ThemedProductArtwork product={product} characterIds={characterIds} colors={colors} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  canvas: { alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  halo: { position: 'absolute', width: '78%', height: '78%', borderRadius: 999, opacity: 0.24 },
  referenceArtFrame: { alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1, overflow: 'hidden' },
  referenceArtImage: { backgroundColor: 'transparent' },
});
