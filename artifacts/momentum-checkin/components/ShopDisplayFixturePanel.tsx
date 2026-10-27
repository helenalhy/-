import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ShopInteriorDecoration } from '@/constants/mall-shop-interior';
import { SHOP_DISPLAY_SLOT_COUNT, type ShopDisplayProduct } from '@/constants/mall-shop-display';
import { useColors } from '@/hooks/useColors';

export function ShopDisplayFixturePanel({
  visible,
  shopName,
  fixture,
  products,
  slots,
  selectedSlot,
  busy = false,
  onSelectSlot,
  onPlaceProduct,
  onClearSlot,
  onClose,
}: {
  visible: boolean;
  shopName: string;
  fixture: ShopInteriorDecoration | null;
  products: ShopDisplayProduct[];
  slots: (string | null)[];
  selectedSlot: number;
  busy?: boolean;
  onSelectSlot: (slotIndex: number) => void;
  onPlaceProduct: (productId: string) => void;
  onClearSlot: () => void;
  onClose: () => void;
}) {
  const colors = useColors();
  const productsById = new Map(products.map((product) => [product.id, product]));
  const filledSlots = slots.filter(Boolean).length;
  const selectedProduct = productsById.get(slots[selectedSlot] ?? '');

  return (
    <Modal
      visible={visible && fixture !== null}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable
          testID="shop-display-dismiss-backdrop"
          accessibilityRole="button"
          accessibilityLabel="關閉商品陳列"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        {fixture && (
          <SafeAreaView edges={['bottom']} style={styles.sheetDock}>
            <View
              testID={`shop-display-panel-${fixture.id}`}
              accessibilityViewIsModal
              style={[styles.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
              <View style={styles.header}>
                <View style={[styles.headerIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="grid" size={18} color={colors.primary} />
                </View>
                <View style={styles.headerCopy}>
                  <Text style={[styles.eyebrow, { color: colors.primary }]}>{shopName} · 商品陳列</Text>
                  <Text numberOfLines={1} style={[styles.title, { color: colors.foreground }]}>{fixture.name}</Text>
                </View>
                <Pressable
                  testID="shop-display-close"
                  accessibilityRole="button"
                  accessibilityLabel="關閉商品陳列"
                  onPress={onClose}
                  style={[styles.closeButton, { backgroundColor: colors.secondary }]}
                >
                  <Feather name="x" size={18} color={colors.primary} />
                </Pressable>
              </View>

              <Text style={[styles.helper, { color: colors.mutedForeground }]}>
                選擇一個展示格，再挑選本店商品；商品隨展示架附送，擺放不扣金幣。
              </Text>

              <View style={styles.slotGrid}>
                {Array.from({ length: SHOP_DISPLAY_SLOT_COUNT }, (_, index) => {
                  const product = productsById.get(slots[index] ?? '');
                  const selected = selectedSlot === index;
                  return (
                    <Pressable
                      key={index}
                      testID={`shop-display-slot-${index + 1}`}
                      accessibilityRole="button"
                      accessibilityLabel={`第 ${index + 1} 個展示格，${product?.name ?? '空位'}${selected ? '，目前選取' : ''}`}
                      accessibilityState={{ selected }}
                      onPress={() => onSelectSlot(index)}
                      disabled={busy}
                      style={[
                        styles.displaySlot,
                        {
                          backgroundColor: product ? `${product.color}55` : colors.background,
                          borderColor: selected ? colors.primary : colors.border,
                          opacity: busy ? 0.65 : 1,
                        },
                      ]}
                    >
                      <Text style={[styles.slotIndex, { color: colors.mutedForeground }]}>{index + 1}</Text>
                      {product ? (
                        <>
                          <Feather name={product.icon as keyof typeof Feather.glyphMap} size={17} color={colors.primary} />
                          <Text numberOfLines={2} style={[styles.slotProductName, { color: colors.foreground }]}>{product.name}</Text>
                        </>
                      ) : (
                        <>
                          <Feather name="plus" size={17} color={colors.mutedForeground} />
                          <Text style={[styles.emptySlotText, { color: colors.mutedForeground }]}>空展示格</Text>
                        </>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.catalogHeading}>
                <View>
                  <Text style={[styles.catalogTitle, { color: colors.foreground }]}>可陳列商品</Text>
                  <Text style={[styles.catalogCount, { color: colors.mutedForeground }]}>
                    已放 {filledSlots} / {SHOP_DISPLAY_SLOT_COUNT} · {selectedProduct ? `目前第 ${selectedSlot + 1} 格：${selectedProduct.name}` : `目前選取第 ${selectedSlot + 1} 格`}
                  </Text>
                </View>
                {selectedProduct && (
                  <Pressable
                    testID="shop-display-clear-slot"
                    accessibilityRole="button"
                    accessibilityLabel={`清空第 ${selectedSlot + 1} 格`}
                    onPress={onClearSlot}
                    disabled={busy}
                    style={[styles.clearButton, { backgroundColor: colors.secondary }]}
                  >
                    <Feather name="trash-2" size={14} color={colors.primary} />
                    <Text style={[styles.clearButtonText, { color: colors.primary }]}>清除此格</Text>
                  </Pressable>
                )}
              </View>

              <ScrollView
                testID="shop-display-catalog"
                style={styles.catalogScroll}
                contentContainerStyle={styles.catalogGrid}
                showsVerticalScrollIndicator={false}
              >
                {products.map((product) => {
                  const alreadyDisplayed = slots.includes(product.id);
                  return (
                    <Pressable
                      key={product.id}
                      testID={`shop-display-product-${product.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`將${product.name}放入第 ${selectedSlot + 1} 格${alreadyDisplayed ? '，這款商品已在另一格' : ''}`}
                      onPress={() => onPlaceProduct(product.id)}
                      disabled={busy}
                      style={[
                        styles.productCard,
                        {
                          backgroundColor: colors.background,
                          borderColor: alreadyDisplayed ? product.color : colors.border,
                          opacity: busy ? 0.65 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.productIcon, { backgroundColor: `${product.color}66` }]}>
                        <Feather name={product.icon as keyof typeof Feather.glyphMap} size={17} color={colors.primary} />
                      </View>
                      <View style={styles.productCopy}>
                        <Text numberOfLines={1} style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
                        <Text numberOfLines={2} style={[styles.productDescription, { color: colors.mutedForeground }]}>{product.description}</Text>
                      </View>
                      <Feather name={alreadyDisplayed ? 'check-circle' : 'plus-circle'} size={17} color={alreadyDisplayed ? colors.primary : colors.mutedForeground} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </SafeAreaView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(52,36,48,0.46)' },
  sheetDock: { maxHeight: '93%', justifyContent: 'flex-end' },
  sheet: { maxHeight: '100%', borderTopLeftRadius: 26, borderTopRightRadius: 26, borderWidth: 1, paddingHorizontal: 16, paddingTop: 9, paddingBottom: 10, gap: 12 },
  handle: { width: 38, height: 4, alignSelf: 'center', borderRadius: 4, marginBottom: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, minWidth: 0, gap: 2 },
  eyebrow: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  title: { fontSize: 17, fontWeight: '800' },
  closeButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  helper: { fontSize: 11, lineHeight: 16 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 7 },
  displaySlot: { width: '31.8%', minHeight: 73, borderWidth: 1.5, borderRadius: 13, padding: 6, alignItems: 'center', justifyContent: 'center', gap: 3 },
  slotIndex: { position: 'absolute', top: 4, left: 6, fontSize: 8, fontWeight: '800' },
  slotProductName: { maxWidth: '100%', fontSize: 8, lineHeight: 10, fontWeight: '700', textAlign: 'center' },
  emptySlotText: { fontSize: 8, fontWeight: '600' },
  catalogHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  catalogTitle: { fontSize: 14, fontWeight: '800' },
  catalogCount: { maxWidth: 245, fontSize: 9, marginTop: 2 },
  clearButton: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 9 },
  clearButtonText: { fontSize: 9, fontWeight: '700' },
  catalogScroll: { flexShrink: 1, minHeight: 100 },
  catalogGrid: { gap: 7, paddingBottom: 4 },
  productCard: { minHeight: 58, borderWidth: 1, borderRadius: 13, paddingHorizontal: 9, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 8 },
  productIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  productCopy: { flex: 1, minWidth: 0, gap: 2 },
  productName: { fontSize: 11, fontWeight: '800' },
  productDescription: { fontSize: 9, lineHeight: 12 },
});
