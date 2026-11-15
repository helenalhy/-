import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getReminderLocalDate, isValidReminderTimeZone } from "../src/lib/reminder-timezone.ts";

test("calculates saved check-in dates using the newly reported timezone", () => {
  const instant = new Date("2026-11-16T00:30:00.000Z");
  assert.equal(getReminderLocalDate("Asia/Hong_Kong", instant), "2026-11-16");
  assert.equal(getReminderLocalDate("America/Los_Angeles", instant), "2026-11-15");
});

test("rejects unknown timezone names before updating a subscription", () => {
  assert.equal(isValidReminderTimeZone("Europe/Paris"), true);
  assert.equal(isValidReminderTimeZone("Not/A_Real_Zone"), false);
});

test("check-in status updates both the subscription timezone and its local check-in date", async () => {
  const route = await readFile(new URL("../src/routes/reminders.ts", import.meta.url), "utf8");
  assert.match(route, /const timeZone = parsed\.data\.timeZone \?\? subscription\.timeZone/);
  assert.match(route, /timeZone,\s*lastCheckInLocalDate: parsed\.data\.hasCheckedInToday \? localDate : null/s);
});
