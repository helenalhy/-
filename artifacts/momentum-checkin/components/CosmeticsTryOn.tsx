import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ShopDisplayProduct } from '@/constants/mall-shop-display';
import { useColors } from '@/hooks/useColors';

export function CosmeticsTryOn({ products }: { products: ShopDisplayProduct[] }) {
  const colors = useColors();
  const lipsticks = products.filter(({ illustration }) => illustration === 'lipstick');
  const eyeshadows = products.filter(({ illustration }) => illustration === 'palette');
  const [selectedLipstickId, setSelectedLipstickId] = useState<string | null>(null);
  const [selectedEyeshadowId, setSelectedEyeshadowId] = useState<string | null>(null);
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
        accessibilityLabel={`妝容預覽：${selectedLipstick.name}搭配${selectedEyeshadow.name}`}
        style={[styles.preview, { backgroundColor: colors.candyCream, borderColor: colors.border }]}
      >
        <View style={styles.portraitStage}>
          <View style={[styles.hairCap, { backgroundColor: colors.candyLavenderDark }]} />
          <View style={[styles.face, { backgroundColor: colors.candyPeach, borderColor: colors.candyCaramelDark }]}>
            <View style={styles.eyeRow}>
              {[0, 1].map((eye) => (
                <View key={eye} style={styles.eyeGroup}>
                  <View style={[styles.eyeshadow, { backgroundColor: selectedEyeshadow.color }]} />
                  <View style={[styles.eye, { backgroundColor: colors.foreground }]} />
                </View>
              ))}
            </View>
            <View style={styles.cheekRow}>
              <View style={[styles.cheek, { backgroundColor: selectedLipstick.color }]} />
              <View style={[styles.cheek, { backgroundColor: selectedLipstick.color }]} />
            </View>
            <View testID="cosmetics-try-on-lips" style={[styles.lips, { backgroundColor: selectedLipstick.color }]} />
          </View>
          <View style={[styles.hairBangs, { backgroundColor: colors.candyLavenderDark }]} />
        </View>
        <View style={styles.previewCopy}>
          <Text style={[styles.previewEyebrow, { color: colors.primary }]}>試妝預覽</Text>
          <Text style={[styles.previewName, { color: colors.foreground }]} numberOfLines={1}>{selectedLipstick.name}</Text>
          <Text style={[styles.previewName, { color: colors.foreground }]} numberOfLines={1}>{selectedEyeshadow.name}</Text>
        </View>
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
  preview: { minHeight: 157, borderWidth: 1, borderRadius: 17, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
  portraitStage: { width: 116, height: 136, alignItems: 'center', justifyContent: 'center' },
  hairCap: { position: 'absolute', top: 13, width: 76, height: 61, borderTopLeftRadius: 40, borderTopRightRadius: 40, borderBottomLeftRadius: 23, borderBottomRightRadius: 23 },
  face: { width: 68, height: 94, marginTop: 22, borderWidth: 1.2, borderRadius: 36, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  hairBangs: { position: 'absolute', top: 33, width: 62, height: 20, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, transform: [{ rotate: '-3deg' }] },
  eyeRow: { width: 42, marginTop: 23, flexDirection: 'row', justifyContent: 'space-between' },
  eyeGroup: { alignItems: 'center', gap: 2 },
  eyeshadow: { width: 15, height: 5, borderRadius: 4, opacity: 0.8 },
  eye: { width: 4, height: 5, borderRadius: 3 },
  cheekRow: { width: 49, flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cheek: { width: 9, height: 5, borderRadius: 6, opacity: 0.45 },
  lips: { width: 15, height: 7, marginTop: 2, borderRadius: 8, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
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
