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

const SLOT_POSITIONS: Record<ShopInteriorSlotId, { left: `${number}%`; top: `${number}%` }> = {
  'front-window': { left: '5%', top: '33%' },
  'left-wall': { left: '5%', top: '57%' },
  center: { left: '35%', top: '62%' },
  'right-wall': { left: '66%', top: '57%' },
  'back-wall': { left: '66%', top: '33%' },
  counter: { left: '35%', top: '36%' },
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
        <View style={[styles.namePlaque, { backgroundColor: colors.card, borderColor: shopColor }]}>
          <View style={[styles.plaqueDot, { backgroundColor: shopColor }]} />
          <Text numberOfLines={1} style={[styles.nameText, { color: colors.foreground }]}>{shopName}</Text>
        </View>
        {SHOP_INTERIOR_SLOTS.map((slot) => {
          const decoration = decorations.find(({ id }) => id === placements[slot.id]);
          const selected = selectedSlot === slot.id;
          return (
            <Pressable
              key={slot.id}
              testID={`shop-interior-slot-${slot.id}`}
              accessibilityRole="button"
              accessibilityLabel={`${slot.label}${decoration ? `，目前是${decoration.name}` : '，尚未佈置'}${selected ? '，目前選取' : ''}`}
              accessibilityHint="選取這個店內位置，再從下方選擇佈置"
              accessibilityState={{ selected }}
              onPress={() => onSelectSlot(slot.id)}
              style={[
                styles.hotspot,
                SLOT_POSITIONS[slot.id],
                {
                  backgroundColor: selected ? 'rgba(255,251,244,0.96)' : 'rgba(255,251,244,0.88)',
                  borderColor: selected ? colors.primary : 'rgba(255,255,255,0.96)',
                },
              ]}
            >
              <View style={[styles.objectStage, { borderColor: decoration?.color ?? 'rgba(117,92,83,0.24)' }]}>
                {decoration ? (
                  <MallObjectVisual
                    id={decoration.visual ?? decoration.id}
                    itemId={`${shopName}:${decoration.id}`}
                    color={decoration.color}
                    icon={decoration.icon}
                    category="decor"
                    isActive
                  />
                ) : (
                  <Feather name={slot.icon as keyof typeof Feather.glyphMap} size={16} color={colors.primary} />
                )}
              </View>
              <Text numberOfLines={1} style={[styles.slotLabel, { color: colors.foreground }]}>
                {decoration?.name ?? slot.label}
              </Text>
              <Text style={[styles.slotState, { color: selected ? colors.primary : colors.mutedForeground }]}>
                {selected ? '選取位置' : decoration ? '已佈置' : '可佈置'}
              </Text>
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
    backgroundColor: 'rgba(255,248,239,0.10)',
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
    width: '29%',
    minHeight: 88,
    borderWidth: 2,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    paddingVertical: 5,
    shadowColor: '#63464F',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  objectStage: {
    height: 47,
    width: '92%',
    borderWidth: 1,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  slotLabel: { maxWidth: '100%', fontSize: 8, fontWeight: '800', textAlign: 'center' },
  slotState: { fontSize: 7 },
});
