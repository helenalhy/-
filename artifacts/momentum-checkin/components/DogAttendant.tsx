import React from 'react';
import { StyleSheet, View } from 'react-native';
import palette from '@/constants/colors';

const c = palette.light;

export type DogAttendantKind = 'huahua' | 'milkshake' | 'xiaoniu' | 'pudding';

const dogLooks: Record<DogAttendantKind, {
  coat: string;
  ear: string;
  muzzle: string;
  collar: string;
  marking: string;
  collie: boolean;
}> = {
  huahua: {
    coat: c.candyCaramel,
    ear: c.candyCaramelDark,
    muzzle: c.candyCream,
    collar: c.candyPink,
    marking: c.candyCream,
    collie: false,
  },
  milkshake: {
    coat: c.candyCream,
    ear: c.candyPeach,
    muzzle: c.card,
    collar: c.candyLavender,
    marking: c.candyPeach,
    collie: false,
  },
  xiaoniu: {
    coat: c.candyInk,
    ear: c.candyInk,
    muzzle: c.candyCream,
    collar: c.candyMintDark,
    marking: c.candyCream,
    collie: true,
  },
  pudding: {
    coat: c.candyCaramel,
    ear: c.candyCaramelDark,
    muzzle: c.candyCream,
    collar: c.candyLemon,
    marking: c.candyPeach,
    collie: false,
  },
};

export function DogAttendant({ kind }: { kind: DogAttendantKind }) {
  const look = dogLooks[kind];
  const pointedEars = look.collie;

  return (
    <View testID={`dog-attendant-${kind}`} accessible={false} style={s.canvas}>
      <View style={[s.tail, { backgroundColor: look.coat, borderColor: look.ear }]} />
      <View style={[s.body, { backgroundColor: look.coat, borderColor: look.ear }]}>
        <View style={[s.chest, { backgroundColor: look.marking }]} />
        {look.collie && <View style={s.saddlePatch} />}
      </View>
      <View style={s.legs}>
        <View style={[s.leg, { backgroundColor: look.coat, borderColor: look.ear }]} />
        <View style={[s.leg, { backgroundColor: look.coat, borderColor: look.ear }]} />
      </View>
      <View style={[s.ear, s.leftEar, pointedEars && s.pointedEar, { backgroundColor: look.ear }]} />
      <View style={[s.ear, s.rightEar, pointedEars && s.pointedEar, { backgroundColor: look.ear }]} />
      <View style={[s.head, { backgroundColor: look.coat, borderColor: look.ear }]}>
        {look.collie && <View style={s.collieBlaze} />}
        <View style={[s.eye, s.leftEye]} />
        <View style={[s.eye, s.rightEye]} />
        <View style={[s.cheek, s.leftCheek, { backgroundColor: look.marking }]} />
        <View style={[s.cheek, s.rightCheek, { backgroundColor: look.marking }]} />
        <View style={[s.muzzle, { backgroundColor: look.muzzle }]}>
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
  chest: { position: 'absolute', width: 9, height: 14, left: 2, top: 0, borderTopLeftRadius: 7, borderTopRightRadius: 7 },
  saddlePatch: { position: 'absolute', right: 1, top: 2, width: 11, height: 9, borderRadius: 6, backgroundColor: c.candyCream },
  legs: { position: 'absolute', left: 16, bottom: 0, flexDirection: 'row', gap: 8 },
  leg: { width: 6, height: 9, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  ear: { position: 'absolute', top: 4, width: 9, height: 12, borderRadius: 7, borderWidth: 1, borderColor: c.candyCaramelDark },
  pointedEar: { height: 13, borderTopLeftRadius: 2, borderTopRightRadius: 8, transform: [{ rotate: '-12deg' }] },
  leftEar: { left: 14, transform: [{ rotate: '-20deg' }] },
  rightEar: { right: 14, transform: [{ rotate: '20deg' }] },
  head: { position: 'absolute', width: 24, height: 22, left: 13, top: 6, borderRadius: 13, borderWidth: 1.2, zIndex: 2 },
  collieBlaze: { position: 'absolute', width: 4, height: 12, left: 9, top: 1, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: c.candyCream },
  eye: { position: 'absolute', top: 8, width: 2.5, height: 3, borderRadius: 2, backgroundColor: c.candyInk },
  leftEye: { left: 6 },
  rightEye: { right: 6 },
  cheek: { position: 'absolute', top: 11, width: 5, height: 3, borderRadius: 4, opacity: 0.9 },
  leftCheek: { left: 1 },
  rightCheek: { right: 1 },
  muzzle: { position: 'absolute', width: 11, height: 7, left: 5.5, bottom: 1, borderRadius: 6, alignItems: 'center' },
  nose: { position: 'absolute', top: 0.5, width: 3, height: 2, borderRadius: 2, backgroundColor: c.candyCaramelDark },
  smile: { position: 'absolute', top: 3, width: 4, height: 2, borderBottomWidth: 0.8, borderColor: c.candyCaramelDark, borderRadius: 4 },
  collar: { position: 'absolute', width: 16, height: 4, left: 18, bottom: 15, borderRadius: 3, zIndex: 3 },
  bell: { position: 'absolute', width: 3, height: 3, left: 6.5, top: 2, borderRadius: 2, backgroundColor: c.candyLemon },
});
