import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { getCheckInMilestones } from '@/lib/check-in-milestones';

export function CheckInMilestoneCards({ totalCheckIns }: { totalCheckIns: number }) {
  const colors = useColors();
  const milestones = getCheckInMilestones(totalCheckIns);
  const nextMilestone = milestones.find((milestone) => !milestone.unlocked);

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} testID="check-in-milestone-cards">
      <View style={styles.heading}>
        <View style={[styles.headingIcon, { backgroundColor: colors.candyPink }]}>
          <Feather name="bookmark" size={16} color={colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: colors.foreground }]}>目標紀念卡</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {nextMilestone
              ? `下一張紀念卡，再完成 ${nextMilestone.total - totalCheckIns} 次。`
              : '三張紀念卡都已點亮，謝謝你持續為自己留時間。'}
          </Text>
        </View>
      </View>
      <View style={styles.grid}>
        {milestones.map((milestone) => {
          const unlocked = milestone.unlocked;
          return (
            <View
              key={milestone.total}
              testID={`check-in-milestone-${milestone.total}`}
              style={[
                styles.milestone,
                {
                  backgroundColor: unlocked ? colors.candyLemon : colors.secondary,
                  borderColor: unlocked ? colors.candyCaramelDark : colors.border,
                },
              ]}
            >
              <Feather name={milestone.icon} size={15} color={unlocked ? colors.candyCaramelDark : colors.mutedForeground} />
              <Text style={[styles.count, { color: unlocked ? colors.foreground : colors.mutedForeground }]}>{milestone.total} 次</Text>
              <Text style={[styles.milestoneTitle, { color: colors.foreground }]} numberOfLines={2}>{milestone.title}</Text>
              <Text style={[styles.milestoneNote, { color: colors.mutedForeground }]} numberOfLines={3}>
                {unlocked ? milestone.note : `還差 ${milestone.remaining} 次`}
              </Text>
            </View>
          );
        })}
      </View>
      <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
        只紀錄累積練習，不扣金幣，也不改動商場原有樓層或裝飾。
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 14, marginTop: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 10, lineHeight: 15, marginTop: 3 },
  grid: { flexDirection: 'row', gap: 7, marginTop: 12 },
  milestone: { flex: 1, minWidth: 0, minHeight: 108, borderWidth: 1, borderRadius: 14, padding: 8, alignItems: 'center' },
  count: { fontSize: 11, fontWeight: '700', marginTop: 5 },
  milestoneTitle: { fontSize: 10, lineHeight: 14, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  milestoneNote: { fontSize: 9, lineHeight: 13, textAlign: 'center', marginTop: 4 },
  footnote: { fontSize: 9, lineHeight: 14, marginTop: 9 },
});
