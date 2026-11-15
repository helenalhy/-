import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const CHIIKAWA_CUTOUT_PREVIEWS = [
  { id: 'chiikawa', name: '吉伊卡哇', image: require('../assets/chiikawa-merch/standard-chiikawa.png') },
  { id: 'hachiware', name: '小八貓', image: require('../assets/chiikawa-merch/standard-hachiware.png') },
  { id: 'usagi', name: '兔兔', image: require('../assets/chiikawa-merch/standard-usagi.png') },
  { id: 'momonga', name: '飛鼠', image: require('../assets/chiikawa-merch/standard-momonga.png') },
  { id: 'shisa', name: '獅薩', image: require('../assets/chiikawa-merch/standard-shisa.png') },
  { id: 'kurimanju', name: '栗子饅頭', image: require('../assets/chiikawa-merch/standard-kurimanju.png') },
  { id: 'rakko', name: '海獺師傅', image: require('../assets/chiikawa-merch/standard-rakko.png') },
] as const;
const HUNTING_STICK_PREVIEW = require('../assets/chiikawa-merch/item-hunting-stick-toys.png');

export function ChiikawaMerchandisePreviewModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          testID="shop-display-art-preview-dismiss"
          accessibilityRole="button"
          accessibilityLabel="關閉圖片預覽"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView edges={['bottom']} style={styles.dock}>
          <View style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.header}>
              <View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}>
                <Feather name="image" size={18} color={colors.primary} />
              </View>
              <View style={styles.headerCopy}>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>Chiikawa Land · 免費預覽</Text>
                <Text style={[styles.title, { color: colors.foreground }]}>角色去背圖與討伐棒</Text>
              </View>
              <Pressable
                testID="shop-display-art-preview-close"
                accessibilityRole="button"
                accessibilityLabel="關閉圖片預覽"
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: colors.secondary }]}
              >
                <Feather name="x" size={18} color={colors.primary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>透明去背角色圖</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                只保留角色本體，PNG 圖檔保留透明背景，可直接查看輪廓和邊緣。
              </Text>
              <View style={styles.cutoutGrid}>
                {CHIIKAWA_CUTOUT_PREVIEWS.map((character) => (
                  <View
                    key={character.id}
                    testID={`shop-display-cutout-preview-${character.id}`}
                    style={[styles.cutoutCard, { backgroundColor: colors.background, borderColor: colors.border }]}
                  >
                    <View style={[styles.cutoutImageStage, { backgroundColor: colors.card }]}>
                      <Image accessible={false} source={character.image} resizeMode="contain" style={styles.cutoutImage} />
                    </View>
                    <Text numberOfLines={1} style={[styles.cutoutName, { color: colors.foreground }]}>{character.name}</Text>
                  </View>
                ))}
              </View>
              <View style={[styles.huntingStickCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <View style={styles.huntingStickCopy}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>角色造型討伐棒玩具組</Text>
                  <Text style={[styles.description, { color: colors.mutedForeground }]}>
                    吉伊卡哇、小八貓和兔兔造型的三支獨立棒狀玩具，不是原子筆。
                  </Text>
                  <View style={[styles.freePreviewTag, { backgroundColor: colors.secondary }]}>
                    <Feather name="eye" size={12} color={colors.primary} />
                    <Text style={[styles.freePreviewTagText, { color: colors.primary }]}>預覽不扣金幣</Text>
                  </View>
                </View>
                <Image
                  testID="shop-display-hunting-stick-preview-image"
                  accessibilityLabel="三支角色造型討伐棒玩具"
                  source={HUNTING_STICK_PREVIEW}
                  resizeMode="contain"
                  style={styles.huntingStickImage}
                />
              </View>
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(52,36,48,0.55)' },
  dock: { maxHeight: '90%', justifyContent: 'flex-end' },
  sheet: { maxHeight: '100%', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, paddingHorizontal: 16, paddingTop: 9, paddingBottom: 14, gap: 12 },
  handle: { width: 38, height: 4, alignSelf: 'center', borderRadius: 4, marginBottom: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, gap: 2 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  title: { fontSize: 17, fontWeight: '800' },
  closeButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  content: { gap: 10, paddingBottom: 8 },
  sectionTitle: { fontSize: 14, lineHeight: 19, fontWeight: '800' },
  description: { fontSize: 10, lineHeight: 15 },
  cutoutGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  cutoutCard: { width: '23.5%', minHeight: 91, alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderRadius: 13, padding: 5 },
  cutoutImageStage: { width: 54, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  cutoutImage: { width: 50, height: 54 },
  cutoutName: { maxWidth: '100%', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  huntingStickCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 16, padding: 10 },
  huntingStickCopy: { flex: 1, gap: 6 },
  huntingStickImage: { width: 116, height: 110 },
  freePreviewTag: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 4 },
  freePreviewTagText: { fontSize: 9, fontWeight: '800' },
});
