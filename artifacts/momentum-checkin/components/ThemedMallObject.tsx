import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import palette from '@/constants/colors';

const c = palette.light;

export function ThemedMallObject({ id, color }: { id: string; color: string }) {
  let drawing: React.ReactNode;
  switch (id) {
    case 'coral-aquarium':
      drawing = <><View style={[s.tank, { backgroundColor: c.candySky, borderColor: c.candySkyDark }]}>{[c.candyCoral, c.candyLemon, c.candyPink].map((fish, i) => <View key={i} style={[s.fish, { backgroundColor: fish, left: 5 + i * 13, top: 7 + (i % 2) * 10 }]} />)}<View style={[s.coral, { backgroundColor: c.candyCoral }]} /></View><View style={[s.base, { backgroundColor: c.candySkyDark }]} /></>;
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
      drawing = <><View style={[s.swingBar, { backgroundColor: c.candySkyDark }]} /><View style={s.swingFrame}><View style={[s.swingPost, { backgroundColor: c.candySkyDark }]} /><View style={[s.swingRope, { backgroundColor: c.candyCaramelDark }]} /><View style={[s.swingRope, { backgroundColor: c.candyCaramelDark }]} /><View style={[s.swingPost, { backgroundColor: c.candySkyDark }]} /></View><View style={[s.swingSeat, { backgroundColor: c.candyPink }]} /></>;
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
    default:
      drawing = <Feather name="gift" size={30} color={c.candyRoseDark} />;
  }
  return <View style={s.object}>{drawing}</View>;
}

const s = StyleSheet.create({
  object: { width: 62, height: 47, alignItems: 'center', justifyContent: 'flex-end' },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  tank: { width: 56, height: 35, borderWidth: 3, borderRadius: 5, overflow: 'hidden' },
  fish: { position: 'absolute', width: 10, height: 6, borderRadius: 6 },
  coral: { position: 'absolute', bottom: 0, right: 4, width: 5, height: 13, borderTopLeftRadius: 7 },
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
  swingFrame: { flexDirection: 'row', justifyContent: 'space-between', width: 55, height: 39 },
  swingPost: { width: 4, height: 39 },
  swingRope: { width: 2, height: 27 },
  swingSeat: { position: 'absolute', bottom: 8, width: 28, height: 7, borderRadius: 4 },
  shell: { width: 43, height: 35, borderTopLeftRadius: 25, borderTopRightRadius: 25, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  sign: { width: 47, height: 43, borderRadius: 10, borderWidth: 4, alignItems: 'center', justifyContent: 'center' },
  diffuser: { width: 36, height: 24, borderRadius: 18, borderWidth: 2 },
  frame: { width: 18, height: 26, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  hanging: { alignItems: 'center', width: 15 },
  string: { width: 1 },
  jarRow: { flexDirection: 'row', gap: 5 },
  jar: { width: 12, height: 17, borderWidth: 1, borderTopWidth: 4, borderRadius: 3 },
  shelf: { width: 58, height: 4 },
  rainbow: { width: 60, height: 45 },
  rainbowBand: { position: 'absolute', borderWidth: 5, borderBottomWidth: 0, borderTopLeftRadius: 40, borderTopRightRadius: 40 },
});
