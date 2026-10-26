import { Feather } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import palette from '@/constants/colors';

const c = palette.light;
const useNativeDriver = Platform.OS !== 'web';

export function ThemedMallObject({ id, color, icon = 'gift' }: { id: string; color: string; icon?: string }) {
  let drawing: React.ReactNode;
  switch (id) {
    case 'coral-aquarium':
      drawing = <><View style={[s.tank, { backgroundColor: c.candySky, borderColor: c.candySkyDark }]}>{[c.candyCoral, c.candyLemon, c.candyPink].map((fish, i) => <SwimmingFish key={i} color={fish} left={5 + i * 13} top={7 + (i % 2) * 10} />)}<View style={[s.coral, { backgroundColor: c.candyCoral }]} /><View style={s.waterBubble} /></View><View style={[s.base, { backgroundColor: c.candySkyDark }]} /></>;
      break;
    case 'rhythm-stage':
      drawing = <><View style={s.row}><View style={[s.speaker, { backgroundColor: c.candyLavenderDark }]} /><Feather name="mic" size={27} color={c.candyRoseDark} /><View style={[s.speaker, { backgroundColor: c.candyLavenderDark }]} /></View><View style={[s.stage, { backgroundColor: color, borderColor: c.candyRoseDark }]} /></>;
      break;
    case 'yoga-deck':
      drawing = <><Feather name="heart" size={20} color={c.candyMintDark} /><View style={[s.mat, { backgroundColor: color, borderColor: c.candyMintDark }]} /><View style={[s.cushion, { backgroundColor: c.candyPeach }]} /></>;
      break;
    case 'sculpture-plaza':
      drawing = <><View style={[s.sculpture, { backgroundColor: c.candyCoral, transform: [{ rotate: '30deg' }] }]} /><View style={[s.sculptureSmall, { backgroundColor: color, transform: [{ rotate: '-20deg' }] }]} /><View style={[s.base, { backgroundColor: c.candyCaramel }]} /></>;
      break;
    case 'observatory-dome':
      drawing = <><View style={[s.telescope, { backgroundColor: color, borderColor: c.candyLavenderDark }]} /><View style={s.tripod}><View style={[s.tripodLeg, { backgroundColor: c.candyLavenderDark, transform: [{ rotate: '22deg' }] }]} /><View style={[s.tripodLeg, { backgroundColor: c.candyLavenderDark, transform: [{ rotate: '-22deg' }] }]} /></View></>;
      break;
    case 'tasting-court':
      drawing = <><View style={[s.tableTop, { backgroundColor: color, borderColor: c.candyCaramelDark }]} /><View style={[s.tableLeg, { backgroundColor: c.candyCaramelDark }]} /><View style={s.stoolRow}>{[0, 1, 2].map((i) => <View key={i} style={[s.stool, { backgroundColor: c.candyCoral }]} />)}</View></>;
      break;
    case 'cloud-swing':
      drawing = <><View style={[s.swingBar, { backgroundColor: c.candySkyDark }]} /><View style={s.swingFrame}><View style={[s.swingPost, { backgroundColor: c.candySkyDark }]} /><SwingSeat color={color} /><View style={[s.swingPost, { backgroundColor: c.candySkyDark }]} /></View></>;
      break;
    case 'shell-lantern':
      drawing = <><View style={[s.shell, { backgroundColor: c.candyLemon, borderColor: c.candyCoral }]}><Feather name="sun" size={23} color={c.candyCaramelDark} /></View><View style={[s.base, { backgroundColor: c.candyPeach, width: 30 }]} /></>;
      break;
    case 'neon-sign':
      drawing = <View style={[s.sign, { borderColor: c.candyRose, backgroundColor: c.candyLavenderDark }]}><Feather name="zap" size={28} color={c.candyLemon} /></View>;
      break;
    case 'aroma-diffuser':
      drawing = <><Feather name="wind" size={23} color={c.candyLavenderDark} /><View style={[s.diffuser, { backgroundColor: color, borderColor: c.candyLavenderDark }]} /></>;
      break;
    case 'gallery-frames':
      drawing = <View style={s.row}>{[c.candySky, c.candyCoral, c.candyLavender].map((frame, i) => <View key={i} style={[s.frame, { backgroundColor: frame, borderColor: c.candyCaramelDark, marginTop: i % 2 ? 12 : 0 }]}><Feather name={i === 1 ? 'sun' : 'triangle'} size={10} color={c.candyInk} /></View>)}</View>;
      break;
    case 'starlight-mobile':
      drawing = <><View style={[s.swingBar, { backgroundColor: c.candyLavenderDark, width: 48 }]} /><View style={s.row}>{[0, 1, 2].map((i) => <View key={i} style={s.hanging}><View style={[s.string, { height: 8 + i * 5, backgroundColor: c.candyLavenderDark }]} /><Feather name={i === 1 ? 'moon' : 'star'} size={14} color={c.candyCaramelDark} /></View>)}</View></>;
      break;
    case 'spice-display':
      drawing = <><View style={s.jarRow}>{[c.candyCoral, c.candyMint, c.candyLemon].map((jar, i) => <View key={i} style={[s.jar, { backgroundColor: jar, borderColor: c.candyCaramelDark }]} />)}</View><View style={[s.shelf, { backgroundColor: c.candyCaramelDark }]} /><View style={s.jarRow}>{[c.candyPeach, c.candyLavender, c.candyPink].map((jar, i) => <View key={i} style={[s.jar, { backgroundColor: jar, borderColor: c.candyCaramelDark }]} />)}</View><View style={[s.shelf, { backgroundColor: c.candyCaramelDark }]} /></>;
      break;
    case 'rainbow-arch':
      drawing = <View style={s.rainbow}>{[c.candyCoral, c.candyLemon, c.candyMint, c.candySky, c.candyLavender].map((rainbowColor, i) => <View key={i} style={[s.rainbowBand, { width: 60 - i * 9, height: 45 - i * 6, left: i * 4.5, bottom: 0, borderColor: rainbowColor }]} />)}</View>;
      break;
    case 'clothing-rack':
      drawing = <ClothingRack color={color} />;
      break;
    case 'clothing-wardrobe':
      drawing = <ClothingWardrobe color={color} />;
      break;
    case 'blouse-display':
      drawing = <ClothingStand color={color} kind="blouse" />;
      break;
    case 'skirt-display':
      drawing = <ClothingStand color={color} kind="skirt" />;
      break;
    case 'dress-display':
      drawing = <ClothingStand color={color} kind="dress" />;
      break;
    case 'kimono-display':
      drawing = <KimonoStand color={color} />;
      break;
    case 'coffee-machine':
      drawing = <CoffeeMachine color={color} />;
      break;
    case 'ice-cream-machine':
      drawing = <IceCreamMachine color={color} />;
      break;
    case 'cotton-candy-machine':
      drawing = <CottonCandyMachine color={color} />;
      break;
    case 'candy-display':
      drawing = <CandyDisplay color={color} />;
      break;
    case 'bakery-oven':
      drawing = <BakeryOven color={color} />;
      break;
    case 'tea-brewer':
      drawing = <TeaBrewer color={color} />;
      break;
    case 'food-prep':
      drawing = <FoodPrep color={color} />;
      break;
    case 'flower-station':
      drawing = <FlowerStation color={color} />;
      break;
    case 'book-carousel':
      drawing = <BookCarousel color={color} />;
      break;
    case 'capsule-machine':
      drawing = <CapsuleMachine color={color} />;
      break;
    case 'craft-station':
      drawing = <CraftStation color={color} />;
      break;
    case 'sewing-machine':
      drawing = <SewingMachine color={color} />;
      break;
    case 'electronics-bench':
      drawing = <ElectronicsBench color={color} />;
      break;
    case 'jewelry-case':
      drawing = <JewelryCase color={color} />;
      break;
    default:
      drawing = <><View style={[s.fallbackShowcase, { backgroundColor: color, borderColor: c.candyCaramelDark }]}><Feather name={icon as keyof typeof Feather.glyphMap} size={20} color={c.candyCaramelDark} /></View><View style={[s.base, { backgroundColor: c.candyCaramel }]} /></>;
  }
  return <View style={s.object}>{drawing}</View>;
}

function CoffeeMachine({ color }: { color: string }) {
  return (
    <>
      <View style={[s.machineBody, { backgroundColor: color, borderColor: c.candyCaramelDark }]}>
        <View style={s.machineTop}><View style={[s.machineKnob, { backgroundColor: c.candyLemon }]} /><View style={[s.machineKnob, { backgroundColor: c.candyMint }]} /></View>
        <View style={[s.machinePanel, { backgroundColor: c.candyCream }]} />
        <View style={[s.machineSpout, { backgroundColor: c.candyCaramelDark }]} />
      </View>
      <View style={[s.machineTray, { backgroundColor: c.candyCaramelDark }]} />
      <View style={[s.machineCup, { backgroundColor: c.candyPeach, borderColor: c.candyCaramelDark }]} />
      <View style={[s.machineBase, { backgroundColor: c.candyCaramel }]} />
    </>
  );
}

function IceCreamMachine({ color }: { color: string }) {
  return (
    <>
      <View style={[s.machineBody, { backgroundColor: c.candyCream, borderColor: c.candySkyDark }]}>
        <View style={[s.machinePanel, { backgroundColor: color }]} />
        <View style={s.machineSpout} />
        <View style={[s.iceCreamScoop, { backgroundColor: c.candyPink }]} />
        <View style={[s.iceCreamScoop, s.iceCreamScoopSecond, { backgroundColor: c.candyLemon }]} />
      </View>
      <View style={[s.machineTray, { backgroundColor: c.candySkyDark }]} />
      <View style={[s.machineBase, { backgroundColor: c.candyCaramel }]} />
    </>
  );
}

function CottonCandyMachine({ color }: { color: string }) {
  return (
    <>
      <View style={[s.candyBowl, { backgroundColor: color, borderColor: c.candyCaramelDark }]}>
        <View style={[s.cottonCloud, { backgroundColor: c.candyPink }]} />
        <View style={[s.cottonCloud, s.cottonCloudSecond, { backgroundColor: c.candyLavender }]} />
        <View style={[s.cottonStick, { backgroundColor: c.candyCaramel }]} />
      </View>
      <View style={[s.machineBase, { backgroundColor: c.candyCaramelDark }]} />
    </>
  );
}

function CandyDisplay({ color }: { color: string }) {
  const sweets = [c.candyPink, c.candyLemon, c.candySky, c.candyMint, c.candyLavender, c.candyCoral];
  return (
    <>
      <View style={[s.candyShelf, { backgroundColor: c.candyCream, borderColor: c.candyCaramelDark }]}>
        {sweets.slice(0, 3).map((sweet, index) => <View key={index} style={[s.candyJar, { backgroundColor: sweet }]} />)}
        <View style={[s.candyShelfLine, { backgroundColor: color }]} />
        {sweets.slice(3).map((sweet, index) => <View key={index + 3} style={[s.candyJar, { backgroundColor: sweet }]} />)}
      </View>
      <View style={[s.machineBase, { backgroundColor: c.candyCaramel }]} />
    </>
  );
}

function BakeryOven({ color }: { color: string }) {
  return (
    <>
      <View style={[s.ovenBody, { backgroundColor: color, borderColor: c.candyCaramelDark }]}>
        <View style={[s.ovenWindow, { backgroundColor: c.candyCream, borderColor: c.candyCaramelDark }]}>
          <View style={[s.ovenBread, { backgroundColor: c.candyPeach }]} />
          <View style={[s.ovenBread, s.ovenBreadSecond, { backgroundColor: c.candyLemon }]} />
        </View>
        <View style={s.ovenControls}><View style={[s.machineKnob, { backgroundColor: c.candyRose }]} /><View style={[s.machineKnob, { backgroundColor: c.candyLavender }]} /></View>
      </View>
      <View style={[s.machineBase, { backgroundColor: c.candyCaramelDark }]} />
    </>
  );
}

function TeaBrewer({ color }: { color: string }) {
  return (
    <>
      <View style={[s.machineBody, { backgroundColor: color, borderColor: c.candyCaramelDark }]}>
        <View style={[s.machinePanel, { backgroundColor: c.candyCream }]} />
        <View style={[s.teaPot, { backgroundColor: c.candyLemon, borderColor: c.candyCaramelDark }]} />
        <View style={[s.machineSpout, { backgroundColor: c.candyCaramelDark }]} />
      </View>
      <View style={[s.machineTray, { backgroundColor: c.candyCaramelDark }]} />
      <View style={[s.machineBase, { backgroundColor: c.candyCaramel }]} />
    </>
  );
}

function FoodPrep({ color }: { color: string }) {
  return (
    <>
      <View style={[s.machineBody, { backgroundColor: c.candyCream, borderColor: c.candyCaramelDark }]}>
        <View style={[s.foodPan, { backgroundColor: color }]} />
        <View style={[s.foodPan, s.foodPanSecond, { backgroundColor: c.candyPeach }]} />
        <View style={[s.machinePanel, s.foodPrepPanel, { backgroundColor: c.candyMint }]} />
      </View>
      <View style={[s.machineBase, { backgroundColor: c.candyCaramelDark }]} />
    </>
  );
}

function FlowerStation({ color }: { color: string }) {
  return (
    <>
      <View style={s.flowerStationTop}>
        {[c.candyPink, c.candyLemon, c.candyLavender].map((flower, index) => <View key={index} style={[s.flowerStationBloom, { backgroundColor: flower, left: 8 + index * 15 }]} />)}
      </View>
      <View style={[s.flowerStationBench, { backgroundColor: color, borderColor: c.candyCaramelDark }]} />
      <View style={[s.machineBase, { backgroundColor: c.candyCaramel }]} />
    </>
  );
}

function BookCarousel({ color }: { color: string }) {
  return (
    <>
      <View style={s.bookCarouselRow}>
        {[c.candyPink, c.candyMint, color, c.candyLavender].map((book, index) => <View key={index} style={[s.miniBook, { backgroundColor: book, transform: [{ rotate: index % 2 ? '8deg' : '-7deg' }] }]} />)}
      </View>
      <View style={[s.machineTray, { backgroundColor: c.candyCaramelDark }]} />
      <View style={[s.machineBase, { backgroundColor: c.candyCaramel }]} />
    </>
  );
}

function CapsuleMachine({ color }: { color: string }) {
  return (
    <>
      <View style={[s.capsuleGlass, { backgroundColor: color, borderColor: c.candyCaramelDark }]}>
        {[c.candyPink, c.candyLemon, c.candyMint, c.candyLavender].map((capsule, index) => <View key={index} style={[s.capsuleBall, { backgroundColor: capsule }]} />)}
      </View>
      <View style={[s.machineBase, s.capsuleBase, { backgroundColor: c.candyRose }]} />
      <View style={[s.machineKnob, s.capsuleKnob, { backgroundColor: c.candyLemon }]} />
    </>
  );
}

function CraftStation({ color }: { color: string }) {
  return (
    <>
      <View style={[s.craftBoard, { backgroundColor: color, borderColor: c.candyCaramelDark }]}>
        <View style={[s.craftTool, { backgroundColor: c.candyCoral, transform: [{ rotate: '28deg' }] }]} />
        <View style={[s.craftTool, s.craftToolSecond, { backgroundColor: c.candyLavender, transform: [{ rotate: '-20deg' }] }]} />
        <View style={[s.machineKnob, s.craftButton, { backgroundColor: c.candyLemon }]} />
      </View>
      <View style={[s.machineBase, { backgroundColor: c.candyCaramel }]} />
    </>
  );
}

function SewingMachine({ color }: { color: string }) {
  return (
    <>
      <View style={[s.sewingHead, { backgroundColor: color, borderColor: c.candyCaramelDark }]}>
        <View style={[s.sewingArm, { backgroundColor: c.candyCream }]} />
        <View style={[s.sewingNeedle, { backgroundColor: c.candyCaramelDark }]} />
        <View style={[s.machineKnob, s.sewingWheel, { backgroundColor: c.candyLemon }]} />
      </View>
      <View style={[s.sewingTable, { backgroundColor: c.candyCaramel }]} />
      <View style={[s.sewingLeg, { backgroundColor: c.candyCaramelDark }]} />
    </>
  );
}

function ElectronicsBench({ color }: { color: string }) {
  return (
    <>
      <View style={[s.electronicsScreen, { backgroundColor: color, borderColor: c.candyCaramelDark }]}>
        <Feather name="zap" size={17} color={c.candyCream} />
      </View>
      <View style={[s.machineTray, { backgroundColor: c.candyCaramelDark }]} />
      <View style={[s.machineBase, { backgroundColor: c.candyCaramel }]} />
      <View style={[s.machineKnob, s.electronicsIndicator, { backgroundColor: c.candyMint }]} />
    </>
  );
}

function JewelryCase({ color }: { color: string }) {
  return (
    <>
      <View style={[s.jewelryCase, { backgroundColor: color, borderColor: c.candyCaramelDark }]}>
        {[c.candyLemon, c.candyPink, c.candyLavender].map((gem, index) => <View key={index} style={[s.jewelryGem, { backgroundColor: gem }]} />)}
        <View style={[s.jewelryShelf, { backgroundColor: c.candyCream }]} />
      </View>
      <View style={[s.machineBase, { backgroundColor: c.candyCaramel }]} />
    </>
  );
}

function ClothingRack({ color }: { color: string }) {
  return (
    <View style={s.rackScene}>
      <View style={[s.rackTop, { backgroundColor: c.candyCaramelDark }]} />
      <View style={s.rackGarments}>
        {[c.candyPink, color, c.candyLavender, c.candySky].map((garment, index) => (
          <View key={index} style={s.hangingPiece}>
            <View style={[s.hanger, { borderColor: c.candyCaramelDark }]} />
            <View style={[s.hangingGarment, { backgroundColor: garment, height: 22 + (index % 2) * 4 }]} />
          </View>
        ))}
      </View>
      <View style={[s.rackBase, { backgroundColor: c.candyCaramelDark }]} />
    </View>
  );
}

function ClothingWardrobe({ color }: { color: string }) {
  return (
    <View style={s.wardrobeScene}>
      <View style={[s.wardrobeCrown, { backgroundColor: c.candyCaramelDark }]} />
      <View style={[s.wardrobeBody, { backgroundColor: c.candyCream, borderColor: c.candyCaramelDark }]}>
        <View style={[s.wardrobeRail, { backgroundColor: c.candyCaramelDark }]} />
        <View style={s.wardrobeGarments}>
          {[c.candyPink, color, c.candyLavender].map((garment, index) => (
            <View key={index} style={[s.wardrobeGarment, { backgroundColor: garment, height: 17 + (index % 2) * 3 }]} />
          ))}
        </View>
        <View style={s.wardrobeCenterLine} />
        <View style={[s.wardrobeDrawer, { backgroundColor: c.candyPeach, borderColor: c.candyCaramel }]} />
        <View style={[s.wardrobeKnob, { backgroundColor: c.candyCaramelDark }]} />
      </View>
      <View style={[s.wardrobeFoot, { backgroundColor: c.candyCaramelDark }]} />
    </View>
  );
}

function ClothingStand({ color, kind }: { color: string; kind: 'blouse' | 'skirt' | 'dress' }) {
  return (
    <View style={s.clothingStand}>
      <View style={[s.clothingHanger, { borderColor: c.candyCaramelDark }]} />
      {kind === 'blouse' ? (
        <View style={s.blouseShape}>
          <View style={[s.blouseSleeve, { backgroundColor: color, left: 2, transform: [{ rotate: '-22deg' }] }]} />
          <View style={[s.blouseSleeve, { backgroundColor: color, right: 2, transform: [{ rotate: '22deg' }] }]} />
          <View style={[s.blouseBody, { backgroundColor: color }]} />
          <View style={s.blouseCollar} />
        </View>
      ) : kind === 'skirt' ? (
        <View style={s.skirtShape}>
          <View style={[s.skirtWaist, { backgroundColor: c.candyCaramelDark }]} />
          <View style={[s.skirtHem, { borderTopColor: color }]} />
        </View>
      ) : (
        <View style={s.dressShape}>
          <View style={[s.dressBodice, { backgroundColor: color }]} />
          <View style={[s.dressHem, { borderTopColor: color }]} />
          <View style={s.dressSash} />
        </View>
      )}
      <View style={[s.clothingStandStem, { backgroundColor: c.candyCaramelDark }]} />
      <View style={[s.clothingStandBase, { backgroundColor: c.candyCaramel }]} />
    </View>
  );
}

function KimonoStand({ color }: { color: string }) {
  return (
    <View style={s.kimonoStand}>
      <View style={[s.clothingHanger, { borderColor: c.candyCaramelDark }]} />
      <View style={s.kimonoSleeves}>
        <View style={[s.kimonoSleeve, { backgroundColor: color, left: 0, transform: [{ rotate: '-18deg' }] }]} />
        <View style={[s.kimonoSleeve, { backgroundColor: color, right: 0, transform: [{ rotate: '18deg' }] }]} />
      </View>
      <View style={[s.kimonoBody, { backgroundColor: color }]}>
        <View style={[s.kimonoLapels, { borderLeftColor: c.card, borderRightColor: c.card }]} />
        <View style={[s.kimonoObi, { backgroundColor: c.candyLemon }]} />
        <Feather name="star" size={7} color={c.card} />
      </View>
      <View style={[s.clothingStandStem, { backgroundColor: c.candyCaramelDark }]} />
      <View style={[s.clothingStandBase, { backgroundColor: c.candyCaramel }]} />
    </View>
  );
}

function SwimmingFish({ color, left, top }: { color: string; left: number; top: number }) {
  const swim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(swim, { toValue: 8, duration: 1300, useNativeDriver }),
      Animated.timing(swim, { toValue: 0, duration: 1300, useNativeDriver }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [swim]);
  return (
    <Animated.View style={[s.fish, { backgroundColor: color, left, top, transform: [{ translateX: swim }] }]}>
      <View style={s.fishEye} />
    </Animated.View>
  );
}

function SwingSeat({ color }: { color: string }) {
  const sway = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(sway, { toValue: 1, duration: 1500, useNativeDriver }),
      Animated.timing(sway, { toValue: 0, duration: 1500, useNativeDriver }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [sway]);
  const rotation = sway.interpolate({ inputRange: [0, 1], outputRange: ['-4deg', '4deg'] });
  return (
    <Animated.View style={[s.swingRig, { transform: [{ rotate: rotation }] }]}>
      <View style={[s.swingRope, { backgroundColor: c.candyCaramelDark }]} />
      <View style={[s.swingRope, { backgroundColor: c.candyCaramelDark }]} />
      <View style={[s.swingSeat, { backgroundColor: color }]} />
    </Animated.View>
  );
}

const s = StyleSheet.create({
  object: { width: 62, height: 47, alignItems: 'center', justifyContent: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  tank: { width: 56, height: 35, borderWidth: 3, borderRadius: 5, overflow: 'hidden' },
  fish: { position: 'absolute', width: 10, height: 6, borderRadius: 6, alignItems: 'flex-end', justifyContent: 'center' },
  fishEye: { width: 1.5, height: 1.5, marginRight: 2, borderRadius: 1, backgroundColor: c.card },
  coral: { position: 'absolute', bottom: 0, right: 4, width: 5, height: 13, borderTopLeftRadius: 7 },
  waterBubble: { position: 'absolute', width: 3, height: 3, right: 8, top: 5, borderRadius: 2, backgroundColor: c.card, opacity: 0.8 },
  base: { width: 60, height: 7, borderRadius: 3 },
  speaker: { width: 10, height: 24, borderRadius: 2 },
  stage: { width: 61, height: 12, borderRadius: 8, borderWidth: 2 },
  mat: { width: 59, height: 22, borderRadius: 7, borderWidth: 2, transform: [{ rotate: '-9deg' }] },
  cushion: { position: 'absolute', bottom: 2, right: 3, width: 19, height: 9, borderRadius: 9 },
  sculpture: { width: 23, height: 23, borderRadius: 4 },
  sculptureSmall: { width: 20, height: 14, borderRadius: 4, marginTop: -4 },
  telescope: { width: 44, height: 16, borderRadius: 4, borderWidth: 3, transform: [{ rotate: '-25deg' }] },
  tripod: { flexDirection: 'row', gap: 7, height: 24 },
  tripodLeg: { width: 3, height: 25 },
  tableTop: { width: 52, height: 20, borderRadius: 30, borderWidth: 2 },
  tableLeg: { width: 5, height: 12 },
  stoolRow: { position: 'absolute', flexDirection: 'row', gap: 10, bottom: 0 },
  stool: { width: 13, height: 9, borderRadius: 5 },
  swingBar: { width: 61, height: 5, borderRadius: 3 },
  swingFrame: { flexDirection: 'row', justifyContent: 'space-between', width: 55, height: 39, position: 'relative' },
  swingPost: { width: 4, height: 39 },
  swingRig: { position: 'absolute', top: 0, left: 12, width: 30, height: 34, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  swingRope: { width: 2, height: 27, position: 'absolute', top: 0, left: 5 },
  swingSeat: { position: 'absolute', bottom: 4, left: 0, width: 30, height: 7, borderRadius: 4 },
  shell: { width: 43, height: 35, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sign: { width: 47, height: 43, borderRadius: 10, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  diffuser: { width: 36, height: 24, borderRadius: 18, borderWidth: 2 },
  frame: { width: 18, height: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  hanging: { alignItems: 'center', width: 15 },
  string: { width: 1 },
  jarRow: { flexDirection: 'row', gap: 5 },
  jar: { width: 12, height: 17, borderWidth: 1, borderTopWidth: 4, borderRadius: 3 },
  shelf: { width: 58, height: 4 },
  machineBody: { width: 38, height: 31, borderWidth: 2, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  machineTop: { position: 'absolute', top: 3, flexDirection: 'row', gap: 5 },
  machineKnob: { width: 5, height: 5, borderRadius: 3 },
  machinePanel: { width: 18, height: 9, borderRadius: 3, borderWidth: 1, borderColor: c.candyCaramel },
  machineSpout: { position: 'absolute', bottom: 3, width: 3, height: 7, borderRadius: 2 },
  machineTray: { width: 27, height: 3, borderRadius: 2, marginTop: -1 },
  machineCup: { position: 'absolute', bottom: 4, right: 12, width: 9, height: 8, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  machineBase: { width: 42, height: 5, borderRadius: 3 },
  iceCreamScoop: { position: 'absolute', bottom: 1, left: 11, width: 11, height: 11, borderRadius: 6, borderWidth: 1, borderColor: c.candyCream },
  iceCreamScoopSecond: { left: 19, bottom: 3, width: 10, height: 10 },
  candyBowl: { width: 47, height: 36, borderWidth: 2, borderRadius: 24, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cottonCloud: { position: 'absolute', top: 3, left: 12, width: 25, height: 19, borderRadius: 12 },
  cottonCloudSecond: { top: 1, left: 19, width: 18, height: 16 },
  cottonStick: { position: 'absolute', top: 20, width: 2, height: 12 },
  candyShelf: { width: 54, height: 36, borderWidth: 2, borderRadius: 5, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'space-evenly', justifyContent: 'space-evenly', overflow: 'hidden' },
  candyJar: { width: 9, height: 8, borderRadius: 3, borderWidth: 1, borderColor: c.candyCream },
  candyShelfLine: { position: 'absolute', top: 17, left: 0, right: 0, height: 2 },
  ovenBody: { width: 43, height: 37, borderWidth: 2, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  ovenWindow: { width: 27, height: 22, borderWidth: 2, borderRadius: 4, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ovenBread: { position: 'absolute', width: 9, height: 6, borderRadius: 5, left: 3 },
  ovenBreadSecond: { left: 14, top: 10 },
  ovenControls: { position: 'absolute', right: 3, top: 3, gap: 3 },
  teaPot: { width: 21, height: 17, borderWidth: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  foodPan: { position: 'absolute', top: 5, left: 6, width: 16, height: 11, borderRadius: 3 },
  foodPanSecond: { left: 27, backgroundColor: c.candyPeach },
  foodPrepPanel: { position: 'absolute', bottom: 4, width: 36 },
  flowerStationTop: { width: 58, height: 23, position: 'relative' },
  flowerStationBloom: { position: 'absolute', bottom: 1, width: 12, height: 12, borderRadius: 7 },
  flowerStationBench: { width: 57, height: 10, borderWidth: 2, borderRadius: 4 },
  bookCarouselRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  miniBook: { width: 11, height: 22, borderRadius: 2, borderWidth: 1, borderColor: c.candyCaramelDark },
  capsuleGlass: { width: 38, height: 28, borderWidth: 2, borderRadius: 20, flexDirection: 'row', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', gap: 2, overflow: 'hidden' },
  capsuleBall: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: c.card },
  capsuleBase: { width: 29, height: 14, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  capsuleKnob: { position: 'absolute', bottom: 5, right: 18 },
  craftBoard: { width: 48, height: 31, borderWidth: 2, borderRadius: 5 },
  craftTool: { position: 'absolute', top: 5, left: 11, width: 4, height: 22, borderRadius: 2 },
  craftToolSecond: { left: 22, height: 18 },
  craftButton: { position: 'absolute', top: 7, right: 8 },
  sewingHead: { position: 'absolute', top: 8, left: 10, width: 37, height: 24, borderWidth: 2, borderRadius: 5 },
  sewingArm: { position: 'absolute', top: 6, left: 6, width: 19, height: 12, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  sewingNeedle: { position: 'absolute', right: 8, bottom: 0, width: 2, height: 10 },
  sewingWheel: { position: 'absolute', right: -4, top: 7, borderWidth: 1, borderColor: c.candyCaramelDark },
  sewingTable: { position: 'absolute', bottom: 8, width: 56, height: 7, borderRadius: 3 },
  sewingLeg: { position: 'absolute', bottom: 2, left: 13, width: 3, height: 8 },
  electronicsScreen: { width: 36, height: 29, borderWidth: 3, borderRadius: 5, alignItems: 'center', justifyContent: 'center' },
  electronicsIndicator: { position: 'absolute', top: 8, right: 15 },
  jewelryCase: { width: 52, height: 34, borderWidth: 2, borderRadius: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  jewelryGem: { width: 8, height: 9, borderRadius: 4, borderWidth: 1, borderColor: c.card },
  jewelryShelf: { position: 'absolute', bottom: 5, left: 3, right: 3, height: 3 },
  rainbow: { width: 60, height: 45 },
  rainbowBand: { position: 'absolute', borderWidth: 5, borderBottomWidth: 0, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  rackScene: { width: 57, height: 46, alignItems: 'center', justifyContent: 'flex-end' },
  rackTop: { width: 48, height: 3, borderRadius: 2 },
  rackGarments: { height: 37, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 3 },
  hangingPiece: { alignItems: 'center', width: 11 },
  hanger: { width: 8, height: 5, borderTopWidth: 1.5, borderLeftWidth: 1, borderRightWidth: 1, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  hangingGarment: { width: 10, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  rackBase: { width: 58, height: 3, borderRadius: 2 },
  wardrobeScene: { width: 56, height: 47, alignItems: 'center', justifyContent: 'flex-end' },
  wardrobeCrown: { width: 50, height: 5, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  wardrobeBody: { width: 46, height: 37, borderWidth: 2, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'center', overflow: 'hidden' },
  wardrobeRail: { position: 'absolute', top: 7, left: 4, right: 4, height: 2, borderRadius: 1 },
  wardrobeGarments: { height: 22, marginTop: 9, flexDirection: 'row', alignItems: 'flex-start', gap: 3 },
  wardrobeGarment: { width: 7, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  wardrobeCenterLine: { position: 'absolute', top: 0, bottom: 11, width: 1, backgroundColor: c.candyCaramel },
  wardrobeDrawer: { position: 'absolute', bottom: 3, left: 4, right: 4, height: 8, borderWidth: 1, borderRadius: 2 },
  wardrobeKnob: { position: 'absolute', bottom: 6, width: 3, height: 3, borderRadius: 2 },
  wardrobeFoot: { width: 51, height: 3, borderRadius: 2 },
  clothingStand: { width: 58, height: 47, alignItems: 'center', justifyContent: 'flex-end' },
  clothingHanger: { position: 'absolute', top: 0, width: 14, height: 7, borderTopWidth: 1.5, borderLeftWidth: 1, borderRightWidth: 1, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  blouseShape: { width: 34, height: 29, marginBottom: 4, alignItems: 'center', justifyContent: 'center' },
  blouseSleeve: { position: 'absolute', top: 4, width: 12, height: 17, borderRadius: 4 },
  blouseBody: { width: 21, height: 25, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  blouseCollar: { position: 'absolute', top: 0, width: 9, height: 6, borderBottomLeftRadius: 5, borderBottomRightRadius: 5, backgroundColor: c.card },
  skirtShape: { width: 34, height: 30, marginBottom: 4, alignItems: 'center' },
  skirtWaist: { width: 17, height: 5, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  skirtHem: { width: 0, height: 0, borderLeftWidth: 14, borderRightWidth: 14, borderTopWidth: 23, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  dressShape: { width: 38, height: 32, marginBottom: 3, alignItems: 'center' },
  dressBodice: { width: 17, height: 12, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  dressHem: { width: 0, height: 0, borderLeftWidth: 15, borderRightWidth: 15, borderTopWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
  dressSash: { position: 'absolute', top: 10, width: 18, height: 3, backgroundColor: c.candyLemon },
  clothingStandStem: { width: 3, height: 8 },
  clothingStandBase: { width: 24, height: 4, borderRadius: 2 },
  kimonoStand: { width: 58, height: 47, alignItems: 'center', justifyContent: 'flex-end' },
  kimonoSleeves: { position: 'absolute', top: 8, width: 48, height: 21 },
  kimonoSleeve: { position: 'absolute', top: 3, width: 18, height: 16, borderRadius: 3 },
  kimonoBody: { width: 23, height: 29, alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 7, borderTopRightRadius: 7, overflow: 'hidden' },
  kimonoLapels: { position: 'absolute', top: -1, width: 8, height: 22, borderLeftWidth: 2, borderRightWidth: 2, transform: [{ rotate: '20deg' }] },
  kimonoObi: { position: 'absolute', top: 14, left: 0, right: 0, height: 5 },
  fallbackShowcase: { width: 42, height: 33, borderWidth: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
