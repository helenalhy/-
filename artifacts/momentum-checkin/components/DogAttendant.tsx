import React from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import palette from '@/constants/colors';
import { DOG_ATTENDANT_LOOKS } from '@/constants/dog-attendant-looks';
import {
  DOG_STAFF_ACCESSORY_BY_ID,
  DOG_STAFF_OUTFIT_BY_ID,
  type DogAnimalKind,
} from '@/constants/dog-staff-customization';

const c = palette.light;

export type DogAttendantKind =
  | 'huahua'
  | 'milkshake'
  | 'xiaoniu'
  | 'pudding'
  | 'tangtang'
  | 'pipi'
  | 'amber'
  | 'cloud'
  | 'wonton'
  | 'butter'
  | 'sesame'
  | 'snowball'
  | 'maomao'
  | 'poppy';

export function DogAttendant({
  kind,
  outfitId,
  accessoryId,
  happy = false,
}: {
  kind: DogAttendantKind;
  outfitId?: string;
  accessoryId?: string;
  happy?: boolean;
}) {
  const look = DOG_ATTENDANT_LOOKS[kind];
  const outfit = outfitId ? DOG_STAFF_OUTFIT_BY_ID[outfitId] : undefined;
  const accessory = accessoryId ? DOG_STAFF_ACCESSORY_BY_ID[accessoryId] : undefined;
  const animalEarKind = accessory?.shape === 'animal-ears'
    ? accessory.animalKind
    : outfit?.cut === 'animal-costume' ? outfit.animalKind : undefined;
  const animalEarColor = accessory?.shape === 'animal-ears' ? accessory.color : outfit?.color;
  const animalEarAccent = accessory?.shape === 'animal-ears' ? accessory.accentColor : outfit?.accentColor;
  const animalEarShape = animalEarKind ? ({
    lion: s.roundAnimalEar,
    rabbit: s.longAnimalEar,
    fox: s.pointedAnimalEar,
    duck: s.shortAnimalEar,
    bear: s.roundAnimalEar,
    cat: s.pointedAnimalEar,
    deer: s.pointedAnimalEar,
    koala: s.largeRoundAnimalEar,
    lamb: s.fluffyAnimalEar,
    panda: s.roundAnimalEar,
    'polar-bear': s.roundAnimalEar,
    seal: s.fluffyAnimalEar,
    tiger: s.pointedAnimalEar,
    raccoon: s.roundAnimalEar,
  } satisfies Record<DogAnimalKind, ViewStyle>)[animalEarKind] : null;
  const leftEarStyle = look.earStyle === 'upright'
    ? s.leftUprightEar
    : look.earStyle === 'floppy' ? s.leftFloppyEar : s.leftEar;
  const rightEarStyle = look.earStyle === 'upright'
    ? s.rightUprightEar
    : look.earStyle === 'floppy' ? s.rightFloppyEar : s.rightEar;
  const outfitCutStyle = outfit ? {
    apron: s.apronOutfit,
    vest: s.vestOutfit,
    jacket: s.jacketOutfit,
    cape: s.capeOutfit,
    dress: s.dressOutfit,
    princess: s.princessOutfit,
    'little-skirt': s.littleSkirtOutfit,
    'santa-coat': s.santaCoatOutfit,
    'snowflake-cape': s.snowflakeCapeOutfit,
    'pumpkin-dress': s.pumpkinDressOutfit,
    'ghost-poncho': s.ghostPonchoOutfit,
    'moon-rabbit': s.moonRabbitOutfit,
    'sakura-kimono': s.sakuraKimonoOutfit,
    'tropical-sailor': s.tropicalSailorOutfit,
    'lion-dance': s.lionDanceOutfit,
    'star-fairy': s.starFairyOutfit,
    'forest-leaf': s.forestLeafOutfit,
    'magical-girl': s.magicalGirlOutfit,
    sweater: s.sweaterOutfit,
    'animal-costume': s.animalCostumeOutfit,
  }[outfit.cut] : null;
  const accessoryShapeStyle = accessory ? {
    bow: s.bowAccessory,
    beret: s.beretAccessory,
    headband: s.headbandAccessory,
    flower: s.flowerAccessory,
    scarf: s.scarfAccessory,
    'animal-ears': s.animalEarsAccessory,
  }[accessory.shape] : null;

  return (
    <View testID={`dog-attendant-${kind}`} accessible={false} style={s.canvas}>
      <View
        style={[
          s.tail,
          look.tailStyle === 'long' ? s.longTail : s.roundTail,
          { backgroundColor: look.coat, borderColor: look.ear },
        ]}
      />
      <View style={[
        s.body,
        look.bodyStyle === 'low' && s.lowBody,
        look.bodyStyle === 'long' && s.longBody,
        { backgroundColor: look.coat, borderColor: look.ear },
      ]}>
        <View style={[s.chest, { backgroundColor: look.marking }]} />
        {look.facePattern === 'collie' && <View style={s.saddlePatch} />}
      </View>
      {outfit && (
        <View style={[
          s.outfitBase,
          outfitCutStyle,
          { backgroundColor: outfit.color, borderColor: c.candyCaramelDark },
        ]}>
          <View style={[
            s.outfitDetail,
            outfit.pattern === 'stripes' ? s.outfitStripe : null,
            outfit.pattern === 'checks' ? s.outfitCheck : null,
            outfit.pattern === 'stars' ? s.outfitStar : null,
            outfit.pattern === 'flowers' ? s.outfitFlower : null,
            { backgroundColor: outfit.accentColor },
          ]} />
          <View style={[s.outfitButton, { backgroundColor: outfit.accentColor }]} />
          {outfit.cut === 'magical-girl' && (
            <>
              <View style={[s.magicalBowLoop, s.leftMagicalBowLoop, { backgroundColor: outfit.accentColor }]} />
              <View style={[s.magicalBowLoop, s.rightMagicalBowLoop, { backgroundColor: outfit.accentColor }]} />
              <View style={[s.magicalBowKnot, { backgroundColor: outfit.color, borderColor: outfit.accentColor }]} />
              <View style={[s.magicalGem, { backgroundColor: outfit.color, borderColor: c.candyCaramelDark }]}>
                <View style={[s.magicalGemGlint, { backgroundColor: c.card }]} />
              </View>
              <View style={[s.magicalSkirtLayer, { backgroundColor: outfit.accentColor, borderColor: outfit.color }]} />
              <View style={[s.magicalLaceHem, { borderTopColor: c.candyCream }]}>
                {Array.from({ length: 6 }, (_, index) => (
                  <View key={index} style={[s.magicalScallop, { backgroundColor: c.candyCream, borderColor: outfit.accentColor }]} />
                ))}
              </View>
              <View style={[s.magicalSleeve, s.leftMagicalSleeve, { backgroundColor: outfit.accentColor }]} />
              <View style={[s.magicalSleeve, s.rightMagicalSleeve, { backgroundColor: outfit.accentColor }]} />
              <Feather name="star" size={5} color={c.candyCream} style={s.leftMagicalStarGlyph} />
              <Feather name="star" size={5} color={c.candyCream} style={s.rightMagicalStarGlyph} />
              <View style={[s.magicalWaistBand, { backgroundColor: outfit.accentColor }]} />
            </>
          )}
          {outfit.cut === 'sweater' && (
            <>
              <View style={[s.knitRib, s.knitRibTop, { backgroundColor: outfit.accentColor }]} />
              <View style={[s.knitRib, s.knitRibBottom, { backgroundColor: outfit.accentColor }]} />
              <View style={[s.knitStitch, s.knitStitchLeft, { backgroundColor: outfit.accentColor }]} />
              <View style={[s.knitStitch, s.knitStitchRight, { backgroundColor: outfit.accentColor }]} />
            </>
          )}
          {outfit.cut === 'animal-costume' && (
            <View style={[s.animalCostumeBadge, { backgroundColor: outfit.accentColor, borderColor: outfit.color }]}>
              <View style={[s.animalCostumeNose, { backgroundColor: outfit.color }]} />
            </View>
          )}
            {outfit.lace && (
              <View style={[s.laceTrim, { borderTopColor: outfit.accentColor }]}>
                {Array.from({ length: 7 }, (_, index) => (
                  <View
                    key={index}
                    style={[s.laceScallop, { backgroundColor: c.candyCream, borderColor: outfit.accentColor }]}
                  />
                ))}
              </View>
            )}
        </View>
      )}
      <View style={[s.legs, look.bodyStyle === 'low' && s.lowLegs, look.bodyStyle === 'long' && s.longLegs]}>
        <View style={[s.leg, { backgroundColor: look.coat, borderColor: look.ear }]} />
        <View style={[s.leg, { backgroundColor: look.coat, borderColor: look.ear }]} />
      </View>
      {look.fluffy && (
        <>
          <View style={[s.furPuff, s.leftFurPuff, { backgroundColor: look.coat }]} />
          <View style={[s.furPuff, s.rightFurPuff, { backgroundColor: look.coat }]} />
          <View style={[s.furPuff, s.topFurPuff, { backgroundColor: look.coat }]} />
        </>
      )}
      <View style={[s.ear, leftEarStyle, { backgroundColor: look.ear }]} />
      <View style={[s.ear, rightEarStyle, { backgroundColor: look.ear }]} />
      <View style={[s.head, { backgroundColor: look.coat, borderColor: look.ear }]}>
        {look.facePattern === 'collie' && <View style={s.collieBlaze} />}
        {look.facePattern === 'shih-tzu' && (
          <>
            <View style={[s.facePatch, s.leftFacePatch, { backgroundColor: look.marking }]} />
            <View style={[s.facePatch, s.rightFacePatch, { backgroundColor: look.marking }]} />
          </>
        )}
        <View style={[happy ? s.happyEye : s.eye, s.leftEye]} />
        <View style={[happy ? s.happyEye : s.eye, s.rightEye]} />
        <View style={[s.cheek, happy && s.happyCheek, s.leftCheek, { backgroundColor: happy ? c.candyPink : look.marking }]} />
        <View style={[s.cheek, happy && s.happyCheek, s.rightCheek, { backgroundColor: happy ? c.candyPink : look.marking }]} />
        <View style={[s.muzzle, { backgroundColor: look.muzzle }]}>
          {look.facePattern === 'schnauzer' && <View style={s.schnauzerBeard} />}
          <View style={s.nose} />
          <View style={[s.smile, happy && s.happySmile]} />
        </View>
      </View>
      <View style={[s.collar, { backgroundColor: look.collar }]}>
        <View style={s.bell} />
      </View>
      {accessory && (
        <View style={[
          s.accessoryBase,
          accessoryShapeStyle,
          { backgroundColor: accessory.color, borderColor: c.candyCaramelDark },
        ]}>
          {accessory.shape === 'bow' && (
            <>
              <View style={[s.accessoryBowLoop, s.accessoryBowLeft, { backgroundColor: accessory.accentColor }]} />
              <View style={[s.accessoryBowLoop, s.accessoryBowRight, { backgroundColor: accessory.accentColor }]} />
              <View style={[s.accessoryBowKnot, { backgroundColor: accessory.color }]} />
            </>
          )}
          {accessory.shape === 'beret' && (
            <>
              <View style={[s.accessoryBeretHighlight, { backgroundColor: c.card }]} />
              <View style={[s.accessoryBeretPin, { backgroundColor: accessory.accentColor }]} />
            </>
          )}
          {accessory.shape === 'headband' && (
            <>
              <View style={[s.accessoryHeadbandGem, { backgroundColor: accessory.accentColor }]} />
              <View style={[s.accessoryHeadbandGlint, { backgroundColor: c.card }]} />
            </>
          )}
          {accessory.shape === 'flower' && (
            <>
              {[0, 1, 2, 3, 4].map((petal) => (
                <View
                  key={petal}
                  style={[
                    s.accessoryFlowerPetal,
                    { backgroundColor: accessory.accentColor },
                    petal === 0 ? s.accessoryFlowerTop : null,
                    petal === 1 ? s.accessoryFlowerRight : null,
                    petal === 2 ? s.accessoryFlowerBottom : null,
                    petal === 3 ? s.accessoryFlowerLeft : null,
                    petal === 4 ? s.accessoryFlowerTopLeft : null,
                  ]}
                />
              ))}
              <View style={[s.accessoryFlowerCenter, { backgroundColor: c.candyLemon }]} />
            </>
          )}
          {accessory.shape === 'scarf' && (
            <>
              <View style={[s.accessoryScarfFold, { backgroundColor: accessory.accentColor }]} />
              <View style={[s.accessoryScarfTail, { backgroundColor: accessory.color, borderColor: c.candyCaramelDark }]} />
            </>
          )}
          {accessory.shape !== 'bow' && accessory.shape !== 'beret' && accessory.shape !== 'headband' && accessory.shape !== 'flower' && accessory.shape !== 'scarf' && (
            <View style={[s.accessoryDetail, { backgroundColor: accessory.accentColor }]} />
          )}
        </View>
      )}
      {animalEarKind && animalEarShape && animalEarColor && animalEarAccent && (
        <View style={s.animalEarsHat} accessible={false}>
          <View style={[
            s.animalEarOuter,
            s.leftAnimalEar,
            animalEarShape,
            { backgroundColor: animalEarColor, borderColor: animalEarAccent },
          ]}>
            <View style={[s.animalEarInner, { backgroundColor: animalEarAccent }]} />
          </View>
          <View style={[
            s.animalEarOuter,
            s.rightAnimalEar,
            animalEarShape,
            { backgroundColor: animalEarColor, borderColor: animalEarAccent },
          ]}>
            <View style={[s.animalEarInner, { backgroundColor: animalEarAccent }]} />
          </View>
          <View style={[s.animalEarHatBand, { backgroundColor: animalEarColor, borderColor: animalEarAccent }]} />
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  canvas: { width: 50, height: 45, alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  tail: { position: 'absolute', right: 8, bottom: 13, borderWidth: 1.5, zIndex: 0 },
  roundTail: { width: 9, height: 9, borderRadius: 99 },
  longTail: { width: 14, height: 5, borderRadius: 99, bottom: 15, transform: [{ rotate: '-25deg' }] },
  body: { position: 'absolute', width: 25, height: 15, left: 13, bottom: 5, borderRadius: 10, borderWidth: 1.2, overflow: 'hidden' },
  lowBody: { width: 29, left: 11, height: 13, bottom: 5, borderRadius: 8 },
  longBody: { width: 31, left: 10, height: 13, bottom: 5, borderRadius: 8 },
  outfitBase: { position: 'absolute', zIndex: 1, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  apronOutfit: { left: 16, bottom: 7, width: 19, height: 10, borderRadius: 4 },
  vestOutfit: { left: 14, bottom: 6, width: 23, height: 12, borderRadius: 7 },
  jacketOutfit: { left: 14, bottom: 7, width: 23, height: 9, borderRadius: 5 },
  capeOutfit: { left: 11, bottom: 5, width: 28, height: 13, borderRadius: 8 },
  dressOutfit: { left: 11, bottom: 4, width: 28, height: 14, borderRadius: 7, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  princessOutfit: { left: 8, bottom: 3, width: 34, height: 16, borderRadius: 9, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  littleSkirtOutfit: { left: 12, bottom: 4, width: 26, height: 12, borderRadius: 7, borderBottomLeftRadius: 11, borderBottomRightRadius: 11 },
  santaCoatOutfit: { left: 11, bottom: 4, width: 28, height: 15, borderRadius: 7, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  snowflakeCapeOutfit: { left: 9, bottom: 4, width: 32, height: 14, borderRadius: 8, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  pumpkinDressOutfit: { left: 8, bottom: 3, width: 34, height: 17, borderRadius: 13, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  ghostPonchoOutfit: { left: 9, bottom: 5, width: 32, height: 14, borderRadius: 10, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  moonRabbitOutfit: { left: 10, bottom: 3, width: 30, height: 16, borderRadius: 9, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  sakuraKimonoOutfit: { left: 10, bottom: 4, width: 30, height: 15, borderTopLeftRadius: 9, borderTopRightRadius: 5, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 },
  tropicalSailorOutfit: { left: 12, bottom: 6, width: 26, height: 12, borderRadius: 5, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
  lionDanceOutfit: { left: 8, bottom: 3, width: 34, height: 17, borderRadius: 12, borderBottomLeftRadius: 15, borderBottomRightRadius: 15 },
  starFairyOutfit: { left: 8, bottom: 4, width: 34, height: 15, borderRadius: 8, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  forestLeafOutfit: { left: 9, bottom: 4, width: 32, height: 14, borderRadius: 8, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  magicalGirlOutfit: { left: 6, bottom: 2, width: 38, height: 18, borderRadius: 9, borderBottomLeftRadius: 17, borderBottomRightRadius: 17, overflow: 'visible' },
  sweaterOutfit: { left: 9, bottom: 5, width: 32, height: 14, borderRadius: 7, borderBottomLeftRadius: 9, borderBottomRightRadius: 9 },
  animalCostumeOutfit: { left: 8, bottom: 4, width: 34, height: 15, borderRadius: 10, borderBottomLeftRadius: 14, borderBottomRightRadius: 14 },
  outfitDetail: { position: 'absolute', left: 3, top: 3, width: 7, height: 2, borderRadius: 2 },
  outfitStripe: { width: 16, height: 2, left: 2, top: 4 },
  outfitCheck: { width: 6, height: 4, left: 4, top: 3 },
  outfitStar: { width: 4, height: 4, left: 5, top: 2, borderRadius: 4 },
  outfitFlower: { width: 5, height: 5, left: 4, top: 2, borderRadius: 4 },
  outfitButton: { position: 'absolute', width: 2, height: 2, right: 4, top: 3, borderRadius: 2 },
  magicalGem: { position: 'absolute', left: 16, top: 4, width: 6, height: 6, borderWidth: 0.8, borderRadius: 2, transform: [{ rotate: '45deg' }], zIndex: 4, alignItems: 'flex-start', justifyContent: 'flex-start' },
  magicalGemGlint: { width: 2, height: 2, margin: 0.8, borderRadius: 2 },
  magicalBowLoop: { position: 'absolute', top: -1, width: 9, height: 6, borderRadius: 6, borderWidth: 0.8, borderColor: c.candyCaramelDark, zIndex: 4 },
  leftMagicalBowLoop: { left: 10, transform: [{ rotate: '-22deg' }] },
  rightMagicalBowLoop: { left: 19, transform: [{ rotate: '22deg' }] },
  magicalBowKnot: { position: 'absolute', left: 16, top: 1, width: 6, height: 5, borderWidth: 0.8, borderColor: c.candyCaramelDark, borderRadius: 3, zIndex: 5 },
  magicalStarGlyph: { position: 'absolute', top: 10 },
  leftMagicalStarGlyph: { left: 5 },
  rightMagicalStarGlyph: { right: 5 },
  magicalSleeve: { position: 'absolute', top: 4, width: 7, height: 8, borderRadius: 5, borderWidth: 0.8, borderColor: c.candyCaramelDark, zIndex: 3 },
  leftMagicalSleeve: { left: -2 },
  rightMagicalSleeve: { right: -2 },
  magicalSkirtLayer: { position: 'absolute', left: 1, right: 1, bottom: 2, height: 7, borderTopWidth: 1, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 11, borderBottomRightRadius: 11 },
  magicalLaceHem: { position: 'absolute', left: 0, right: 0, bottom: -1, height: 5, borderTopWidth: 0.7, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  magicalScallop: { width: 5, height: 4, borderRadius: 4, borderWidth: 0.6 },
  magicalWaistBand: { position: 'absolute', left: 4, right: 4, top: 9, height: 2, borderRadius: 3 },
  knitRib: { position: 'absolute', left: 2, right: 2, height: 1.5, borderRadius: 2 },
  knitRibTop: { top: 3 },
  knitRibBottom: { bottom: 2 },
  knitStitch: { position: 'absolute', top: 6, width: 2, height: 2, borderRadius: 2 },
  knitStitchLeft: { left: 8 },
  knitStitchRight: { right: 8 },
  animalCostumeBadge: { position: 'absolute', left: 12, top: 4, width: 7, height: 6, borderWidth: 0.7, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  animalCostumeNose: { width: 2, height: 1.5, borderRadius: 2 },
  animalEarsHat: { position: 'absolute', left: 8, top: 0, width: 34, height: 14, zIndex: 4 },
  animalEarOuter: { position: 'absolute', top: 0, width: 9, height: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  leftAnimalEar: { left: 3, transform: [{ rotate: '-22deg' }] },
  rightAnimalEar: { right: 3, transform: [{ rotate: '22deg' }] },
  roundAnimalEar: { borderRadius: 7 },
  longAnimalEar: { width: 7, height: 14, borderTopLeftRadius: 4, borderTopRightRadius: 5, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  pointedAnimalEar: { width: 8, height: 12, borderTopLeftRadius: 2, borderTopRightRadius: 7, borderBottomLeftRadius: 5, borderBottomRightRadius: 5 },
  shortAnimalEar: { width: 8, height: 7, borderRadius: 5 },
  largeRoundAnimalEar: { width: 12, height: 12, borderRadius: 8 },
  fluffyAnimalEar: { width: 10, height: 10, borderRadius: 6 },
  animalEarInner: { width: 4, height: 5, borderRadius: 4 },
  animalEarHatBand: { position: 'absolute', left: 5, right: 5, top: 5, height: 3, borderWidth: 0.7, borderRadius: 3 },
  laceTrim: { position: 'absolute', left: 1, right: 1, bottom: 0, height: 4, borderTopWidth: 0.7, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around' },
  laceScallop: { width: 4, height: 4, borderRadius: 3, borderWidth: 0.6 },
  chest: { position: 'absolute', width: 9, height: 14, left: 2, top: 0, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  saddlePatch: { position: 'absolute', right: 1, top: 2, width: 11, height: 9, borderRadius: 6, backgroundColor: c.candyCream },
  legs: { position: 'absolute', left: 16, bottom: 0, flexDirection: 'row', gap: 8 },
  lowLegs: { left: 13, gap: 12 },
  longLegs: { left: 12, gap: 16 },
  leg: { width: 6, height: 9, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  ear: { position: 'absolute', top: 4, width: 9, height: 12, borderRadius: 7, borderWidth: 1, borderColor: c.candyCaramelDark },
  leftEar: { left: 14, transform: [{ rotate: '-20deg' }] },
  rightEar: { right: 14, transform: [{ rotate: '20deg' }] },
  leftUprightEar: { left: 13, top: 1, width: 8, height: 14, borderTopLeftRadius: 2, borderTopRightRadius: 8, transform: [{ rotate: '-8deg' }] },
  rightUprightEar: { right: 13, top: 1, width: 8, height: 14, borderTopLeftRadius: 8, borderTopRightRadius: 2, transform: [{ rotate: '8deg' }] },
  leftFloppyEar: { left: 11, top: 8, width: 10, height: 14, borderRadius: 8, transform: [{ rotate: '18deg' }] },
  rightFloppyEar: { right: 11, top: 8, width: 10, height: 14, borderRadius: 8, transform: [{ rotate: '-18deg' }] },
  furPuff: { position: 'absolute', width: 11, height: 11, borderRadius: 7, zIndex: 1 },
  leftFurPuff: { left: 10, top: 14 },
  rightFurPuff: { right: 10, top: 14 },
  topFurPuff: { left: 19, top: 3, width: 12, height: 10 },
  head: { position: 'absolute', width: 24, height: 22, left: 13, top: 6, borderRadius: 13, borderWidth: 1.2, zIndex: 2 },
  collieBlaze: { position: 'absolute', width: 4, height: 12, left: 9, top: 1, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: c.candyCream },
  facePatch: { position: 'absolute', top: 4, width: 7, height: 8, borderRadius: 5 },
  leftFacePatch: { left: 1 },
  rightFacePatch: { right: 1 },
  eye: { position: 'absolute', top: 8, width: 2.5, height: 3, borderRadius: 2, backgroundColor: c.candyInk },
  happyEye: { position: 'absolute', top: 9, width: 5, height: 4, borderTopWidth: 1.3, borderTopColor: c.candyInk, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  leftEye: { left: 6 },
  rightEye: { right: 6 },
  cheek: { position: 'absolute', top: 11, width: 5, height: 3, borderRadius: 4, opacity: 0.9 },
  happyCheek: { width: 6, height: 3.5, opacity: 1 },
  leftCheek: { left: 1 },
  rightCheek: { right: 1 },
  muzzle: { position: 'absolute', width: 11, height: 7, left: 5.5, bottom: 1, borderRadius: 6, alignItems: 'center' },
  schnauzerBeard: { position: 'absolute', top: 2, width: 11, height: 6, borderRadius: 5, backgroundColor: c.candySky },
  nose: { position: 'absolute', top: 0.5, width: 3, height: 2, borderRadius: 2, backgroundColor: c.candyCaramelDark },
  smile: { position: 'absolute', top: 3, width: 4, height: 2, borderBottomWidth: 0.8, borderColor: c.candyCaramelDark, borderRadius: 4 },
  happySmile: { width: 5, height: 2.5, borderBottomWidth: 1.2 },
  collar: { position: 'absolute', width: 16, height: 4, left: 18, bottom: 15, borderRadius: 3, zIndex: 3 },
  bell: { position: 'absolute', width: 3, height: 3, left: 6.5, top: 2, borderRadius: 2, backgroundColor: c.candyLemon },
  accessoryBase: { position: 'absolute', zIndex: 5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bowAccessory: { left: 31, top: 5, width: 9, height: 7, borderRadius: 4, transform: [{ rotate: '15deg' }] },
  beretAccessory: { left: 16, top: 0, width: 20, height: 8, borderRadius: 8, transform: [{ rotate: '-12deg' }] },
  headbandAccessory: { left: 14, top: 7, width: 22, height: 4, borderRadius: 4 },
  flowerAccessory: { left: 11, top: 1, width: 10, height: 10, borderRadius: 7 },
  scarfAccessory: { left: 27, top: 27, width: 17, height: 6, borderRadius: 4, transform: [{ rotate: '15deg' }] },
  animalEarsAccessory: { left: 12, top: 5, width: 26, height: 4, borderRadius: 4 },
  accessoryDetail: { width: 3, height: 3, borderRadius: 3 },
  accessoryBowLoop: { position: 'absolute', top: 0, width: 6, height: 5, borderRadius: 5, borderWidth: 0.6, borderColor: c.candyCaramelDark },
  accessoryBowLeft: { left: -1, transform: [{ rotate: '-18deg' }] },
  accessoryBowRight: { right: -1, transform: [{ rotate: '18deg' }] },
  accessoryBowKnot: { position: 'absolute', width: 3, height: 4, borderRadius: 2, borderWidth: 0.5, borderColor: c.candyCaramelDark },
  accessoryBeretHighlight: { position: 'absolute', top: 1, left: 4, width: 8, height: 2, borderRadius: 3, opacity: 0.8 },
  accessoryBeretPin: { position: 'absolute', top: -1, right: 4, width: 4, height: 4, borderRadius: 3, borderWidth: 0.5, borderColor: c.candyCaramelDark },
  accessoryHeadbandGem: { position: 'absolute', top: -2, left: 8, width: 6, height: 5, borderRadius: 3, borderWidth: 0.6, borderColor: c.candyCaramelDark },
  accessoryHeadbandGlint: { position: 'absolute', top: -1, left: 9, width: 2, height: 2, borderRadius: 2 },
  accessoryFlowerPetal: { position: 'absolute', width: 4, height: 4, borderRadius: 3, borderWidth: 0.4, borderColor: c.candyCaramelDark },
  accessoryFlowerTop: { top: -2, left: 2 },
  accessoryFlowerRight: { top: 1, right: -1 },
  accessoryFlowerBottom: { bottom: -2, left: 3 },
  accessoryFlowerLeft: { top: 2, left: -2 },
  accessoryFlowerTopLeft: { top: -1, left: -1 },
  accessoryFlowerCenter: { width: 3, height: 3, borderRadius: 2, borderWidth: 0.4, borderColor: c.candyCaramelDark },
  accessoryScarfFold: { position: 'absolute', left: 3, top: 1, width: 8, height: 2, borderRadius: 3 },
  accessoryScarfTail: { position: 'absolute', right: 0, top: 3, width: 4, height: 7, borderWidth: 0.5, borderTopWidth: 0, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
});
