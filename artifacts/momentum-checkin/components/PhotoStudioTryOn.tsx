import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import palette from '@/constants/colors';
import { useColors } from '@/hooks/useColors';

const c = palette.light;

const PHOTO_MODELS = [
  { id: 'guest-1', name: '客人 1', source: require('../assets/images/cosmetics-tryon-guest-portrait-01.png') },
  { id: 'guest-2', name: '客人 2', source: require('../assets/images/cosmetics-tryon-guest-portrait-02.png') },
  { id: 'guest-3', name: '客人 3', source: require('../assets/images/cosmetics-tryon-guest-portrait-03.png') },
  { id: 'guest-4', name: '客人 4', source: require('../assets/images/cosmetics-tryon-guest-portrait-04.png') },
  { id: 'guest-5', name: '客人 5', source: require('../assets/images/cosmetics-tryon-guest-portrait-05.png') },
  { id: 'guest-6', name: '客人 6', source: require('../assets/images/cosmetics-tryon-guest-portrait-06.png') },
  { id: 'guest-7', name: '客人 7', source: require('../assets/images/cosmetics-tryon-guest-portrait-07.png') },
  { id: 'guest-8', name: '客人 8', source: require('../assets/images/cosmetics-tryon-guest-portrait-08.png') },
] as const;

const PHOTO_OUTFITS = [
  { id: 'blossom-dress', name: '花園蕾絲洋裝', color: c.candyPink, trim: c.candyRose, cut: 'dress' },
  { id: 'starlight-gown', name: '星河舞會禮服', color: c.candyLavender, trim: c.candyLemon, cut: 'gown' },
  { id: 'academy-suit', name: '復古學院套裝', color: c.candyCaramel, trim: c.candyCream, cut: 'tailored' },
  { id: 'sea-breeze-set', name: '海風水手造型', color: c.candySky, trim: c.candyCream, cut: 'tailored' },
  { id: 'sakura-kimono', name: '櫻花和風袍', color: c.candyRose, trim: c.candyPink, cut: 'kimono' },
  { id: 'mint-garden-dress', name: '薄荷花園長裙', color: c.candyMint, trim: c.candyLemon, cut: 'dress' },
  { id: 'classic-palace-gown', name: '典雅宮廷長禮服', color: c.candyPeach, trim: c.candyCaramel, cut: 'gown' },
  { id: 'moonlight-cape', name: '月光星點披肩', color: c.candySkyDark, trim: c.candyLemon, cut: 'kimono' },
] as const;

const PHOTO_BACKDROPS = [
  { id: 'flower-arch', name: '春日花拱', color: '#FBE6EC', accent: '#D98BAB', icon: 'feather' },
  { id: 'starlit-night', name: '星河夜景', color: '#E9E6F7', accent: '#7971B5', icon: 'moon' },
  { id: 'palace-window', name: '古典宮廷', color: '#F4E8D8', accent: '#C49B63', icon: 'home' },
  { id: 'ocean-garden', name: '海風花園', color: '#DDF1F2', accent: '#67AEB2', icon: 'wind' },
  { id: 'rose-courtyard', name: '玫瑰庭園', color: '#F8E4E0', accent: '#CA7E86', icon: 'heart' },
  { id: 'snowy-window', name: '冬日雪窗', color: '#E7F0F7', accent: '#82AFC4', icon: 'cloud-snow' },
  { id: 'carnival-lights', name: '夢幻燈影', color: '#F2E2F2', accent: '#B46EA5', icon: 'star' },
  { id: 'forest-garden', name: '森林花園', color: '#E4F0E6', accent: '#6C9A75', icon: 'sun' },
] as const;

type OutfitCut = typeof PHOTO_OUTFITS[number]['cut'];

function OutfitOverlay({ color, trim, cut }: { color: string; trim: string; cut: OutfitCut }) {
  const basePath = cut === 'dress' || cut === 'gown'
    ? 'M82 8 C68 9 57 18 44 23 L22 42 L34 58 L54 46 L47 108 L193 108 L186 46 L206 58 L218 42 L196 23 C183 18 172 9 158 8 C145 20 95 20 82 8 Z'
    : 'M82 8 C68 9 57 18 44 23 L22 42 L34 58 L54 46 L54 108 L186 108 L186 46 L206 58 L218 42 L196 23 C183 18 172 9 158 8 C145 20 95 20 82 8 Z';

  return (
    <Svg width="100%" height="116" viewBox="0 0 240 116" style={styles.outfitOverlay} testID="photo-studio-outfit-overlay">
      <Path d={basePath} fill={color} stroke={trim} strokeWidth="4" strokeLinejoin="round" />
      {cut === 'tailored' && (
        <>
          <Path d="M82 12 L119 42 L102 55 L72 20 M158 12 L121 42 L138 55 L168 20" fill={trim} stroke={trim} strokeWidth="2" />
          <Path d="M120 50 V98" stroke={trim} strokeWidth="3" strokeDasharray="2 9" />
        </>
      )}
      {cut === 'kimono' && (
        <>
          <Path d="M80 12 L120 51 L158 12 L176 26 L133 71 L120 61 L107 71 L64 26 Z" fill={trim} opacity="0.92" />
          <Path d="M62 82 H178" stroke={trim} strokeWidth="8" />
        </>
      )}
      {(cut === 'dress' || cut === 'gown') && (
        <>
          <Path d="M77 16 Q120 50 163 16" fill="none" stroke={trim} strokeWidth="4" />
          <Path d="M55 91 Q120 82 185 91" fill="none" stroke={trim} strokeWidth="3" />
          {cut === 'gown' && <Circle cx="120" cy="75" r="5" fill={trim} />}
        </>
      )}
    </Svg>
  );
}

export function PhotoStudioTryOn() {
  const colors = useColors();
  const [modelId, setModelId] = useState<string>(PHOTO_MODELS[0].id);
  const [outfitId, setOutfitId] = useState<string>(PHOTO_OUTFITS[0].id);
  const [backdropId, setBackdropId] = useState<string>(PHOTO_BACKDROPS[0].id);
  const model = PHOTO_MODELS.find(({ id }) => id === modelId) ?? PHOTO_MODELS[0];
  const outfit = PHOTO_OUTFITS.find(({ id }) => id === outfitId) ?? PHOTO_OUTFITS[0];
  const backdrop = PHOTO_BACKDROPS.find(({ id }) => id === backdropId) ?? PHOTO_BACKDROPS[0];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="photo-studio-try-on">
      <View style={styles.headingRow}>
        <View style={[styles.headingIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="camera" size={18} color={colors.primary} />
        </View>
        <View style={styles.headingCopy}>
          <Text style={[styles.heading, { color: colors.foreground }]}>卡通寫真試拍</Text>
          <Text style={[styles.subheading, { color: colors.mutedForeground }]}>搭配服飾與背景，預覽拍攝造型</Text>
        </View>
        <View style={[styles.previewPill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.previewPillText, { color: colors.primary }]}>即時預覽</Text>
        </View>
      </View>

      <View style={[styles.previewFrame, { borderColor: colors.border }]} testID="photo-studio-preview">
        <View style={[styles.backdrop, { backgroundColor: backdrop.color }]}>
          <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 320 300" style={StyleSheet.absoluteFill}>
            <Rect width="320" height="300" fill={backdrop.color} />
            <Path d="M27 278 V132 C27 62 78 24 160 24 C242 24 293 62 293 132 V278 Z" fill={backdrop.accent} opacity="0.25" />
            <Path d="M42 275 V135 C42 77 87 42 160 42 C233 42 278 77 278 135 V275" fill="none" stroke={backdrop.accent} strokeWidth="5" opacity="0.6" />
            <Circle cx="65" cy="70" r="8" fill={backdrop.accent} opacity="0.7" />
            <Circle cx="255" cy="86" r="6" fill={backdrop.accent} opacity="0.6" />
            <Circle cx="80" cy="117" r="4" fill={backdrop.accent} opacity="0.6" />
            <Path d="M0 246 Q80 226 160 246 T320 246 V300 H0 Z" fill="#FFFFFF" opacity="0.32" />
          </Svg>
          <View style={[styles.sceneBadge, { backgroundColor: 'rgba(255,255,255,0.86)' }]}>
            <Feather name={backdrop.icon as keyof typeof Feather.glyphMap} size={13} color={backdrop.accent} />
            <Text style={[styles.sceneBadgeText, { color: colors.foreground }]}>{backdrop.name}</Text>
          </View>
          <Image source={model.source} resizeMode="contain" style={styles.modelImage} accessibilityLabel={`${model.name}卡通寫真角色`} />
          <OutfitOverlay color={outfit.color} trim={outfit.trim} cut={outfit.cut} />
          <View style={styles.photoStamp}>
            <Feather name="aperture" size={12} color={colors.primary} />
            <Text style={[styles.photoStampText, { color: colors.primary }]}>{outfit.name}</Text>
          </View>
        </View>
      </View>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>選擇卡通客人</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modelRow}>
        {PHOTO_MODELS.map((option) => {
          const selected = option.id === modelId;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={option.name}
              accessibilityState={{ selected }}
              onPress={() => setModelId(option.id)}
              style={[
                styles.modelChoice,
                { backgroundColor: selected ? colors.secondary : colors.background, borderColor: selected ? colors.primary : colors.border },
              ]}
              testID={`photo-studio-model-${option.id}`}
            >
              <Image source={option.source} resizeMode="contain" style={styles.modelThumbnail} />
              <Text numberOfLines={1} style={[styles.modelLabel, { color: selected ? colors.primary : colors.mutedForeground }]}>{option.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>拍攝服飾</Text>
      <View style={styles.optionGrid}>
        {PHOTO_OUTFITS.map((option) => {
          const selected = option.id === outfitId;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={option.name}
              accessibilityState={{ selected }}
              onPress={() => setOutfitId(option.id)}
              style={[
                styles.outfitChoice,
                { backgroundColor: selected ? colors.secondary : colors.background, borderColor: selected ? colors.primary : colors.border },
              ]}
              testID={`photo-studio-outfit-${option.id}`}
            >
              <View style={[styles.outfitSwatch, { backgroundColor: option.color, borderColor: option.trim }]}>
                <Feather name="shopping-bag" size={17} color={colors.foreground} />
              </View>
              <Text numberOfLines={2} style={[styles.optionLabel, { color: selected ? colors.primary : colors.foreground }]}>{option.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionLabel, { color: colors.foreground }]}>拍攝場景</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.backdropRow}>
        {PHOTO_BACKDROPS.map((option) => {
          const selected = option.id === backdropId;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="button"
              accessibilityLabel={`${option.name}背景`}
              accessibilityState={{ selected }}
              onPress={() => setBackdropId(option.id)}
              style={[
                styles.backdropChoice,
                { backgroundColor: option.color, borderColor: selected ? colors.primary : colors.border },
              ]}
              testID={`photo-studio-backdrop-${option.id}`}
            >
              <Feather name={option.icon as keyof typeof Feather.glyphMap} size={18} color={option.accent} />
              <Text numberOfLines={1} style={[styles.optionLabel, { color: selected ? colors.primary : colors.foreground }]}>{option.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>只使用內建卡通客人預覽，不會啟動相機或讀取個人相片。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 16,
    marginBottom: 18,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  headingIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  headingCopy: { flex: 1 },
  heading: { fontSize: 17, fontWeight: '800' },
  subheading: { fontSize: 12, marginTop: 3 },
  previewPill: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  previewPillText: { fontSize: 11, fontWeight: '700' },
  previewFrame: { borderWidth: 1, borderRadius: 20, padding: 8, marginBottom: 16 },
  backdrop: { height: 290, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  sceneBadge: { position: 'absolute', zIndex: 3, top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 },
  sceneBadgeText: { fontSize: 11, fontWeight: '700' },
  modelImage: { width: 270, height: 270, position: 'absolute', bottom: 8 },
  outfitOverlay: { position: 'absolute', bottom: 2, alignSelf: 'center' },
  photoStamp: { position: 'absolute', right: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 11, paddingHorizontal: 8, paddingVertical: 5 },
  photoStampText: { fontSize: 10, fontWeight: '700' },
  sectionLabel: { fontSize: 14, fontWeight: '800', marginBottom: 8, marginTop: 2 },
  modelRow: { gap: 8, paddingBottom: 14, paddingRight: 4 },
  modelChoice: { width: 66, borderWidth: 1.5, borderRadius: 15, padding: 5, alignItems: 'center' },
  modelThumbnail: { width: 48, height: 48 },
  modelLabel: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  outfitChoice: { width: '23.5%', minWidth: 68, flexGrow: 1, borderWidth: 1.5, borderRadius: 14, padding: 7, alignItems: 'center', minHeight: 92 },
  outfitSwatch: { width: 34, height: 34, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 5 },
  optionLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  backdropRow: { gap: 8, paddingBottom: 8, paddingRight: 4 },
  backdropChoice: { width: 96, minHeight: 70, borderWidth: 1.5, borderRadius: 14, padding: 8, justifyContent: 'center', alignItems: 'center', gap: 5 },
  disclaimer: { fontSize: 11, lineHeight: 16, marginTop: 2 },
});
