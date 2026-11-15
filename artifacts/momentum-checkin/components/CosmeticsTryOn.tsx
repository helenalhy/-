import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { ImageSourcePropType } from 'react-native';
import type { ShopDisplayProduct } from '@/constants/mall-shop-display';
import { getCosmeticsTryOnPreviewLayout } from '@/constants/cosmetics-try-on-layout';
import { useColors } from '@/hooks/useColors';

type EyeshadowCurve = {
  centerX: number;
  centerY: number;
  halfWidth: number;
  bend: number;
  tilt: number;
  thickness: number;
};

type GuestMakeupAnchors = {
  leftEye: EyeshadowCurve;
  rightEye: EyeshadowCurve;
  lipsX: number;
  lipsY: number;
  lipHalfWidth: number;
};

const GUEST_PORTRAITS: ReadonlyArray<{
  id: string;
  source: ImageSourcePropType;
  makeup: GuestMakeupAnchors;
}> = [
  {
    id: 'guest-1',
    source: require('../assets/images/cosmetics-tryon-guest-portrait-01.png'),
    makeup: {
      leftEye: { centerX: 46, centerY: 60, halfWidth: 7.4, bend: -2.6, tilt: 0.3, thickness: 2.3 },
      rightEye: { centerX: 73, centerY: 60, halfWidth: 7.2, bend: -2.3, tilt: -0.2, thickness: 2.3 },
      lipsX: 60,
      lipsY: 81,
      lipHalfWidth: 4.5,
    },
  },
  {
    id: 'guest-2',
    source: require('../assets/images/cosmetics-tryon-guest-portrait-02.png'),
    makeup: {
      leftEye: { centerX: 45, centerY: 54, halfWidth: 7.8, bend: -2.5, tilt: 0.2, thickness: 2.3 },
      rightEye: { centerX: 73, centerY: 54, halfWidth: 7.8, bend: -2.8, tilt: -0.2, thickness: 2.3 },
      lipsX: 60,
      lipsY: 78,
      lipHalfWidth: 5.5,
    },
  },
  {
    id: 'guest-3',
    source: require('../assets/images/cosmetics-tryon-guest-portrait-03.png'),
    makeup: {
      leftEye: { centerX: 45, centerY: 51, halfWidth: 7.2, bend: -1.9, tilt: 0.5, thickness: 2.3 },
      rightEye: { centerX: 74, centerY: 51, halfWidth: 7.1, bend: -2.2, tilt: -0.3, thickness: 2.3 },
      lipsX: 60,
      lipsY: 71,
      lipHalfWidth: 5,
    },
  },
  {
    id: 'guest-4',
    source: require('../assets/images/cosmetics-tryon-guest-portrait-04.png'),
    makeup: {
      leftEye: { centerX: 45, centerY: 53, halfWidth: 7.2, bend: -1.7, tilt: 0.6, thickness: 2.3 },
      rightEye: { centerX: 73, centerY: 53, halfWidth: 7.1, bend: -2.0, tilt: -0.5, thickness: 2.3 },
      lipsX: 60,
      lipsY: 72,
      lipHalfWidth: 5,
    },
  },
  {
    id: 'guest-5',
    source: require('../assets/images/cosmetics-tryon-guest-portrait-05.png'),
    makeup: {
      leftEye: { centerX: 45, centerY: 53, halfWidth: 7.3, bend: -2.3, tilt: 0.3, thickness: 2.3 },
      rightEye: { centerX: 74, centerY: 53, halfWidth: 7.2, bend: -2.0, tilt: -0.2, thickness: 2.3 },
      lipsX: 60,
      lipsY: 72,
      lipHalfWidth: 4.1,
    },
  },
  {
    id: 'guest-6',
    source: require('../assets/images/cosmetics-tryon-guest-portrait-06.png'),
    makeup: {
      leftEye: { centerX: 45, centerY: 52, halfWidth: 7.2, bend: -2.4, tilt: 0.2, thickness: 2.3 },
      rightEye: { centerX: 73, centerY: 52, halfWidth: 7.2, bend: -2.5, tilt: -0.2, thickness: 2.3 },
      lipsX: 60,
      lipsY: 72,
      lipHalfWidth: 5.2,
    },
  },
  {
    id: 'guest-7',
    source: require('../assets/images/cosmetics-tryon-guest-portrait-07.png'),
    makeup: {
      leftEye: { centerX: 45, centerY: 55, halfWidth: 7.4, bend: -1.8, tilt: 0.5, thickness: 2.3 },
      rightEye: { centerX: 73, centerY: 55, halfWidth: 7.4, bend: -2.1, tilt: -0.4, thickness: 2.3 },
      lipsX: 60,
      lipsY: 72,
      lipHalfWidth: 5,
    },
  },
  {
    id: 'guest-8',
    source: require('../assets/images/cosmetics-tryon-guest-portrait-08.png'),
    makeup: {
      leftEye: { centerX: 46, centerY: 55, halfWidth: 7.2, bend: -2.2, tilt: 0.3, thickness: 2.3 },
      rightEye: { centerX: 74, centerY: 55, halfWidth: 7.2, bend: -2.0, tilt: -0.4, thickness: 2.3 },
      lipsX: 60,
      lipsY: 81,
      lipHalfWidth: 4.5,
    },
  },
];

function getEyeshadowPath(eye: EyeshadowCurve) {
  const leftX = eye.centerX - eye.halfWidth;
  const rightX = eye.centerX + eye.halfWidth;
  const leftY = eye.centerY - eye.tilt / 2;
  const rightY = eye.centerY + eye.tilt / 2;
  const curveY = eye.centerY + eye.bend;
  // Positive bend follows a downward-curving lid; negative bend follows an upward arch.
  return `M ${leftX} ${leftY} Q ${eye.centerX} ${curveY} ${rightX} ${rightY} L ${rightX} ${rightY + eye.thickness} Q ${eye.centerX} ${curveY + eye.thickness} ${leftX} ${leftY + eye.thickness} Z`;
}

function getLipstickPath(centerX: number, centerY: number, halfWidth: number) {
  const upperHeight = 1;
  const lowerHeight = 1.2;
  const leftX = centerX - halfWidth;
  const rightX = centerX + halfWidth;
  return `M ${leftX} ${centerY} C ${centerX - halfWidth * 0.72} ${centerY - upperHeight * 0.72}, ${centerX - halfWidth * 0.24} ${centerY - upperHeight}, ${centerX} ${centerY - upperHeight * 0.3} C ${centerX + halfWidth * 0.24} ${centerY - upperHeight}, ${centerX + halfWidth * 0.72} ${centerY - upperHeight * 0.72}, ${rightX} ${centerY} C ${centerX + halfWidth * 0.74} ${centerY + lowerHeight * 0.75}, ${centerX + halfWidth * 0.24} ${centerY + lowerHeight}, ${centerX} ${centerY + lowerHeight * 0.72} C ${centerX - halfWidth * 0.24} ${centerY + lowerHeight}, ${centerX - halfWidth * 0.74} ${centerY + lowerHeight * 0.75}, ${leftX} ${centerY} Z`;
}

function getEyeSparklePoints(eye: EyeshadowCurve, finish: ShopDisplayProduct['finish']) {
  if (finish !== 'glitter' && finish !== 'shimmer') return [];
  const samples = finish === 'glitter' ? [0.16, 0.34, 0.52, 0.70, 0.88] : [0.28, 0.56, 0.82];
  return samples.map((t, index) => {
    const inverse = 1 - t;
    const startX = eye.centerX - eye.halfWidth;
    const endX = eye.centerX + eye.halfWidth;
    const startY = eye.centerY - eye.tilt / 2;
    const endY = eye.centerY + eye.tilt / 2;
    return {
      x: inverse ** 2 * startX + 2 * inverse * t * eye.centerX + t ** 2 * endX,
      y: inverse ** 2 * startY
        + 2 * inverse * t * (eye.centerY + eye.bend)
        + t ** 2 * endY
        + eye.thickness * 0.56,
      radius: finish === 'glitter' ? (index % 2 === 0 ? 0.8 : 0.65) : 0.45,
    };
  });
}

function getLipSparklePoints(centerX: number, centerY: number, finish: ShopDisplayProduct['finish']) {
  if (finish !== 'glitter' && finish !== 'shimmer') return [];
  const offsets = finish === 'glitter' ? [-2.2, -0.7, 0.9, 2.4] : [-1.4, 1.5];
  return offsets.map((offset, index) => ({
    x: centerX + offset,
    y: centerY + (index % 2 === 0 ? 0 : 0.45),
    radius: finish === 'glitter' ? 0.55 : 0.4,
  }));
}

export function CosmeticsTryOn({ products }: { products: ShopDisplayProduct[] }) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const previewLayout = getCosmeticsTryOnPreviewLayout(width);
  const compactLayout = previewLayout.isCompact;
  const lipsticks = products.filter(({ illustration }) => illustration === 'lipstick');
  const eyeshadows = products.filter(({ illustration }) => illustration === 'palette');
  const [selectedGuestIndex, setSelectedGuestIndex] = useState(0);
  const [selectedLipstickId, setSelectedLipstickId] = useState<string | null>(null);
  const [selectedEyeshadowId, setSelectedEyeshadowId] = useState<string | null>(null);
  const selectedGuest = GUEST_PORTRAITS[selectedGuestIndex] ?? GUEST_PORTRAITS[0];
  const selectedLipstick = lipsticks.find(({ id }) => id === selectedLipstickId) ?? lipsticks[0];
  const selectedEyeshadow = eyeshadows.find(({ id }) => id === selectedEyeshadowId) ?? eyeshadows[0];

  if (!selectedLipstick || !selectedEyeshadow) {
    return (
      <View testID="cosmetics-try-on-unavailable" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>目前沒有可試用的唇色或眼影商品。</Text>
      </View>
    );
  }

  function renderChoices(
    label: string,
    choices: ShopDisplayProduct[],
    selectedId: string,
    onSelect: (id: string) => void,
    testIdPrefix: string,
  ) {
    return (
      <View style={styles.choiceGroup}>
        <Text style={[styles.choiceLabel, { color: colors.foreground }]}>{label}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceList}>
          {choices.map((product) => {
            const selected = product.id === selectedId;
            return (
              <Pressable
                key={product.id}
                testID={`${testIdPrefix}-${product.id}`}
                accessibilityRole="button"
                accessibilityLabel={`試用${label}：${product.name}${product.finish === 'glitter' ? '，閃粉款' : product.finish === 'shimmer' ? '，珠光款' : ''}`}
                accessibilityState={{ selected }}
                onPress={() => onSelect(product.id)}
                style={[
                  styles.choice,
                  {
                    backgroundColor: selected ? colors.secondary : colors.background,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={[styles.swatch, { backgroundColor: product.color, borderColor: colors.border }]}>
                  {product.finish === 'glitter' && <Feather name="star" size={13} color={colors.card} />}
                </View>
                <Text numberOfLines={2} style={[styles.choiceName, { color: colors.foreground }]}>
                  {product.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View testID="cosmetics-try-on" style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.candyPink }]}>
          <Feather name="heart" size={16} color={colors.candyRoseDark} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>唇色與眼影試搭</Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>選擇喜歡的色彩，即時看看搭配效果。</Text>
        </View>
        <View style={[styles.freePill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.freeText, { color: colors.primary }]}>免費</Text>
        </View>
      </View>

      <View
        testID="cosmetics-try-on-preview"
        accessible
        accessibilityLabel={`第 ${selectedGuestIndex + 1} 位客人妝容預覽：${selectedLipstick.name}搭配${selectedEyeshadow.name}`}
        style={[
          styles.preview,
          { flexDirection: previewLayout.direction },
          { backgroundColor: colors.candyCream, borderColor: colors.border },
        ]}
      >
        <View
          testID="cosmetics-try-on-portrait"
          style={[
            styles.portraitStage,
            { width: previewLayout.portraitSize, height: previewLayout.portraitSize },
            { backgroundColor: colors.candyPeach, borderColor: colors.candyPink },
          ]}
        >
          <Image
            testID="cosmetics-try-on-guest-art"
            accessible={false}
            source={selectedGuest.source}
            resizeMode="cover"
            fadeDuration={0}
            style={styles.guestPortrait}
          />
          <View testID="cosmetics-try-on-makeup-layer" pointerEvents="none" style={styles.makeupLayer}>
            <Svg width="100%" height="100%" viewBox="0 0 120 120" preserveAspectRatio="none">
              <Path
                testID="cosmetics-try-on-eyeshadow-left"
                d={getEyeshadowPath(selectedGuest.makeup.leftEye)}
                fill={selectedEyeshadow.color}
                fillOpacity={0.42}
              />
              <Path
                testID="cosmetics-try-on-eyeshadow-right"
                d={getEyeshadowPath(selectedGuest.makeup.rightEye)}
                fill={selectedEyeshadow.color}
                fillOpacity={0.42}
              />
              {getEyeSparklePoints(selectedGuest.makeup.leftEye, selectedEyeshadow.finish).map((point, index) => (
                <Circle
                  key={`left-eye-glitter-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={point.radius}
                  fill={index % 2 === 0 ? colors.card : colors.primary}
                  opacity={0.92}
                />
              ))}
              {getEyeSparklePoints(selectedGuest.makeup.rightEye, selectedEyeshadow.finish).map((point, index) => (
                <Circle
                  key={`right-eye-glitter-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={point.radius}
                  fill={index % 2 === 0 ? colors.card : colors.primary}
                  opacity={0.92}
                />
              ))}
              <Path
                testID="cosmetics-try-on-lips"
                d={getLipstickPath(selectedGuest.makeup.lipsX, selectedGuest.makeup.lipsY, selectedGuest.makeup.lipHalfWidth)}
                fill={selectedLipstick.color}
                fillOpacity={0.56}
              />
              {getLipSparklePoints(selectedGuest.makeup.lipsX, selectedGuest.makeup.lipsY, selectedLipstick.finish).map((point, index) => (
                <Circle
                  key={`lip-glitter-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={point.radius}
                  fill={index % 2 === 0 ? colors.card : colors.primary}
                  opacity={0.95}
                />
              ))}
            </Svg>
          </View>
        </View>
        <View style={[styles.previewCopy, compactLayout && styles.compactPreviewCopy]}>
          <Text style={[styles.previewEyebrow, { color: colors.primary }]}>客人妝容預覽</Text>
          <Text style={[styles.previewName, { color: colors.foreground }]} numberOfLines={1}>{selectedLipstick.name}</Text>
          <Text style={[styles.previewName, { color: colors.foreground }]} numberOfLines={1}>{selectedEyeshadow.name}</Text>
        </View>
      </View>

      <View style={styles.choiceGroup}>
        <Text style={[styles.choiceLabel, { color: colors.foreground }]}>選擇試妝客人</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.guestChoiceList}>
          {GUEST_PORTRAITS.map((guest, index) => {
            const selected = index === selectedGuestIndex;
            return (
              <Pressable
                key={guest.id}
                testID={`cosmetics-guest-${index + 1}`}
                accessibilityRole="button"
                accessibilityLabel={`選擇客人 ${index + 1} 試妝`}
                accessibilityState={{ selected }}
                onPress={() => setSelectedGuestIndex(index)}
                style={[
                  styles.guestChoice,
                  {
                    backgroundColor: selected ? colors.secondary : colors.background,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <View style={[styles.guestChoicePortrait, { backgroundColor: colors.candyPeach, borderColor: colors.border }]}>
                  <Image accessible={false} source={guest.source} resizeMode="cover" style={styles.guestChoiceImage} />
                </View>
                <Text style={[styles.guestChoiceName, { color: colors.foreground }]}>客人 {index + 1}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {renderChoices(`唇色（${lipsticks.length}款）`, lipsticks, selectedLipstick.id, setSelectedLipstickId, 'cosmetics-lip')}
      {renderChoices(`眼影（${eyeshadows.length}款）`, eyeshadows, selectedEyeshadow.id, setSelectedEyeshadowId, 'cosmetics-eyeshadow')}

      <View style={styles.note}>
        <Feather name="info" size={13} color={colors.mutedForeground} />
        <Text style={[styles.noteText, { color: colors.mutedForeground }]}>試色只會改變預覽，不扣金幣，也不會更改商品陳列。</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 16, gap: 15 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '800' },
  copy: { fontSize: 12, lineHeight: 17 },
  freePill: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5 },
  freeText: { fontSize: 11, fontWeight: '800' },
  preview: { minHeight: 174, borderWidth: 1, borderRadius: 17, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  portraitStage: { flexShrink: 0, position: 'relative', borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  guestPortrait: { position: 'absolute', width: '100%', height: '100%' },
  makeupLayer: { ...StyleSheet.absoluteFill, zIndex: 2 },
  guestChoiceList: { gap: 8, paddingRight: 4 },
  guestChoice: { width: 72, minHeight: 84, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 5 },
  guestChoicePortrait: { width: 58, height: 55, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  guestChoiceImage: { width: 58, height: 55 },
  guestChoiceName: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  previewCopy: { flex: 1, gap: 6 },
  compactPreviewCopy: { width: '100%', flex: 0 },
  previewEyebrow: { fontSize: 11, fontWeight: '800' },
  previewName: { fontSize: 12, fontWeight: '700' },
  choiceGroup: { gap: 8 },
  choiceLabel: { fontSize: 13, fontWeight: '800' },
  choiceList: { gap: 8, paddingRight: 4 },
  choice: { width: 88, minHeight: 82, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 5, paddingVertical: 7 },
  swatch: { width: 25, height: 25, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  choiceName: { fontSize: 10, fontWeight: '600', textAlign: 'center', lineHeight: 13 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  noteText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
