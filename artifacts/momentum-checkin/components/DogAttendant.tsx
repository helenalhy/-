import React from 'react';
import { StyleSheet, View } from 'react-native';
import palette from '@/constants/colors';

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

const dogLooks: Record<DogAttendantKind, {
  coat: string;
  ear: string;
  muzzle: string;
  collar: string;
  marking: string;
  earStyle: 'small' | 'upright' | 'floppy';
  bodyStyle: 'regular' | 'low' | 'long';
  facePattern: 'none' | 'collie' | 'shih-tzu' | 'schnauzer';
  fluffy: boolean;
}> = {
  huahua: {
    coat: c.candyCaramel,
    ear: c.candyCaramelDark,
    muzzle: c.candyCream,
    collar: c.candyPink,
    marking: c.candyCream,
    earStyle: 'small',
    bodyStyle: 'regular',
    facePattern: 'none',
    fluffy: true,
  },
  milkshake: {
    coat: c.candyCream,
    ear: c.candyPeach,
    muzzle: c.card,
    collar: c.candyLavender,
    marking: c.candyPeach,
    earStyle: 'small',
    bodyStyle: 'regular',
    facePattern: 'none',
    fluffy: true,
  },
  xiaoniu: {
    coat: c.candyInk,
    ear: c.candyInk,
    muzzle: c.candyCream,
    collar: c.candyMintDark,
    marking: c.candyCream,
    earStyle: 'upright',
    bodyStyle: 'regular',
    facePattern: 'collie',
    fluffy: false,
  },
  pudding: {
    coat: c.candyCaramel,
    ear: c.candyCaramelDark,
    muzzle: c.candyCream,
    collar: c.candyLemon,
    marking: c.candyPeach,
    earStyle: 'floppy',
    bodyStyle: 'regular',
    facePattern: 'none',
    fluffy: false,
  },
  tangtang: {
    coat: c.candyCream,
    ear: c.candyCream,
    muzzle: c.card,
    collar: c.candyPink,
    marking: c.candyPeach,
    earStyle: 'small',
    bodyStyle: 'regular',
    facePattern: 'none',
    fluffy: true,
  },
  pipi: {
    coat: c.candyCaramel,
    ear: c.candyCaramelDark,
    muzzle: c.candyCream,
    collar: c.candySky,
    marking: c.candyCream,
    earStyle: 'upright',
    bodyStyle: 'low',
    facePattern: 'none',
    fluffy: false,
  },
  amber: {
    coat: c.candyPeach,
    ear: c.candyCaramel,
    muzzle: c.candyCream,
    collar: c.candyLavender,
    marking: c.candyCream,
    earStyle: 'small',
    bodyStyle: 'regular',
    facePattern: 'none',
    fluffy: true,
  },
  cloud: {
    coat: c.candyCream,
    ear: c.candyLavender,
    muzzle: c.card,
    collar: c.candySky,
    marking: c.candyPeach,
    earStyle: 'upright',
    bodyStyle: 'regular',
    facePattern: 'none',
    fluffy: true,
  },
  wonton: {
    coat: c.candyCream,
    ear: c.candyPeach,
    muzzle: c.card,
    collar: c.candyMint,
    marking: c.candyLavender,
    earStyle: 'floppy',
    bodyStyle: 'regular',
    facePattern: 'none',
    fluffy: false,
  },
  butter: {
    coat: c.candyLemon,
    ear: c.candyPeach,
    muzzle: c.candyCream,
    collar: c.candyRose,
    marking: c.candyPeach,
    earStyle: 'floppy',
    bodyStyle: 'regular',
    facePattern: 'none',
    fluffy: true,
  },
  sesame: {
    coat: c.candyInk,
    ear: c.candyInk,
    muzzle: c.candyCream,
    collar: c.candyRose,
    marking: c.candyPeach,
    earStyle: 'floppy',
    bodyStyle: 'regular',
    facePattern: 'shih-tzu',
    fluffy: false,
  },
  snowball: {
    coat: c.card,
    ear: c.candySkyDark,
    muzzle: c.candyCream,
    collar: c.candyMintDark,
    marking: c.candySky,
    earStyle: 'upright',
    bodyStyle: 'regular',
    facePattern: 'schnauzer',
    fluffy: true,
  },
  maomao: {
    coat: c.candyCream,
    ear: c.card,
    muzzle: c.card,
    collar: c.candyLemon,
    marking: c.candyCream,
    earStyle: 'upright',
    bodyStyle: 'regular',
    facePattern: 'none',
    fluffy: true,
  },
  poppy: {
    coat: c.candyCaramel,
    ear: c.candyCaramelDark,
    muzzle: c.candyCream,
    collar: c.candyPink,
    marking: c.candyPeach,
    earStyle: 'floppy',
    bodyStyle: 'long',
    facePattern: 'none',
    fluffy: false,
  },
};

export function DogAttendant({ kind }: { kind: DogAttendantKind }) {
  const look = dogLooks[kind];
  const leftEarStyle = look.earStyle === 'upright'
    ? s.leftUprightEar
    : look.earStyle === 'floppy' ? s.leftFloppyEar : s.leftEar;
  const rightEarStyle = look.earStyle === 'upright'
    ? s.rightUprightEar
    : look.earStyle === 'floppy' ? s.rightFloppyEar : s.rightEar;

  return (
    <View testID={`dog-attendant-${kind}`} accessible={false} style={s.canvas}>
      <View style={[s.tail, { backgroundColor: look.coat, borderColor: look.ear }]} />
      <View style={[
        s.body,
        look.bodyStyle === 'low' && s.lowBody,
        look.bodyStyle === 'long' && s.longBody,
        { backgroundColor: look.coat, borderColor: look.ear },
      ]}>
        <View style={[s.chest, { backgroundColor: look.marking }]} />
        {look.facePattern === 'collie' && <View style={s.saddlePatch} />}
      </View>
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
        <View style={[s.eye, s.leftEye]} />
        <View style={[s.eye, s.rightEye]} />
        <View style={[s.cheek, s.leftCheek, { backgroundColor: look.marking }]} />
        <View style={[s.cheek, s.rightCheek, { backgroundColor: look.marking }]} />
        <View style={[s.muzzle, { backgroundColor: look.muzzle }]}>
          {look.facePattern === 'schnauzer' && <View style={s.schnauzerBeard} />}
          <View style={s.nose} />
          <View style={s.smile} />
        </View>
      </View>
      <View style={[s.collar, { backgroundColor: look.collar }]}>
        <View style={s.bell} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  canvas: { width: 50, height: 45, alignItems: 'center', justifyContent: 'flex-end', position: 'relative' },
  tail: { position: 'absolute', width: 10, height: 8, right: 8, bottom: 13, borderRadius: 7, borderWidth: 1.5, transform: [{ rotate: '-25deg' }] },
  body: { position: 'absolute', width: 25, height: 15, left: 13, bottom: 5, borderRadius: 10, borderWidth: 1.2, overflow: 'hidden' },
  lowBody: { width: 29, left: 11, height: 13, bottom: 5, borderRadius: 8 },
  longBody: { width: 31, left: 10, height: 13, bottom: 5, borderRadius: 8 },
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
  leftEye: { left: 6 },
  rightEye: { right: 6 },
  cheek: { position: 'absolute', top: 11, width: 5, height: 3, borderRadius: 4, opacity: 0.9 },
  leftCheek: { left: 1 },
  rightCheek: { right: 1 },
  muzzle: { position: 'absolute', width: 11, height: 7, left: 5.5, bottom: 1, borderRadius: 6, alignItems: 'center' },
  schnauzerBeard: { position: 'absolute', top: 2, width: 11, height: 6, borderRadius: 5, backgroundColor: c.candySky },
  nose: { position: 'absolute', top: 0.5, width: 3, height: 2, borderRadius: 2, backgroundColor: c.candyCaramelDark },
  smile: { position: 'absolute', top: 3, width: 4, height: 2, borderBottomWidth: 0.8, borderColor: c.candyCaramelDark, borderRadius: 4 },
  collar: { position: 'absolute', width: 16, height: 4, left: 18, bottom: 15, borderRadius: 3, zIndex: 3 },
  bell: { position: 'absolute', width: 3, height: 3, left: 6.5, top: 2, borderRadius: 2, backgroundColor: c.candyLemon },
});
