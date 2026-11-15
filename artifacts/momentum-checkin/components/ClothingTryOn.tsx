import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import palette from '@/constants/colors';
import { useColors } from '@/hooks/useColors';

const c = palette.light;

const MODELS = [
  { id: 'guest-1', name: '客人 1', source: require('../assets/images/cosmetics-tryon-guest-portrait-01.png') },
  { id: 'guest-2', name: '客人 2', source: require('../assets/images/cosmetics-tryon-guest-portrait-02.png') },
  { id: 'guest-3', name: '客人 3', source: require('../assets/images/cosmetics-tryon-guest-portrait-03.png') },
  { id: 'guest-4', name: '客人 4', source: require('../assets/images/cosmetics-tryon-guest-portrait-04.png') },
  { id: 'guest-5', name: '客人 5', source: require('../assets/images/cosmetics-tryon-guest-portrait-05.png') },
  { id: 'guest-6', name: '客人 6', source: require('../assets/images/cosmetics-tryon-guest-portrait-06.png') },
  { id: 'guest-7', name: '客人 7', source: require('../assets/images/cosmetics-tryon-guest-portrait-07.png') },
  { id: 'guest-8', name: '客人 8', source: require('../assets/images/cosmetics-tryon-guest-portrait-08.png') },
] as const;

const BRIDAL_LOOKS = [
  { id: 'lace-princess', name: '蕾絲公主婚紗', color: '#FFF7F6', trim: '#D99AAE', cut: 'gown' },
  { id: 'pearl-a-line', name: '珍珠A字長裙', color: '#FFF5E9', trim: '#C6A66D', cut: 'dress' },
  { id: 'rose-ballgown', name: '玫瑰蓬裙禮服', color: '#FBE4EC', trim: '#C66D93', cut: 'gown' },
  { id: 'moonlight-satin', name: '月光緞面婚紗', color: '#E9E9FA', trim: '#8C83BD', cut: 'gown' },
  { id: 'garden-veil', name: '花園薄紗婚紗', color: '#EAF5ED', trim: '#86A88B', cut: 'dress' },
  { id: 'champagne-empire', name: '香檳高腰婚紗', color: '#F5E4C9', trim: '#B68C55', cut: 'gown' },
  { id: 'bluebell-ceremony', name: '風鈴草藍婚紗', color: '#E1EFF9', trim: '#75A9C2', cut: 'dress' },
  { id: 'starlight-train', name: '星光長拖尾婚紗', color: '#F1E4F8', trim: '#AB83BF', cut: 'gown' },
] as const;

const CUSTOM_LOOKS = [
  { id: 'lace-dress', name: '花邊洋裝', color: '#F7DCE7', trim: '#BD6388', cut: 'dress' },
  { id: 'puff-sleeve', name: '泡泡袖上衣', color: '#DFEAF8', trim: '#7198C0', cut: 'tailored' },
  { id: 'pleated-skirt', name: '百褶裙套裝', color: '#E3F0E5', trim: '#72A17F', cut: 'dress' },
  { id: 'ribbon-blouse', name: '蝴蝶結襯衫', color: '#F5E8C9', trim: '#B28C45', cut: 'tailored' },
  { id: 'tulle-cape', name: '薄紗披肩裙', color: '#EAE3F7', trim: '#8A78B4', cut: 'gown' },
  { id: 'sakura-kimono', name: '櫻花和風袍', color: '#F5DDE0', trim: '#BD7380', cut: 'kimono' },
] as const;

const FABRIC_SWATCHES = [
  { name: '玫瑰蕾絲', color: '#F7DCE7', trim: '#BD6388' },
  { name: '薄荷棉布', color: '#DFF0E5', trim: '#70A27F' },
  { name: '星點薄紗', color: '#E7E2F7', trim: '#8173B1' },
  { name: '天空格紋', color: '#DFEDF8', trim: '#6C9FC0' },
  { name: '香檳緞布', color: '#F4E7CF', trim: '#B18A4C' },
  { name: '珊瑚刺繡', color: '#F7DFD9', trim: '#C57868' },
] as const;

type OutfitCut = typeof BRIDAL_LOOKS[number]['cut'] | typeof CUSTOM_LOOKS[number]['cut'];

function OutfitPreview({ color, trim, cut }: { color: string; trim: string; cut: OutfitCut }) {
  const shape = cut === 'tailored'
    ? 'M82 8 C66 10 55 17 42 23 L18 43 L32 59 L53 47 L53 119 L187 119 L187 47 L208 59 L222 43 L198 23 C184 17 173 10 158 8 C145 22 95 22 82 8 Z'
    : cut === 'kimono'
      ? 'M80 8 L45 23 L18 57 L42 73 L61 53 L54 121 L186 121 L179 53 L198 73 L222 57 L195 23 L160 8 C143 24 97 24 80 8 Z'
      : 'M82 8 C65 10 56 18 42 24 L18 43 L32 60 L53 48 L46 105 L34 124 L206 124 L194 105 L187 48 L208 60 L222 43 L198 24 C184 18 175 10 158 8 C145 22 95 22 82 8 Z';

  return (
    <Svg width="100%" height="148" viewBox="0 0 240 148" style={styles.outfitOverlay} testID="clothing-try-on-outfit">
      <Path d={shape} fill={color} stroke={trim} strokeWidth="4" strokeLinejoin="round" />
      {cut === 'gown' && <Path d="M45 104 Q120 92 195 104 L206 126 H34 Z" fill={color} stroke={trim} strokeWidth="2" opacity="0.9" />}
      {cut === 'kimono' && (
        <>
          <Path d="M80 13 L120 58 L160 13 L176 25 L134 75 L120 64 L106 75 L64 25 Z" fill={trim} opacity="0.86" />
          <Path d="M87 83 H153" stroke={trim} strokeWidth="8" />
        </>
      )}
      {cut !== 'kimono' && (
        <>
          <Path d="M82 15 Q120 47 158 15" fill="none" stroke={trim} strokeWidth="4" />
          <Path d="M57 94 Q120 84 183 94" fill="none" stroke={trim} strokeWidth="3" strokeDasharray="3 7" />
        </>
      )}
      <Circle cx="120" cy="67" r="5" fill={trim} />
      <Circle cx="109" cy="68" r="2.5" fill="#FFFFFF" />
      <Circle cx="131" cy="68" r="2.5" fill="#FFFFFF" />
    </Svg>
  );
}

export function ClothingTryOn({ kind }: { kind: 'bridal' | 'custom' }) {
  const colors = useColors();
  const looks = kind === 'bridal' ? BRIDAL_LOOKS : CUSTOM_LOOKS;
  const [modelId, setModelId] = useState<string>(MODELS[0].id);
  const [lookId, setLookId] = useState<string>(looks[0].id);
  const [fabricIndex, setFabricIndex] = useState(0);
  const model = MODELS.find(({ id }) => id === modelId) ?? MODELS[0];
  const look = looks.find(({ id }) => id === lookId) ?? looks[0];
  const fabric = FABRIC_SWATCHES[fabricIndex];
  const color = kind === 'custom' ? fabric.color : look.color;
  const trim = kind === 'custom' ? fabric.trim : look.trim;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID={`clothing-try-on-${kind}`}>
      <View style={styles.headingRow}>
        <View style={[styles.headingIcon, { backgroundColor: colors.secondary }]}>
          <Feather name={kind === 'bridal' ? 'heart' : 'scissors'} size={18} color={colors.primary} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={[styles.heading, { color: colors.foreground }]}>{kind === 'bridal' ? '婚紗試穿預覽' : '萊斯布料訂製預覽'}</Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
            {kind === 'bridal' ? '挑選不同婚紗款式，查看試穿效果' : '選布料與剪裁，即時預覽訂製造型'}
          </Text>
        </View>
        <View style={[styles.previewPill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.previewPillText, { color: colors.primary }]}>即時預覽</Text>
        </View>
      </View>

      <View style={[styles.previewFrame, { borderColor: colors.border, backgroundColor: kind === 'bridal' ? '#FFF8F6' : '#FFF8F3' }]} testID="clothing-try-on-preview">
        <View style={styles.previewCanvas}>
          <View style={[styles.sceneAccent, { borderColor: trim, backgroundColor: `${color}88` }]} />
          <Image source={model.source} resizeMode="contain" style={styles.modelImage} />
          <OutfitPreview color={color} trim={trim} cut={look.cut} />
          <View style={[styles.lookBadge, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.lookName, { color: colors.foreground }]}>{look.name}</Text>
            {kind === 'custom' && <Text style={[styles.fabricName, { color: colors.mutedForeground }]}>{fabric.name}</Text>}
          </View>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>選擇試穿客人</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelRow}>
        {MODELS.map((option) => {
          const selected = option.id === modelId;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={option.name}
              accessibilityState={{ selected }}
              onPress={() => setModelId(option.id)}
              style={[styles.modelChoice, { backgroundColor: selected ? colors.secondary : colors.background, borderColor: selected ? colors.primary : colors.border }]}
            >
              <Image source={option.source} resizeMode="contain" style={styles.modelThumbnail} />
              <Text numberOfLines={1} style={[styles.modelLabel, { color: selected ? colors.primary : colors.mutedForeground }]}>{option.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>{kind === 'bridal' ? '婚紗款式' : '訂製服裝款式'}</Text>
      <View style={styles.optionGrid}>
        {looks.map((option) => {
          const selected = option.id === lookId;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={option.name}
              accessibilityState={{ selected }}
              onPress={() => setLookId(option.id)}
              style={[styles.lookChoice, { backgroundColor: selected ? colors.secondary : colors.background, borderColor: selected ? colors.primary : colors.border }]}
            >
              <View style={[styles.lookSwatch, { backgroundColor: kind === 'custom' ? color : option.color, borderColor: kind === 'custom' ? trim : option.trim }]}>
                <Feather name="shopping-bag" size={17} color={colors.foreground} />
              </View>
              <Text numberOfLines={2} style={[styles.optionLabel, { color: selected ? colors.primary : colors.foreground }]}>{option.name}</Text>
            </Pressable>
          );
        })}
      </View>

      {kind === 'custom' && (
        <>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>選擇布料與配色</Text>
          <View style={styles.swatchRow}>
            {FABRIC_SWATCHES.map((option, index) => {
              const selected = index === fabricIndex;
              return (
                <Pressable
                  key={option.name}
                  accessibilityRole="button"
                  accessibilityLabel={option.name}
                  accessibilityState={{ selected }}
                  onPress={() => setFabricIndex(index)}
                  style={[styles.fabricChoice, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.secondary : colors.background }]}
                >
                  <View style={[styles.fabricSwatch, { backgroundColor: option.color, borderColor: option.trim }]} />
                  <Text numberOfLines={1} style={[styles.fabricLabel, { color: selected ? colors.primary : colors.mutedForeground }]}>{option.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>此處為造型預覽，不會扣金幣或改變已擁有物品。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, borderWidth: 1, padding: 16, marginTop: 18, gap: 12 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  heading: { fontSize: 16, fontWeight: '800' },
  subheading: { fontSize: 12, marginTop: 3 },
  previewPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  previewPillText: { fontSize: 11, fontWeight: '800' },
  previewFrame: { borderWidth: 1, borderRadius: 18, overflow: 'hidden' },
  previewCanvas: { height: 300, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sceneAccent: { position: 'absolute', width: 230, height: 230, borderRadius: 115, borderWidth: 2, opacity: 0.34, bottom: -82 },
  modelImage: { width: 230, height: 278, marginTop: -18 },
  outfitOverlay: { position: 'absolute', width: '82%', bottom: 0 },
  lookBadge: { position: 'absolute', top: 10, left: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  lookName: { fontSize: 12, fontWeight: '800' },
  fabricName: { fontSize: 10, marginTop: 2 },
  sectionLabel: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  modelRow: { gap: 8, paddingRight: 4 },
  modelChoice: { width: 66, borderWidth: 1, borderRadius: 13, alignItems: 'center', padding: 5 },
  modelThumbnail: { width: 48, height: 48 },
  modelLabel: { fontSize: 10, marginTop: 3 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lookChoice: { width: '48%', minHeight: 76, borderWidth: 1, borderRadius: 14, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  lookSwatch: { width: 34, height: 34, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { flex: 1, fontSize: 11, fontWeight: '700' },
  swatchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fabricChoice: { width: '31%', minHeight: 67, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 13, paddingHorizontal: 5, paddingVertical: 8 },
  fabricSwatch: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5 },
  fabricLabel: { fontSize: 9, marginTop: 4 },
  disclaimer: { fontSize: 11, lineHeight: 16 },
});
