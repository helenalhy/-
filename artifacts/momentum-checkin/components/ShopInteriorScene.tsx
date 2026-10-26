import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { MallObjectVisual } from '@/components/MallVisuals';
import { SHOP_INTERIOR_SLOTS, type ShopInteriorDecoration, type ShopInteriorSlotId, type ShopInteriorSceneKey } from '@/constants/mall-shop-interior';
import { useColors } from '@/hooks/useColors';

const SCENES: Record<ShopInteriorSceneKey, number> = {
  general: require('../assets/images/shop-room-gifts.jpg'),
  cafe: require('../assets/images/shop-room-cafe.jpg'),
  candy: require('../assets/images/shop-room-candy.jpg'),
  icecream: require('../assets/images/shop-room-icecream.jpg'),
  bakery: require('../assets/images/shop-room-bakery.jpg'),
  tea: require('../assets/images/shop-room-tea.jpg'),
  food: require('../assets/images/shop-room-food.jpg'),
  flower: require('../assets/images/shop-room-florist.jpg'),
  book: require('../assets/images/shop-room-bookshop.jpg'),
  toy: require('../assets/images/shop-room-toy.jpg'),
  craft: require('../assets/images/shop-room-craft.jpg'),
  womenswear: require('../assets/images/shop-room-fashion.jpg'),
  bridal: require('../assets/images/shop-room-bridal.jpg'),
  eveningwear: require('../assets/images/shop-room-eveningwear.jpg'),
  kimono: require('../assets/images/shop-room-kimono.jpg'),
  supermarket: require('../assets/images/shop-room-market.jpg'),
  hyakuen: require('../assets/images/shop-room-hyakuen.jpg'),
  swimwear: require('../assets/images/shop-room-swimwear.jpg'),
  cosplay: require('../assets/images/shop-room-cosplay.jpg'),
  electronics: require('../assets/images/shop-room-electronics.jpg'),
  boutique: require('../assets/images/shop-room-boutique.jpg'),
};

// These fixed scene anchors are shared by every room illustration. Positions
// align with the illustrated window, wall shelving, tabletop and counter.
const SLOT_POSITIONS: Record<ShopInteriorSlotId, { left: `${number}%`; top: `${number}%` }> = {
  'front-window': { left: '4%', top: '37%' },
  'left-wall': { left: '4%', top: '64%' },
  center: { left: '36.5%', top: '68%' },
  'right-wall': { left: '70%', top: '64%' },
  'back-wall': { left: '70%', top: '37%' },
  counter: { left: '36.5%', top: '42%' },
};

type ObjectPlacementStyle = {
  scale: number;
  base: 'floor' | 'shelf' | 'wall' | 'table';
};

function getObjectPlacementStyle(decoration: ShopInteriorDecoration | undefined, slotId: ShopInteriorSlotId): ObjectPlacementStyle {
  if (!decoration) return { scale: 1, base: 'table' };

  const visualId = `${decoration.visual ?? ''} ${decoration.id} ${decoration.icon}`.toLowerCase();
  const wallMounted = /wall|frame|mirror|sign|lamp|mobile|light|picture|gallery|neon/.test(visualId);
  const largeFixture = /rack|wardrobe|bench|pavilion|fountain|machine|oven|counter|stage|display|carousel|aquarium|arch/.test(visualId);
  const tabletopAnchor = slotId === 'counter' || slotId === 'center' || slotId === 'front-window';

  if (wallMounted) return { scale: 0.86, base: 'wall' };
  if (decoration.itemKind === 'equipment') {
    return { scale: largeFixture ? 1.12 : 0.92, base: tabletopAnchor ? 'table' : 'shelf' };
  }
  if (largeFixture) return { scale: 1.16, base: tabletopAnchor ? 'shelf' : 'floor' };
  return { scale: tabletopAnchor ? 0.9 : 0.98, base: tabletopAnchor ? 'table' : 'shelf' };
}

export function ShopInteriorScene({
  testID,
  sceneKey,
  shopName,
  shopColor,
  placements,
  decorations,
  selectedSlot,
  onSelectSlot,
}: {
  testID: string;
  sceneKey: ShopInteriorSceneKey;
  shopName: string;
  shopColor: string;
  placements: Partial<Record<ShopInteriorSlotId, string>>;
  decorations: ShopInteriorDecoration[];
  selectedSlot: ShopInteriorSlotId;
  onSelectSlot: (slot: ShopInteriorSlotId) => void;
}) {
  const colors = useColors();
  return (
    <View
      testID={testID}
      style={[
        styles.frame,
        {
          borderColor: shopColor,
          backgroundColor: colors.candyCream,
          shadowColor: colors.candyCaramelDark,
        },
      ]}
    >
      <ImageBackground source={SCENES[sceneKey]} resizeMode="cover" style={styles.image} imageStyle={styles.imageShape}>
        <View style={styles.topScrim} pointerEvents="none" />
        <View style={[styles.namePlaque, { backgroundColor: colors.card, borderColor: shopColor }]} pointerEvents="none">
          <View style={[styles.plaqueDot, { backgroundColor: shopColor }]} />
          <Text numberOfLines={1} style={[styles.nameText, { color: colors.foreground }]}>{shopName}</Text>
        </View>
        {SHOP_INTERIOR_SLOTS.map((slot) => {
          const decoration = decorations.find(({ id }) => id === placements[slot.id]);
          const selected = selectedSlot === slot.id;
          const placementStyle = getObjectPlacementStyle(decoration, slot.id);
          return (
            <Pressable
              key={slot.id}
              testID={`shop-interior-slot-${slot.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${slot.label}${decoration ? `，目前是${decoration.name}` : '，尚未佈置'}${selected ? '，目前選取' : ''}`}
              accessibilityHint="選取這個店內位置，再從下方選擇佈置"
              accessibilityState={{ selected }}
              onPress={() => onSelectSlot(slot.id)}
              style={[styles.hotspot, SLOT_POSITIONS[slot.id]]}
            >
              <View
                style={[
                  styles.anchor,
                  selected && { borderColor: colors.primary, backgroundColor: 'rgba(255,251,244,0.68)' },
                  !decoration && !selected && styles.emptyAnchor,
                ]}
              >
                {decoration ? (
                  <>
                    {placementStyle.base !== 'wall' && (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.objectBase,
                          placementStyle.base === 'floor' ? styles.floorBase : placementStyle.base === 'shelf' ? styles.shelfBase : styles.tableBase,
                          { backgroundColor: `${decoration.color}B8` },
                        ]}
                      />
                    )}
                    <View style={[styles.objectVisual, { transform: [{ scale: placementStyle.scale }] }]}>
                      <MallObjectVisual
                        id={decoration.visual ?? decoration.id}
                        itemId={`${shopName}:${decoration.id}`}
                        color={decoration.color}
                        icon={decoration.icon}
                        category="decor"
                        isActive
                      />
                    </View>
                  </>
                ) : (
                  <Feather name={slot.icon as keyof typeof Feather.glyphMap} size={16} color={selected ? colors.primary : colors.mutedForeground} />
                )}
              </View>
              <View style={[styles.slotLabelPill, selected && { borderColor: colors.primary, backgroundColor: colors.card }]}>
                <Text numberOfLines={1} style={[styles.slotLabel, { color: colors.foreground }]}>
                  {decoration?.name ?? slot.label}
                </Text>
                {!decoration && <Text style={[styles.slotState, { color: selected ? colors.primary : colors.mutedForeground }]}>可佈置</Text>}
              </View>
            </Pressable>
          );
        })}
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    aspectRatio: 0.94,
    minHeight: 360,
    maxHeight: 510,
    width: '100%',
    borderRadius: 25,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
  },
  image: { flex: 1, justifyContent: 'flex-start' },
  imageShape: { width: '100%', height: '100%' },
  topScrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,248,239,0.08)',
  },
  namePlaque: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    maxWidth: '72%',
    minHeight: 30,
    borderWidth: 1.5,
    borderRadius: 13,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    shadowColor: '#74575D',
    shadowOpacity: 0.14,
    shadowRadius: 5,
    elevation: 2,
  },
  plaqueDot: { width: 7, height: 7, borderRadius: 4 },
  nameText: { fontSize: 11, fontWeight: '800' },
  hotspot: {
    position: 'absolute',
    width: '27%',
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'visible',
    zIndex: 2,
  },
  anchor: {
    width: '100%',
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  emptyAnchor: {
    borderColor: 'rgba(255,255,255,0.78)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,251,244,0.34)',
  },
  objectVisual: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  objectBase: {
    position: 'absolute',
    bottom: 1,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.76)',
  },
  floorBase: { width: '76%', height: 11 },
  shelfBase: { width: '62%', height: 7, bottom: 4 },
  tableBase: { width: '54%', height: 5, bottom: 5 },
  slotLabelPill: {
    maxWidth: '100%',
    minHeight: 19,
    marginTop: 1,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.48)',
    backgroundColor: 'rgba(255,251,244,0.70)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: { maxWidth: '100%', fontSize: 8, lineHeight: 11, fontWeight: '800', textAlign: 'center' },
  slotState: { fontSize: 7, lineHeight: 9 },
});
