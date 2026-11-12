export const CHECK_IN_MILESTONES = [
  { total: 10, title: '開始成形', note: '十次小步，值得記住。', icon: 'star' },
  { total: 30, title: '持續前進', note: '努力正在變成習慣。', icon: 'trending-up' },
  { total: 50, title: '走出自己的路', note: '五十次完成，真不簡單。', icon: 'award' },
] as const;

export function getCheckInMilestones(totalCheckIns: number) {
  const total = Number.isFinite(totalCheckIns) ? Math.max(0, Math.floor(totalCheckIns)) : 0;
  return CHECK_IN_MILESTONES.map((milestone) => ({
    ...milestone,
    unlocked: total >= milestone.total,
    remaining: Math.max(0, milestone.total - total),
  }));
}
