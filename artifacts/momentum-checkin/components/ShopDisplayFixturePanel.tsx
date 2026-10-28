import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ShopInteriorDecoration } from '@/constants/mall-shop-interior';
import { SHOP_DISPLAY_SLOT_COUNT, type ShopDisplayProduct } from '@/constants/mall-shop-display';
import { useColors } from '@/hooks/useColors';
import { ShopMerchandiseVisual } from '@/components/ShopMerchandiseVisual';
import { useReducedMotion } from '@/context/ReducedMotionContext';

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
  const reduceMotion = useReducedMotion();
  const [catalogPage, setCatalogPage] = useState(1);
  const productMotion = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!visible || products.length === 0) {
      productMotion.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(productMotion, { toValue: 1, duration: 1050, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(productMotion, { toValue: 0, duration: 1250, useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [productMotion, products.length, visible]);
  const catalogPageSize = 12;
  const selectableProducts = products.filter(({ legacyOnly }) => !legacyOnly);
  const catalogPageCount = Math.max(1, Math.ceil(selectableProducts.length / catalogPageSize));
  const visibleProducts = selectableProducts.slice((catalogPage - 1) * catalogPageSize, catalogPage * catalogPageSize);
  const productsById = new Map(products.map((product) => [product.id, product]));
  const filledSlots = slots.filter(Boolean).length;
  const selectedProduct = productsById.get(slots[selectedSlot] ?? '');

  return (
    <Modal
      visible={visible && fixture !== null}
      transparent
      animationType={reduceMotion === false ? 'slide' : 'none'}
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
                18 個展示格 · 本櫃 {selectableProducts.length} 款免費商品。選一格後陳列，商品不扣金幣。
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
                          <ShopMerchandiseVisual product={product} motion={productMotion} size={31} index={index} />
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
                    已放 {filledSlots} / {SHOP_DISPLAY_SLOT_COUNT} · {selectableProducts.length} 款 · {selectedProduct ? `第 ${selectedSlot + 1} 格：${selectedProduct.name}` : `選取第 ${selectedSlot + 1} 格`}
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
                {visibleProducts.map((product, index) => {
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
                      <ShopMerchandiseVisual product={product} motion={productMotion} size={39} index={index + (catalogPage - 1) * catalogPageSize} />
                      <View style={styles.productCopy}>
                        <Text numberOfLines={1} style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>
                        <Text numberOfLines={2} style={[styles.productDescription, { color: colors.mutedForeground }]}>{product.description}</Text>
                      </View>
                      <Feather name={alreadyDisplayed ? 'check-circle' : 'plus-circle'} size={17} color={alreadyDisplayed ? colors.primary : colors.mutedForeground} />
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles.pageNavigation}>
                <Pressable
                  testID="shop-display-page-previous"
                  accessibilityRole="button"
                  accessibilityLabel="上一頁商品"
                  onPress={() => setCatalogPage((page) => Math.max(1, page - 1))}
                  disabled={catalogPage <= 1}
                  style={[styles.pageButton, { borderColor: colors.border, backgroundColor: colors.background, opacity: catalogPage <= 1 ? 0.4 : 1 }]}
                >
                  <Feather name="chevron-left" size={16} color={colors.primary} />
                </Pressable>
                <Text style={[styles.pageText, { color: colors.mutedForeground }]}>
                  商品 {Math.min((catalogPage - 1) * catalogPageSize + 1, selectableProducts.length)}–{Math.min(catalogPage * catalogPageSize, selectableProducts.length)} · 第 {catalogPage} / {catalogPageCount} 頁
                </Text>
                <Pressable
                  testID="shop-display-page-next"
                  accessibilityRole="button"
                  accessibilityLabel="下一頁商品"
                  onPress={() => setCatalogPage((page) => Math.min(catalogPageCount, page + 1))}
                  disabled={catalogPage >= catalogPageCount}
                  style={[styles.pageButton, { borderColor: colors.border, backgroundColor: colors.background, opacity: catalogPage >= catalogPageCount ? 0.4 : 1 }]}
                >
                  <Feather name="chevron-right" size={16} color={colors.primary} />
                </Pressable>
              </View>
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
  helper: { fontSize: 10, lineHeight: 15 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 7 },
  displaySlot: { width: '15.8%', minHeight: 66, borderWidth: 1.5, borderRadius: 10, padding: 3, alignItems: 'center', justifyContent: 'center', gap: 1 },
  slotIndex: { position: 'absolute', top: 4, left: 6, fontSize: 8, fontWeight: '800' },
  slotProductName: { maxWidth: '100%', fontSize: 7, lineHeight: 8, fontWeight: '700', textAlign: 'center' },
  emptySlotText: { fontSize: 8, fontWeight: '600' },
  catalogHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  catalogTitle: { fontSize: 14, fontWeight: '800' },
  catalogCount: { maxWidth: 245, fontSize: 9, marginTop: 2 },
  clearButton: { minHeight: 34, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 9 },
  clearButtonText: { fontSize: 9, fontWeight: '700' },
  catalogScroll: { flexShrink: 1, minHeight: 100 },
  catalogGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 7, paddingBottom: 4 },
  productCard: { width: '48.6%', minHeight: 60, borderWidth: 1, borderRadius: 13, paddingHorizontal: 6, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
  productCopy: { flex: 1, minWidth: 0, gap: 2 },
  productName: { fontSize: 9, fontWeight: '800' },
  productDescription: { fontSize: 8, lineHeight: 10 },
  pageNavigation: { minHeight: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageButton: { width: 32, height: 30, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pageText: { fontSize: 9, fontWeight: '700' },
});
