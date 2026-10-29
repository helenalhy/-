import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ImageSourcePropType } from 'react-native';
import type { ShopDisplayProduct } from '@/constants/mall-shop-display';
import { useColors } from '@/hooks/useColors';

type GuestMakeupAnchors = {
  leftEye: number;
  rightEye: number;
  eyeLine: number;
  lipsX: number;
  lipsY: number;
};

const GUEST_PORTRAITS: ReadonlyArray<{
  id: string;
  source: ImageSourcePropType;
  makeup: GuestMakeupAnchors;
}> = [
  { id: 'guest-1', source: require('../assets/images/cosmetics-tryon-guest-portrait-01.png'), makeup: { leftEye: 55, rightEye: 86, eyeLine: 78, lipsX: 71, lipsY: 95 } },
  { id: 'guest-2', source: require('../assets/images/cosmetics-tryon-guest-portrait-02.png'), makeup: { leftEye: 53, rightEye: 85, eyeLine: 72, lipsX: 69, lipsY: 88 } },
  { id: 'guest-3', source: require('../assets/images/cosmetics-tryon-guest-portrait-03.png'), makeup: { leftEye: 56, rightEye: 88, eyeLine: 78, lipsX: 72, lipsY: 92 } },
  { id: 'guest-4', source: require('../assets/images/cosmetics-tryon-guest-portrait-04.png'), makeup: { leftEye: 54, rightEye: 86, eyeLine: 78, lipsX: 70, lipsY: 92 } },
  { id: 'guest-5', source: require('../assets/images/cosmetics-tryon-guest-portrait-05.png'), makeup: { leftEye: 51, rightEye: 83, eyeLine: 80, lipsX: 68, lipsY: 95 } },
  { id: 'guest-6', source: require('../assets/images/cosmetics-tryon-guest-portrait-06.png'), makeup: { leftEye: 56, rightEye: 89, eyeLine: 77, lipsX: 72, lipsY: 90 } },
  { id: 'guest-7', source: require('../assets/images/cosmetics-tryon-guest-portrait-07.png'), makeup: { leftEye: 56, rightEye: 88, eyeLine: 79, lipsX: 72, lipsY: 94 } },
  { id: 'guest-8', source: require('../assets/images/cosmetics-tryon-guest-portrait-08.png'), makeup: { leftEye: 55, rightEye: 86, eyeLine: 76, lipsX: 70, lipsY: 90 } },
];

export function CosmeticsTryOn({ products }: { products: ShopDisplayProduct[] }) {
  const colors = useColors();
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
                accessibilityLabel={`試用${label}：${product.name}`}
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
                  <Feather
                    name={label === '唇色' ? 'heart' : 'star'}
                    size={11}
                    color={colors.candyCream}
                  />
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
        style={[styles.preview, { backgroundColor: colors.candyCream, borderColor: colors.border }]}
      >
        <View
          testID="cosmetics-try-on-portrait"
          style={[styles.portraitStage, { backgroundColor: colors.candyPeach, borderColor: colors.candyPink }]}
        >
          <Image
            testID="cosmetics-try-on-guest-art"
            accessible={false}
            source={selectedGuest.source}
            resizeMode="stretch"
            fadeDuration={0}
            style={styles.guestPortrait}
          />
          <View
            testID="cosmetics-try-on-eyeshadow-left"
            pointerEvents="none"
            style={[
              styles.eyeshadowOverlay,
              { left: selectedGuest.makeup.leftEye - 7, top: selectedGuest.makeup.eyeLine - 3, backgroundColor: selectedEyeshadow.color },
            ]}
          />
          <View
            testID="cosmetics-try-on-eyeshadow-right"
            pointerEvents="none"
            style={[
              styles.eyeshadowOverlay,
              { left: selectedGuest.makeup.rightEye - 7, top: selectedGuest.makeup.eyeLine - 3, backgroundColor: selectedEyeshadow.color },
            ]}
          />
          <View
            testID="cosmetics-try-on-lips"
            pointerEvents="none"
            style={[
              styles.lipstickOverlay,
              { left: selectedGuest.makeup.lipsX - 7, top: selectedGuest.makeup.lipsY - 3, backgroundColor: selectedLipstick.color },
            ]}
          />
        </View>
        <View style={styles.previewCopy}>
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
                  <Image accessible={false} source={guest.source} resizeMode="stretch" style={styles.guestChoiceImage} />
                </View>
                <Text style={[styles.guestChoiceName, { color: colors.foreground }]}>客人 {index + 1}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {renderChoices('唇色', lipsticks, selectedLipstick.id, setSelectedLipstickId, 'cosmetics-lip')}
      {renderChoices('眼影', eyeshadows, selectedEyeshadow.id, setSelectedEyeshadowId, 'cosmetics-eyeshadow')}

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
  portraitStage: { width: 144, height: 136, borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  guestPortrait: { position: 'absolute', width: 144, height: 136 },
  eyeshadowOverlay: { position: 'absolute', width: 14, height: 6, borderRadius: 8, opacity: 0.55 },
  lipstickOverlay: { position: 'absolute', width: 14, height: 6, borderRadius: 8, opacity: 0.78 },
  guestChoiceList: { gap: 8, paddingRight: 4 },
  guestChoice: { width: 72, minHeight: 84, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 5 },
  guestChoicePortrait: { width: 58, height: 55, borderWidth: 1, borderRadius: 10, overflow: 'hidden' },
  guestChoiceImage: { width: 58, height: 55 },
  guestChoiceName: { fontSize: 9, fontWeight: '700', textAlign: 'center' },
  previewCopy: { flex: 1, gap: 6 },
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
