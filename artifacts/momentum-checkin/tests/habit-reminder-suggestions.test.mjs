import assert from "node:assert/strict";
import test from "node:test";
import { recommendHabitReminderTimes } from "../lib/habit-reminder-suggestions.ts";

test("suggests a morning reminder from the habit title", () => {
  assert.deepEqual(
    recommendHabitReminderTimes({ title: "早上喝一杯水" }),
    ["08:00"],
  );
});

test("uses the habit description when the title is not specific", () => {
  assert.deepEqual(
    recommendHabitReminderTimes({ title: "每日目標", reason: "下班後做瑜伽" }),
    ["18:00"],
  );
});

test("provides a safe evening suggestion for unmatched habits", () => {
  assert.deepEqual(
    recommendHabitReminderTimes({ title: "整理相片" }),
    ["20:00"],
  );
});
