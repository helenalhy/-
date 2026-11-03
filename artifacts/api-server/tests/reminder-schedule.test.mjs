import assert from "node:assert/strict";
import test from "node:test";
import { getDueReminderTimes } from "../src/lib/reminder-schedule.ts";

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
