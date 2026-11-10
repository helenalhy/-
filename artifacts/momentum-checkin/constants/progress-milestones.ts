export const PROGRESS_MILESTONES = [
  { id: 'starlight-lanterns', total: 25, floor: 1, title: '星光燈串', effect: '星星微光' },
  { id: 'sakura-petals', total: 75, floor: 15, title: '櫻花花瓣', effect: '花瓣飄落' },
  { id: 'rainbow-sparkles', total: 150, floor: 20, title: '彩虹星光', effect: '彩虹光點' },
] as const;

export function getRewardedCheckInCount(rewardedCheckIns: readonly string[]) {
  return rewardedCheckIns.filter((key) => (
    !key.startsWith('makeup-used:')
    && !key.startsWith('daily-dog-task:')
  )).length;
}

export function getUnlockedMilestones(totalCompletedCheckIns: number) {
  return PROGRESS_MILESTONES.filter((milestone) => totalCompletedCheckIns >= milestone.total);
}

export function getNextMilestone(totalCompletedCheckIns: number) {
  return PROGRESS_MILESTONES.find((milestone) => totalCompletedCheckIns < milestone.total) ?? null;
}
