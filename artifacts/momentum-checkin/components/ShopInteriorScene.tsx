import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { MallObjectVisual } from '@/components/MallVisuals';
import { SHOP_INTERIOR_SLOTS, type ShopInteriorDecoration, type ShopInteriorSlotId, type ShopInteriorSceneKey } from '@/constants/mall-shop-interior';
import { classifyDecoration, mapCoverPoint, resolveObjectAnchor } from '@/constants/mall-shop-scene-anchors';
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
  const [size, setSize] = useState({ width: 360, height: 383 });
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
      <ImageBackground onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })} source={SCENES[sceneKey]} resizeMode="cover" style={styles.image} imageStyle={styles.imageShape}>
        <View style={styles.topScrim} pointerEvents="none" />
        <View style={[styles.namePlaque, { backgroundColor: colors.card, borderColor: shopColor }]} pointerEvents="none">
          <View style={[styles.plaqueDot, { backgroundColor: shopColor }]} />
          <Text numberOfLines={1} style={[styles.nameText, { color: colors.foreground }]}>{shopName}</Text>
        </View>
        {SHOP_INTERIOR_SLOTS.map((slot) => {
          const decoration = decorations.find(({ id }) => id === placements[slot.id]);
          const selected = selectedSlot === slot.id;
          const profile = decoration ? classifyDecoration(decoration) : { cls: 'tabletop' as const, scale: 1 };
          const point = mapCoverPoint(resolveObjectAnchor(sceneKey, slot.id, profile.cls), size.width, size.height);
          const lift = (OBJECT_H * (profile.scale - 1)) / 2;
          return (
            <Pressable
              key={slot.id}
              testID={`shop-interior-slot-${slot.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${slot.label}${decoration ? `，目前是${decoration.name}` : '，尚未佈置'}${selected ? '，目前選取' : ''}`}
              accessibilityHint="選取這個店內位置，再從下方選擇佈置"
              accessibilityState={{ selected }}
              onPress={() => onSelectSlot(slot.id)}
              style={[styles.hotspot, { left: point.x - HOTSPOT_W / 2, top: point.y - HOTSPOT_H }]}
            >
              {decoration ? (
                <>
                  <View pointerEvents="none" style={styles.contactShadow} />
                  <View pointerEvents="none" style={[styles.objectVisual, { transform: [{ translateY: lift }, { scale: profile.scale }] }]}>
                    <MallObjectVisual
                      id={decoration.visual ?? decoration.id}
                      itemId={`${shopName}:${decoration.id}`}
                      color={decoration.color}
                      icon={decoration.icon}
                      category="decor"
                      isActive
                    />
                  </View>
                  {selected && <View pointerEvents="none" style={[styles.selectRing, { borderColor: colors.primary }]} />}
                </>
              ) : (
                <View
                  pointerEvents="none"
                  style={[styles.emptyMarker, selected ? { borderColor: colors.primary, backgroundColor: 'rgba(255,251,244,0.8)' } : null]}
                >
                  <Feather name={slot.icon as keyof typeof Feather.glyphMap} size={15} color={selected ? colors.primary : colors.mutedForeground} />
                </View>
              )}
              <View pointerEvents="none" style={[styles.slotLabelPill, selected && { borderColor: colors.primary, backgroundColor: colors.card }]}>
                <Text numberOfLines={1} style={[styles.slotLabel, { color: colors.foreground }]}>
                  {decoration?.name ?? slot.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ImageBackground>
    </View>
  );
}

const OBJECT_H = 47;
const HOTSPOT_W = 64;
const HOTSPOT_H = 50;

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
    width: HOTSPOT_W,
    height: HOTSPOT_H,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
    zIndex: 2,
  },
  contactShadow: {
    position: 'absolute',
    bottom: -1,
    width: 38,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(92,60,60,0.22)',
  },
  objectVisual: { width: 62, height: OBJECT_H, alignItems: 'center', justifyContent: 'center' },
  selectRing: { position: 'absolute', bottom: -2, width: 56, height: 56, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed' },
  emptyMarker: {
    width: 38,
    height: 38,
    marginBottom: 0,
    borderRadius: 13,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,251,244,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabelPill: {
    position: 'absolute',
    top: HOTSPOT_H + 1,
    maxWidth: 84,
    minHeight: 16,
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
});
