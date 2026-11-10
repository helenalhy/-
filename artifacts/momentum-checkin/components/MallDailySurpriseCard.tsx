import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { DogAttendant, type DogAttendantKind } from '@/components/DogAttendant';
import { MallObjectVisual } from '@/components/MallVisuals';
import { useColors } from '@/hooks/useColors';
import { getDailyMallSurprise } from '@/lib/daily-mall-surprise';

export function MallDailySurpriseCard({ today }: { today: string }) {
  const colors = useColors();
  const surprise = getDailyMallSurprise(today);
  const isDog = surprise.kind === 'dog';

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="mall-daily-surprise"
      accessibilityLabel={isDog
        ? `今日限時驚喜，${surprise.dog.name}來商場拜訪，只停留到今日午夜`
        : `今日限時驚喜，${surprise.item.name}裝飾只展示到今日午夜`}
    >
      <View style={styles.main}>
        <View style={[styles.art, { backgroundColor: isDog ? colors.candyPink : surprise.item.color }]}>
          {isDog ? (
            <DogAttendant kind={surprise.dog.kind as DogAttendantKind} happy />
          ) : (
            <MallObjectVisual
              id={surprise.item.visual ?? surprise.item.id}
              itemId={surprise.item.id}
              itemName={surprise.item.name}
              floor={surprise.item.floor}
              color={surprise.item.color}
              icon={surprise.item.icon}
              category="decor"
              isActive
            />
          )}
        </View>
        <View style={styles.copy}>
          <View style={styles.eyebrowRow}>
            <Feather name="star" size={12} color={colors.primary} />
            <Text style={[styles.eyebrow, { color: colors.primary }]}>今日限時驚喜</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {isDog ? `${surprise.dog.name}來商場拜訪` : surprise.item.name}
          </Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            {isDog ? '和可愛的狗狗店員打個招呼吧。' : '今天限定展示，明天會換上新的驚喜。'}
          </Text>
        </View>
      </View>
      <View style={[styles.expiry, { backgroundColor: colors.secondary }]}>
        <Feather name="clock" size={11} color={colors.primary} />
        <Text style={[styles.expiryText, { color: colors.mutedForeground }]}>只停留到今日午夜，不需兌換</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 18, padding: 12, marginTop: 10, overflow: 'hidden' },
  main: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  art: { width: 70, height: 64, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  copy: { flex: 1, minWidth: 0 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  eyebrow: { fontSize: 9, fontWeight: '700', letterSpacing: 0.2 },
  title: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  body: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  expiry: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5, marginTop: 9 },
  expiryText: { fontSize: 9, fontWeight: '600' },
});
