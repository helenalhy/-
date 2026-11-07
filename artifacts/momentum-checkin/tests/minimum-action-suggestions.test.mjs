import assert from "node:assert/strict";
import test from "node:test";
import { recommendMinimumAction } from "../lib/minimum-action-suggestions.ts";

test("suggests a small first action for common habit types", () => {
  assert.equal(recommendMinimumAction({ title: "每天閱讀 10 頁" }), "先讀一頁");
  assert.equal(recommendMinimumAction({ title: "做運動" }), "先做 2 分鐘");
  assert.equal(recommendMinimumAction({ title: "早上散步" }), "先走 2 分鐘");
  assert.equal(recommendMinimumAction({ title: "喝水 1500ml" }), "先喝幾口水");
});

test("uses the goal reason when the title is too general", () => {
  assert.equal(
    recommendMinimumAction({ title: "完成今天目標", reason: "持續閱讀英文書" }),
    "先讀一頁",
  );
});

test("keeps an actionable general recommendation for unrecognized goals", () => {
  assert.equal(recommendMinimumAction({ title: "照顧自己" }), "先做 2 分鐘，做到哪裡都可以");
});
