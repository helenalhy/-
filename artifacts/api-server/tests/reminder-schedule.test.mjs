import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveSnoozedReminders,
  getDueReminderBatch,
  getDueReminderTimes,
  getDueSnoozedReminders,
} from "../src/lib/reminder-schedule.ts";

test("returns only reminder slots that have passed and have not been sent", () => {
  assert.deepEqual(
    getDueReminderTimes({
      reminderTimes: ["09:00", "13:30", "20:00"],
      fallbackReminderTime: "20:00",
      localDate: "2026-11-03",
      localTime: "13:30",
      lastSentLocalDates: { "09:00": "2026-11-03" },
      legacyLastSentLocalDate: null,
    }),
    ["13:30"],
  );
});

test("uses the old single reminder time for subscriptions not yet migrated", () => {
  assert.deepEqual(
    getDueReminderTimes({
      reminderTimes: [],
      fallbackReminderTime: "20:00",
      localDate: "2026-11-03",
      localTime: "20:05",
      lastSentLocalDates: {},
      legacyLastSentLocalDate: null,
    }),
    ["20:00"],
  );
});

test("does not resend a legacy reminder already sent today during migration", () => {
  assert.deepEqual(
    getDueReminderTimes({
      reminderTimes: ["09:00", "20:00"],
      fallbackReminderTime: "20:00",
      localDate: "2026-11-03",
      localTime: "20:05",
      lastSentLocalDates: {},
      legacyLastSentLocalDate: "2026-11-03",
    }),
    [],
  );
});

test("deduplicates schedule slots and lets later slots run after earlier ones", () => {
  assert.deepEqual(
    getDueReminderTimes({
      reminderTimes: ["20:00", "20:00", "21:00"],
      fallbackReminderTime: "20:00",
      localDate: "2026-11-03",
      localTime: "21:01",
      lastSentLocalDates: { "20:00": "2026-11-03" },
      legacyLastSentLocalDate: null,
    }),
    ["21:00"],
  );
});

test("returns due habit names and merged slots at the latest due time", () => {
  assert.deepEqual(
    getDueReminderBatch({
      schedules: [
        { scheduleId: "global", reminderTimes: ["09:00", "20:00"] },
        { scheduleId: "habit:exercise", reminderTimes: ["18:00"], habitTitle: "晚間運動" },
        { scheduleId: "habit:reading", reminderTimes: ["18:00"], habitTitle: "閱讀" },
      ],
      fallbackReminderTime: "20:00",
      localDate: "2026-11-03",
      localTime: "18:00",
      lastSentLocalDates: { "habit:exercise:18:00": "2026-11-02" },
      legacyLastSentLocalDate: null,
    }),
    {
      time: "18:00",
      keysToMarkSent: ["global:09:00", "habit:exercise:18:00", "habit:reading:18:00"],
      habitTitles: ["晚間運動", "閱讀"],
    },
  );
});

test("does not send any due reminder after a check-in that day", () => {
  assert.deepEqual(
    getDueReminderTimes({
      reminderTimes: ["09:00", "13:30"],
      fallbackReminderTime: "13:30",
      localDate: "2026-11-03",
      localTime: "13:30",
      lastSentLocalDates: {},
      legacyLastSentLocalDate: null,
      hasCheckedInToday: true,
    }),
    [],
  );
  assert.equal(
    getDueReminderBatch({
      schedules: [{ scheduleId: "global", reminderTimes: ["09:00", "13:30"] }],
      fallbackReminderTime: "13:30",
      localDate: "2026-11-03",
      localTime: "13:30",
      lastSentLocalDates: {},
      legacyLastSentLocalDate: null,
      hasCheckedInToday: true,
    }),
    null,
  );
});

test("legacy global sent marker does not suppress a newly configured habit reminder", () => {
  assert.deepEqual(
    getDueReminderBatch({
      schedules: [
        { scheduleId: "global", reminderTimes: ["09:00", "20:00"] },
        { scheduleId: "habit:walk", reminderTimes: ["18:00"], habitTitle: "晚飯後散步" },
      ],
      fallbackReminderTime: "20:00",
      localDate: "2026-11-03",
      localTime: "20:00",
      lastSentLocalDates: {},
      legacyLastSentLocalDate: "2026-11-03",
    }),
    {
      time: "18:00",
      keysToMarkSent: ["habit:walk:18:00"],
      habitTitles: ["晚飯後散步"],
    },
  );
});

test("a same-day snooze suppresses that habit's recurring reminder until it fires", () => {
  const stored = {
    "snooze:walk": JSON.stringify({
      status: "pending",
      habitId: "walk",
      habitTitle: "晚飯後散步",
      fireAt: "2026-11-03T10:30:00.000Z",
      localDate: "2026-11-03",
    }),
    "snooze:read": JSON.stringify({
      status: "sent",
      habitId: "read",
      habitTitle: "閱讀",
      fireAt: "2026-11-03T08:00:00.000Z",
      localDate: "2026-11-03",
    }),
  };

  assert.deepEqual(
    getActiveSnoozedReminders(stored, "2026-11-03").map((item) => item.record.habitId),
    ["walk", "read"],
  );
  assert.deepEqual(
    getDueSnoozedReminders(stored, "2026-11-03", new Date("2026-11-03T10:00:00.000Z")),
    [],
  );
  assert.deepEqual(
    getDueSnoozedReminders(stored, "2026-11-03", new Date("2026-11-03T10:30:00.000Z"))
      .map((item) => item.record.habitId),
    ["walk"],
  );
});

test("snoozes from another local day are neither active nor due", () => {
  const stored = {
    "snooze:walk": JSON.stringify({
      status: "pending",
      habitId: "walk",
      habitTitle: "晚飯後散步",
      fireAt: "2026-11-03T23:50:00.000Z",
      localDate: "2026-11-03",
    }),
  };
  assert.deepEqual(getActiveSnoozedReminders(stored, "2026-11-04"), []);
  assert.deepEqual(
    getDueSnoozedReminders(stored, "2026-11-04", new Date("2026-11-04T00:20:00.000Z")),
    [],
  );
});

test("does not send a pending snooze after a check-in that day", () => {
  const stored = {
    "snooze:walk": JSON.stringify({
      status: "pending",
      habitId: "walk",
      habitTitle: "晚飯後散步",
      fireAt: "2026-11-03T10:30:00.000Z",
      localDate: "2026-11-03",
    }),
  };
  assert.deepEqual(
    getDueSnoozedReminders(
      stored,
      "2026-11-03",
      new Date("2026-11-03T10:30:00.000Z"),
      true,
    ),
    [],
  );
});
