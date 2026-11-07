import assert from "node:assert/strict";
import test from "node:test";
import {
  FULL_CHECK_IN_REWARD,
  getMinimumActionReward,
  UNMEASURABLE_MINIMUM_REWARD_RATIO,
} from "../lib/proportional-checkin-reward.ts";

test("pays the measurable fraction of the normal check-in reward", () => {
  assert.equal(getMinimumActionReward("散步 20 分鐘", "先走 2 分鐘"), 2);
  assert.equal(getMinimumActionReward("閱讀 10 頁", "先讀一頁"), 2);
  assert.equal(getMinimumActionReward("walk for 1 hour", "walk 15 minutes"), 5);
});

test("uses a quarter reward when a goal has no matching measurable amount", () => {
  assert.equal(
    getMinimumActionReward("每天練習瑜伽", "先做 2 分鐘"),
    Math.floor(FULL_CHECK_IN_REWARD * UNMEASURABLE_MINIMUM_REWARD_RATIO),
  );
});

test("keeps minimum rewards between one coin and the full goal reward", () => {
  assert.equal(getMinimumActionReward("閱讀 100 頁", "先讀一頁"), 1);
  assert.equal(getMinimumActionReward("散步 2 分鐘", "先走 5 分鐘"), FULL_CHECK_IN_REWARD);
  assert.equal(getMinimumActionReward("散步 20 分鐘", "先走 2 分鐘", 0), 0);
});
